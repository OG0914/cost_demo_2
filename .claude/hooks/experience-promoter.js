#!/usr/bin/env node
/**
 * 项目级经验晋升工具
 * 根据匹配次数自动将P2提升为P1，P1提升为P0
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.dirname(__dirname);
const EXPERIENCES_DIR = path.join(PROJECT_DIR, 'memory', 'experiences');

function promoteExperiences() {
  if (!fs.existsSync(EXPERIENCES_DIR)) {
    console.log('经验目录不存在，无需晋升');
    return;
  }

  const files = fs.readdirSync(EXPERIENCES_DIR).filter(f => f.endsWith('.md'));

  files.forEach(f => {
    const filepath = path.join(EXPERIENCES_DIR, f);
    let content = fs.readFileSync(filepath, 'utf8');

    // 检查是否需要晋升
    const p2Match = content.match(/\*\*级别\*\*: P2/);
    const p1Match = content.match(/\*\*级别\*\*: P1/);

    if (p2Match) {
      // 如果已经匹配3次以上，晋升P1
      const matches = (content.match(/匹配记录/g) || []).length;
      if (matches >= 3) {
        content = content.replace('**级别**: P2', '**级别**: P1');
        fs.writeFileSync(filepath, content);
        console.log(`⬆️  ${f} 已晋升至 P1`);
      }
    } else if (p1Match) {
      // 如果已经匹配10次以上，晋升P0
      const matches = (content.match(/匹配记录/g) || []).length;
      if (matches >= 10) {
        content = content.replace('**级别**: P1', '**级别**: P0');
        fs.writeFileSync(filepath, content);
        console.log(`⬆️️  ${f} 已晋升至 P0`);
      }
    }
  });
}

function recordMatch(expId) {
  if (!fs.existsSync(EXPERIENCES_DIR)) {
    console.log('经验目录不存在');
    return;
  }

  const files = fs.readdirSync(EXPERIENCES_DIR).filter(f => f.includes(expId) && f.endsWith('.md'));
  if (files.length === 0) {
    console.log(`未找到经验: ${expId}`);
    return;
  }

  const filepath = path.join(EXPERIENCES_DIR, files[0]);
  let content = fs.readFileSync(filepath, 'utf8');

  const timestamp = new Date().toISOString();
  content += `\n- 匹配记录: ${timestamp}`;
  fs.writeFileSync(filepath, content);
  console.log(`✅ 已记录匹配: ${expId}`);
}

// 主逻辑
const args = process.argv.slice(2);
const command = args[0];

if (command === 'promote') {
  promoteExperiences();
} else if (command === 'match') {
  recordMatch(args[1]);
} else {
  console.log(`
项目级经验晋升工具

用法:
  node hooks/experience-promoter.js promote    # 运行晋升检查
  node hooks/experience-promoter.js match EXP-001  # 记录一次匹配
`);
}
