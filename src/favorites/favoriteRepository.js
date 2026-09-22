// 收藏数据层：只负责收藏记录的持久化（localStorage）与原始读写。
// 记录结构：{ id, exhibitId, createdAt }
// 不做任何业务判定（能否收藏、是否失效均由 favoriteRules 负责）。

const STORAGE_KEY = 'guide-favorites';
const listeners = new Set();

function readAll() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  listeners.forEach((fn) => fn(list));
}

export const favoriteRepository = {
  list() {
    return readAll();
  },
  // 追加一条收藏记录；是否允许追加由规则层决定
  add(exhibitId) {
    const list = readAll();
    list.push({ id: Date.now(), exhibitId, createdAt: Date.now() });
    writeAll(list);
    return list;
  },
  // 按展项删除收藏记录（访客主动取消收藏）
  remove(exhibitId) {
    writeAll(readAll().filter((r) => r.exhibitId !== exhibitId));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
