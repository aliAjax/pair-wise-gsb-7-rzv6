import { useMemo, useState } from 'react';
import { useFavorites } from './useFavorites';
import { decorateFavorites, hasFavorited, INVALID_REASON_TEXT } from './rules';

// 收藏按钮：仅用于已发布展项；重复点击为取消收藏
export function FavoriteButton({ exhibit, onNotice, className = '' }) {
  const { favorites, toggleFavorite } = useFavorites();
  const active = hasFavorited(favorites, exhibit.id);

  const handleClick = (e) => {
    e.stopPropagation();
    const result = toggleFavorite(exhibit);
    if (onNotice) {
      if (result === 'added') onNotice('已加入收藏');
      else if (result === 'removed') onNotice('已取消收藏');
      else if (result === 'blocked') onNotice('展项未发布，暂不可收藏');
    }
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      className={'fav-btn' + (active ? ' active' : '') + (className ? ' ' + className : '')}
      onClick={handleClick}
    >
      <span className="fav-icon">{active ? '♥' : '♡'}</span>
      {active ? '已收藏' : '收藏'}
    </button>
  );
}

export function FavoritesView({ exhibits, onBack, onOpenExhibit }) {
  const { favorites, unfavorite } = useFavorites();
  const [notice, setNotice] = useState('');
  const decorated = useMemo(() => decorateFavorites(favorites, exhibits), [favorites, exhibits]);
  const validCount = decorated.filter((x) => x.valid).length;

  return (
    <div className="visitor">
      <header>
        <div className="brand">
          <span className="mark">M</span>
          <span>潮汐美术馆 · 我的收藏</span>
        </div>
        <button className="ghost" onClick={onBack}>
          ← 返回导览
        </button>
      </header>
      <main className="visitor-main fav-page">
        <span className="eyebrow">MY FAVORITES</span>
        <h1>
          我收藏的<em>展项</em>
        </h1>
        <p className="lead">
          共 {favorites.length} 条记录，其中 {validCount} 条可正常导览。展项撤回或下架后记录仍会保留，并标注为失效。
        </p>
        {decorated.length === 0 ? (
          <div className="fav-empty">还没有收藏。在导览中点击 ♡ 即可收藏已发布的展项。</div>
        ) : (
          <div className="visitor-grid fav-grid">
            {decorated.map((item) =>
              item.valid ? (
                <article
                  className="visitor-card"
                  key={item.exhibitId}
                  onClick={() => onOpenExhibit(item.exhibitId)}
                >
                  <div className="art" style={{ background: item.exhibit.color }}>
                    <span>{String(item.exhibit.id).padStart(2, '0')}</span>
                    <i>↗</i>
                  </div>
                  <div className="card-meta">
                    <small>{item.exhibit.room}</small>
                    <h3>{item.exhibit.title}</h3>
                    <p>{item.exhibit.desc}</p>
                    <button
                      className="fav-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        unfavorite(item.exhibitId);
                        setNotice('已移除该收藏');
                      }}
                    >
                      移除收藏
                    </button>
                  </div>
                </article>
              ) : (
                <article className="visitor-card fav-card-invalid" key={item.exhibitId}>
                  <div className="art faded" style={{ background: item.color }}>
                    <span>{String(item.exhibitId).padStart(2, '0')}</span>
                    <i className="badge-invalid">失效</i>
                  </div>
                  <div className="card-meta">
                    <small>{item.room || '—'}</small>
                    <h3>{item.title}</h3>
                    <p className="fav-note">
                      {INVALID_REASON_TEXT[item.reason] || '展项暂不可用'}，原收藏记录已保留；重新发布后将自动恢复。
                    </p>
                    <button
                      className="fav-remove"
                      onClick={() => {
                        unfavorite(item.exhibitId);
                        setNotice('已移除该收藏');
                      }}
                    >
                      移除收藏
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </main>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
