import { useEffect, useMemo, useState } from 'react';
import { TEAM_MEMBERS } from '../data/seedData.js';
import { countListTodos, countProjectTodos, formatDateInputDisplay, getTodayDateInputValue } from '../services/taskApi.js';

const MORNING_TIMES = ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM'];
const EVENING_TIMES = ['3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'];

function ProgressRing({ pct, color = '#006946' }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#ebeef7" strokeWidth="3.2" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.2"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--on-surface)',
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

export function TodosCardsView({
  project,
  onBackHome,
  onOpenList,
  onToggleTodo,
  onAddTodo,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onOpenTaskDetail,
}) {
  const allLists = project.lists || [];
  const cardLists = useMemo(
    () => allLists.filter((l) => !l.hideFromCards),
    [allLists]
  );

  const [selectedListId, setSelectedListId] = useState(
    () => cardLists[0]?.id || allLists[0]?.id || ''
  );
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [inlineText, setInlineText] = useState('');
  const [inlineDueDate, setInlineDueDate] = useState(() => getTodayDateInputValue());
  const [showCompleted, setShowCompleted] = useState(false);

  // New list modal
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  // Card "..." dropdown & Edit list modal
  const [openMenuListId, setOpenMenuListId] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDueLabel, setEditDueLabel] = useState('');

  // Calm schedule popover/modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [morningDigest, setMorningDigest] = useState('9:00 AM');
  const [eveningDigest, setEveningDigest] = useState('4:30 PM');
  const [draftEnabled, setDraftEnabled] = useState(true);
  const [draftMorning, setDraftMorning] = useState('9:00 AM');
  const [draftEvening, setDraftEvening] = useState('4:30 PM');

  useEffect(() => {
    if (!openMenuListId) return;
    function handleOutsideClick() {
      setOpenMenuListId(null);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpenMenuListId(null);
    }
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuListId]);

  const projectStats = countProjectTodos(project);
  const activeList =
    allLists.find((l) => l.id === selectedListId) || cardLists[0] || allLists[0];

  const members = (project.members || [])
    .map((id) => TEAM_MEMBERS.find((m) => m.id === id))
    .filter(Boolean);

  function filterTodo(todo) {
    if (assigneeFilter !== 'all' && todo.assigneeId !== assigneeFilter) return false;
    const dueStr = String(todo.dueDate || '').trim();
    const dueLower = dueStr.toLowerCase();
    if (dueFilter === 'urgent') {
      const isUrgent =
        Boolean(todo.dueUrgent) ||
        dueLower.includes('tomorrow') ||
        dueLower.includes('today') ||
        dueLower.includes('overdue');
      if (!isUrgent) return false;
    } else if (dueFilter === 'has_date') {
      if (!dueStr) return false;
    } else if (dueFilter === 'no_date') {
      if (dueStr) return false;
    }
    return true;
  }

  const activeRemaining = (activeList?.todos || []).filter((t) => !t.done && filterTodo(t));
  const activeCompleted = (activeList?.todos || []).filter((t) => t.done && filterTodo(t));

  function handleInlineSubmit(e) {
    e.preventDefault();
    if (!inlineText.trim() || !activeList) return;
    onAddTodo(project.id, activeList.id, {
      title: inlineText.trim(),
      assigneeId: assigneeFilter !== 'all' ? assigneeFilter : 'alex',
      dueDate: formatDateInputDisplay(inlineDueDate),
    });
    setInlineText('');
    setInlineDueDate(getTodayDateInputValue());
  }

  function handleCreateListSubmit(e) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const createdId = onCreateList(project.id, {
      title: newListTitle.trim(),
      subtitle: newListDesc.trim() || 'Focused to-do track for this milestone.',
    });
    setSelectedListId(createdId);
    setNewListTitle('');
    setNewListDesc('');
    setShowNewListModal(false);
  }

  function openEditListModal(list) {
    setEditingList(list);
    setEditTitle(list.title || '');
    setEditSubtitle(list.subtitle || '');
    setEditDueLabel(list.dueLabel || '');
    setOpenMenuListId(null);
  }

  function handleEditListSubmit(e) {
    e.preventDefault();
    if (!editingList || !editTitle.trim()) return;
    onUpdateList?.(project.id, editingList.id, {
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      dueLabel: editDueLabel.trim(),
    });
    setEditingList(null);
  }

  function handleOpenScheduleModal() {
    setDraftEnabled(digestEnabled);
    setDraftMorning(morningDigest);
    setDraftEvening(eveningDigest);
    setShowScheduleModal(true);
  }

  function handleSaveSchedule(e) {
    e.preventDefault();
    setDigestEnabled(draftEnabled);
    setMorningDigest(draftMorning);
    setEveningDigest(draftEvening);
    setShowScheduleModal(false);
  }

  function getCommentCount(todo) {
    return Array.isArray(todo.commentList)
      ? todo.commentList.length
      : todo.comments || 0;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onBackHome}>
          Home
        </button>
        <span>/</span>
        <button type="button" onClick={onBackHome}>
          Projects
        </button>
        <span>/</span>
        <button type="button" onClick={onBackHome}>
          {project.title}
        </button>
        <span>/</span>
        <span className="current">To-dos</span>
      </nav>

      {/* Editorial Header */}
      <div className="todos-header">
        <div>
          <h1 className="todos-title">To-dos</h1>
          <p className="todos-subtitle">
            Calm, trackable task lists for the {project.title.toLowerCase()} team.
          </p>
        </div>

        <div className="summary-pill">
          <div className="avatar-stack">
            {members.slice(0, 3).map((m) => (
              <span
                key={m.id}
                className="mini-avatar"
                style={{ background: m.color }}
                title={m.name}
              >
                {m.initials}
              </span>
            ))}
            {members.length > 3 && (
              <span className="mini-avatar more">+{members.length - 3}</span>
            )}
          </div>
          <span style={{ color: 'var(--outline-variant)' }}>|</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'var(--primary)' }}
            >
              check_circle
            </span>
            {projectStats.done} of {projectStats.total} completed
          </span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="toolbar-row">
        <div className="toolbar-group">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowNewListModal(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              add
            </span>
            New to-do list
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const el = document.getElementById('milestone-inline-input');
              if (el) el.focus();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              playlist_add
            </span>
            Add a to-do
          </button>
        </div>

        <div className="toolbar-group">
          <select
            className="filter-select"
            value=""
            onChange={(e) => {
              if (e.target.value) onOpenList(e.target.value);
            }}
            aria-label="Jump to list"
          >
            <option value="">Jump to list...</option>
            {allLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
                {l.hideFromCards ? ' (Checklist)' : ''}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Filter by assignee"
          >
            <option value="all">Assigned to: Anyone</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>
                Assigned to: {m.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            aria-label="Filter by due date"
          >
            <option value="all">Due dates: All</option>
            <option value="urgent">Overdue / Tomorrow</option>
            <option value="has_date">Has due date</option>
            <option value="no_date">No due date</option>
          </select>

          <div className="segmented-toggle" role="group" aria-label="View mode">
            <button type="button" className="segmented-btn active">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                grid_view
              </span>
              Cards
            </button>
            <button
              type="button"
              className="segmented-btn"
              onClick={() => {
                const launch = allLists.find((l) => l.id === 'launch-checklist');
                onOpenList(launch ? launch.id : activeList?.id);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                view_list
              </span>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Track Cards Grid */}
      <section className="tracks-grid" aria-label="To-do lists">
        {cardLists.map((list) => {
          const stats = countListTodos(list);
          const previewTodos = (list.todos || []).filter(filterTodo).slice(0, 4);
          const isSelected = activeList?.id === list.id;
          const isMenuOpen = openMenuListId === list.id;

          return (
            <article
              key={list.id}
              className={`track-card ${isSelected ? 'selected' : ''}`}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div className="track-kicker">
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: list.dotColor || 'var(--primary)',
                        }}
                      />
                      <span>{list.trackLabel}</span>
                      {list.isMilestone && (
                        <span
                          className="status-badge amber"
                          style={{
                            padding: '1px 7px',
                            fontSize: '0.64rem',
                            marginLeft: 4,
                          }}
                        >
                          Milestone
                        </span>
                      )}
                    </div>
                    <h3
                      className="track-title"
                      onClick={() => setSelectedListId(list.id)}
                    >
                      {list.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
                    <ProgressRing pct={stats.pct} color={list.dotColor || '#006946'} />
                    <button
                      type="button"
                      className="icon-circle-btn"
                      aria-label={`List actions for ${list.title}`}
                      aria-expanded={isMenuOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuListId((cur) => (cur === list.id ? null : list.id));
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        more_horiz
                      </span>
                    </button>

                    {isMenuOpen && (
                      <div
                        className="dropdown-menu"
                        role="menu"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: 6,
                          minWidth: 205,
                          background: 'var(--surface-lowest)',
                          border: '1px solid rgba(190, 201, 192, 0.55)',
                          borderRadius: 12,
                          boxShadow: 'var(--shadow-md)',
                          padding: 6,
                          zIndex: 50,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="jump-item"
                          onClick={() => openEditListModal(list)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              edit
                            </span>
                            Rename / Edit list
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="jump-item"
                          onClick={() => {
                            onUpdateList?.(project.id, list.id, {
                              isMilestone: !list.isMilestone,
                            });
                            setOpenMenuListId(null);
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              flag
                            </span>
                            {list.isMilestone ? 'Unmark Milestone' : 'Mark Active Milestone'}
                          </span>
                        </button>
                        <div
                          style={{
                            height: 1,
                            background: 'rgba(190, 201, 192, 0.35)',
                            margin: '4px 6px',
                          }}
                        />
                        <button
                          type="button"
                          role="menuitem"
                          className="jump-item"
                          style={{ color: 'var(--error)' }}
                          onClick={() => {
                            onDeleteList?.(project.id, list.id);
                            setOpenMenuListId(null);
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              delete_outline
                            </span>
                            Move list to Trash
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="track-meta">
                  {stats.done} of {stats.total} done •{' '}
                  <span
                    style={{
                      color:
                        list.dueAccent === 'green'
                          ? 'var(--primary)'
                          : 'var(--secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {list.dueLabel || 'No target date'}
                  </span>
                </div>

                <div className="track-items">
                  {previewTodos.map((todo) => (
                    <div key={todo.id} className="todo-check-row">
                      <button
                        type="button"
                        className={`todo-checkbox ${todo.done ? 'checked' : ''}`}
                        aria-label={`Toggle ${todo.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTodo(project.id, list.id, todo.id);
                        }}
                      >
                        {todo.done && (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 13 }}
                          >
                            check
                          </span>
                        )}
                      </button>
                      <span
                        className={todo.done ? 'todo-text-done' : ''}
                        style={{ cursor: 'pointer', flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTaskDetail?.(project.id, list.id, todo);
                        }}
                      >
                        {todo.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="track-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    chat_bubble_outline
                  </span>
                  {list.notesCount || 0} notes
                </span>

                <button
                  type="button"
                  className="open-list-btn"
                  onClick={() => onOpenList(list.id)}
                >
                  Open list
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Active Milestone Expanded Panel */}
      {activeList && (
        <section className="milestone-panel" aria-label="Active milestone">
          <div className="milestone-head">
            <div>
              <h2>{activeList.title}</h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '0.86rem',
                  color: 'var(--on-surface-variant)',
                }}
              >
                {activeList.subtitle}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeList.isMilestone ? (
                <span className="status-badge amber">Active Milestone</span>
              ) : (
                <span className="status-badge neutral">Selected List</span>
              )}
              <button
                type="button"
                className="open-list-btn"
                onClick={() => onOpenList(activeList.id)}
              >
                Full list view
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  open_in_new
                </span>
              </button>
            </div>
          </div>

          {activeRemaining.length === 0 ? (
            <div
              style={{
                padding: '18px 8px',
                fontSize: '0.86rem',
                color: 'var(--outline)',
              }}
            >
              {assigneeFilter !== 'all' || dueFilter !== 'all'
                ? 'No remaining tasks match the current filters.'
                : 'All tasks in this milestone are complete.'}
            </div>
          ) : (
            activeRemaining.map((todo) => {
              const assignee = TEAM_MEMBERS.find((m) => m.id === todo.assigneeId);
              const commentCount = getCommentCount(todo);
              return (
                <div key={todo.id} className="milestone-task-row">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    <button
                      type="button"
                      className={`todo-checkbox ${todo.done ? 'checked' : ''}`}
                      style={{ marginTop: 3 }}
                      aria-label={`Toggle ${todo.title}`}
                      onClick={() => onToggleTodo(project.id, activeList.id, todo.id)}
                    />
                    <div
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => onOpenTaskDetail?.(project.id, activeList.id, todo)}
                    >
                      <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                        {todo.title}
                      </div>
                      {todo.note && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--outline)',
                            marginTop: 2,
                          }}
                        >
                          {todo.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {todo.dueDate && (
                      <span
                        className="pill-tag"
                        style={
                          todo.dueUrgent
                            ? {
                                background: 'var(--error-container)',
                                color: 'var(--error)',
                              }
                            : undefined
                        }
                      >
                        {todo.dueUrgent && (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 13 }}
                          >
                            schedule
                          </span>
                        )}
                        {todo.dueDate}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenTaskDetail?.(project.id, activeList.id, todo)}
                      aria-label={`Open details and comments for ${todo.title}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                        color: 'var(--outline)',
                        background: 'transparent',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        chat_bubble_outline
                      </span>
                      {commentCount}
                    </button>
                    {assignee && (
                      <span
                        className="mini-avatar"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: assignee.color,
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                        title={assignee.name}
                      >
                        {assignee.initials}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <form className="inline-add-bar" onSubmit={handleInlineSubmit} style={{ flexWrap: 'wrap' }}>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--outline)', fontSize: 19 }}
            >
              add_circle_outline
            </span>
            <input
              id="milestone-inline-input"
              type="text"
              placeholder="Add a new to-do to this list..."
              value={inlineText}
              onChange={(e) => setInlineText(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <input
              type="date"
              className="filter-select"
              style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'var(--surface)' }}
              value={inlineDueDate}
              onChange={(e) => setInlineDueDate(e.target.value)}
              title="Select task due date (defaults to today)"
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              Add
            </button>
          </form>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--on-surface-variant)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
              }}
              onClick={() => setShowCompleted((s) => !s)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                {showCompleted ? 'expand_more' : 'chevron_right'}
              </span>
              {activeCompleted.length} completed to-dos (click to view)
            </button>

            {showCompleted && activeCompleted.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeCompleted.map((todo) => (
                  <div
                    key={todo.id}
                    className="todo-check-row"
                    style={{ padding: '4px 6px' }}
                  >
                    <button
                      type="button"
                      className="todo-checkbox checked"
                      aria-label={`Toggle ${todo.title}`}
                      onClick={() => onToggleTodo(project.id, activeList.id, todo.id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        check
                      </span>
                    </button>
                    <span
                      className="todo-text-done"
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => onOpenTaskDetail?.(project.id, activeList.id, todo)}
                    >
                      {todo.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Calm Notification Rhythm Banner */}
      <section className="calm-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: digestEnabled ? 'rgba(154, 245, 198, 0.5)' : 'var(--surface-container)',
              color: digestEnabled ? 'var(--primary)' : 'var(--outline)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              notifications_paused
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
              {digestEnabled
                ? 'Calm notification rhythm active'
                : 'Calm notification rhythm paused'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--outline)' }}>
              {digestEnabled
                ? `Team updates are batched twice daily at ${morningDigest} and ${eveningDigest}.`
                : 'Digest batching is paused. Click Manage schedule to resume.'}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleOpenScheduleModal}
        >
          Manage schedule
        </button>
      </section>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="modal-backdrop" onClick={() => setShowNewListModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif" style={{ margin: '0 0 14px', fontSize: '1.45rem' }}>
              New to-do list
            </h2>
            <form onSubmit={handleCreateListSubmit}>
              <div className="modal-field">
                <label htmlFor="new-list-title">List title</label>
                <input
                  id="new-list-title"
                  type="text"
                  required
                  placeholder="e.g., Launch Checklist"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label htmlFor="new-list-desc">Description</label>
                <textarea
                  id="new-list-desc"
                  rows={2}
                  placeholder="Optional milestone notes..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewListModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {editingList && (
        <div className="modal-backdrop" onClick={() => setEditingList(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif" style={{ margin: '0 0 14px', fontSize: '1.45rem' }}>
              Edit to-do list
            </h2>
            <form onSubmit={handleEditListSubmit}>
              <div className="modal-field">
                <label htmlFor="edit-list-title">List title</label>
                <input
                  id="edit-list-title"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label htmlFor="edit-list-subtitle">Subtitle / notes</label>
                <textarea
                  id="edit-list-subtitle"
                  rows={2}
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label htmlFor="edit-list-due">Target date label</label>
                <input
                  id="edit-list-due"
                  type="text"
                  placeholder="e.g., Due in 3 days"
                  value={editDueLabel}
                  onChange={(e) => setEditDueLabel(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingList(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-backdrop" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif" style={{ margin: '0 0 6px', fontSize: '1.45rem' }}>
              Digest Schedule
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--outline)' }}>
              Batch team activity into calm, predictable check-in windows.
            </p>
            <form onSubmit={handleSaveSchedule}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={draftEnabled}
                  onChange={(e) => setDraftEnabled(e.target.checked)}
                />
                Enable twice-daily notification batching
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  opacity: draftEnabled ? 1 : 0.5,
                  pointerEvents: draftEnabled ? 'auto' : 'none',
                }}
              >
                <div className="modal-field">
                  <label htmlFor="morning-digest-time">Morning digest</label>
                  <select
                    id="morning-digest-time"
                    value={draftMorning}
                    onChange={(e) => setDraftMorning(e.target.value)}
                  >
                    {MORNING_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-field">
                  <label htmlFor="evening-digest-time">Afternoon digest</label>
                  <select
                    id="evening-digest-time"
                    value={draftEvening}
                    onChange={(e) => setDraftEvening(e.target.value)}
                  >
                    {EVENING_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
