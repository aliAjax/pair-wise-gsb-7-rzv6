// 收藏判定规则层：全部为纯函数，不读写存储、不依赖 React。
// 工作台与访客页面共用同一套规则，避免判定逻辑散落在页面里。

export const PUBLISHED = '已发布';
export const DRAFT = '草稿';
export const OFFLINE = '已下架';

export function isPublished(exhibit) {
  return Boolean(exhibit) && exhibit.status === PUBLISHED;
}

// 规则 1：访客只能收藏已发布展项
export const canFavorite = isPublished;

export function findFavorite(favorites, exhibitId) {
  return favorites.find((item) => item.exhibitId === exhibitId);
}

export function hasFavorited(favorites, exhibitId) {
  return favorites.some((item) => item.exhibitId === exhibitId);
}

// 规则 2：同一展项重复收藏只留一条（未发布或已收藏时都不再写入）
export function shouldAddFavorite(favorites, exhibit) {
  return canFavorite(exhibit) && !hasFavorited(favorites, exhibit.id);
}

// 收藏时保存展项快照：撤回发布或下架后，原记录仍可展示给访客
export function buildRecord(exhibit, now = Date.now()) {
  return {
    exhibitId: exhibit.id,
    title: exhibit.title,
    room: exhibit.room,
    type: exhibit.type,
    color: exhibit.color,
    addedAt: now,
  };
}

// 规则 3：有效/失效完全由展项当前状态派生，不改动收藏记录本身。
// 撤回发布（草稿）、下架、展项被移除 → 失效；重新发布 → 自动恢复有效，
// 因为记录始终在，恢复时无需新增条目，也就不会产生重复。
export function decorateFavorites(favorites, exhibits) {
  return favorites
    .map((record) => {
      const exhibit = exhibits.find((x) => x.id === record.exhibitId) || null;
      if (!exhibit) {
        return { ...record, valid: false, reason: 'missing', exhibit: null };
      }
      if (exhibit.status === PUBLISHED) {
        return { ...record, valid: true, reason: null, exhibit };
      }
      return {
        ...record,
        valid: false,
        reason: exhibit.status === DRAFT ? 'withdrawn' : 'offline',
        exhibit,
      };
    })
    .sort((a, b) => b.addedAt - a.addedAt);
}

// 规则 4：撤回发布 / 下架前，统计将转为失效的收藏数量
// （展项当前为已发布，其名下收藏此刻均有效，状态一变全部失效）
export function countAffectedFavorites(favorites, exhibitId) {
  return favorites.filter((item) => item.exhibitId === exhibitId).length;
}

export const INVALID_REASON_TEXT = {
  withdrawn: '展项已撤回发布',
  offline: '展项已下架',
  missing: '展项已移除',
};
