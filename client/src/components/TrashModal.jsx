import { useEffect, useState } from 'react';
import { computeTrashExpiry } from '../services/taskApi.js';

export function TrashModal({
  isOpen,
  trashItems,
  onClose,
  onRestore,
  onDeletePermanent,
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'project' | 'list' | 'task'

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawItems = Array.isArray(trashItems) ? trashItems : [];
  const items = rawItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const projectCount = rawItems.filter((i) => i.type === 'project').length;
  const listCount = rawItems.filter((i) => i.type === 'list').length;
  const taskCount = rawItems.filter((i) => i.type === 'task' || i.type === 'todo').length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Trash"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 22px',
            borderBottom: '1px solid rgba(190, 201, 192, 0.35)',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}
            >
              delete
            </span>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.35rem' }}>
              Trash
            </h2>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--surface-container)',
                color: 'var(--on-surface-variant)',
              }}
            >
              {rawItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close trash modal"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '1px solid rgba(190, 201, 192, 0.6)',
              background: 'var(--surface-lowest)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--on-surface-variant)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* 30-Day Buffer Policy Banner */}
        <div
          style={{
            padding: '10px 22px',
            background: 'rgba(154, 245, 198, 0.25)',
            borderBottom: '1px solid rgba(190, 201, 192, 0.35)',
            fontSize: '0.78rem',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
            verified_user
          </span>
          <span>
            <strong>30-Day Safety Buffer:</strong> Items stay here for 30 days before being automatically purged. You can restore them anytime or permanently delete them immediately below.
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ padding: '10px 22px 4px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`pill-tag ${filterType === 'all' ? 'amber' : ''}`}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setFilterType('all')}
          >
            All Items ({rawItems.length})
          </button>
          <button
            type="button"
            className={`pill-tag ${filterType === 'project' ? 'amber' : ''}`}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setFilterType('project')}
          >
            Projects ({projectCount})
          </button>
          <button
            type="button"
            className={`pill-tag ${filterType === 'list' ? 'amber' : ''}`}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setFilterType('list')}
          >
            Lists ({listCount})
          </button>
          <button
            type="button"
            className={`pill-tag ${filterType === 'task' ? 'amber' : ''}`}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setFilterType('task')}
          >
            Tasks ({taskCount})
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                color: 'var(--outline)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 36, marginBottom: 8, opacity: 0.6 }}
              >
                delete_outline
              </span>
              <p style={{ margin: 0, fontSize: '0.92rem' }}>
                {rawItems.length === 0
                  ? 'Trash is empty. Deleted projects, lists, and tasks will appear here.'
                  : 'No items match this filter.'}
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isProject = item.type === 'project';
              const isList = item.type === 'list';
              const isTask = item.type === 'task' || item.type === 'todo';
              const title =
                item.title ||
                item.task?.title ||
                item.list?.title ||
                item.data?.title ||
                'Untitled item';
              const location =
                item.originalLocation ||
                [item.projectTitle, item.listTitle].filter(Boolean).join(' / ') ||
                'Workspace';

              const { daysRemaining, expiryDateString } = computeTrashExpiry(item.deletedAt, 30);

              let badgeLabel = 'Item';
              let badgeTone = 'neutral';
              if (isProject) {
                badgeLabel = 'Project';
                badgeTone = 'green';
              } else if (isList) {
                badgeLabel = 'List';
                badgeTone = 'amber';
              } else if (isTask) {
                badgeLabel = 'Task';
                badgeTone = 'neutral';
              }

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--surface-low)',
                    border: '1px solid rgba(190, 201, 192, 0.35)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        className={`status-badge ${badgeTone}`}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {badgeLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: 'var(--on-surface)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {title}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--outline)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>From: {location}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: daysRemaining <= 3 ? 'var(--error)' : 'var(--secondary)',
                          fontWeight: 500,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          timer
                        </span>
                        {daysRemaining} days left (purges {expiryDateString})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onRestore?.(item.id)}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16 }}
                      >
                        restore_from_trash
                      </span>
                      Restore
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => onDeletePermanent?.(item.id)}
                      style={{
                        background: 'var(--error-container)',
                        color: 'var(--error)',
                        border: '1px solid rgba(186, 26, 26, 0.2)',
                      }}
                      title="Permanently erase from storage now"
                    >
                      Delete permanently
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default TrashModal;
