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

// 定义创建地区策略组的函数
function createRegionGroup(name, icon, proxies) {
  const autoTestName = `${name}-自动选择`;
  return [
    {
      ...urlTestBaseOption,
      name: autoTestName,
      proxies,
    },
    {
      ...selectBaseOption,
      name,
      icon,
      proxies: [autoTestName, ...proxies],
    },
  ];
}

// 定义分流策略组和对应的规则
const serviceConfigs = [
  {
    key: 'ai',
    name: 'AI',
    providers: ['ai'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png',
    rules: ['RULE-SET,ai,AI'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    providers: ['youtube'],
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
    providers: ['googlefcm'],
    icon: 'https://fastly.jsdelivr.net/gh/MiToverG422/Qure@master/IconSet/Color/fcm.png',
    rules: ['RULE-SET,googlefcm,FCM'],
  },
  {
    key: 'google',
    name: 'Google',
    providers: ['google', 'google_ip'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png',
    rules: ['RULE-SET,google,Google', 'RULE-SET,google_ip,Google,no-resolve'],
  },
  {
    key: 'github',
    name: 'GitHub',
    providers: ['github'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png',
    rules: ['RULE-SET,github,GitHub'],
  },
  {
    key: 'microsoft',
    name: 'Microsoft',
    providers: ['microsoft'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png',
    rules: ['RULE-SET,microsoft,Microsoft'],
  },
  {
    key: 'apple',
    name: 'Apple',
    providers: ['apple'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png',
    rules: ['RULE-SET,apple,Apple'],
  },
  {
    key: 'telegram',
    name: 'Telegram',
    providers: ['telegram', 'telegram_ip'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png',
    rules: [
      'RULE-SET,telegram,Telegram',
      'RULE-SET,telegram_ip,Telegram,no-resolve',
    ],
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    providers: ['cloudflare', 'cloudflare_ip'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cloudflare.png',
    rules: [
      'RULE-SET,cloudflare,Cloudflare',
      'RULE-SET,cloudflare_ip,Cloudflare,no-resolve',
    ],
  },
  {
    key: 'pixiv',
    name: 'Pixiv',
    providers: ['pixiv'],
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
    providers: ['steam'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png',
    rules: ['RULE-SET,steam,Steam'],
  },
  {
    key: 'twitter',
    name: 'Twitter',
    providers: ['twitter', 'twitter_ip'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png',
    rules: [
      'RULE-SET,twitter,Twitter',
      'RULE-SET,twitter_ip,Twitter,no-resolve',
    ],
  },
  {
    key: 'instagram',
    name: 'Instagram',
    providers: ['instagram'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Instagram.png',
    rules: ['RULE-SET,instagram,Instagram'],
  },
  {
    key: 'emby',
    name: 'Emby',
    providers: ['emby', 'emby_ip'],
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
    providers: ['spotify'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png',
    rules: ['RULE-SET,spotify,Spotify'],
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    providers: ['tiktok'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png',
    rules: ['RULE-SET,tiktok,TikTok'],
  },
  {
    key: 'netflix',
    name: 'Netflix',
    providers: ['netflix', 'netflix_ip'],
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
    providers: ['adblockmihomolite'],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Advertising.png',
    rules: ['RULE-SET,adblockmihomolite,广告拦截'],
  },
];
