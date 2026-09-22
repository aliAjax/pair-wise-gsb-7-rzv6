// 展项数据：种子数据与 localStorage 读写，独立于页面。

export const STATUS_PUBLISHED = '已发布';
export const STATUS_DRAFT = '草稿';
export const STATUS_OFFLINE = '已下架';

export const seedExhibits = [
  { id: 1, title: '潮汐之后', room: 'A01 · 主展厅', type: '装置', desc: '一件记录海岸线变化的沉浸式影像装置。', audio: 'https://example.com/audio.mp3', status: STATUS_PUBLISHED, color: '#e6b45d' },
  { id: 2, title: '未寄出的信', room: 'B02 · 纸上时间', type: '档案', desc: '来自三代人的手写信件与声音档案。', audio: '', status: STATUS_DRAFT, color: '#ef8f84' },
  { id: 3, title: '柔软的边界', room: 'C01 · 新媒介', type: '互动', desc: '观众的移动会改变墙面上的光影。', audio: '', status: STATUS_PUBLISHED, color: '#83b9b1' },
];

const STORAGE_KEY = 'guide-exhibits';

export const loadExhibits = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedExhibits;
  } catch {
    return seedExhibits;
  }
};

export const saveExhibits = (exhibits) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exhibits));
