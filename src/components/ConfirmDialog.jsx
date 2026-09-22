// 通用确认弹窗：工作台撤回发布 / 下架前提示受影响的收藏数量
export function ConfirmDialog({
  open,
  title,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel,
  children,
}) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={danger ? 'primary danger-btn' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
