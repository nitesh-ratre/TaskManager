import { useEffect, useState } from 'react';
import { TEAM_MEMBERS } from '../data/seedData.js';
import { formatDateInputDisplay, getTodayDateInputValue } from '../services/taskApi.js';

function SubtaskItem({ subtask, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(subtask.title || '');

  useEffect(() => {
    setTitleDraft(subtask.title || '');
  }, [subtask.id, subtask.title]);

  function commitTitle() {
    const trimmed = titleDraft.trim();
    setEditing(false);
    if (!trimmed) {
      setTitleDraft(subtask.title || '');
      return;
    }
    if (trimmed !== subtask.title) {
      onUpdate(subtask.id, { title: trimmed });
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 10,
        background: 'var(--surface-low)',
        border: '1px solid rgba(190, 201, 192, 0.35)',
      }}
    >
      <input
        type="checkbox"
        checked={Boolean(subtask.done)}
        onChange={() => onToggle(subtask.id)}
        aria-label={`Mark sub-task "${subtask.title}" ${subtask.done ? 'incomplete' : 'complete'}`}
        style={{
          width: 16,
          height: 16,
          accentColor: 'var(--primary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />

      {editing ? (
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitTitle();
            } else if (e.key === 'Escape') {
              setTitleDraft(subtask.title || '');
              setEditing(false);
            }
          }}
          autoFocus
          style={{
            flex: 1,
            border: '1px solid var(--primary)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: '0.86rem',
            background: 'var(--surface-lowest)',
            color: 'var(--on-surface)',
            outline: 'none',
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Click to edit sub-task title"
          style={{
            flex: 1,
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            padding: '2px 4px',
            cursor: 'text',
            fontSize: '0.86rem',
            color: subtask.done ? 'var(--outline)' : 'var(--on-surface)',
            textDecoration: subtask.done ? 'line-through' : 'none',
          }}
        >
          {subtask.title}
        </button>
      )}

      <button
        type="button"
        onClick={() => onDelete(subtask.id)}
        aria-label={`Delete sub-task "${subtask.title}"`}
        title="Delete sub-task"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--outline)',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
          close
        </span>
      </button>
    </div>
  );
}

export function TaskDetailDrawer({
  isOpen,
  projectId,
  listId,
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) {
  const [titleDraft, setTitleDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [dueDateDraft, setDueDateDraft] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState(() => getTodayDateInputValue());
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (!task) return;
    setTitleDraft(task.title || '');
    setNoteDraft(task.note ?? task.description ?? '');
    setDueDateDraft(task.dueDate || '');
  }, [task?.id, task?.title, task?.note, task?.description, task?.dueDate]);

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

  if (!isOpen || !task) return null;

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const commentList = Array.isArray(task.commentList) ? task.commentList : [];
  const completedSubtasks = subtasks.filter((s) => s.done).length;
  const selectedMember = TEAM_MEMBERS.find((m) => m.id === task.assigneeId);

  function commitTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(task.title || '');
      return;
    }
    if (trimmed !== task.title) {
      onUpdateTask?.(projectId, listId, task.id, { title: trimmed });
    }
  }

  function commitNote() {
    const currentNote = task.note ?? task.description ?? '';
    if (noteDraft !== currentNote) {
      onUpdateTask?.(projectId, listId, task.id, { note: noteDraft });
    }
  }

  function commitDueDate(nextValue, urgentOverride) {
    const trimmed = nextValue.trim();
    const isUrgent =
      typeof urgentOverride === 'boolean'
        ? urgentOverride
        : trimmed.toLowerCase() === 'today' || trimmed.toLowerCase() === 'tomorrow';

    setDueDateDraft(trimmed);
    onUpdateTask?.(projectId, listId, task.id, {
      dueDate: trimmed,
      dueUrgent: isUrgent,
    });
  }

  function handleAddSubtaskSubmit(e) {
    e.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    onAddSubtask?.(projectId, listId, task.id, {
      title: trimmed,
      assigneeId: '',
      dueDate: formatDateInputDisplay(newSubtaskDueDate),
    });
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(getTodayDateInputValue());
  }

  function handleAddCommentSubmit(e) {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    onAddComment?.(projectId, listId, task.id, trimmed);
    setNewCommentText('');
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        padding: 0,
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          height: '100vh',
          background: 'var(--surface-lowest)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(190, 201, 192, 0.45)',
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 22px',
            borderBottom: '1px solid rgba(190, 201, 192, 0.35)',
            background: 'var(--surface)',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--on-surface-variant)',
            }}
          >
            Task Details
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onDeleteTask?.(projectId, listId, task.id)}
              style={{
                background: 'var(--error-container)',
                color: 'var(--error)',
                border: '1px solid rgba(186, 26, 26, 0.2)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                delete
              </span>
              Move to Trash
            </button>

            <button
              type="button"
              className="icon-circle-btn"
              onClick={onClose}
              aria-label="Close drawer"
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
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* Completion + Editable Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              checked={Boolean(task.done)}
              onChange={() =>
                onUpdateTask?.(projectId, listId, task.id, { done: !task.done })
              }
              aria-label="Toggle task completion"
              style={{
                width: 20,
                height: 20,
                marginTop: 6,
                accentColor: 'var(--primary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />

            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              aria-label="Task title"
              placeholder="Task title..."
              style={{
                flex: 1,
                border: '1px solid transparent',
                borderRadius: 8,
                padding: '4px 8px',
                marginLeft: -8,
                fontSize: '1.15rem',
                fontWeight: 600,
                color: task.done ? 'var(--outline)' : 'var(--on-surface)',
                textDecoration: task.done ? 'line-through' : 'none',
                background: 'transparent',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'var(--surface)';
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'transparent';
              }}
            />
          </div>

          {/* Assignee & Due Date */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 14,
              padding: 16,
              borderRadius: 12,
              background: 'var(--surface-low)',
              border: '1px solid rgba(190, 201, 192, 0.35)',
            }}
          >
            {/* Assignee */}
            <div className="modal-field" style={{ marginBottom: 0 }}>
              <label htmlFor="drawer-assignee">Assignee</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedMember ? (
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: selectedMember.color,
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selectedMember.initials}
                  </span>
                ) : (
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: 'var(--surface-high)',
                      color: 'var(--outline)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      person_off
                    </span>
                  </span>
                )}
                <select
                  id="drawer-assignee"
                  value={task.assigneeId || ''}
                  onChange={(e) =>
                    onUpdateTask?.(projectId, listId, task.id, {
                      assigneeId: e.target.value,
                    })
                  }
                  style={{ background: 'var(--surface-lowest)' }}
                >
                  <option value="">Unassigned</option>
                  {TEAM_MEMBERS.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="modal-field" style={{ marginBottom: 0 }}>
              <label htmlFor="drawer-due-date">Due Date</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={dueDateDraft.includes('-') ? dueDateDraft : ''}
                    onChange={(e) => commitDueDate(e.target.value)}
                    style={{ background: 'var(--surface-lowest)', width: 145 }}
                    title="Select date with datepicker"
                  />
                  <input
                    id="drawer-due-date"
                    type="text"
                    value={dueDateDraft}
                    placeholder="e.g. Today, Tomorrow, Oct 28"
                    onChange={(e) => setDueDateDraft(e.target.value)}
                    onBlur={() => commitDueDate(dueDateDraft)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitDueDate(dueDateDraft);
                      }
                    }}
                    style={{ background: 'var(--surface-lowest)', flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => commitDueDate(getTodayDateInputValue(), true)}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => commitDueDate('Tomorrow', true)}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => commitDueDate('Next Week', false)}
                  >
                    Next Week
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => commitDueDate('', false)}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description / Note */}
          <div className="modal-field" style={{ marginBottom: 0 }}>
            <label htmlFor="drawer-note">Notes &amp; Description</label>
            <textarea
              id="drawer-note"
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={commitNote}
              placeholder="Add context, links, or acceptance criteria..."
              style={{ resize: 'vertical', minHeight: 82 }}
            />
          </div>

          {/* Sub-tasks */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: 'var(--on-surface-variant)',
                }}
              >
                Sub-tasks
              </h3>
              {subtasks.length > 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--outline)' }}>
                  {completedSubtasks}/{subtasks.length} completed
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {subtasks.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--outline)' }}>
                  No sub-tasks yet. Break this down into smaller steps below.
                </p>
              ) : (
                subtasks.map((sub) => (
                  <SubtaskItem
                    key={sub.id}
                    subtask={sub}
                    onToggle={(subId) =>
                      onToggleSubtask?.(projectId, listId, task.id, subId)
                    }
                    onUpdate={(subId, patch) =>
                      onUpdateSubtask?.(projectId, listId, task.id, subId, patch)
                    }
                    onDelete={(subId) =>
                      onDeleteSubtask?.(projectId, listId, task.id, subId)
                    }
                  />
                ))
              )}
            </div>

            <form
              onSubmit={handleAddSubtaskSubmit}
              style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="+ Add sub-task"
                aria-label="Add sub-task"
                style={{
                  flex: '1 1 200px',
                  border: '1px solid rgba(190, 201, 192, 0.7)',
                  borderRadius: 9,
                  padding: '7px 11px',
                  fontSize: '0.85rem',
                  background: 'var(--surface)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                }}
              />
              <input
                type="date"
                value={newSubtaskDueDate}
                onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                title="Sub-task due date (defaults to today)"
                style={{
                  border: '1px solid rgba(190, 201, 192, 0.7)',
                  borderRadius: 9,
                  padding: '6px 8px',
                  fontSize: '0.78rem',
                  background: 'var(--surface)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                }}
              />
              <button type="submit" className="btn btn-secondary btn-sm">
                Add
              </button>
            </form>
          </section>

          {/* Comments & Notes */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: 'var(--on-surface-variant)',
                }}
              >
                Comments &amp; Notes
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--outline)' }}>
                {commentList.length || task.comments || 0}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {commentList.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--outline)' }}>
                  No comments yet. Start a discussion or leave an update.
                </p>
              ) : (
                commentList.map((comment, idx) => {
                  const text =
                    typeof comment === 'string' ? comment : comment.text || '';
                  const author =
                    typeof comment === 'string'
                      ? 'Team Member'
                      : comment.author || 'Team Member';
                  const createdAt =
                    typeof comment === 'string' ? '' : comment.createdAt || '';
                  return (
                    <div
                      key={comment.id || idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--surface-low)',
                        border: '1px solid rgba(190, 201, 192, 0.35)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--on-surface)',
                          }}
                        >
                          {author}
                        </span>
                        {createdAt && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--outline)' }}>
                            {createdAt}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          color: 'var(--on-surface-variant)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleAddCommentSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <textarea
                rows={2}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment or update..."
                aria-label="Write a comment"
                style={{
                  width: '100%',
                  border: '1px solid rgba(190, 201, 192, 0.7)',
                  borderRadius: 9,
                  padding: '8px 11px',
                  fontSize: '0.85rem',
                  background: 'var(--surface)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-sm">
                  Post Comment
                </button>
              </div>
            </form>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default TaskDetailDrawer;
