/**
 * mihomo配置覆写脚本（全量版 · 审查优化版）
 * 原作者：AIsouler
 * 原仓库：https://github.com/AIsouler/MyClash
 * 原脚本：https://raw.githubusercontent.com/AIsouler/MyClash/main/Script/mihomoScript.js
 *
 * 本版本改动摘要：
 * 1. 规则顺序重排：私网 → 广告拦截 → QUIC 拦截 → GitHub → 国内直连 → 服务分流 → 兜底
 *    （原版广告规则排在最后，google/twitter 等规则集内的广告域名会先被服务规则放行；
 *      原版 github 排在 QUIC 拦截之前，GitHub 的 QUIC 流量不会被拦截，与初衷不符）
 * 2. 修复"美国"正则：US 增加字母边界，避免误匹配 AUS（澳大利亚）/ RUSSIA 等节点名；
 *    "弗尼基亚"更正为"弗吉尼亚"
 * 3. default-selected 增加存在性校验：无对应地区节点时不写入（内核会静默回退，写了也无效）
 * 4. 新增 sniffer 域名嗅探；新增 mixed-port（allow-lan 需要监听端口才有意义）；可选 API secret
 * 5. IPv6 由 enableIPv6 统一控制（原版全局与 DNS 均关 IPv6，"IPv6优先"直连出口形同虚设）
 * 6. excludeFilter 中裸 "com" 收紧为 "\.com"，降低误伤正常节点名的概率
 * 7. 小修：直连组重复 url、allNodes 组空 proxies 数组、无节点时报错区分 proxy-providers 场景
 *
 * 注意：default-selected / empty-fallback / path-in-bundle 均为较新内核字段，
 * 请使用较新版本的 mihomo 内核（旧内核会忽略这些字段，功能降级但不报错）。
 */

// --- 静态配置区域 ---

/**
 * 是否启用 IPv6（同时控制全局 ipv6 与 DNS 的 AAAA 解析）
 * 关闭时无法解析出 IPv6 地址，"🇨🇳 直连 | IPv6优先 / 双栈"出口实际等同于 IPv4
 */
const enableIPv6 = false;

/**
 * 是否启用域名嗅探（sniffer）
 * 作用：还原直连 IP / 绕过内核 DNS 的流量的域名，提高规则命中率
 * 默认关闭：Bybit 等交易所 App 会使用自选 IP 直连、非标准 TLS 等方式对抗封锁，
 * 嗅探（尤其是目标改写）可能破坏这类连接，表现为浏览器正常但 App 报网络错误
 */
const enableSniffer = false;

/**
 * 是否启用"禁国外 QUIC"规则
 * 设备内 TUN 下 REJECT 会让应用立刻回落 TCP；但在旁路由/路由器场景下，
 * UDP 的 REJECT 表现为静默丢包，QUIC 优先的 App 需要干等超时，可能直接报网络错误。
 * 若旁路由环境下出现"浏览器正常、App 报错"，可将其设为 false 测试
 */
const enableQuicBlock = false;

/**
 * 混合端口（HTTP + SOCKS5）。allow-lan 局域网共享必须有监听端口才生效；
 * 纯 TUN 场景可设为 0 关闭。Mihomo Party / Clash Verge 等 GUI 通常会覆盖端口设置
 */
const mixedPort = 7890;

/**
 * external-controller 访问密钥。建议设置，避免本机恶意网页/程序未授权调用 9090 API；
 * 留空则不写入（GUI 通常会注入自己的 secret）
 */
const apiSecret = '';

/**
 * 分流策略组启用配置，若不需要某个策略组，请设为 false
 * true = 启用
 * false = 禁用
 */
const ruleOptionsEnable = {
  AI: true, // 国外AI服务
  Crypto: true, // 加密货币交易所/钱包（Bybit、SafePal、币安等）
  Media: true, // 国外视频平台
  Instagram: true, // Instagram社交平台
  FCM: true, // GoogleFCM服务
  Google: true, // Google服务
  Microsoft: true, // Microsoft服务
  Apple: true, // Apple服务
  Telegram: true, // Telegram通讯软件
  NS: true, // NodeSeek论坛
  Steam: true, // Steam游戏平台
  TikTok: true, // TikTok视频平台
  Twitter: true, // Twitter社交平台
  Emby: true, // Emby媒体服务
  Spotify: true, // Spotify音乐服务
  AdBlock: true, // 广告拦截
};

// 定义全局排除节点的正则表达式，用于排除非地区的信息节点
// 注：裸 "com" 已收紧为 "\.com"，避免误伤含 com 字样的正常节点名
const excludeFilter =
  /群|❌|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|访问|支持|教程|关注|更新|作者|加入|超时|收藏|福利|邀请|好友|失联|选择|剩余|公益|发布|DIZTNA|通路|登录|禁止|定时|渠道|牢记|永久|余额|阁下|本站|刷新|导航|建议|重置|以下|⚠️|@|expire|http|\.com|traffic/iu;

// --- 预定义规则（按用途拆分，最终顺序在 main 中统一组装）---

// 私有网络直连（应最先匹配）
const privateRules = ['RULE-SET,private,直连', 'RULE-SET,private_ip,直连,no-resolve'];

// 禁用国外 QUIC 流量（UDP 443），强制 HTTP/3 回落 TCP，代理下更稳定
const quicBlockRule =
  'AND,((NETWORK,UDP),(DST-PORT,443),(NOT,((OR,((RULE-SET,cn_additional),(RULE-SET,cn_ip,no-resolve)))))),REJECT';

// 需要先于服务分流强制走代理的规则
// 注意：github 必须排在 Microsoft 分流之前，因为 geosite:microsoft 规则集包含 GitHub 域名
const forceProxyRules = ['RULE-SET,github,默认代理'];

// 广告拦截白名单：写在这里的完整规则会排在广告拦截之前，用于救回被误杀的域名
// 示例：'DOMAIN-SUFFIX,app-measurement.com,Google'（放行 Firebase 统计并按 Google 分流）
const adblockAllowRules = [];

// 国内直连
const cnDirectRules = [
  'RULE-SET,games_cn,直连', // 已包含 steam 下载域名
  'RULE-SET,epicgames,直连',
  'RULE-SET,nvidia_cn,直连',
  'RULE-SET,apple_cn,直连',
  'RULE-SET,microsoft_cn,直连',
  'DOMAIN,fsend.cn,直连',
  'DOMAIN,international-gfe.download.nvidia.com,直连',
];

// 定义地区策略组
const regionDefinitions = [
  {
    name: '香港',
    regex: /🇭🇰|香港|HK|[Hh]ong\s*[Kk]ong/,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png',
  },
  {
    name: '日本',
    regex: /🇯🇵|日本|JP|[Jj]apan/,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png',
  },
  {
    name: '美国',
    // US 前后不允许出现字母，避免把 AUS（澳大利亚）、RUSSIA 等节点误归入美国组
    regex: /🇺🇸|美|夏威夷|弗吉尼亚|ATT|MEGA|(?:^|[^A-Za-z])US(?![A-Za-z])|[Aa]merica|[Uu]nited\s*[Ss]tates/,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png',
  },
  {
    name: '新加坡',
    regex: /🇸🇬|新加坡|狮城|SG|[Ss]ingapore/,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png',
  },
  {
    name: '台湾省',
    regex: /🇹🇼|台湾|TW|[Tt]aiwan/,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png',
  },
];

// Rule Providers 通用配置
const ruleProviderCommonDomain = {
  type: 'http',
  format: 'mrs',
  interval: 86400,
  behavior: 'domain',
};
const ruleProviderCommonIpcidr = {
  type: 'http',
  format: 'mrs',
  interval: 86400,
  behavior: 'ipcidr',
};

// 定义基础 Rule Providers
const baseRuleProviders = {
  // --- 直连规则集 ---

  private: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/private.mrs',
    path: './ruleset/private.mrs',
    'path-in-bundle': 'geo/geosite/private.mrs',
  },
  private_ip: {
    ...ruleProviderCommonIpcidr,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/private.mrs',
    path: './ruleset/private_ip.mrs',
    'path-in-bundle': 'geo/geoip/private.mrs',
  },
  games_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-games@cn.mrs',
    path: './ruleset/category-games@cn.mrs',
    'path-in-bundle': 'geo/geosite/category-games@cn.mrs',
  },
  epicgames: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/epicgames.mrs',
    path: './ruleset/epicgames.mrs',
    'path-in-bundle': 'geo/geosite/epicgames.mrs',
  },
  nvidia_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/nvidia@cn.mrs',
    path: './ruleset/nvidia@cn.mrs',
    'path-in-bundle': 'geo/geosite/nvidia@cn.mrs',
  },
  apple_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple@cn.mrs',
    path: './ruleset/apple@cn.mrs',
    'path-in-bundle': 'geo/geosite/apple@cn.mrs',
  },
  microsoft_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft@cn.mrs',
    path: './ruleset/microsoft@cn.mrs',
    'path-in-bundle': 'geo/geosite/microsoft@cn.mrs',
  },
  cn_additional: {
    ...ruleProviderCommonDomain,
    url: 'https://static-file-global.353355.xyz/rules/cn-additional-list.mrs',
    path: './ruleset/cn-additional-list.mrs',
    'path-in-bundle': 'geo/geosite/cn.mrs',
  },
  cn_ip: {
    ...ruleProviderCommonIpcidr,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cn.mrs',
    path: './ruleset/cn_ip.mrs',
    'path-in-bundle': 'geo/geoip/cn.mrs',
  },

  // --- 代理规则集 ---

  github: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/github.mrs',
    path: './ruleset/github.mrs',
    'path-in-bundle': 'geo/geosite/github.mrs',
  },
  gfw: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/gfw.mrs',
    path: './ruleset/gfw.mrs',
    'path-in-bundle': 'geo/geosite/gfw.mrs',
  },

  // --- 其他规则集 ---

  fakeip_filter: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/wwqgtxx/clash-rules@release/fakeip-filter.mrs',
    path: './ruleset/fakeip-filter.mrs',
    'path-in-bundle': 'geo/geosite/private.mrs',
  },
  cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/wwqgtxx/clash-rules@release/direct.mrs',
    path: './ruleset/cn.mrs',
    'path-in-bundle': 'geo/geosite/cn.mrs',
  },
};

// 策略组公共配置
const groupBaseOption = {
  interval: 600,
  timeout: 3000,
  url: 'http://cp.cloudflare.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
  'empty-fallback': 'REJECT',
};

// select策略组通用配置
const selectBaseOption = {
  ...groupBaseOption,
  type: 'select',
  hidden: false,
};

// url-test策略组通用配置
const urlTestBaseOption = {
  ...groupBaseOption,
  type: 'url-test',
  tolerance: 50,
  'exclude-type': 'DIRECT',
  icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png',
  hidden: true,
};

// load-balance策略组通用配置
const loadBalanceBaseOption = {
  ...groupBaseOption,
  type: 'load-balance',
  strategy: 'sticky-sessions',
  'exclude-type': 'DIRECT',
  icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Round_Robin.png',
  hidden: true,
};

// 定义分流策略组配置
const serviceConfigs = [
  {
    name: 'AI',
    defaultSelected: '美国',
    providers: {
      ai: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs',
        path: './ruleset/ai.mrs',
        'path-in-bundle': 'geo/geosite/category-ai-!cn.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png',
    rules: ['RULE-SET,ai,AI'],
  },
  {
    // 交易所/钱包类金融应用对出口 IP 风控严格：Bybit 等封锁美国、新加坡、英国、
    // 大陆等地区出口，SafePal Bank（Fiat24）等银行服务还会拦截数据中心 IP。
    // 默认跟随"默认代理"（组内第一项）；本地网络可直连这些服务时再手动切"直连"。
    // 走代理时优先选香港/日本等未被交易所封锁的出口，家宽/原生 IP 最稳。
    name: 'Crypto',
    direct: true,
    providers: {
      cryptocurrency: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-cryptocurrency.mrs',
        path: './ruleset/cryptocurrency.mrs',
        'path-in-bundle': 'geo/geosite/category-cryptocurrency.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bitcoin.png',
    rules: [
      // 显式域名兜底，避免规则集缺失或更新滞后导致 App 断网
      'DOMAIN-SUFFIX,safepal.com,Crypto',
      'DOMAIN-SUFFIX,safepal.io,Crypto',
      'DOMAIN-SUFFIX,bybit.com,Crypto',
      'DOMAIN-SUFFIX,bybitglobal.com,Crypto',
      'DOMAIN-SUFFIX,bycsi.com,Crypto',
      'RULE-SET,cryptocurrency,Crypto',
    ],
  },
  {
    name: 'Media',
    defaultSelected: '日本',
    providers: {
      youtube: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs',
        path: './ruleset/youtube.mrs',
        'path-in-bundle': 'geo/geosite/youtube.mrs',
      },
      netflix: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/netflix.mrs',
        path: './ruleset/netflix.mrs',
        'path-in-bundle': 'geo/geosite/netflix.mrs',
      },
      netflix_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/netflix.mrs',
        path: './ruleset/netflix_ip.mrs',
        'path-in-bundle': 'geo/geoip/netflix.mrs',
      },
      hbo: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/hbo.mrs',
        path: './ruleset/hbo.mrs',
        'path-in-bundle': 'geo/geosite/hbo.mrs',
      },
      twitch: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/twitch.mrs',
        path: './ruleset/twitch.mrs',
        'path-in-bundle': 'geo/geosite/twitch.mrs',
      },
      disney: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/disney.mrs',
        path: './ruleset/disney.mrs',
        'path-in-bundle': 'geo/geosite/disney.mrs',
      },
      niconico: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/niconico.mrs',
        path: './ruleset/niconico.mrs',
        'path-in-bundle': 'geo/geosite/niconico.mrs',
      },
      bbc: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/bbc.mrs',
        path: './ruleset/bbc.mrs',
        'path-in-bundle': 'geo/geosite/bbc.mrs',
      },
      pornhub: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/pornhub.mrs',
        path: './ruleset/pornhub.mrs',
        'path-in-bundle': 'geo/geosite/pornhub.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ForeignMedia.png',
    rules: [
      'RULE-SET,youtube,Media',
      'RULE-SET,netflix,Media',
      'RULE-SET,netflix_ip,Media,no-resolve',
      'RULE-SET,hbo,Media',
      'RULE-SET,twitch,Media',
      'RULE-SET,disney,Media',
      'RULE-SET,niconico,Media',
      'RULE-SET,bbc,Media',
      'RULE-SET,pornhub,Media',
    ],
  },
  {
    name: 'Instagram',
    providers: {
      instagram: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/instagram.mrs',
        path: './ruleset/instagram.mrs',
        'path-in-bundle': 'geo/geosite/instagram.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Instagram.png',
    rules: ['RULE-SET,instagram,Instagram'],
  },
  {
    name: 'FCM',
    direct: true,
    defaultSelected: '直连',
    providers: {
      googlefcm: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/googlefcm.mrs',
        path: './ruleset/googlefcm.mrs',
        'path-in-bundle': 'geo/geosite/googlefcm.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/MiToverG422/Qure@master/IconSet/Color/fcm.png',
    rules: ['RULE-SET,googlefcm,FCM'],
  },
  {
    name: 'Google',
    providers: {
      google: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google.mrs',
        path: './ruleset/google.mrs',
        'path-in-bundle': 'geo/geosite/google.mrs',
      },
      google_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/google.mrs',
        path: './ruleset/google_ip.mrs',
        'path-in-bundle': 'geo/geoip/google.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png',
    rules: ['RULE-SET,google,Google', 'RULE-SET,google_ip,Google,no-resolve'],
  },
  {
    name: 'Microsoft',
    direct: true,
    providers: {
      microsoft: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft.mrs',
        path: './ruleset/microsoft.mrs',
        'path-in-bundle': 'geo/geosite/microsoft.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png',
    rules: ['RULE-SET,microsoft,Microsoft'],
  },
  {
    name: 'Apple',
    direct: true,
    providers: {
      apple: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple.mrs',
        path: './ruleset/apple.mrs',
        'path-in-bundle': 'geo/geosite/apple.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png',
    rules: ['RULE-SET,apple,Apple'],
  },
  {
    name: 'Telegram',
    providers: {
      telegram: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/telegram.mrs',
        path: './ruleset/telegram.mrs',
        'path-in-bundle': 'geo/geosite/telegram.mrs',
      },
      telegram_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/telegram.mrs',
        path: './ruleset/telegram_ip.mrs',
        'path-in-bundle': 'geo/geoip/telegram.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png',
    rules: ['RULE-SET,telegram,Telegram', 'RULE-SET,telegram_ip,Telegram,no-resolve'],
  },
  {
    name: 'NS',
    allNodes: true,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Available.png',
    rules: ['DOMAIN-SUFFIX,nodeseek.com,NS'],
  },
  {
    name: 'Steam',
    direct: true,
    providers: {
      steam: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/steam.mrs',
        path: './ruleset/steam.mrs',
        'path-in-bundle': 'geo/geosite/steam.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png',
    rules: ['RULE-SET,steam,Steam'],
  },
  {
    name: 'TikTok',
    defaultSelected: '日本',
    providers: {
      tiktok: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/tiktok.mrs',
        path: './ruleset/tiktok.mrs',
        'path-in-bundle': 'geo/geosite/tiktok.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png',
    rules: ['RULE-SET,tiktok,TikTok'],
  },
  {
    name: 'Twitter',
    providers: {
      twitter: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/twitter.mrs',
        path: './ruleset/twitter.mrs',
        'path-in-bundle': 'geo/geosite/twitter.mrs',
      },
      twitter_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/twitter.mrs',
        path: './ruleset/twitter_ip.mrs',
        'path-in-bundle': 'geo/geoip/twitter.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png',
    rules: ['RULE-SET,twitter,Twitter', 'RULE-SET,twitter_ip,Twitter,no-resolve'],
  },
  {
    name: 'Emby',
    direct: true,
    providers: {
      emby: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/666OS/rules@release/mihomo/domain/Emby.mrs',
        path: './ruleset/emby.mrs',
        'path-in-bundle': 'geo/geosite/category-emby.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png',
    rules: ['RULE-SET,emby,Emby', 'DOMAIN-SUFFIX,mb3admin.com,Emby', 'DOMAIN-KEYWORD,emby,Emby'],
  },
  {
    name: 'Spotify',
    direct: true,
    providers: {
      spotify: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/spotify.mrs',
        path: './ruleset/spotify.mrs',
        'path-in-bundle': 'geo/geosite/spotify.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png',
    rules: ['RULE-SET,spotify,Spotify'],
  },
  {
    name: 'AdBlock',
    reject: true,
    providers: {
      adblockmihomolite: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.mrs',
        path: './ruleset/adblockmihomolite.mrs',
        'path-in-bundle': 'geo/geosite/category-ads-all.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Advertising.png',
    rules: ['RULE-SET,adblockmihomolite,AdBlock'],
  },
];

// 定义创建地区策略组的函数
function createRegionGroup(name, icon, proxies) {
  const urlTestName = `${name}-自动选择`;
  return [
    {
      ...urlTestBaseOption,
      name: urlTestName,
      proxies,
    },
    {
      ...selectBaseOption,
      name,
      icon,
      proxies: [urlTestName, ...proxies],
    },
  ];
}

// 判断域名规则是否匹配节点域名
function matchDomainPattern(pattern, domains) {
  pattern = pattern.toLowerCase();

  // 精确匹配
  if (!pattern.includes('*') && !pattern.startsWith('+.') && !pattern.startsWith('.')) {
    return domains.has(pattern);
  }

  // +.example.com
  if (pattern.startsWith('+.')) {
    const suffix = pattern.slice(2);
    for (const domain of domains) {
      if (domain === suffix || domain.endsWith(`.${suffix}`)) {
        return true;
      }
    }
    return false;
  }

  // .example.com
  if (pattern.startsWith('.')) {
    const suffix = pattern.slice(1);
    for (const domain of domains) {
      if (domain !== suffix && domain.endsWith(`.${suffix}`)) {
        return true;
      }
    }
    return false;
  }

  // *.example.com、example.*.com 等
  const patternParts = pattern.split('.');
  for (const domain of domains) {
    const domainParts = domain.split('.');

    // 标签数量必须一致
    if (patternParts.length !== domainParts.length) {
      continue;
    }
    let matched = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '*' && patternParts[i] !== domainParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return true;
    }
  }

  return false;
}

// --- 主入口 ---

function main(config) {
  const newConfig = {};

  // 过滤节点列表
  const filteredProxies = (config.proxies || []).filter((proxy) => {
    const type = String(proxy.type ?? '').toLowerCase();
    return type !== 'direct' && type !== 'reject' && !excludeFilter.test(proxy.name);
  });

  // 验证节点列表是否存在代理节点
  if (!filteredProxies.length) {
    const usesProviders = Object.keys(config['proxy-providers'] || {}).length > 0;
    throw new Error(
      usesProviders
        ? '订阅通过 proxy-providers 提供节点，本脚本无法读取，请使用包含 proxies 节点列表的配置进行覆写'
        : '配置文件中未找到任何代理节点，请使用机场提供的配置文件进行覆写',
    );
  }

  // --- 构建地区组和倍率组 ---

  // 节点分类
  // 注意：一个节点可能同时命中多个地区（如中转节点"香港->美国"），会被加入多个地区组；
  // 如不希望如此，可在命中后 break
  const regionGroups = Object.fromEntries(regionDefinitions.map((r) => [r.name, { ...r, proxies: [] }]));
  const otherProxies = [];

  for (const proxy of filteredProxies) {
    let matched = false;
    for (const region of regionDefinitions) {
      if (region.regex.test(proxy.name)) {
        regionGroups[region.name].proxies.push(proxy.name);
        matched = true;
      }
    }

    // 未匹配到地区组的归为其他节点
    if (!matched) {
      otherProxies.push(proxy.name);
    }
  }

  // 构建地区策略组
  const generatedRegionGroups = regionDefinitions
    .filter((r) => regionGroups[r.name].proxies.length > 0)
    .flatMap((r) => createRegionGroup(r.name, r.icon, regionGroups[r.name].proxies));

  if (otherProxies.length > 0) {
    generatedRegionGroups.push(
      ...createRegionGroup(
        '其他节点',
        'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/World_Map.png',
        otherProxies,
      ),
    );
  }

  // --- 构建分流策略组 ---

  const functionalGroups = [];
  const serviceRules = []; // 普通服务分流规则
  const rejectServiceRules = []; // 拦截类规则（广告等），必须先于服务分流匹配
  const finalRuleProviders = { ...baseRuleProviders };

  // 筛选类型为 select 的地区策略组
  const groupNamesOfSelect = generatedRegionGroups.filter((g) => g.type === 'select').map((g) => g.name);

  // 生成基础策略组
  functionalGroups.push(
    {
      ...selectBaseOption,
      name: '默认代理',
      proxies: [...groupNamesOfSelect, '手动选择', '自动选择', '负载均衡'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png',
    },
    {
      ...selectBaseOption,
      name: '手动选择',
      'include-all': true,
      'exclude-type': 'DIRECT',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
    },
    {
      ...urlTestBaseOption,
      name: '自动选择',
      'include-all': true,
    },
    {
      ...loadBalanceBaseOption,
      name: '负载均衡',
      'include-all': true,
    },
  );

  // 构建分流策略组
  for (const svc of serviceConfigs) {
    if (!ruleOptionsEnable[svc.name]) continue;

    // 拦截类（reject）规则需排在所有服务分流之前，
    // 否则 google/twitter 等规则集中包含的广告域名会先被服务规则放行，广告拦截失效
    (svc.reject ? rejectServiceRules : serviceRules).push(...svc.rules);
    Object.assign(finalRuleProviders, svc.providers || {});

    // 添加分流策略组对应的节点列表
    const groupProxies = svc.reject
      ? ['REJECT', 'REJECT-DROP', 'PASS']
      : svc.allNodes
        ? []
        : ['默认代理', '手动选择', '自动选择', '负载均衡', ...groupNamesOfSelect, ...(svc.direct ? ['直连'] : [])];

    // default-selected 引用不存在的成员时内核会静默回退到第一项，
    // 这里先做存在性校验，避免写入无效默认值（如订阅中没有对应地区的节点）
    const defaultSelected =
      svc.defaultSelected !== undefined && (svc.allNodes || groupProxies.includes(svc.defaultSelected))
        ? svc.defaultSelected
        : undefined;

    functionalGroups.push({
      ...selectBaseOption,
      name: svc.name,
      icon: svc.icon,
      ...(svc.allNodes ? { 'include-all': true, 'exclude-type': 'DIRECT' } : { proxies: groupProxies }),
      ...(defaultSelected !== undefined && { 'default-selected': defaultSelected }),
    });
  }

  // 添加其他策略组
  functionalGroups.push(
    {
      ...selectBaseOption,
      name: '漏网之鱼',
      proxies: ['默认代理', '手动选择', ...groupNamesOfSelect, '直连'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Stack.png',
    },
    {
      ...selectBaseOption,
      name: '直连',
      proxies: ['🇨🇳 直连 | IPv4优先', '🇨🇳 直连 | IPv6优先', '🇨🇳 直连 | 双栈'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/China_Map.png',
    },
  );

  // 构建 GLOBAL 全局策略组（新版内核支持自定义 GLOBAL，用于控制全局模式下的展示）
  const globalGroup = {
    ...selectBaseOption,
    name: 'GLOBAL',
    proxies: [...functionalGroups.map((g) => g.name), ...generatedRegionGroups.map((g) => g.name)],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png',
  };

  // --- 添加基础配置 ---

  // ---DNS配置---

  // 读取订阅中的 DNS 配置，保留订阅中的私有 DNS
  // 用以解决部分机场使用私有 DNS 导致无法解析节点的问题
  const originalDnsConfig = config.dns || {};

  // 过滤常见的公共 DNS
  const commonDnsRegex =
    /(223\.5\.5\.5|223\.6\.6\.6|119\.29\.29\.29|1\.12\.12\.12|120\.53\.53\.53|114\.114\.114\.114|180\.76\.76\.76|1\.1\.1\.1|1\.0\.0\.1|8\.8\.8\.8|8\.8\.4\.4|94\.140\.14\.14|94\.140\.15\.15|127\.0\.0\.1|alidns|doh\.pub|dot\.pub|dnspod|dns\.baidu|dns\.google|cloudflare|adguard|system)/i;

  const originalProxyServerNameserver = [
    ...new Set([...(originalDnsConfig['nameserver'] || []), ...(originalDnsConfig['proxy-server-nameserver'] || [])]),
  ].filter((dns) => !commonDnsRegex.test(String(dns)));

  // 收集所有节点域名
  const proxyDomains = new Set(
    filteredProxies.filter((proxy) => typeof proxy.server === 'string').map((proxy) => proxy.server.toLowerCase()),
  );

  // 提取节点域名对应的 DNS 配置
  const originalPolicyNameserver = {};
  for (const policy of [
    originalDnsConfig['nameserver-policy'] || {},
    originalDnsConfig['proxy-server-nameserver-policy'] || {},
  ]) {
    for (const [domain, dns] of Object.entries(policy)) {
      if (matchDomainPattern(domain, proxyDomains)) {
        originalPolicyNameserver[domain] = dns;
      }
    }
  }

  // 国内外 DNS 定义
  const chinaDNS = ['https://dns.alidns.com/dns-query#DIRECT', 'https://doh.pub/dns-query#DIRECT'];
  const foreignDNS = ['https://dns.cloudflare.com/dns-query#默认代理', 'https://dns.google/dns-query#默认代理'];

  newConfig['dns'] = {
    enable: true,
    ipv6: enableIPv6,
    'use-hosts': true,
    'cache-algorithm': 'arc',
    'use-system-hosts': true,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter': ['rule-set:private', 'rule-set:fakeip_filter'],
    'proxy-server-nameserver': [...chinaDNS, ...originalProxyServerNameserver],
    ...(Object.keys(originalPolicyNameserver).length > 0 && {
      'proxy-server-nameserver-policy': originalPolicyNameserver,
    }),
    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    nameserver: [...foreignDNS],
    'nameserver-policy': {
      'rule-set:cn': [...chinaDNS],
    },
    'direct-nameserver': ['system', '223.5.5.5', '119.29.29.29'],
  };

  // ---hosts 配置---

  // 提取订阅 hosts 中与节点域名对应的记录
  const originalHosts = config.hosts || {};
  const proxyHosts = {};
  for (const [domain, value] of Object.entries(originalHosts)) {
    if (matchDomainPattern(domain, proxyDomains)) {
      proxyHosts[domain] = value;
    }
  }

  newConfig['hosts'] = {
    'dns.alidns.com': ['223.5.5.5', '223.6.6.6'],
    'doh.pub': ['1.12.12.12', '120.53.53.53'],
    'dns.cloudflare.com': ['1.1.1.1', '1.0.0.1'],
    'dns.google': ['8.8.8.8', '8.8.4.4'],

    // 解决谷歌商店无法下载的问题
    'services.googleapis.cn': ['services.googleapis.com'],

    // 屏蔽哔哩哔哩PCDN，解决访问视频卡顿问题
    '+.mcdn.bilivideo.com': ['0.0.0.0'],
    '+.mcdn.bilivideo.cn': ['0.0.0.0'],
    '+.edge.mountaintoys.cn': ['0.0.0.0'],

    // 保留机场用于节点解析的 hosts
    ...proxyHosts,
  };

  // ---域名嗅探---

  // 还原直连 IP / 未经过内核 DNS 的连接的域名，提高规则命中率
  // 注意：交易所类 App 的自选 IP 直连/非标准 TLS 可能被嗅探破坏，默认由 enableSniffer 关闭
  if (enableSniffer) newConfig['sniffer'] = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': true,
    'override-destination': true,
    sniff: {
      HTTP: { ports: [80, '8080-8880'] },
      TLS: { ports: [443, 8443] },
      QUIC: { ports: [443, 8443] },
    },
    // 跳过嗅探：米家设备心跳、苹果推送，嗅探会导致断连
    'skip-domain': ['Mijia Cloud', '+.push.apple.com'],
  };

  // ---基础项---

  if (mixedPort) {
    newConfig['mixed-port'] = mixedPort;
  }
  newConfig['allow-lan'] = true;
  newConfig['ipv6'] = enableIPv6;
  newConfig['mode'] = 'rule';
  newConfig['log-level'] = 'info';
  newConfig['bind-address'] = '*';
  newConfig['unified-delay'] = true;
  newConfig['tcp-concurrent'] = true;
  newConfig['keep-alive-idle'] = 600;
  newConfig['keep-alive-interval'] = 60;
  newConfig['find-process-mode'] = 'strict';

  newConfig['external-controller'] = '127.0.0.1:9090';
  newConfig['external-ui'] = 'ui';
  newConfig['external-ui-url'] = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip';
  if (apiSecret) {
    newConfig['secret'] = apiSecret;
  }

  newConfig['profile'] = {
    'store-selected': true,
    'store-fake-ip': true,
  };

  newConfig['ntp'] = {
    enable: true,
    'write-to-system': false,
    server: 'ntp.aliyun.com',
    port: 123,
    interval: 60,
  };

  newConfig['tun'] = {
    enable: true,
    stack: 'system',
    'auto-route': true,
    'strict-route': true,
    'auto-redirect': true,
    'auto-detect-interface': true,
    'dns-hijack': ['any:53', 'tcp://any:53'],
  };

  // 添加节点
  newConfig['proxies'] = [
    ...filteredProxies,
    {
      name: '🇨🇳 直连 | IPv4优先',
      type: 'direct',
      'ip-version': 'ipv4-prefer',
    },
    {
      name: '🇨🇳 直连 | IPv6优先',
      type: 'direct',
      'ip-version': 'ipv6-prefer',
    },
    {
      name: '🇨🇳 直连 | 双栈',
      type: 'direct',
    },
  ];

  newConfig['proxy-groups'] = [globalGroup, ...functionalGroups, ...generatedRegionGroups];
  newConfig['rule-providers'] = finalRuleProviders;

  // 规则最终顺序：私网 → 广告拦截 → QUIC 拦截 → GitHub → 国内直连 → 服务分流 → 兜底
  newConfig['rules'] = [
    // 私有网络最先直连
    ...privateRules,

    // 广告拦截白名单（救回误杀域名）
    ...adblockAllowRules,

    // 广告拦截必须先于所有服务分流
    ...rejectServiceRules,

    // 禁用国外 QUIC 流量（可由 enableQuicBlock 关闭，见静态配置区说明）
    ...(enableQuicBlock ? [quicBlockRule] : []),

    // 强制代理（github 需在 Microsoft 分流之前）
    ...forceProxyRules,

    // 国内直连细分
    ...cnDirectRules,

    // 各服务分流
    ...serviceRules,

    // 兜底规则
    'RULE-SET,gfw,默认代理',
    'RULE-SET,cn_additional,直连',
    'RULE-SET,cn_ip,直连',
    'MATCH,漏网之鱼',
  ];

  return newConfig;
}
