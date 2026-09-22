import { useCallback, useSyncExternalStore } from 'react';
import { addFavorite, getFavorites, removeFavorite, subscribe } from './store';
import { buildRecord, hasFavorited, shouldAddFavorite } from './rules';

// 页面与收藏数据层之间的唯一 React 绑定，页面不直接碰 store。
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getFavorites);

  // 返回本次操作结果，由页面决定提示文案：
  // added 新收藏 / removed 取消收藏 / blocked 展项未发布，不允许收藏
  const toggleFavorite = useCallback((exhibit) => {
    if (hasFavorited(getFavorites(), exhibit.id)) {
      removeFavorite(exhibit.id);
      return 'removed';
    }
    if (!shouldAddFavorite(getFavorites(), exhibit)) return 'blocked';
    addFavorite(buildRecord(exhibit));
    return 'added';
  }, []);

  const unfavorite = useCallback((exhibitId) => {
    removeFavorite(exhibitId);
  }, []);

  return { favorites, toggleFavorite, unfavorite };
}
