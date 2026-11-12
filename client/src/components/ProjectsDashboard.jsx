import { useState } from 'react';
import { HQ_TOOLS, TEAM_MEMBERS } from '../data/seedData.js';
import { countProjectTodos } from '../services/taskApi.js';

function HillChartSvg() {
  return (
    <svg viewBox="0 0 260 44" style={{ width: '100%', height: 40, overflow: 'visible' }}>
      <line x1="8" y1="36" x2="252" y2="36" stroke="#bec9c0" strokeWidth="1" strokeDasharray="3 3" />
      <path
        d="M 12 36 C 65 36, 92 8, 130 8 C 168 8, 195 36, 248 36"
        fill="none"
        stroke="#bec9c0"
        strokeWidth="2"
      />
      <circle cx="84" cy="21" r="4.5" fill="#feb235" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="130" cy="8" r="5" fill="#006946" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="176" cy="21" r="4.5" fill="#006946" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

const PRESET_COVERS = [
  { label: 'Studio Minimal', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=720&q=80' },
  { label: 'Architecture', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=720&q=80' },
  { label: 'Mobile Workspace', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=720&q=80' },
  { label: 'Design Tokens', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=720&q=80' },
];

export function ProjectsDashboard({
  workspace,
  onOpenProject,
  onOpenLaunchChecklist,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectNav,
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');
  const [openMenuProjectId, setOpenMenuProjectId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({
    title: '',
    description: '',
    status: 'In Progress',
    statusTone: 'green',
    coverImage: '',
  });
  const [editingImageProject, setEditingImageProject] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');

  const featuredProject = workspace.projects[0];
  const featuredPending = featuredProject
    ? featuredProject.lists.reduce(
        (acc, list) => acc + list.todos.filter((t) => !t.done).length,
        0
      )
    : 0;

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Calm, focused project workspace for your team.',
      coverImage: newCoverImage.trim(),
    });
    setNewTitle('');
    setNewDesc('');
    setNewCoverImage('');
    setShowNewModal(false);
  }

  function handleImageUpload(e, isEdit = false, isProjectEdit = false) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isProjectEdit) {
          setEditProjectForm((prev) => ({ ...prev, coverImage: reader.result }));
        } else if (isEdit) {
          setEditImageUrl(reader.result);
        } else {
          setNewCoverImage(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function openEditProjectModal(project) {
    setEditingProject(project);
    setEditProjectForm({
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'In Progress',
      statusTone: project.statusTone || 'green',
      coverImage: project.coverImage || '',
    });
  }

  function handleEditProjectSubmit(e) {
    e.preventDefault();
    if (!editingProject || !editProjectForm.title.trim()) return;
    onUpdateProject?.(editingProject.id, {
      title: editProjectForm.title.trim(),
      description: editProjectForm.description.trim(),
      status: editProjectForm.status,
      statusTone: editProjectForm.statusTone,
      coverImage: editProjectForm.coverImage.trim(),
    });
    setEditingProject(null);
  }

  return (
    <div>
      {/* Greeting Header */}
      <div className="greeting-row">
        <div>
          <div className="date-kicker">
            <span className="date-kicker-dot" />
            <span>Tuesday, Oct 24</span>
            <span style={{ color: 'var(--outline-variant)' }}>•</span>
            <span>Good morning</span>
          </div>
          <h1 className="greeting-title">Welcome back, {workspace.userName}.</h1>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSelectNav?.('routines')}
            title="Open Monthly Routine Checklist"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>
              event_repeat
            </span>
            Routines
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              tune
            </span>
            Customize home
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewModal(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add
            </span>
            New Project
          </button>
        </div>
      </div>

      {/* Acme Studio HQ Banner */}
      <section className="hq-card" aria-label="Company headquarters">
        <div className="hq-top">
          <div className="hq-brand">
            <div className="hq-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                apartment
              </span>
            </div>
            <div>
              <div className="hq-title-row">
                <h2>{workspace.workspaceName} HQ</h2>
                <span className="pill-tag">Company-wide</span>
              </div>
              <p className="hq-desc">
                The town square for our 28 teammates. Core policies, announcements,
                watercooler chats, and official roadmaps.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="announcement-box"
            onClick={() => onSelectNav('hey')}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--secondary)', fontSize: 20 }}
            >
              campaign
            </span>
            <div style={{ textAlign: 'left' }}>
              <div className="announcement-kicker">Latest Announcement</div>
              <div className="announcement-text">{workspace.announcement}</div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--outline)', fontSize: 18 }}
            >
              arrow_forward
            </span>
          </button>
        </div>

        <div className="hq-tools-grid">
          {HQ_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="hq-tool-tile"
              onClick={() =>
                onSelectNav(tool.id === 'campfire' ? 'pings' : 'activity')
              }
            >
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--primary)', fontSize: 19 }}
              >
                {tool.icon}
              </span>
              <div>
                <div className="hq-tool-name">{tool.name}</div>
                <div className="hq-tool-sub">{tool.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Teams & Projects Section */}
      <div className="section-bar">
        <div className="section-title-group">
          <h2>Teams &amp; Projects</h2>
          <span className="pill-tag">{workspace.projects.length} active</span>
        </div>

        <div className="segmented-toggle" role="group" aria-label="Project layout">
          <button
            type="button"
            className={`segmented-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              grid_view
            </span>
          </button>
          <button
            type="button"
            className={`segmented-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              view_list
            </span>
          </button>
        </div>
      </div>

      <section className={viewMode === 'grid' ? 'projects-grid' : 'projects-list-stack'}>
        {workspace.projects.map((project) => {
          const stats = countProjectTodos(project);
          const members = (project.members || [])
            .map((id) => TEAM_MEMBERS.find((m) => m.id === id))
            .filter(Boolean);
          const visibleMembers = members.slice(0, 3);
          const extraCount = Math.max(0, members.length - 3);

          return (
            <article
              key={project.id}
              className="project-card"
              onClick={() => onOpenProject(project.id)}
            >
              <div>
                {project.coverImage && (
                  <div
                    style={{
                      width: '100%',
                      height: 120,
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 14,
                      position: 'relative',
                      background: 'var(--surface-container)',
                    }}
                  >
                    <img
                      src={project.coverImage}
                      alt={`${project.title} cover`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="project-card-head" style={{ position: 'relative' }}>
                  <span className={`status-badge ${project.statusTone || 'green'}`}>
                    <span className="status-dot" />
                    {project.status}
                  </span>

                  <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ padding: 4, borderRadius: 6 }}
                      title="Project options"
                      aria-label={`Options for ${project.title}`}
                      onClick={() =>
                        setOpenMenuProjectId((id) => (id === project.id ? null : project.id))
                      }
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'var(--outline)', fontSize: 18 }}
                      >
                        more_horiz
                      </span>
                    </button>

                    {openMenuProjectId === project.id && (
                      <div
                        className="dropdown-menu"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          minWidth: 195,
                          zIndex: 25,
                        }}
                      >
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setOpenMenuProjectId(null);
                            onOpenProject(project.id);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            open_in_new
                          </span>
                          Open Project
                        </button>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setOpenMenuProjectId(null);
                            openEditProjectModal(project);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            edit
                          </span>
                          Edit Project Details
                        </button>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setOpenMenuProjectId(null);
                            setEditingImageProject(project);
                            setEditImageUrl(project.coverImage || '');
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            image
                          </span>
                          {project.coverImage ? 'Change Cover Image' : 'Add Cover Image'}
                        </button>
                        <button
                          type="button"
                          className="dropdown-item"
                          style={{ color: 'var(--error)' }}
                          onClick={() => {
                            setOpenMenuProjectId(null);
                            setProjectToDelete(project);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            delete
                          </span>
                          Move to Trash (30 days)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>

                {project.highlightType === 'hill' && (
                  <div className="project-highlight-box">
                    <div className="hill-labels">
                      <span>Figuring it out</span>
                      <span className="center">Hill Chart</span>
                      <span>Getting it done</span>
                    </div>
                    <HillChartSvg />
                  </div>
                )}

                {project.highlightType === 'quote' && (
                  <div
                    className="project-highlight-box"
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ color: 'var(--outline)', fontSize: 18, marginTop: 2 }}
                    >
                      chat_bubble_outline
                    </span>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>
                        {project.highlightAuthor}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--on-surface)',
                          marginTop: 2,
                        }}
                      >
                        {project.highlightText}
                      </div>
                    </div>
                  </div>
                )}

                {project.highlightType === 'tags' && (
                  <div className="project-tags-row">
                    {(project.tags || []).map((tag) => (
                      <span
                        key={tag.label}
                        className={`tag-chip ${tag.tone === 'amber' ? 'amber' : ''}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}

                {project.highlightType === 'stat' && (
                  <div
                    className="project-highlight-box"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'var(--primary)', fontSize: 19 }}
                      >
                        {project.highlightIcon || 'insights'}
                      </span>
                      <div>
                        {project.highlightKicker && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>
                            {project.highlightKicker}
                          </div>
                        )}
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {project.highlightText}
                        </div>
                      </div>
                    </div>
                    {project.highlightMeta && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>
                        {project.highlightMeta}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="progress-meta">
                  <span>To-dos</span>
                  <span>
                    {stats.done} of {stats.total} done ({stats.pct}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${
                      project.statusTone === 'amber' ? 'amber' : ''
                    }`}
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>

                <div className="project-card-foot">
                  <div className="avatar-stack">
                    {visibleMembers.map((m) => (
                      <span
                        key={m.id}
                        className="mini-avatar"
                        style={{ background: m.color }}
                        title={m.name}
                      >
                        {m.initials}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="mini-avatar more">+{extraCount}</span>
                    )}
                  </div>
                  <span className="active-ago">{project.activeAgo}</span>
                </div>
              </div>
            </article>
          );
        })}

        <button
          type="button"
          className="new-project-card"
          onClick={() => setShowNewModal(true)}
        >
          <div className="plus-circle">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              add
            </span>
          </div>
          <div className="serif" style={{ fontSize: '1.15rem', fontWeight: 500 }}>
            Make a new project
          </div>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '0.8rem',
              color: 'var(--outline)',
              maxWidth: 220,
            }}
          >
            Set up message boards, to-dos, and shared file vaults.
          </p>
        </button>
      </section>

      {/* Jump Directly to Work Banner */}
      {featuredProject && (
        <section className="jump-work-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(154, 245, 198, 0.4)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                checklist
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--outline)',
                }}
              >
                Jump Directly to Work
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, marginTop: 2 }}>
                {featuredProject.title} &rarr; To-dos list
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
              {featuredPending} pending tasks due this week
            </span>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => onSelectNav?.('routines')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                event_repeat
              </span>
              <span>Routines</span>
            </button>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => onOpenProject(featuredProject.id)}
            >
              <span>Open To-dos</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenLaunchChecklist(featuredProject.id)}
            >
              Launch Checklist
            </button>
          </div>
        </section>
      )}

      {/* New Project Modal */}
      {showNewModal && (
        <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif" style={{ margin: '0 0 14px', fontSize: '1.45rem' }}>
              Make a new project
            </h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-field">
                <label htmlFor="new-proj-title">Project name</label>
                <input
                  id="new-proj-title"
                  type="text"
                  required
                  placeholder="e.g., Q1 Partner Portal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-field">
                <label htmlFor="new-proj-desc">Mission / description</label>
                <textarea
                  id="new-proj-desc"
                  rows={2}
                  placeholder="What is this team building together?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>Cover Image (Optional)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={newCoverImage}
                    onChange={(e) => setNewCoverImage(e.target.value)}
                  />
                  <label
                    className="btn btn-secondary btn-sm"
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      upload
                    </span>
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, false)}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>Presets:</span>
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="pill-tag"
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                      onClick={() => setNewCoverImage(preset.url)}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {newCoverImage && (
                    <button
                      type="button"
                      className="pill-tag"
                      style={{ border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.7rem' }}
                      onClick={() => setNewCoverImage('')}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {newCoverImage && (
                  <div
                    style={{
                      marginTop: 10,
                      width: '100%',
                      height: 100,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: 'var(--surface-container)',
                    }}
                  >
                    <img
                      src={newCoverImage}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move to Trash Modal */}
      {projectToDelete && (
        <div className="modal-backdrop" onClick={() => setProjectToDelete(null)} role="dialog" aria-modal="true">
          <div className="modal-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--error)' }}>
                delete_forever
              </span>
              <h2 className="serif" style={{ margin: 0, fontSize: '1.35rem' }}>
                Move Project to Trash?
              </h2>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{projectToDelete.title}</strong>?
            </p>

            <div
              style={{
                background: 'rgba(255, 221, 179, 0.45)',
                border: '1px solid rgba(217, 119, 6, 0.35)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 18,
                fontSize: '0.82rem',
                color: 'var(--on-surface)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>
                schedule
              </span>
              <div>
                <strong>30-Day Buffer Guarantee:</strong> This project and all its to-dos will be kept safely in the{' '}
                <strong>Trash</strong> for 30 days before permanent deletion. You can restore it at any time, or permanently delete it right away from the Trash.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setProjectToDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: 'var(--error-container)',
                  color: 'var(--error)',
                  border: '1px solid rgba(186, 26, 26, 0.25)',
                }}
                onClick={() => {
                  const target = projectToDelete;
                  setProjectToDelete(null);
                  onDeleteProject?.(target.id);
                }}
              >
                Move to Trash (30 days)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cover Image Modal */}
      {editingImageProject && (
        <div className="modal-backdrop" onClick={() => setEditingImageProject(null)} role="dialog" aria-modal="true">
          <div className="modal-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary)' }}>
                  image
                </span>
                <h2 className="serif" style={{ margin: 0, fontSize: '1.35rem' }}>
                  Cover Image for {editingImageProject.title}
                </h2>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                onClick={() => setEditingImageProject(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>

            <div className="modal-field">
              <label>Image URL or File Upload</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                />
                <label
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    upload
                  </span>
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageUpload(e, true)}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>Quick presets:</span>
                {PRESET_COVERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="pill-tag"
                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                    onClick={() => setEditImageUrl(preset.url)}
                  >
                    {preset.label}
                  </button>
                ))}
                {editImageUrl && (
                  <button
                    type="button"
                    className="pill-tag"
                    style={{ border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.7rem' }}
                    onClick={() => setEditImageUrl('')}
                  >
                    Remove Cover
                  </button>
                )}
              </div>

              {editImageUrl && (
                <div
                  style={{
                    width: '100%',
                    height: 140,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--surface-container)',
                    marginBottom: 16,
                  }}
                >
                  <img
                    src={editImageUrl}
                    alt="Cover preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingImageProject(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onUpdateProject?.(editingImageProject.id, { coverImage: editImageUrl.trim() });
                  setEditingImageProject(null);
                }}
              >
                Save Cover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Details Modal */}
      {editingProject && (
        <div className="modal-backdrop" onClick={() => setEditingProject(null)} role="dialog" aria-modal="true">
          <div className="modal-panel" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary)' }}>
                  edit_note
                </span>
                <h2 className="serif" style={{ margin: 0, fontSize: '1.35rem' }}>
                  Edit Project Details
                </h2>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                onClick={() => setEditingProject(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleEditProjectSubmit}>
              <div className="modal-field">
                <label htmlFor="edit-proj-title">Project Title</label>
                <input
                  id="edit-proj-title"
                  type="text"
                  required
                  value={editProjectForm.title}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, title: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label htmlFor="edit-proj-desc">Mission &amp; Description</label>
                <textarea
                  id="edit-proj-desc"
                  rows={3}
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div className="modal-field">
                  <label htmlFor="edit-proj-status">Status Badge Label</label>
                  <input
                    id="edit-proj-status"
                    type="text"
                    value={editProjectForm.status}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, status: e.target.value })}
                    placeholder="e.g. In Progress, Reviewing, SOC2 Prep"
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="edit-proj-tone">Badge Tone</label>
                  <select
                    id="edit-proj-tone"
                    value={editProjectForm.statusTone}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, statusTone: e.target.value })}
                  >
                    <option value="green">Green (Active / Normal)</option>
                    <option value="amber">Amber (Reviewing / Caution)</option>
                    <option value="neutral">Neutral (Ongoing / Research)</option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label>Cover Image (Optional)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editProjectForm.coverImage}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, coverImage: e.target.value })}
                  />
                  <label
                    className="btn btn-secondary btn-sm"
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      upload
                    </span>
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, false, true)}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--outline)' }}>Presets:</span>
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="pill-tag"
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                      onClick={() => setEditProjectForm({ ...editProjectForm, coverImage: preset.url })}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {editProjectForm.coverImage && (
                    <button
                      type="button"
                      className="pill-tag"
                      style={{ border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.7rem' }}
                      onClick={() => setEditProjectForm({ ...editProjectForm, coverImage: '' })}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {editProjectForm.coverImage && (
                  <div
                    style={{
                      marginTop: 10,
                      width: '100%',
                      height: 100,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: 'var(--surface-container)',
                    }}
                  >
                    <img
                      src={editProjectForm.coverImage}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingProject(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
