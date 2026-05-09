// --- 静态配置区域 ---

// 脚本链接：https://raw.githubusercontent.com/AIsouler/MyClash/refs/heads/main/Script/mihomoScript.js

/**
 * 整个脚本的总开关
 * true = 启用
 * false = 禁用
 */
const enable = true;

/**
 * 分流规则配置，会自动生成对应的策略组
 * true = 启用
 * false = 禁用
 */
const ruleOptionsEnable = {
  ai: true, // 国外AI服务
  youtube: true, // YouTube
  googlefcm: true, // FCM服务
  google: true, // Google服务
  github: true, // GitHub服务
  microsoft: true, // Microsoft服务
  apple: true, // Apple服务
  telegram: true, // Telegram通讯软件
  twitter: true, // Twitter社交平台
  instagram: true, // Instagram社交平台
  steam: true, // Steam游戏平台
  cloudflare: true, // Cloudflare服务
  pixiv: true, // Pixiv绘画网站
  emby: true, // Emby媒体服务
  spotify: true, // Spotify音乐服务
  tiktok: true, // TikTok短视频平台
  netflix: true, // Netflix视频服务
  adblock: true, // 广告拦截
};

/**
 * 节点组配置，用于分类地区节点和倍率节点
 * 未启用的节点组将不会被生成，且该节点组的节点会被分类到其他节点组中
 * true = 启用
 * false = 禁用
 */
const regionDefinitionsEnable = {
  香港: true,
  日本: true,
  美国: true,
  新加坡: true,
  台湾省: true,
  低倍率节点: true,
  高倍率节点: true,
};

/**
 * 全局排除节点过滤配置
 * 该配置用于启用全局排除节点过滤功能
 * true = 启用
 * false = 禁用
 */
const excludeFilterEnable = true;

// 定义全局排除节点的正则表达式，用于排除非地区的信息节点
const excludeFilter =
  /群|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|超时|收藏|福利|邀请|好友|失联|选择|剩余|公益|发布|DIZTNA|通路|登录|禁止|定时|渠道|牢记|永久|余额|阁下|本站|刷新|导航|⚠️|@|Expire|http|com/u;
