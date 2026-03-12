#!/usr/bin/env node
/**
 * 项目级经验教训记录工具
 * 用法: node hooks/insight-capture.js create "场景" "问题" "教训" [关键词...]
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.dirname(__dirname);
const EXPERIENCES_DIR = path.join(PROJECT_DIR, 'memory', 'experiences');

// 确保目录存在
if (!fs.existsSync(EXPERIENCES_DIR)) {
  fs.mkdirSync(EXPERIENCES_DIR, { recursive: true });
}

function getNextId() {
  const files = fs.readdirSync(EXPERIENCES_DIR).filter(f => f.endsWith('.md'));
  const ids = files.map(f => {
    const match = f.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  });
  return Math.max(0, ...ids) + 1;
}

function createExperience(scene, problem, lesson, keywords = []) {
  const id = getNextId();
  const timestamp = new Date().toISOString().split('T')[0];

  const content = `# ${scene}

**ID**: EXP-${String(id).padStart(3, '0')}
**级别**: P2
**记录时间**: ${timestamp}
**关键词**: ${keywords.join(', ')}

## 场景
${scene}

## 问题
${problem}

## 教训/解决方案
${lesson}

## 预防 checklist
- [ ] 遇到类似场景时回顾此经验
- [ ] 团队内部分享
`;

  const filename = `${String(id).toString().padStart(3, '0')}-${scene.slice(0, 20).replace(/\s+/g, '-')}.md`;
  const filepath = path.join(EXPERIENCES_DIR, filename);

  fs.writeFileSync(filepath, content);
  console.log(`✅ 经验已记录: ${filepath}`);
  return filepath;
}

function listExperiences() {
  const files = fs.readdirSync(EXPERIENCES_DIR).filter(f => f.endsWith('.md'));

  console.log('📚 项目经验库列表:\n');
  files.forEach(f => {
    const content = fs.readFileSync(path.join(EXPERIENCES_DIR, f), 'utf8');
    const title = content.split('\n')[0].replace('# ', '');
    const idMatch = content.match(/\*\*ID\*\*: (EXP-\d+)/);
    const levelMatch = content.match(/\*\*级别\*\*: (P\d)/);
    console.log(`${idMatch?.[1] || '???'} [${levelMatch?.[1] || '?'}] ${title}`);
  });
}

// 主逻辑
const args = process.argv.slice(2);
const command = args[0];

if (command === 'create') {
  const [_, scene, problem, lesson, ...keywords] = args;
  if (!scene || !problem || !lesson) {
    console.log('用法: node hooks/insight-capture.js create "场景" "问题" "教训" [关键词...]');
    process.exit(1);
  }
  createExperience(scene, problem, lesson, keywords);
} else if (command === 'list') {
  listExperiences();
} else {
  console.log(`
项目级经验教训记录工具

用法:
  node hooks/insight-capture.js create "场景描述" "遇到的具体问题" "学到的教训" [关键词...]
  node hooks/insight-capture.js list

示例:
  node hooks/insight-capture.js create "报价单成本计算错误" "小数精度丢失" "使用Prisma.Decimal进行计算" prisma decimal cost-calculation
`);
}
