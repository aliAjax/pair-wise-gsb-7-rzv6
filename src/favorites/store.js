// 收藏数据层：只负责收藏记录的本地持久化与发布订阅。
// 按 exhibitId 幂等存取，不含任何展项状态判定（判定见 rules.js），
// 页面也不直接读写 localStorage（读写经 useFavorites.js）。

const STORAGE_KEY = 'guide-favorites';

// 演示种子：两条均对应已发布展项，初始为有效收藏
const seedFavorites = [
  { exhibitId: 1, title: '潮汐之后', room: 'A01 · 主展厅', type: '装置', color: '#e6b45d', addedAt: 1710800000000 },
  { exhibitId: 3, title: '柔软的边界', room: 'C01 · 新媒介', type: '互动', color: '#83b9b1', addedAt: 1710800600000 },
];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seedFavorites;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

let records = readStorage();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* 存储不可用时仅保留内存状态 */
  }
}

function emit() {
  listeners.forEach((fn) => fn(records));
}

export function getFavorites() {
  return records;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 幂等写入：同一展项只保留一条（数据层兜底，规则层 rules.js 先行判定）
export function addFavorite(record) {
  if (records.some((item) => item.exhibitId === record.exhibitId)) return records;
  records = records.concat(record);
  persist();
  emit();
  return records;
}

// 撤回发布 / 下架不会走到这里：失效只改状态，收藏记录保持不动
export function removeFavorite(exhibitId) {
  records = records.filter((item) => item.exhibitId !== exhibitId);
  persist();
  emit();
  return records;
}
