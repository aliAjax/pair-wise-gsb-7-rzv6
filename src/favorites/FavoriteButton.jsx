import React from 'react';
import { canFavorite, hasFavorite } from './favoriteRules';

// 展项详情页的收藏按钮。
// 仅负责交互与展示：能不能收藏、是否已收藏均由 favoriteRules 判定。
export default function FavoriteButton({ exhibit, favoriteRecords, onAdd, onRemove }) {
  if (!exhibit) return null;
  const favorited = hasFavorite(favoriteRecords, exhibit.id);
  const allowed = canFavorite(exhibit);

  return (
    <button
      className={'fav-btn' + (favorited ? ' on' : '') + (allowed ? '' : ' off')}
      disabled={!allowed}
      onClick={() => (favorited ? onRemove(exhibit.id) : onAdd(exhibit))}
      title={allowed ? (favorited ? '取消收藏' : '收藏展项') : '仅已发布展项可收藏'}
    >
      <span className="fav-ico">{favorited ? '★' : '☆'}</span>
      {favorited ? '已收藏' : allowed ? '收藏展项' : '当前不可收藏'}
    </button>
  );
}
