// rules 预定义
const rules = [
  // 私有网络直连
  'RULE-SET,private,直连',
  'RULE-SET,private_ip,直连,no-resolve',

  // 进程规则
  'RULE-SET,DownloadApps,直连', // 常见磁力下载软件

  // 国内直连
  'RULE-SET,games_cn,直连',
  'RULE-SET,epicgames,直连',
  'RULE-SET,nvidia_cn,直连',
  'RULE-SET,microsoft_cn,直连',
  'RULE-SET,cloudflare_cn,直连',
  'RULE-SET,apple_cn,直连',
  'DOMAIN,fsend.cn,直连',
];
