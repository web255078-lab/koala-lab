// 第1章 コアラの地図
import { createChapter } from './core/klesson.js';

const S = 'SAMPLE', Q = 'SEQUENCE', P = 'PERFORM', M = 'MENU';
const OPTS = [S, Q, P, M];
const ask = (q, ans, explain) => ({ q, options: OPTS, answer: OPTS.indexOf(ans), explain });

const ch = createChapter({
  id: 'ch01',
  title: '第1章 コアラの地図',
  tasks: ['quiz', 'check'],
  tries: ['try1', 'try2', 'try3'],
  cando: [
    { text: 'SAMPLE・SEQUENCE・PERFORM が「集める・並べる・演奏する」だと分かる', need: ['try1'] },
    { text: 'パッドとバンク（16個×A〜D＝64個）が分かる', need: ['try2'] },
    { text: 'ソングを名前をつけて保存・読み込みできる', need: ['try3', 'check'] },
    { text: 'やりたいことが、どの画面にあるか迷わない', need: ['quiz'] },
  ],
});

ch.quiz('quiz', [
  ask('マイクで声を録って、パッドに入れたい', S, 'パッドに音を入れるのは SAMPLE。'),
  ask('テンポ（速さ）を変えたい', Q, 'テンポや拍子は SEQUENCE の再生ボタンの近く。'),
  ask('パッドの音の高さ（ピッチ）や音量を変えたい', S, 'パッドを選ぶと SAMPLE に VOL・PITCH が出る。'),
  ask('叩いたリズムを録音して、フレーズにしたい', Q, '録音ボタンでシーケンスを録るのは SEQUENCE。'),
  ask('演奏しながら、指でエフェクトをかけて遊びたい', P, 'エフェクトのボタンが並ぶのは PERFORM。'),
  ask('作った曲に名前をつけて保存したい', M, '保存・読み込み・新しい曲は MENU。'),
  ask('いくつかのシーケンスを切り替えて、曲として演奏したい', P, 'シーケンスを切り替えて演奏するのは PERFORM。'),
  ask('完成した曲を WAV ファイルにして、ほかのアプリで使いたい', M, '書き出し（EXPORT）は MENU。'),
], { need: 7 });
ch.checklist('check');
ch.renderProgress();
