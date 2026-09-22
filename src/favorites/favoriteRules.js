// 收藏判定规则层：纯函数，不碰存储、不碰界面。
// 页面与工作台只通过这里判断“能不能收藏 / 是否失效 / 撤回会影响多少条”。

export const PUBLISHED = '已发布';
const OFFLINE = '已下架';

// 展项是否存在
export const findExhibit = (exhibits, exhibitId) =>
  exhibits.find((x) => x.id === exhibitId) || null;

// 访客只能收藏已发布展项
export const canFavorite = (exhibit) => !!exhibit && exhibit.status === PUBLISHED;

// 同一展项是否已存在收藏记录（任何状态下都算，重复收藏只留一条）
export const hasFavorite = (favoriteRecords, exhibitId) =>
  favoriteRecords.some((r) => r.exhibitId === exhibitId);

// 失效原因；有效返回 null。
// 规则：展项撤回发布（草稿）或下架后，收藏不消失，转为失效并保留原记录；
// 展项被删除时同样保留记录并标记失效。
export const invalidReason = (exhibit) => {
  if (!exhibit) return '展项已删除';
  if (exhibit.status === OFFLINE) return '展项已下架';
  if (exhibit.status !== PUBLISHED) return '展项已撤回发布';
  return null;
};

// 单条收藏记录的视图状态
export const decorateRecord = (record, exhibits) => {
  const exhibit = findExhibit(exhibits, record.exhibitId);
  const reason = invalidReason(exhibit);
  return {
    ...record,
    exhibit,
    valid: reason === null,
    reason,
  };
};

// 收藏列表（最新收藏在前），供“我的收藏”页面使用
export const listFavorites = (favoriteRecords, exhibits) =>
  favoriteRecords
    .map((r) => decorateRecord(r, exhibits))
    .sort((a, b) => b.createdAt - a.createdAt);

// 收藏 / 取消收藏：返回是否需要写入，保证同一展项永远只有一条
export const shouldAdd = (favoriteRecords, exhibit) =>
  canFavorite(exhibit) && !hasFavorite(favoriteRecords, exhibit.id);

// 工作台：撤回发布或下架前，提示将失效的收藏数量。
// 目标状态非“已发布”时，对该展项当前仍有效的收藏计数（每个展项至多一条）。
export const countAffectedFavorites = (favoriteRecords, exhibits, exhibitId, nextStatus) => {
  if (nextStatus === PUBLISHED) return 0;
  const exhibit = findExhibit(exhibits, exhibitId);
  if (!exhibit || exhibit.status !== PUBLISHED) return 0;
  return favoriteRecords.some((r) => r.exhibitId === exhibitId) ? 1 : 0;
};

// 工作台：重新发布时将恢复的收藏数量（保留的记录自动恢复有效，不产生新条目）
export const countRestoredFavorites = (favoriteRecords, exhibits, exhibitId) => {
  const exhibit = findExhibit(exhibits, exhibitId);
  if (!exhibit || exhibit.status === PUBLISHED) return 0;
  return favoriteRecords.some((r) => r.exhibitId === exhibitId) ? 1 : 0;
};

export const favoriteStats = (favoriteRecords, exhibits) => {
  const items = listFavorites(favoriteRecords, exhibits);
  return {
    total: items.length,
    valid: items.filter((i) => i.valid).length,
    invalid: items.filter((i) => !i.valid).length,
  };
};
