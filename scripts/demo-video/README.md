# 系统演示视频生成脚本

自动为成本管理系统生成截图素材包和旁白稿。

## 用法

### 1. 安装依赖

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

### 2. 启动项目

```bash
pnpm dev
```

### 3. 运行生成脚本

```bash
npx tsx scripts/demo-video/generate-demo.ts
```

脚本会自动检查 `http://localhost:5174` 是否可达，不可达时会提示先启动项目。

### 4. 查看输出

生成内容在 `demos/` 目录：

```
demos/
├── 01-login/
├── 02-dashboard/
│   ├── full.png
│   ├── highlight-0-zoom-0-1x.png
│   ├── highlight-0-zoom-1-1.15x.png
│   ├── highlight-0-zoom-2-1.3x.png
│   └── narration.md
├── storyboard.json
└── script.md
```

### 5. 合成视频

#### 方案 A：导入剪辑软件（推荐）

把 `demos/` 下的图片按 `storyboard.json` 的时间轴导入剪映/CapCut，配上 `script.md` 的旁白。

#### 方案 B：FFmpeg 快速合成

```bash
ffmpeg -framerate 24 -i demos/%02d/full.png -vf "zoompan=z='min(zoom+0.0015,1.5)':d=120" -c:v libx264 -pix_fmt yuv420p -y demo.mp4
```

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DEMO_BASE_URL` | `http://localhost:5174` | 前端地址 |
| `DEMO_USER` | `admin` | 登录账号 |
| `DEMO_PASS` | `admin123` | 登录密码 |

## 自定义页面

编辑 `scripts/demo-video/pages.config.ts` 中的 `PAGES` 数组，无需改动脚本即可调整演示顺序、页面路径和解说文案：

```typescript
{
  id: '07-custom',
  name: '自定义页面',
  path: '/your/page',
  highlights: ['[data-demo="your-element"]'],
  narration: '这是自定义页面的解说文案。'
}
```

前端代码中给关键元素加上 `data-demo="xxx"` 属性，脚本就能自动放大截图。

## 注意事项

- 页面需要完全加载后再截图，脚本已等待 `networkidle`
- 测试数据尽量整洁，避免截图出现脏数据
- 放大倍数最大 1.3x，避免模糊
