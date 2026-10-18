# コアラ・ラボ

iPad の Koala Sampler（無料の機能だけ）で、1曲のビートを完成させる初心者向け教材（全7章・約3時間）。ビルド不要の静的サイト。

## 手元で動かす

`起動.bat` をダブルクリック（http://localhost:8766/ が開く）。iPad で使うには GitHub Pages などで https 公開する。

## 作り

- FM-1 ラボ（`../fm1-lab`）の部品を一部コピーして使っている：`synth.js` `fx.js` `notes.js` `store.js`（保存場所の名前だけ `koalalab.` に変更）
- `js/core/klesson.js`：章ページの共通部品。Koala の中はブラウザからのぞけないので、「やってみる」は本人が「やってみた」を押して開く。判定できるのはブラウザ側のクイズ・耳の課題・チェックリスト
- `js/core/kit.js` / `wav.js`：教材オリジナルの素材（ブラウザで合成 → WAV で保存 → Koala にインポート）

## 事実確認

操作手順は公式マニュアル https://manual.koalasampler.com/tablet/ で確かめる。マニュアルに書かれていないボタン位置などは `.check-hw[data-label="要確認"]` で書き、推測で書かない。マニュアルの文章はそのまま写さず、自分の言葉で書く。

## 記録を消さないための決まり

FM-1 ラボと同じ（課題IDは変えない・消さない、変えるなら `chapters.js` の `TASK_ALIASES`、保存は `store.js` 経由、テストは `?sandbox`）。
