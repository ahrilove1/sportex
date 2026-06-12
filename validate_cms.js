// SPORTEX CMS Validator — 每次修改 index.html 后运行
// 用法: node validate_cms.js

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'sportexmanger', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

let errors = [];
let warnings = [];

// ═══ 1. 提取 <script> 中的 JS 代码 ═══
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let allJS = '';
let scriptCount = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  scriptCount++;
  allJS += match[1] + '\n';
}

if (scriptCount === 0) {
  errors.push('NO <script> tags found!');
} else if (scriptCount > 2) {
  errors.push(`Too many <script> tags: ${scriptCount} (expected 1-2)`);
}

// ═══ 2. 语法检查 (支持 async/await) ═══
const vm = require('vm');
try {
  new vm.Script(allJS);
  console.log('✅ JavaScript syntax: OK');
} catch (e) {
  errors.push(`JS SYNTAX ERROR: ${e.message}`);
}

// ═══ 2b. 括号平衡检查 ═══
let braceDepth = 0;
for (const ch of allJS) {
  if (ch === '{') braceDepth++;
  if (ch === '}') braceDepth--;
}
if (braceDepth !== 0) {
  errors.push(`BRACE MISMATCH: depth=${braceDepth} (should be 0)`);
}

// ═══ 3. 关键模式检查 ═══
const checks = [
  {
    name: 'fileList.map without Array.from',
    pattern: /(?<!Array\.from\()fileList\.map/,
    level: 'error',
    msg: 'fileList.map 没有 Array.from() 包裹'
  },
  {
    name: 'resizeImage returns original file',
    pattern: /ok\(file\)/,
    level: 'warn',
    msg: 'resizeImage 可能返回未压缩的原文件'
  },
  {
    name: 'tree path leading slash',
    pattern: /path:\s*['"]\/images\//,
    level: 'warn',
    msg: 'Git tree path 可能包含前导斜杠（需 strip）'
  },
  {
    name: 'viewImage onclick broken escaping',
    pattern: /viewImage\(''\+/,
    level: 'error',
    msg: 'viewImage onclick 转义符丢失（应为 viewImage(\\\'）'
  },
  {
    name: 'copyUrl onclick broken escaping',
    pattern: /copyUrl\(''\+/,
    level: 'error',
    msg: 'copyUrl onclick 转义符丢失（应为 copyUrl(\\\'）'
  },
  {
    name: 'ghAPI returns Response',
    pattern: /return fetch\('https:\/\/api\.github\.com'\+path,opts\)/,
    level: 'warn',
    msg: 'ghAPI 直接返回 fetch，错误不会被 log'
  },
];

for (const check of checks) {
  if (check.pattern.test(allJS)) {
    const msg = `[${check.level.toUpperCase()}] ${check.msg}`;
    if (check.level === 'error') {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }
}

// ═══ 4. 必要函数检查 ═══
const requiredFuncs = [
  'renderImages',
  'renderProducts',
  'uploadFileAndSet',
  'resizeImage',
  'ghAPI',
  'loadData',
];

for (const func of requiredFuncs) {
  if (!allJS.includes(`function ${func}(`)) {
    errors.push(`Missing required function: ${func}()`);
  }
}

// ═══ 5. 输出结果 ═══
console.log('');
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  warnings.forEach(w => console.log(`   ${w}`));
}

if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} error(s):`);
  errors.forEach(e => console.log(`   ${e}`));
  console.log('\n🚫 VALIDATION FAILED — 请修复后重试\n');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed — 可以安全推送\n');
  process.exit(0);
}
