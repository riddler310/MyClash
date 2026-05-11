// 策略组公共配置
const groupBaseOption = {
  interval: 600,
  timeout: 3000,
  url: 'https://g.cn/generate_204',
  lazy: true,
  'max-failed-times': 3,
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
  tolerance: 100,
  icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png',
  hidden: true,
};

// 定义分流策略组配置
const serviceConfigs = [
  {
    key: 'ai',
    name: 'AI',
    providers: {
      ai: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs',
        path: './ruleset/ai.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png',
    rules: ['RULE-SET,ai,AI'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    providers: {
      youtube: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs',
        path: './ruleset/youtube.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png',
    rules: [
      'AND,((NETWORK,UDP),(DST-PORT,443),(RULE-SET,youtube)),REJECT', // 阻断 YouTube UDP 流量
      'RULE-SET,youtube,YouTube',
    ],
  },
  {
    key: 'googlefcm',
    name: 'FCM',
    proxyMode: 'directfirst',
    providers: {
      googlefcm: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/googlefcm.mrs',
        path: './ruleset/googlefcm.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/MiToverG422/Qure@master/IconSet/Color/fcm.png',
    rules: ['RULE-SET,googlefcm,FCM'],
  },
  {
    key: 'google',
    name: 'Google',
    providers: {
      google: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google.mrs',
        path: './ruleset/google.mrs',
      },
      google_ip: {
        ...ruleProviderCommonIpcidr,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/google.mrs',
        path: './ruleset/google_ip.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png',
    rules: ['RULE-SET,google,Google', 'RULE-SET,google_ip,Google,no-resolve'],
  },
  {
    key: 'github',
    name: 'GitHub',
    providers: {
      github: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/github.mrs',
        path: './ruleset/github.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png',
    rules: ['RULE-SET,github,GitHub'],
  },
  {
    key: 'microsoft',
    name: 'Microsoft',
    providers: {
      microsoft: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft.mrs',
        path: './ruleset/microsoft.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png',
    rules: ['RULE-SET,microsoft,Microsoft'],
  },
  {
    key: 'apple',
    name: 'Apple',
    providers: {
      apple: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple.mrs',
        path: './ruleset/apple.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png',
    rules: ['RULE-SET,apple,Apple'],
  },
  {
    key: 'telegram',
    name: 'Telegram',
    providers: {
      telegram: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/telegram.mrs',
        path: './ruleset/telegram.mrs',
      },
      telegram_ip: {
        ...ruleProviderCommonIpcidr,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/telegram.mrs',
        path: './ruleset/telegram_ip.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png',
    rules: [
      'RULE-SET,telegram,Telegram',
      'RULE-SET,telegram_ip,Telegram,no-resolve',
    ],
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    providers: {
      cloudflare: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/cloudflare.mrs',
        path: './ruleset/cloudflare.mrs',
      },
      cloudflare_ip: {
        ...ruleProviderCommonIpcidr,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cloudflare.mrs',
        path: './ruleset/cloudflare_ip.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cloudflare.png',
    rules: [
      'RULE-SET,cloudflare,Cloudflare',
      'RULE-SET,cloudflare_ip,Cloudflare,no-resolve',
    ],
  },
  {
    key: 'pixiv',
    name: 'Pixiv',
    providers: {
      pixiv: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/pixiv.mrs',
        path: './ruleset/pixiv.mrs',
      },
    },
    icon: 'https://play-lh.googleusercontent.com/Ls9opXo6-wfEWmbBU8heJaFS8HwWydssWE1J3vexIGvkF-UJDqcW7ZMD8w6dQABfygONd4z3Yt4TfRDZAPYq=w480-h960-rw',
    rules: [
      'RULE-SET,pixiv,Pixiv',
      'PROCESS-NAME,com.perol.pixez,Pixiv', // Pixez
      'PROCESS-NAME,com.perol.play.pixez,Pixiv', // Pixez Google Play 版
    ],
  },
  {
    key: 'steam',
    name: 'Steam',
    providers: {
      steam: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/steam.mrs',
        path: './ruleset/steam.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png',
    rules: ['RULE-SET,steam,Steam'],
  },
  {
    key: 'twitter',
    name: 'Twitter',
    providers: {
      twitter: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/twitter.mrs',
        path: './ruleset/twitter.mrs',
      },
      twitter_ip: {
        ...ruleProviderCommonIpcidr,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/twitter.mrs',
        path: './ruleset/twitter_ip.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png',
    rules: [
      'RULE-SET,twitter,Twitter',
      'RULE-SET,twitter_ip,Twitter,no-resolve',
    ],
  },
  {
    key: 'instagram',
    name: 'Instagram',
    providers: {
      instagram: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/instagram.mrs',
        path: './ruleset/instagram.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Instagram.png',
    rules: ['RULE-SET,instagram,Instagram'],
  },
  {
    key: 'emby',
    name: 'Emby',
    providers: {
      emby: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/666OS/rules@release/mihomo/domain/Emby.mrs',
        path: './ruleset/emby.mrs',
      },
      emby_ip: {
        ...ruleProviderCommonIpcidr,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/666OS/rules@release/mihomo/ip/Emby.mrs',
        path: './ruleset/emby_ip.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png',
    rules: [
      'RULE-SET,emby,Emby',
      'RULE-SET,emby_ip,Emby,no-resolve',
      'DOMAIN-KEYWORD,emby,Emby',
    ],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    proxyMode: 'direct',
    providers: {
      spotify: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/spotify.mrs',
        path: './ruleset/spotify.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png',
    rules: ['RULE-SET,spotify,Spotify'],
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    providers: {
      tiktok: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/tiktok.mrs',
        path: './ruleset/tiktok.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png',
    rules: ['RULE-SET,tiktok,TikTok'],
  },
  {
    key: 'netflix',
    name: 'Netflix',
    providers: {
      netflix: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/netflix.mrs',
        path: './ruleset/netflix.mrs',
      },
      netflix_ip: {
        ...ruleProviderCommonIpcidr,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/netflix.mrs',
        path: './ruleset/netflix_ip.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png',
    rules: [
      'RULE-SET,netflix,Netflix',
      'RULE-SET,netflix_ip,Netflix,no-resolve',
    ],
  },
  {
    key: 'adblock',
    name: '广告拦截',
    proxyMode: 'reject',
    providers: {
      adblockmihomolite: {
        ...ruleProviderCommonDomain,
        ...ruleProviderFormatMrs,
        url: 'https://fastly.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.mrs',
        path: './ruleset/adblockmihomolite.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Advertising.png',
    rules: ['RULE-SET,adblockmihomolite,广告拦截'],
  },
];
