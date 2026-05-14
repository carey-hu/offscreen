# OpenFocus PWA

一个开源的番茄钟与专注统计 PWA。适合部署到 EdgeOne Pages、Vercel、Netlify 或任意静态托管平台。

## 功能

- 番茄钟 / 长专注 / 正计时 / 自定义倒计时
- 专注任务标题与标签
- 今日、本周、全部统计
- 专注记录本地保存
- PWA 支持，可添加到手机桌面
- 预留 Supabase 云同步接口

> 注意：Web/PWA 无法读取 iPhone 系统屏幕使用时间、App 使用记录、拿起手机次数，也不能限制其他 App。这个项目只统计本应用内部产生的专注数据。

## 本地运行

```bash
npm install
npm run dev
```

访问：

```bash
http://localhost:5173
```

## 构建

```bash
npm run build
```

构建产物在：

```bash
dist
```

## 部署到 EdgeOne Pages

1. 将项目上传到 GitHub。
2. 进入 EdgeOne Pages，新建项目。
3. 选择 GitHub 仓库。
4. 构建命令填写：

```bash
npm run build
```

5. 输出目录填写：

```bash
dist
```

6. 部署完成后访问 EdgeOne 分配的域名。

## 云同步扩展

第一版默认使用 IndexedDB 本地存储。后续可启用 Supabase：

1. 复制 `.env.example` 为 `.env`
2. 填写：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. 在 Supabase 项目的 SQL Editor 执行 [`supabase/schema.sql`](supabase/schema.sql)（幂等，已有库重跑也安全）。

> 该 schema 包含软删除所需的 `deleted_at` 列。少了它会导致删除操作云端静默失败 —— 本地能删，但下次同步又把记录拉回来。

## 开源建议

不要使用 OffScreen 的名称、图标、界面布局和文案。建议作为独立项目发布，例如：

- OpenFocus
- FocusBoard
- PomodoroBoard

## License

MIT
