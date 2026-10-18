// 章の一覧。ready=true の章だけ開ける。
//
// 課題ID（data-task / data-try）の名前を変えたときは、ここに「古いID → 新しいID」を足す（記録を引き継ぐ）。
export const TASK_ALIASES = {};

export const CHAPTERS = [
  { id: 'ch01', no: 1, title: 'コアラの地図', min: 20, ready: true },
  { id: 'ch02', no: 2, title: '音を集める', min: 30, ready: true },
  { id: 'ch03', no: 3, title: '音を整える', min: 30, ready: true },
  { id: 'ch04', no: 4, title: 'ビートを打ち込む', min: 35, ready: true },
  { id: 'ch05', no: 5, title: 'ベースとメロディ', min: 25, ready: true },
  { id: 'ch06', no: 6, title: '展開とエフェクト', min: 25, ready: true },
  { id: 'ch07', no: 7, title: '書き出して完成', min: 15, ready: true },
];

// 公式マニュアル（操作の確認先）
export const MANUAL = {
  base: 'https://manual.koalasampler.com',
  mobile: 'https://manual.koalasampler.com/mobile/',
  learning: 'https://www.koalasampler.com/learning/',
};
