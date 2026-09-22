import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { useFavorites } from './favorites/useFavorites';
import { countAffectedFavorites, isPublished, OFFLINE } from './favorites/rules';
import { FavoriteButton, FavoritesView } from './favorites/FavoritesView';
import { ConfirmDialog } from './components/ConfirmDialog';

const seed = [
  { id: 1, title: '潮汐之后', room: 'A01 · 主展厅', type: '装置', desc: '一件记录海岸线变化的沉浸式影像装置。', audio: 'https://example.com/audio.mp3', status: '已发布', color: '#e6b45d' },
  { id: 2, title: '未寄出的信', room: 'B02 · 纸上时间', type: '档案', desc: '来自三代人的手写信件与声音档案。', audio: '', status: '草稿', color: '#ef8f84' },
  { id: 3, title: '柔软的边界', room: 'C01 · 新媒介', type: '互动', desc: '观众的移动会改变墙面上的光影。', audio: '', status: '已发布', color: '#83b9b1' },
];
const load = () => {
  try {
    return JSON.parse(localStorage.getItem('guide-exhibits')) || seed;
  } catch {
    return seed;
  }
};

function App() {
  const [exhibits, setExhibits] = useState(load);
  const [selected, setSelected] = useState(1);
  const [view, setView] = useState('edit');
  const [filter, setFilter] = useState('全部');
  const [form, setForm] = useState({ title: '', room: '', type: '装置', desc: '', audio: '' });
  const [notice, setNotice] = useState('');
  // pendingAction: null | 'withdraw'（撤回发布）| 'offline'（下架）
  const [pendingAction, setPendingAction] = useState(null);
  const { favorites } = useFavorites();

  useEffect(() => localStorage.setItem('guide-exhibits', JSON.stringify(exhibits)), [exhibits]);

  const visible = useMemo(
    () => (filter === '全部' ? exhibits : exhibits.filter((x) => x.status === filter)),
    [exhibits, filter]
  );
  const current = exhibits.find((x) => x.id === selected) || exhibits[0];

  const add = () => {
    if (!form.title.trim()) return;
    const item = {
      ...form,
      id: Date.now(),
      status: '草稿',
      color: ['#e6b45d', '#ef8f84', '#83b9b1', '#9ba7dc'][exhibits.length % 4],
    };
    setExhibits([...exhibits, item]);
    setSelected(item.id);
    setForm({ title: '', room: '', type: '装置', desc: '', audio: '' });
    setNotice('展项已保存为草稿');
  };
  const update = (k, v) =>
    setExhibits(exhibits.map((x) => (x.id === current.id ? { ...x, [k]: v } : x)));

  const setStatus = (id, status) =>
    setExhibits(exhibits.map((x) => (x.id === id ? { ...x, status } : x)));

  // 已发布 → 撤回发布：先提示将失效的收藏数量
  const requestWithdraw = () => setPendingAction('withdraw');
  // 已发布 → 下架：同样会使相关收藏失效
  const requestOffline = () => setPendingAction('offline');
  // 草稿 / 已下架 → 发布：对应收藏按规则自动恢复有效，不产生新条目
  const republish = () => {
    const restored = countAffectedFavorites(favorites, current.id);
    setStatus(current.id, '已发布');
    setNotice(restored > 0 ? `已发布，${restored} 条访客收藏已恢复有效` : '已发布，访客预览已更新');
  };

  const affected = current ? countAffectedFavorites(favorites, current.id) : 0;
  const confirmPending = () => {
    if (pendingAction === 'withdraw') {
      setStatus(current.id, '草稿');
      setNotice(affected > 0 ? `已撤回发布，${affected} 条访客收藏已转为失效并保留` : '已撤回发布');
    } else if (pendingAction === 'offline') {
      setStatus(current.id, OFFLINE);
      setNotice(affected > 0 ? `已下架，${affected} 条访客收藏已转为失效并保留` : '已下架');
    }
    setPendingAction(null);
  };

  const exportData = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(exhibits, null, 2)], { type: 'application/json' }));
    a.download = 'exhibition-guide.json';
    a.click();
    setNotice('已导出展项数据');
  };

  // ---------------- 访客：导览首页 ----------------
  if (view === 'visitor')
    return (
      <div className="visitor">
        <header>
          <div className="brand">
            <span className="mark">M</span>
            <span>潮汐美术馆</span>
          </div>
          <div className="visitor-actions">
            <button className="ghost" onClick={() => setView('favorites')}>
              ♡ 我的收藏（{favorites.length}）
            </button>
            <button className="ghost" onClick={() => setView('edit')}>
              返回编辑
            </button>
          </div>
        </header>
        <main className="visitor-main">
          <span className="eyebrow">VISITOR GUIDE / 2024</span>
          <h1>
            沿着作品，<em>走进</em>另一种时间。
          </h1>
          <p className="lead">当你靠近一件作品，它的故事就开始流动。选择一个展项开始探索。</p>
          <div className="visitor-grid">
            {exhibits
              .filter((x) => x.status === '已发布')
              .map((x) => (
                <article
                  className="visitor-card"
                  key={x.id}
                  onClick={() => {
                    setSelected(x.id);
                    setView('detail');
                  }}
                >
                  <div className="art" style={{ background: x.color }}>
                    <span>{String(x.id).padStart(2, '0')}</span>
                    <i>↗</i>
                  </div>
                  <div className="card-meta">
                    <small>{x.room}</small>
                    <h3>{x.title}</h3>
                    <p>{x.desc}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <FavoriteButton exhibit={x} onNotice={setNotice} />
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </main>
        {notice && <div className="toast">{notice}</div>}
      </div>
    );

  // ---------------- 访客：我的收藏 ----------------
  if (view === 'favorites')
    return (
      <FavoritesView
        exhibits={exhibits}
        onBack={() => setView('visitor')}
        onOpenExhibit={(id) => {
          setSelected(id);
          setView('detail');
        }}
      />
    );

  // ---------------- 访客：展项详情 ----------------
  if (view === 'detail' && current)
    return (
      <div className="visitor">
        <header>
          <div className="brand">
            <span className="mark">M</span>
            <span>潮汐美术馆 · 导览</span>
          </div>
          <div className="visitor-actions">
            <button className="ghost" onClick={() => setView('favorites')}>
              ♡ 我的收藏（{favorites.length}）
            </button>
            <button className="ghost" onClick={() => setView('visitor')}>
              ← 全部展项
            </button>
          </div>
        </header>
        <main className="detail">
          <div className="detail-art" style={{ background: current.color }}>
            <span>{String(current.id).padStart(2, '0')}</span>
          </div>
          <div className="detail-copy">
            <span className="eyebrow">
              {current.room} / {current.type}
            </span>
            <h1>{current.title}</h1>
            <p>{current.desc}</p>
            <div className="detail-actions">
              {current.audio && (
                <button className="audio" onClick={() => setNotice('正在播放导览音频…')}>
                  ▶ 播放语音导览
                </button>
              )}
              {isPublished(current) && <FavoriteButton exhibit={current} onNotice={setNotice} />}
            </div>
            <div className="qr">
              <div className="qr-box">▦</div>
              <div>
                <strong>分享这个展项</strong>
                <small>扫描二维码，在手机上继续阅读</small>
              </div>
            </div>
          </div>
        </main>
        {notice && <div className="toast">{notice}</div>}
      </div>
    );

  // ---------------- 工作台 ----------------
  const actionLabel =
    current?.status === '已发布' ? '撤回发布' : current?.status === OFFLINE ? '重新发布' : '发布更新';

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <span className="mark">M</span>
          <span>展览工作台</span>
        </div>
        <div className="side-label">当前项目</div>
        <div className="project">
          <span className="project-dot"></span>
          <div>
            <strong>潮汐之后</strong>
            <small>2024 春季展</small>
          </div>
          <span>⌄</span>
        </div>
        <nav>
          <button className="active">
            ▧ <span>展项内容</span>
            <b>{exhibits.length}</b>
          </button>
          <button>
            ⌁ <span>展厅动线</span>
          </button>
          <button>
            ◉ <span>二维码</span>
          </button>
        </nav>
        <div className="side-foot">
          <button>⚙ 设置</button>
          <small>已自动保存 · 刚刚</small>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">EXHIBITION BUILDER</span>
            <h1>展项内容</h1>
          </div>
          <div className="top-actions">
            <button className="secondary" onClick={exportData}>
              ↓ 导出 JSON
            </button>
            <button className="secondary" onClick={() => setView('visitor')}>
              ◉ 访客预览
            </button>
            {current?.status === '已发布' ? (
              <>
                <button className="secondary" onClick={requestOffline}>
                  下架
                </button>
                <button className="primary" onClick={requestWithdraw}>
                  撤回发布 <span>↗</span>
                </button>
              </>
            ) : (
              <button className="primary" onClick={republish}>
                {actionLabel} <span>↗</span>
              </button>
            )}
          </div>
        </header>
        <div className="content">
          <section className="list-pane">
            <div className="list-head">
              <div>
                <h2>全部展项</h2>
                <span>{exhibits.length} 个展项</span>
              </div>
              <button
                className="add-btn"
                onClick={() => document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' })}
              >
                ＋ 添加展项
              </button>
            </div>
            <div className="filters">
              {['全部', '已发布', '草稿', OFFLINE].map((x) => (
                <button className={filter === x ? 'selected' : ''} onClick={() => setFilter(x)} key={x}>
                  {x}
                </button>
              ))}
            </div>
            <div className="exhibit-list">
              {visible.map((x) => (
                <button
                  className={'exhibit-row ' + (selected === x.id ? 'chosen' : '')}
                  key={x.id}
                  onClick={() => setSelected(x.id)}
                >
                  <span className="thumb" style={{ background: x.color }}>
                    {String(x.id).padStart(2, '0')}
                  </span>
                  <span className="row-copy">
                    <strong>{x.title}</strong>
                    <small>
                      {x.room} · {x.type}
                    </small>
                  </span>
                  <span className={'status ' + (x.status === '已发布' ? 'live' : x.status === OFFLINE ? 'offline' : 'draft')}>
                    {x.status}
                  </span>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </section>
          <section className="form-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">EDIT EXHIBIT</span>
                <h2>编辑展项</h2>
              </div>
              <span className={'status ' + (current?.status === '已发布' ? 'live' : current?.status === OFFLINE ? 'offline' : 'draft')}>
                {current?.status}
              </span>
            </div>
            {current && (
              <div className="editor">
                <label>
                  展项标题
                  <input value={current.title} onChange={(e) => update('title', e.target.value)} />
                </label>
                <div className="two">
                  <label>
                    所在展厅
                    <input value={current.room} onChange={(e) => update('room', e.target.value)} />
                  </label>
                  <label>
                    内容类型
                    <select value={current.type} onChange={(e) => update('type', e.target.value)}>
                      <option>装置</option>
                      <option>档案</option>
                      <option>互动</option>
                      <option>绘画</option>
                    </select>
                  </label>
                </div>
                <label>
                  展项介绍
                  <textarea rows="5" value={current.desc} onChange={(e) => update('desc', e.target.value)} />
                </label>
                <label>
                  语音导览 URL
                  <input value={current.audio} placeholder="https://…" onChange={(e) => update('audio', e.target.value)} />
                  <small className="hint">访客扫描二维码后可播放</small>
                </label>
                <div className="preview-block">
                  <div className="preview-heading">
                    <span>二维码预览</span>
                    <button onClick={() => setNotice('二维码链接已复制')}>复制链接</button>
                  </div>
                  <div className="qr-preview">
                    <div className="qr-box big">▦</div>
                    <div>
                      <strong>展项-{String(current.id).padStart(3, '0')}</strong>
                      <small>/guide/{current.id}</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="new-form">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">NEW ENTRY</span>
                  <h2>快速添加展项</h2>
                </div>
              </div>
              <div className="two">
                <input placeholder="展项标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input placeholder="展厅编号" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </div>
              <textarea
                placeholder="一句话介绍…"
                rows="2"
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
              />
              <button className="primary full" onClick={add}>
                保存新展项
              </button>
            </div>
          </section>
        </div>
      </main>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction === 'withdraw' ? '撤回发布？' : '下架展项？'}
        confirmText={pendingAction === 'withdraw' ? '确认撤回' : '确认下架'}
        danger
        onConfirm={confirmPending}
        onCancel={() => setPendingAction(null)}
      >
        {affected > 0 ? (
          <p>
            当前有 <strong className="warn-num">{affected}</strong> 位访客收藏了该展项。
            {pendingAction === 'withdraw' ? '撤回发布' : '下架'}后，这些收藏将<strong>转为失效状态并保留原记录</strong>
            ；展项重新发布时会自动恢复有效，不会产生重复条目。
          </p>
        ) : (
          <p>当前没有访客收藏该展项。{pendingAction === 'withdraw' ? '撤回发布' : '下架'}后访客将无法看到它。</p>
        )}
      </ConfirmDialog>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
