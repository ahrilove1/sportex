// SPORTEX Front-end Validator — 防止 HTML 标签误入 <script> 等回归 bug
// 用法: node validate_site.js
// 每次 push 时由 GitHub Actions 自动运行，失败会阻断合并/部署

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;

// 不扫描的目录（只关心公开页面的 .html）
const SKIP_DIRS = new Set(['node_modules', '.git', '.wrangler', 'images', 'data', 'functions', 'sportexmanger']);

// HTML 标签名清单：仅用于「语法报错时」提示可疑标签，不单独作为失败依据
const HTML_TAG_RE = /<\s*\/?\s*(link|meta|style|div|section|header|footer|nav|script|body|head|html|title|img|span|p|ul|ol|li|a|h1|h2|h3|h4|form|input|button|table|br|main|article)\b/i;

function walkHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walkHtml(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

// 提取内联 <script>（无 src 属性）的内容
function inlineScripts(html) {
  const blocks = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/src\s*=/.test(m[1])) continue; // 外部脚本内容为空，跳过
    blocks.push(m[2]);
  }
  return blocks;
}

const files = walkHtml(ROOT);
const errors = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf-8');
  const scripts = inlineScripts(html);

  scripts.forEach((body, i) => {
    try {
      new vm.Script(body, { filename: rel });
    } catch (e) {
      // 语法错误 = 权威失败信号（<link> 误入 script 正是这一类）
      let hint = '';
      const tag = body.match(HTML_TAG_RE);
      if (tag) hint = `  ↳ 疑似 HTML 标签 <${tag[1]}> 误入 <script> 块（应放到 <head>）`;
      errors.push(`${rel} [script #${i + 1}]: JS 语法错误 — ${e.message}${hint}`);
    }
  });
}

if (errors.length) {
  console.error(`\n❌ 发现 ${errors.length} 个问题：\n`);
  errors.forEach(e => console.error(`   ${e}`));
  console.error('\n🚫 VALIDATION FAILED — 请修复后再推送\n');
  process.exit(1);
}

console.log(`✅ 检查通过：${files.length} 个 HTML 页面的内联脚本均无语法错误`);
process.exit(0);
