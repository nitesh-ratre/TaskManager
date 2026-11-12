import { useMemo, useState } from 'react';
import { TEAM_MEMBERS } from '../data/seedData.js';
import { countListTodos, formatDateInputDisplay, getTodayDateInputValue } from '../services/taskApi.js';

function parseDueDateValue(dueDate) {
  if (!dueDate || !String(dueDate).trim()) return Number.POSITIVE_INFINITY;
  const raw = String(dueDate).trim();
  const lower = raw.toLowerCase();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (lower.includes('overdue')) return startOfToday - dayMs;
  if (lower === 'today') return startOfToday;
  if (lower === 'tomorrow') return startOfToday + dayMs;
  if (lower === 'next week') return startOfToday + 7 * dayMs;

  const hasYear = /\b\d{4}\b/.test(raw);
  const parsed = Date.parse(hasYear ? raw : `${raw}, ${now.getFullYear()}`);
  if (!Number.isNaN(parsed)) return parsed;

  return Number.MAX_SAFE_INTEGER;
}

function isDueSoon(todo) {
  if (todo.dueUrgent) return true;
  if (!todo.dueDate || !String(todo.dueDate).trim()) return false;
  const lower = String(todo.dueDate).toLowerCase();
  if (lower.includes('today') || lower.includes('tomorrow') || lower.includes('overdue')) {
    return true;
  }
  const ts = parseDueDateValue(todo.dueDate);
  if (!Number.isFinite(ts) || ts === Number.MAX_SAFE_INTEGER) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  return ts <= startOfToday + twoDaysMs;
}

export function TodosListView({
  project,
  list,
  onBackHome,
  onBackToCards,
  onToggleTodo,
  onToggleSubtask,
  onAddTodo,
  onAddSubtask,
  onReorderTodos,
  onOpenTaskDetail,
  onDeleteTodo,
  onDeleteSubtask,
  onNotify,
}) {
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByDue, setSortByDue] = useState(false);
  const [expandedParents, setExpandedParents] = useState(() => {
    const map = {};
    for (const todo of list.todos || []) {
      if (todo.subtasks?.length) map[todo.id] = true;
    }
    return map;
  });

  // Drag & move state
  const [draggedTodoId, setDraggedTodoId] = useState(null);
  const [dragOverTodoId, setDragOverTodoId] = useState(null);
  const [movingTodoId, setMovingTodoId] = useState(null);

  // Per-row inline subtask composer state
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [subtaskDueDate, setSubtaskDueDate] = useState(() => getTodayDateInputValue());

  // Inline composer state
  const [composerOpen, setComposerOpen] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('liam');
  const [newDueDate, setNewDueDate] = useState(() => getTodayDateInputValue());
  const [notifyAssignee, setNotifyAssignee] = useState(true);
  const [indentAsSubtask, setIndentAsSubtask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const stats = countListTodos(list);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const remaining = useMemo(() => {
    const items = (list.todos || []).filter((t) => {
      if (t.done) return false;
      if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false;

      if (dueFilter === 'urgent' && !isDueSoon(t)) return false;
      if (dueFilter === 'has_date' && (!t.dueDate || !String(t.dueDate).trim())) return false;
      if (dueFilter === 'no_date' && t.dueDate && String(t.dueDate).trim()) return false;

      if (normalizedQuery) {
        const titleMatch = String(t.title || '').toLowerCase().includes(normalizedQuery);
        const noteMatch = String(t.note || '').toLowerCase().includes(normalizedQuery);
        const subMatch = (t.subtasks || []).some((s) =>
          String(s.title || '').toLowerCase().includes(normalizedQuery)
        );
        if (!titleMatch && !noteMatch && !subMatch) return false;
      }

      return true;
    });

    if (sortByDue) {
      return [...items].sort((a, b) => {
        const tsA = parseDueDateValue(a.dueDate);
        const tsB = parseDueDateValue(b.dueDate);
        if (tsA !== tsB) return tsA - tsB;
        return String(a.dueDate || 'zzz').localeCompare(String(b.dueDate || 'zzz'));
      });
    }
    return items;
  }, [list.todos, assigneeFilter, dueFilter, normalizedQuery, sortByDue]);

  const completed = useMemo(() => {
    return (list.todos || []).filter((t) => {
      if (!t.done) return false;
      if (!normalizedQuery) return true;
      return String(t.title || '').toLowerCase().includes(normalizedQuery);
    });
  }, [list.todos, normalizedQuery]);

  function toggleExpand(todoId) {
    setExpandedParents((prev) => ({ ...prev, [todoId]: !prev[todoId] }));
  }

  function commitReorderedRemaining(reorderedRemainingIds) {
    if (!onReorderTodos) return;
    const allTodos = list.todos || [];
    const remainingSet = new Set(reorderedRemainingIds);
    let cursor = 0;
    const newOrderedIds = allTodos.map((t) => {
      if (remainingSet.has(t.id)) {
        const nextId = reorderedRemainingIds[cursor];
        cursor += 1;
        return nextId;
      }
      return t.id;
    });
    onReorderTodos(project.id, list.id, newOrderedIds);
  }

  function handleMoveStep(todoId, direction) {
    if (sortByDue) return;
    const ids = remaining.map((t) => t.id);
    const idx = ids.indexOf(todoId);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= ids.length) return;

    const nextIds = [...ids];
    const [moved] = nextIds.splice(idx, 1);
    nextIds.splice(targetIdx, 0, moved);

    setMovingTodoId(todoId);
    setTimeout(() => {
      setMovingTodoId((curr) => (curr === todoId ? null : curr));
    }, 650);

    commitReorderedRemaining(nextIds);
  }

  function handleDragStart(e, todoId) {
    if (sortByDue) return;
    setDraggedTodoId(todoId);
    setMovingTodoId(todoId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', todoId);
    }
  }

  function handleDragOver(e, todoId) {
    if (sortByDue || !draggedTodoId) return;
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverTodoId !== todoId) {
      setDragOverTodoId(todoId);
    }
  }

  function handleDrop(e, targetTodoId) {
    if (sortByDue) return;
    e.preventDefault();
    const sourceId = draggedTodoId || e.dataTransfer?.getData('text/plain');
    setDraggedTodoId(null);
    setDragOverTodoId(null);
    setMovingTodoId(null);

    if (!sourceId || sourceId === targetTodoId) return;

    const ids = remaining.map((t) => t.id);
    const fromIdx = ids.indexOf(sourceId);
    const toIdx = ids.indexOf(targetTodoId);
    if (fromIdx === -1 || toIdx === -1) return;

    const nextIds = [...ids];
    const [moved] = nextIds.splice(fromIdx, 1);
    nextIds.splice(toIdx, 0, moved);
    commitReorderedRemaining(nextIds);
  }

  function handleDragEnd() {
    setDraggedTodoId(null);
    setDragOverTodoId(null);
    setMovingTodoId(null);
  }

  function handleInlineSubtaskSubmit(e, parentTodoId) {
    e.preventDefault();
    const trimmed = subtaskDraft.trim();
    if (!trimmed) return;
    onAddSubtask(project.id, list.id, parentTodoId, {
      title: trimmed,
      assigneeId: '',
      dueDate: formatDateInputDisplay(subtaskDueDate),
    });
    setExpandedParents((prev) => ({ ...prev, [parentTodoId]: true }));
    setSubtaskDraft('');
    setSubtaskDueDate(getTodayDateInputValue());
    setAddingSubtaskFor(null);
  }

  function handleComposerSubmit(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const formattedDue = formatDateInputDisplay(newDueDate);

    if (indentAsSubtask && remaining.length > 0) {
      const targetParent = remaining[remaining.length - 1];
      onAddSubtask(project.id, list.id, targetParent.id, {
        title,
        assigneeId: newAssignee,
        dueDate: formattedDue,
      });
      setExpandedParents((prev) => ({ ...prev, [targetParent.id]: true }));
    } else {
      onAddTodo(project.id, list.id, {
        title,
        assigneeId: newAssignee,
        dueDate: formattedDue,
      });
    }

    if (notifyAssignee) {
      const assigneeName =
        TEAM_MEMBERS.find((m) => m.id === newAssignee)?.name || 'Team';
      onNotify?.(`Notified ${assigneeName} about "${title}"`);
    }

    setNewTitle('');
    setNewDueDate(getTodayDateInputValue());
  }

  function handleComposerKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      setIndentAsSubtask((v) => !v);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onBackHome}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            home
          </span>
          Projects
        </button>
        <span>/</span>
        <button type="button" onClick={onBackToCards}>
          {project.title}
        </button>
        <span>/</span>
        <button type="button" onClick={onBackToCards}>
          To-dos
        </button>
        <span>/</span>
        <span className="current">{list.title}</span>
      </nav>

      {/* Header */}
      <div className="todos-header" style={{ marginBottom: 18 }}>
        <div>
          <span className="status-badge green" style={{ marginBottom: 10 }}>
            <span className="status-dot" />
            {list.phaseBadge || `${list.trackLabel} • Active`}
          </span>
          <h1 className="todos-title">{list.title}</h1>
        </div>

        <span className="pill-tag" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <span className="status-dot" style={{ background: 'var(--primary)' }} />
          {stats.done} of {stats.total} done
        </span>
      </div>

      {/* Toolbar */}
      <div className="toolbar-row">
        <div className="segmented-toggle" role="group" aria-label="View mode">
          <button type="button" className="segmented-btn" onClick={onBackToCards}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              grid_view
            </span>
            Cards
          </button>
          <button type="button" className="segmented-btn active">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              view_list
            </span>
            List
          </button>
        </div>

        <div className="toolbar-group">
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 9,
                fontSize: 16,
                color: 'var(--outline)',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              type="search"
              className="filter-select"
              style={{ paddingLeft: 28, width: 170 }}
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks in list"
            />
          </div>

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
            <option value="all">Due date: All</option>
            <option value="urgent">Due soon</option>
            <option value="has_date">Has due date</option>
            <option value="no_date">No due date</option>
          </select>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setComposerOpen(true);
              setTimeout(() => document.getElementById('list-composer-input')?.focus(), 30);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              add
            </span>
            Add a to-do
          </button>
        </div>
      </div>

      {/* Remaining Tasks Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 className="serif" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 500 }}>
            Remaining Tasks
          </h2>
          <span className="pill-tag">{remaining.length}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem' }}>
          <span className="pill-tag">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              account_tree
            </span>
            Supports nested sub-tasks
          </span>
          <button
            type="button"
            className="pill-tag"
            style={{
              border: 'none',
              cursor: 'pointer',
              background: !sortByDue ? 'rgba(154, 245, 198, 0.4)' : 'var(--surface-low)',
              color: !sortByDue ? 'var(--primary)' : 'var(--on-surface-variant)',
            }}
            onClick={() => setSortByDue(false)}
          >
            Manual order
          </button>
          <button
            type="button"
            className="pill-tag"
            style={{
              border: 'none',
              cursor: 'pointer',
              background: sortByDue ? 'rgba(154, 245, 198, 0.4)' : 'var(--surface-low)',
              color: sortByDue ? 'var(--primary)' : 'var(--on-surface-variant)',
            }}
            onClick={() => setSortByDue(true)}
          >
            Sort by due date
          </button>
        </div>
      </div>

      {/* Remaining Task Rows */}
      <section aria-label="Remaining tasks">
        {remaining.map((todo, idx) => {
          const assignee = TEAM_MEMBERS.find((m) => m.id === todo.assigneeId);
          const hasSubtasks = (todo.subtasks || []).length > 0;
          const isExpanded = !!expandedParents[todo.id];
          const isMoving =
            !!todo.moving || draggedTodoId === todo.id || movingTodoId === todo.id;
          const isDragOver = dragOverTodoId === todo.id && draggedTodoId !== todo.id;
          const commentCount = todo.commentList
            ? todo.commentList.length
            : typeof todo.comments === 'number'
            ? todo.comments
            : 0;

          return (
            <div
              key={todo.id}
              draggable={!sortByDue}
              onDragStart={(e) => handleDragStart(e, todo.id)}
              onDragOver={(e) => handleDragOver(e, todo.id)}
              onDrop={(e) => handleDrop(e, todo.id)}
              onDragEnd={handleDragEnd}
              className={`list-task-card ${isMoving ? 'highlight' : ''} ${
                isDragOver ? 'drag-over' : ''
              }`}
              style={{
                opacity: draggedTodoId === todo.id ? 0.65 : 1,
                outline: isDragOver ? '2px dashed var(--primary)' : undefined,
              }}
            >
              <div className="list-task-main">
                <div className="list-task-left">
                  {!sortByDue && (
                    <span
                      className="material-symbols-outlined"
                      title="Drag to reorder"
                      style={{
                        fontSize: 17,
                        color: 'var(--outline-variant)',
                        cursor: 'grab',
                      }}
                    >
                      drag_indicator
                    </span>
                  )}

                  {hasSubtasks && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--outline)',
                        display: 'inline-flex',
                      }}
                      onClick={() => toggleExpand(todo.id)}
                      aria-label="Toggle sub-tasks"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {isExpanded ? 'expand_more' : 'chevron_right'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`todo-checkbox ${todo.done ? 'checked' : ''}`}
                    onClick={() => onToggleTodo(project.id, list.id, todo.id)}
                    aria-label={`Complete ${todo.title}`}
                  />

                  <button
                    type="button"
                    onClick={() => onOpenTaskDetail?.(project.id, list.id, todo)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      color: isMoving ? 'var(--primary)' : 'var(--on-surface)',
                    }}
                  >
                    {todo.title}
                  </button>

                  {isMoving && (
                    <span className="status-badge green" style={{ fontSize: '0.66rem' }}>
                      MOVING
                    </span>
                  )}

                  {hasSubtasks && (
                    <span className="pill-tag" style={{ fontSize: '0.7rem' }}>
                      {todo.subtasks.length} sub-tasks
                    </span>
                  )}
                </div>

                <div className="list-task-right">
                  {todo.dueDate && (
                    <span
                      className="pill-tag"
                      style={
                        todo.dueUrgent
                          ? { background: 'var(--secondary-fixed)', color: 'var(--secondary)' }
                          : undefined
                      }
                    >
                      {todo.dueDate}
                    </span>
                  )}

                  {assignee ? (
                    <span className="pill-tag">
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: assignee.color,
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '0.58rem',
                          fontWeight: 700,
                        }}
                      >
                        {assignee.initials}
                      </span>
                      {assignee.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>
                      Unassigned
                    </span>
                  )}

                  {commentCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenTaskDetail?.(project.id, list.id, todo)}
                      aria-label={`Open ${commentCount} comments on ${todo.title}`}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '2px 4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: '0.76rem',
                        color: 'var(--outline)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        chat_bubble_outline
                      </span>
                      {commentCount}
                    </button>
                  )}

                  <button
                    type="button"
                    className="pill-tag"
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingSubtaskFor((curr) => (curr === todo.id ? null : todo.id));
                      setSubtaskDraft('');
                      setExpandedParents((prev) => ({ ...prev, [todo.id]: true }));
                    }}
                  >
                    + Sub-task
                  </button>

                  {!sortByDue && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStep(todo.id, -1);
                        }}
                        aria-label={`Move ${todo.title} up`}
                        title="Move up"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.35 : 0.85,
                          padding: 2,
                          color: 'var(--on-surface-variant)',
                          display: 'inline-flex',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                          keyboard_arrow_up
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === remaining.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStep(todo.id, 1);
                        }}
                        aria-label={`Move ${todo.title} down`}
                        title="Move down"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: idx === remaining.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === remaining.length - 1 ? 0.35 : 0.85,
                          padding: 2,
                          color: 'var(--on-surface-variant)',
                          display: 'inline-flex',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                          keyboard_arrow_down
                        </span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTodo?.(project.id, list.id, todo.id);
                    }}
                    aria-label={`Delete ${todo.title}`}
                    title="Move to trash"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 3,
                      color: 'var(--outline)',
                      display: 'inline-flex',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                      delete_outline
                    </span>
                  </button>
                </div>
              </div>

              {(hasSubtasks && isExpanded) || addingSubtaskFor === todo.id ? (
                <div className="subtask-tree">
                  {hasSubtasks &&
                    isExpanded &&
                    todo.subtasks.map((sub) => {
                      const subAssignee = TEAM_MEMBERS.find((m) => m.id === sub.assigneeId);
                      return (
                        <div key={sub.id} className="subtask-row">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 9,
                              cursor: 'pointer',
                            }}
                            onClick={() => onToggleSubtask(project.id, list.id, todo.id, sub.id)}
                          >
                            <button
                              type="button"
                              className={`todo-checkbox ${sub.done ? 'checked' : ''}`}
                            >
                              {sub.done && (
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 12 }}
                                >
                                  check
                                </span>
                              )}
                            </button>
                            <span className={sub.done ? 'todo-text-done' : ''}>
                              {sub.title}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {sub.dueDate && <span className="pill-tag">{sub.dueDate}</span>}
                            {subAssignee ? (
                              <span className="pill-tag">
                                {subAssignee.initials} {subAssignee.name}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--outline)' }}>
                                Unassigned
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSubtask?.(project.id, list.id, todo.id, sub.id);
                              }}
                              aria-label={`Delete sub-task ${sub.title}`}
                              title="Delete sub-task"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 2,
                                color: 'var(--outline)',
                                display: 'inline-flex',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                                close
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {addingSubtaskFor === todo.id && (
                    <form
                      onSubmit={(e) => handleInlineSubtaskSubmit(e, todo.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: hasSubtasks ? 8 : 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        type="text"
                        autoFocus
                        className="filter-select"
                        style={{ flex: '1 1 180px', padding: '5px 10px', fontSize: '0.82rem' }}
                        placeholder="Add a sub-task..."
                        value={subtaskDraft}
                        onChange={(e) => setSubtaskDraft(e.target.value)}
                      />
                      <input
                        type="date"
                        className="filter-select"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        value={subtaskDueDate}
                        onChange={(e) => setSubtaskDueDate(e.target.value)}
                        title="Sub-task due date (defaults to today)"
                      />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setAddingSubtaskFor(null);
                          setSubtaskDraft('');
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Inline Add To-do Composer */}
        {composerOpen && (
          <form className="composer-card" onSubmit={handleComposerSubmit}>
            <div className="composer-input-row">
              <span className="todo-checkbox" style={{ cursor: 'default' }} />
              <input
                id="list-composer-input"
                type="text"
                placeholder="Prepare fallback typography & font subsets for web performance..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleComposerKeyDown}
              />
            </div>

            <div className="composer-controls">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <select
                  className="filter-select"
                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.initials} {m.name}
                    </option>
                  ))}
                </select>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="date"
                    className="filter-select"
                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                    value={newDueDate.includes('-') ? newDueDate : ''}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    title="Select due date (defaults to today)"
                  />
                  <input
                    type="text"
                    className="filter-select"
                    style={{ padding: '4px 8px', fontSize: '0.76rem', width: 88 }}
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="Due date"
                  />
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    className="pill-tag"
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      background:
                        newDueDate === getTodayDateInputValue() || newDueDate.toLowerCase() === 'today'
                          ? 'rgba(154, 245, 198, 0.45)'
                          : 'var(--surface-low)',
                      color:
                        newDueDate === getTodayDateInputValue() || newDueDate.toLowerCase() === 'today'
                          ? 'var(--primary)'
                          : 'var(--on-surface-variant)',
                    }}
                    onClick={() => setNewDueDate(getTodayDateInputValue())}
                  >
                    Today
                  </button>
                  {['Tomorrow', 'Next Week'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="pill-tag"
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        background:
                          newDueDate === preset
                            ? 'rgba(154, 245, 198, 0.45)'
                            : 'var(--surface-low)',
                        color:
                          newDueDate === preset ? 'var(--primary)' : 'var(--on-surface-variant)',
                      }}
                      onClick={() => setNewDueDate(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pill-tag"
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      background: 'var(--surface-low)',
                      color: 'var(--outline)',
                    }}
                    onClick={() => setNewDueDate('')}
                  >
                    Clear
                  </button>
                </div>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notifyAssignee}
                    onChange={(e) => setNotifyAssignee(e.target.checked)}
                  />
                  Notify
                </label>

                <button
                  type="button"
                  className="pill-tag"
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    background: indentAsSubtask
                      ? 'rgba(154, 245, 198, 0.45)'
                      : 'var(--surface-low)',
                    color: indentAsSubtask ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                  onClick={() => setIndentAsSubtask((v) => !v)}
                >
                  Tab indent sub-task {indentAsSubtask ? '(ON)' : ''}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add this to-do
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setNewTitle('');
                    setComposerOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Completed To-dos Section */}
      <section style={{ marginTop: 28 }} aria-label="Completed to-dos">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: 0,
              color: 'var(--on-surface)',
            }}
            onClick={() => setShowCompleted((s) => !s)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {showCompleted ? 'expand_more' : 'chevron_right'}
            </span>
            <span className="serif" style={{ fontSize: '1.15rem', fontWeight: 500 }}>
              {completed.length} Completed to-dos
            </span>
            <span className="pill-tag">All archived</span>
          </button>

          <span style={{ fontSize: '0.76rem', color: 'var(--outline)' }}>
            Last item cleared 34m ago
          </span>
        </div>

        {showCompleted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completed.map((todo) => (
              <div
                key={todo.id}
                className="completed-card"
                style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                onClick={() => onToggleTodo(project.id, list.id, todo.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" className="todo-checkbox checked">
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      check
                    </span>
                  </button>
                  <span
                    className="todo-text-done"
                    onClick={(e) => {
                      if (onOpenTaskDetail) {
                        e.stopPropagation();
                        onOpenTaskDetail(project.id, list.id, todo);
                      }
                    }}
                  >
                    {todo.title}
                  </span>
                </div>
                {onDeleteTodo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTodo(project.id, list.id, todo.id);
                    }}
                    aria-label={`Delete ${todo.title}`}
                    title="Move to trash"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'var(--outline)',
                      display: 'inline-flex',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      delete_outline
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
