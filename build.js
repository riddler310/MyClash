const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_DIR = path.join(__dirname, 'Script');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'mihomoScript.js');

// 必须严格按照此顺序拼接，保证变量和函数声明在调用之前
const fileOrder = [
  'config/enable.js',
  'config/rules.js',
  'config/regionDefinitions.js',
  'config/ruleProviders.js',
  'config/serviceConfigs.js',
  'config/main.js',
];

let combined = '';
for (const relPath of fileOrder) {
  const fullPath = path.join(SRC_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`错误：找不到源文件 ${fullPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  combined += `\n` + content.trim() + '\n';
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, combined, 'utf8');
console.log(`✅ 构建成功：${OUTPUT_FILE}`);
