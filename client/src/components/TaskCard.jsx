import { ArrowRight, Calendar, Pencil, Trash2 } from 'lucide-react';

const NEXT_STATUS_LABEL = {
  todo: 'Start Progress',
  in_progress: 'Mark Done',
  done: 'Reopen',
};

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function TaskCard({ task, onEdit, onDelete, onCycleStatus }) {
  return (
    <article className="task-card">
      <div className="task-card-top">
        <h3 className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</h3>
        <div className="task-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label={`Edit ${task.title}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="btn-icon danger"
            onClick={() => onDelete(task.id)}
            title="Delete task"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <span className={`badge badge-priority-${task.priority}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>

        {task.dueDate && (
          <span className="badge badge-date">
            <Calendar size={11} />
            {task.dueDate}
          </span>
        )}

        {task.tags?.map((tag) => (
          <span key={tag} className="badge badge-tag">
            #{tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="status-cycle-btn"
        onClick={() => onCycleStatus(task)}
      >
        <span>{NEXT_STATUS_LABEL[task.status] || 'Advance'}</span>
        <ArrowRight size={13} />
      </button>
    </article>
  );
}
