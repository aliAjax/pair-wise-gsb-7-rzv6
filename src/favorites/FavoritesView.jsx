import React from 'react';
import { listFavorites, favoriteStats } from './favoriteRules';

// 访客“我的收藏”页面（页面层）。
// 失效收藏不消失：灰显、标注原因、保留原记录；有效的可点击进入详情。
export default function FavoritesView({ exhibits, favoriteRecords, onOpen, onBack, onRemove }) {
  const items = listFavorites(favoriteRecords, exhibits);
  const stats = favoriteStats(favoriteRecords, exhibits);
  const valid = items.filter((i) => i.valid);
  const invalid = items.filter((i) => !i.valid);

  return (
    <div className="visitor">
      <header>
        <div className="brand"><span className="mark">M</span><span>潮汐美术馆 · 我的收藏</span></div>
        <button className="ghost" onClick={onBack}>← 返回展项</button>
      </header>
      <main className="visitor-main fav-page">
        <span className="eyebrow">MY FAVORITES</span>
        <h1>我收藏的<em>展项</em></h1>
        <p className="lead">共 {stats.total} 条 · {stats.valid} 条有效{stats.invalid > 0 ? ` · ${stats.invalid} 条已失效` : ''}</p>

        {items.length === 0 && (
          <div className="fav-empty">还没有收藏。在已发布的展项详情页点击「收藏展项」即可保存到这里。</div>
        )}

        {valid.length > 0 && (
          <div className="fav-group">
            <div className="visitor-grid">
              {valid.map((item) => (
                <FavCard key={item.id} item={item} onOpen={onOpen} onRemove={onRemove} />
              ))}
            </div>
          </div>
        )}

        {invalid.length > 0 && (
          <div className="fav-group invalid-group">
            <h2 className="fav-group-title">已失效 · {invalid.length}（记录已保留，展项重新发布后自动恢复）</h2>
            <div className="fav-invalid-list">
              {invalid.map((item) => (
                <div className="fav-invalid-row" key={item.id}>
                  <span className="fav-dot" style={{ background: item.exhibit ? item.exhibit.color : '#c3cbc7' }} />
                  <span className="fav-row-copy">
                    <strong>{item.exhibit ? item.exhibit.title : `展项 #${item.exhibitId}`}</strong>
                    <small>{item.exhibit ? `${item.exhibit.room} · ${item.exhibit.type}` : ''}</small>
                  </span>
                  <span className="fav-badge broken">{item.reason}</span>
                  <button className="fav-cancel" onClick={() => onRemove(item.exhibitId)}>移除记录</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FavCard({ item, onOpen, onRemove }) {
  const x = item.exhibit;
  return (
    <article className="visitor-card fav-card">
      <div className="art" style={{ background: x.color }} onClick={() => onOpen(x.id)}>
        <span>{String(x.id).padStart(2, '0')}</span>
        <i>↗</i>
      </div>
      <div className="card-meta" onClick={() => onOpen(x.id)}>
        <small>{x.room}</small>
        <h3>{x.title}</h3>
        <p>{x.desc}</p>
      </div>
      <button className="fav-cancel" onClick={() => onRemove(x.id)}>★ 取消收藏</button>
    </article>
  );
}
