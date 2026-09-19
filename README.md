# Chord Sense

一个用于训练和弦听辨的轻量网站：用户听取随机生成的钢琴和弦，选择 **1–7 级数**、**和弦性质** 以及可选的 **add / omit 修饰音**。

## 当前设计

- 默认调式为 C 大调，可在 12 个主音与大调 / 小调之间切换。
- 左上角“主和弦”按钮会播放当前调式的一级和弦，用于建立相对音感。
- 难度不是传统关卡，而是一组随机出题规则：
  1. `maj`、`min` 三和弦
  2. 加入 `dim`、`aug`、`sus2`、`sus4`
  3. 七和弦
  4. 六和弦、七挂四与 `add` / `omit`
  5. 九和弦
  6. 十一和弦
  7. 十三和弦
- 每个难度都有无限随机题池，没有通关、解锁或固定题目数量。
- 播放器在每个音上独立随机生成 MIDI 力度，并轻微错开触发时间。
- 题目进入后会自动播放一次；首次需要用户点击一次，以符合浏览器的音频自动播放策略。
- 做题记录与错题本保存在 `localStorage`。

## 音频方案

项目使用 [smplr](https://github.com/danigb/smplr) 播放本地缓存的 **Splendid Grand Piano** 采样。

- 只保留 C3–B5 目标音域。
- 包含 PPP、PP、MP、MF、FF 力度规则。
- 构建产物带 100 个唯一采样点，同时提供 OGG 与 m4a 回退，约 22 MiB；浏览器只会加载其中一种格式。
- 运行时不会请求 GitHub 或 CDN。
- 需要重新下载采样时运行：

```bash
npm run fetch-audio
```

如果网络需要代理，可先设置：

```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 音源署名

Splendid Grand Piano 采样由 AKAI 以 Public Domain 发布，SFZ 映射来自 [smpldsnds/sfzinstruments-splendid-grand-piano](https://github.com/smpldsnds/sfzinstruments-splendid-grand-piano)。项目内附有 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。


## GitHub Pages

仓库推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并部署 `dist` 到 GitHub Pages。
