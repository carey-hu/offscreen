# 环境音频文件

把以下文件放进这个目录,可以替换默认的程序生成噪音,获得真实的环境音:

| 文件名      | 应该是什么                |
| ----------- | ------------------------- |
| `rain.mp3`  | 雨声 — 中等强度的下雨声 |
| `forest.mp3`| 森林 — 鸟鸣 / 风穿过树叶  |
| `cafe.mp3`  | 咖啡馆 — 背景人声 + 杯具  |
| `fire.mp3`  | 篝火 — 木柴噼啪          |

## 推荐免费来源

- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) — 完全免费,可商用,直接下载 MP3
- [Mixkit](https://mixkit.co/free-sound-effects/ambience/) — 免费,部分需署名
- [Freesound](https://freesound.org/) — CC 协议,需注册

## 文件要求

- **格式**: MP3 / OGG / WAV(浏览器原生支持的格式)
- **时长**: 1–3 分钟最佳(代码会自动 loop)
- **比特率**: 128kbps+
- **首尾**: 尽量是平稳段,避免突然起音/收尾,loop 时不易察觉

## 不放也能用

如果这个目录是空的:
1. 代码会先尝试公开 CDN(Pixabay / Mixkit 链接,在 `src/lib/audio.ts` 里)
2. 如果 CDN 也不通,会回落到 Web Audio API 程序生成的彩色噪音
   - 雨声 → 粉噪音 + 高通(嘶嘶感)
   - 森林 → 粉噪音 + 带通(中频沙沙)
   - 咖啡馆 → 棕噪音(低频鸣响)
   - 篝火 → 粉噪音 + 低通(温暖)

也就是说,**总有声音**,只是真实度不同。
