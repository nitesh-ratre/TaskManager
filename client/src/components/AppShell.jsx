import { useMemo, useState } from 'react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'lineup', label: 'Lineup' },
  { id: 'pings', label: 'Pings', dot: true },
  { id: 'hey', label: 'Hey!' },
  { id: 'activity', label: 'Activity' },
  { id: 'find', label: 'Find' },
  { id: 'routines', label: 'Routines' },
];

export const NAV_LINKS = NAV_ITEMS;

export function AppShell({
  workspace,
  activeNav,
  onSelectNav,
  onJumpToProject,
  onJumpToList,
  onOpenTrash,
  onOpenProfile,
  onOpenSettings,
  narrow = false,
  children,
}) {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const project of workspace.projects) {
      if (project.title.toLowerCase().includes(q)) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.title,
          sub: 'Project • To-dos',
          projectId: project.id,
        });
      }
      for (const list of project.lists || []) {
        if (list.title.toLowerCase().includes(q)) {
          results.push({
            type: 'list',
            id: `${project.id}-${list.id}`,
            title: list.title,
            sub: `${project.title} • List`,
            projectId: project.id,
            listId: list.id,
          });
        }
        for (const todo of list.todos || []) {
          if (todo.title.toLowerCase().includes(q)) {
            results.push({
              type: 'todo',
              id: todo.id,
              title: todo.title,
              sub: `${project.title} / ${list.title}`,
              projectId: project.id,
              listId: list.id,
            });
          }
        }
      }
    }
    return results.slice(0, 7);
  }, [query, workspace.projects]);

  return (
    <div className="shell-root">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-group">
            <button
              type="button"
              className="brand-btn"
              onClick={() => onSelectNav('home')}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--primary)', fontSize: 24 }}
              >
                terrain
              </span>
              <span className="brand-title">Basecamp</span>
            </button>
            <span className="brand-slash">/</span>
            <button
              type="button"
              className="workspace-pill"
              onClick={() => onSelectNav('home')}
            >
              <span>{workspace.workspaceName}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                expand_more
              </span>
            </button>
          </div>

          <nav className="nav-pills" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-path={item.id}
                className={`nav-pill ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => onSelectNav(item.id)}
              >
                <span>{item.label}</span>
                {item.dot && <span className="nav-dot" />}
              </button>
            ))}
          </nav>

          <div className="topbar-right">
            <div className="jump-search">
              <span className="material-symbols-outlined jump-search-icon">
                search
              </span>
              <input
                type="text"
                placeholder="Jump or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              />
              {searchFocused && query.trim() && (
                <div className="jump-dropdown">
                  {searchResults.length === 0 ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                        color: 'var(--outline)',
                      }}
                    >
                      No matches for &ldquo;{query}&rdquo;
                    </div>
                  ) : (
                    searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        className="jump-item"
                        onMouseDown={() => {
                          if (res.listId) {
                            onJumpToList(res.projectId, res.listId);
                          } else {
                            onJumpToProject(res.projectId);
                          }
                          setQuery('');
                        }}
                      >
                        <div>
                          <div className="jump-item-title">{res.title}</div>
                          <div className="jump-item-sub">{res.sub}</div>
                        </div>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, color: 'var(--outline)' }}
                        >
                          arrow_forward
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="icon-circle-btn"
              aria-label="Bookmarks"
              onClick={() => onSelectNav('find')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                bookmark
              </span>
            </button>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="avatar-wrap"
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                title={`${workspace.userProfile?.name || workspace.userName || 'Alex'} (Click for profile & settings)`}
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-expanded={profileMenuOpen}
              >
                <div
                  className="avatar-circle"
                  style={{
                    background: workspace.userProfile?.color || '#1d4e3b',
                  }}
                >
                  {workspace.userProfile?.initials || 'AM'}
                </div>
                <span className="avatar-online" />
              </button>

              {profileMenuOpen && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    minWidth: 230,
                    zIndex: 60,
                    boxShadow: 'var(--shadow-md)',
                  }}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(190, 201, 192, 0.4)',
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)' }}>
                      {workspace.userProfile?.statusEmoji || '🌿'} {workspace.userProfile?.name || workspace.userName || 'Alex'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--outline)' }}>
                      {workspace.userProfile?.title || 'Product Lead'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => onOpenProfile?.('profile')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      person
                    </span>
                    View &amp; Edit Profile
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => onOpenProfile?.('settings')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      tune
                    </span>
                    Workspace Settings
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => onOpenTrash?.()}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>
                      delete
                    </span>
                    View Trash
                    {(workspace.trashItems?.length || 0) > 0 && (
                      <span className="trash-count-badge" style={{ marginLeft: 'auto' }}>
                        {workspace.trashItems.length}
                      </span>
                    )}
                  </button>

                  <div
                    style={{
                      borderTop: '1px solid rgba(190, 201, 192, 0.35)',
                      marginTop: 4,
                      paddingTop: 4,
                    }}
                  >
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => onOpenProfile?.('switch')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        switch_account
                      </span>
                      Switch Teammate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`page-container ${narrow ? 'narrow' : ''}`}>{children}</main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>Calm work, clear minds. Basecamp {workspace.workspaceName}.</span>
          <div className="footer-links">
            <button type="button" onClick={() => onSelectNav('home')}>
              Keyboard Shortcuts
            </button>
            <button type="button" onClick={() => onSelectNav('home')}>
              Help Center
            </button>
            <button type="button" onClick={() => onOpenTrash?.()}>
              Trash
              {(workspace.trashItems?.length || 0) > 0 && (
                <span className="trash-count-badge">{workspace.trashItems.length}</span>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
