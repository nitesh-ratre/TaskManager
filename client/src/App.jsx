import { useEffect, useRef, useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { MonthlyRoutineChecklist } from './components/MonthlyRoutineChecklist.jsx';
import { ProfileModal } from './components/ProfileModal.jsx';
import { ProjectsDashboard } from './components/ProjectsDashboard.jsx';
import { TaskDetailDrawer } from './components/TaskDetailDrawer.jsx';
import { TodosCardsView } from './components/TodosCardsView.jsx';
import { TodosListView } from './components/TodosListView.jsx';
import { TrashModal } from './components/TrashModal.jsx';
import {
  loadWorkspace,
  saveWorkspace,
  fetchRemoteWorkspace,
  syncRemoteWorkspace,
} from './services/taskApi.js';

function parseHash(projects) {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'routines') {
    return { screen: 'routines', projectId: null, listId: null, nav: 'routines' };
  }
  if (parts[0] === 'projects' && parts[1]) {
    const project = projects.find((p) => p.id === parts[1]);
    if (project) {
      if (parts[2] === 'todos' && parts[3]) {
        const list = project.lists.find((l) => l.id === parts[3]);
        if (list) return { screen: 'list', projectId: project.id, listId: list.id, nav: 'home' };
      }
      return { screen: 'cards', projectId: project.id, listId: null, nav: 'home' };
    }
  }
  if (['lineup', 'pings', 'hey', 'activity', 'find'].includes(parts[0])) {
    return { screen: 'secondary', projectId: null, listId: null, nav: parts[0] };
  }
  return { screen: 'dashboard', projectId: null, listId: null, nav: 'home' };
}

export default function App() {
  const [workspace, setWorkspace] = useState(() => loadWorkspace());
  const [route, setRoute] = useState(() => parseHash(loadWorkspace().projects));
  const [selectedTaskRef, setSelectedTaskRef] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [profileModalState, setProfileModalState] = useState({ isOpen: false, tab: 'profile' });
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  useEffect(() => {
    saveWorkspace(workspace);
    syncRemoteWorkspace(workspace);
  }, [workspace]);

  // Initial pull from Node backend if online
  useEffect(() => {
    let cancelled = false;
    fetchRemoteWorkspace().then((remote) => {
      if (!cancelled && remote && remote.projects?.length) {
        setWorkspace(remote);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(workspace.projects));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [workspace.projects]);

  function navigate(next) {
    setRoute(next);
    if (next.screen === 'routines' || next.nav === 'routines') {
      window.location.hash = '#/routines';
    } else if (next.screen === 'dashboard') {
      window.location.hash = '#/home';
    } else if (next.screen === 'cards') {
      window.location.hash = `#/projects/${next.projectId}/todos`;
    } else if (next.screen === 'list') {
      window.location.hash = `#/projects/${next.projectId}/todos/${next.listId}`;
    } else if (next.screen === 'secondary') {
      window.location.hash = `#/${next.nav}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectNav(navId) {
    if (navId === 'home') {
      navigate({ screen: 'dashboard', projectId: null, listId: null, nav: 'home' });
    } else if (navId === 'routines') {
      navigate({ screen: 'routines', projectId: null, listId: null, nav: 'routines' });
    } else {
      navigate({ screen: 'secondary', projectId: null, listId: null, nav: navId });
    }
  }

  function handleOpenProject(projectId) {
    navigate({ screen: 'cards', projectId, listId: null, nav: 'home' });
  }

  function handleOpenList(projectId, listId) {
    navigate({ screen: 'list', projectId, listId, nav: 'home' });
  }

  function handleOpenLaunchChecklist(projectId) {
    const project = workspace.projects.find((p) => p.id === projectId);
    const launch =
      project?.lists.find((l) => l.id === 'launch-checklist') || project?.lists[0];
    if (project && launch) {
      handleOpenList(project.id, launch.id);
    }
  }

  function handleToggleTodo(projectId, listId, todoId) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t)),
            };
          }),
        };
      }),
    }));
  }

  function handleToggleSubtask(projectId, listId, todoId, subtaskId) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) => {
                if (t.id !== todoId) return t;
                return {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s
                  ),
                };
              }),
            };
          }),
        };
      }),
    }));
  }

  function handleAddTodo(projectId, listId, payload) {
    const newTodo = {
      id: `todo-${Date.now()}`,
      title: payload.title,
      note: '',
      done: false,
      assigneeId: payload.assigneeId || '',
      dueDate: payload.dueDate || '',
      comments: 0,
      subtasks: [],
    };
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) =>
            l.id === listId ? { ...l, todos: [...l.todos, newTodo] } : l
          ),
        };
      }),
    }));
  }

  function handleAddSubtask(projectId, listId, todoId, payload) {
    const newSub = {
      id: `sub-${Date.now()}`,
      title: payload.title,
      done: false,
      assigneeId: payload.assigneeId || '',
      dueDate: payload.dueDate || '',
    };
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) =>
                t.id === todoId
                  ? { ...t, subtasks: [...(t.subtasks || []), newSub] }
                  : t
              ),
            };
          }),
        };
      }),
    }));
  }

  function handleCreateList(projectId, payload) {
    const listId = `list-${Date.now()}`;
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const trackNum = String((p.lists?.length || 0) + 1).padStart(2, '0');
        return {
          ...p,
          lists: [
            ...p.lists,
            {
              id: listId,
              trackLabel: `TRACK ${trackNum}`,
              dotColor: '#006946',
              title: payload.title,
              subtitle: payload.subtitle,
              dueLabel: 'Active',
              isMilestone: true,
              notesCount: 0,
              phaseBadge: `Track ${trackNum} • Active`,
              todos: [],
            },
          ],
        };
      }),
    }));
    return listId;
  }

  function handleCreateProject(payload) {
    const projectId = `project-${Date.now()}`;
    const newProject = {
      id: projectId,
      title: payload.title,
      description: payload.description,
      status: 'In Progress',
      statusTone: 'green',
      highlightType: 'tags',
      tags: [{ label: 'New Project', tone: 'neutral' }],
      members: ['alex'],
      activeAgo: 'Active just now',
      lists: [
        {
          id: `kickoff-${Date.now()}`,
          trackLabel: 'TRACK 01',
          dotColor: '#006946',
          title: 'Kickoff & Milestones',
          subtitle: 'Initial goals and team alignment.',
          dueLabel: 'This week',
          isMilestone: true,
          notesCount: 0,
          phaseBadge: 'Phase 1 • Kickoff',
          todos: [
            {
              id: `t-${Date.now()}`,
              title: 'Define project scope & first milestone',
              done: false,
              assigneeId: 'alex',
              dueDate: 'Tomorrow',
              dueUrgent: true,
              comments: 0,
              subtasks: [],
            },
          ],
        },
      ],
    };
    setWorkspace((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));
    handleOpenProject(projectId);
  }

  function handleNotify(message) {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3200);
  }

  function handleOpenTaskDetail(projectId, listId, todoOrId) {
    const todoId = typeof todoOrId === 'string' ? todoOrId : todoOrId?.id;
    if (!todoId) return;
    setSelectedTaskRef({ projectId, listId, todoId });
  }

  function handleUpdateTask(projectId, listId, todoId, updates) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) => (t.id === todoId ? { ...t, ...updates } : t)),
            };
          }),
        };
      }),
    }));
  }

  function handleDeleteTask(projectId, listId, todoId) {
    let deletedTitle = '';
    setWorkspace((prev) => {
      const project = prev.projects.find((p) => p.id === projectId);
      const list = project?.lists.find((l) => l.id === listId);
      const todo = list?.todos.find((t) => t.id === todoId);
      if (!todo) return prev;
      deletedTitle = todo.title;
      const trashEntry = {
        id: `trash-${Date.now()}`,
        type: 'todo',
        title: todo.title,
        projectId,
        projectTitle: project.title,
        listId,
        listTitle: list.title,
        deletedAt: new Date().toISOString(),
        data: todo,
      };
      return {
        ...prev,
        trashItems: [trashEntry, ...(prev.trashItems || [])],
        projects: prev.projects.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            activeAgo: 'Active just now',
            lists: p.lists.map((l) =>
              l.id === listId
                ? { ...l, todos: l.todos.filter((t) => t.id !== todoId) }
                : l
            ),
          };
        }),
      };
    });
    if (selectedTaskRef?.todoId === todoId) {
      setSelectedTaskRef(null);
    }
    if (deletedTitle) {
      handleNotify(`Moved "${deletedTitle}" to Trash`);
    }
  }

  function handleAddComment(projectId, listId, todoId, text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const newComment = {
      id: `comment-${Date.now()}`,
      author: workspace.userName || 'Alex',
      text: trimmed,
      createdAt: 'Just now',
    };
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) =>
                t.id === todoId
                  ? {
                      ...t,
                      comments: (t.comments || 0) + 1,
                      commentList: [...(t.commentList || []), newComment],
                    }
                  : t
              ),
            };
          }),
        };
      }),
    }));
  }

  function handleUpdateSubtask(projectId, listId, todoId, subtaskId, updates) {
    const patch = typeof updates === 'string' ? { title: updates } : updates;
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) => {
                if (t.id !== todoId) return t;
                return {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === subtaskId ? { ...s, ...patch } : s
                  ),
                };
              }),
            };
          }),
        };
      }),
    }));
  }

  function handleDeleteSubtask(projectId, listId, todoId, subtaskId) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            return {
              ...l,
              todos: l.todos.map((t) => {
                if (t.id !== todoId) return t;
                return {
                  ...t,
                  subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId),
                };
              }),
            };
          }),
        };
      }),
    }));
  }

  function handleReorderTodos(projectId, listId, newOrderedIds) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => {
            if (l.id !== listId) return l;
            const byId = new Map(l.todos.map((t) => [t.id, t]));
            const ordered = [];
            const seen = new Set();
            for (const id of newOrderedIds) {
              const item = byId.get(id);
              if (item && !seen.has(id)) {
                ordered.push(item);
                seen.add(id);
              }
            }
            for (const t of l.todos) {
              if (!seen.has(t.id)) {
                ordered.push(t);
              }
            }
            return { ...l, todos: ordered };
          }),
        };
      }),
    }));
  }

  function handleUpdateList(projectId, listId, updates) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          activeAgo: 'Active just now',
          lists: p.lists.map((l) => (l.id === listId ? { ...l, ...updates } : l)),
        };
      }),
    }));
  }

  function handleDeleteList(projectId, listId) {
    let deletedTitle = '';
    setWorkspace((prev) => {
      const project = prev.projects.find((p) => p.id === projectId);
      const list = project?.lists.find((l) => l.id === listId);
      if (!list) return prev;
      deletedTitle = list.title;
      const trashEntry = {
        id: `trash-${Date.now()}`,
        type: 'list',
        title: list.title,
        projectId,
        projectTitle: project.title,
        listId: list.id,
        listTitle: list.title,
        deletedAt: new Date().toISOString(),
        data: list,
      };
      return {
        ...prev,
        trashItems: [trashEntry, ...(prev.trashItems || [])],
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, activeAgo: 'Active just now', lists: p.lists.filter((l) => l.id !== listId) }
            : p
        ),
      };
    });
    if (selectedTaskRef?.listId === listId) {
      setSelectedTaskRef(null);
    }
    if (route.screen === 'list' && route.listId === listId) {
      handleOpenProject(projectId);
    }
    if (deletedTitle) {
      handleNotify(`Moved "${deletedTitle}" to Trash`);
    }
  }

  function handleUpdateProject(projectId, updates) {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates, activeAgo: 'Active just now' } : p
      ),
    }));
    handleNotify('Project updated');
  }

  function handleDeleteProject(projectId) {
    let deletedTitle = '';
    setWorkspace((prev) => {
      const project = prev.projects.find((p) => p.id === projectId);
      if (!project) return prev;
      deletedTitle = project.title;
      const trashEntry = {
        id: `trash-project-${Date.now()}`,
        type: 'project',
        title: project.title,
        projectId: project.id,
        projectTitle: project.title,
        originalLocation: 'All Projects',
        deletedAt: new Date().toISOString(),
        data: project,
      };
      return {
        ...prev,
        trashItems: [trashEntry, ...(prev.trashItems || [])],
        projects: prev.projects.filter((p) => p.id !== projectId),
      };
    });
    if (route.projectId === projectId) {
      navigate({ screen: 'dashboard', projectId: null, listId: null, nav: 'home' });
    }
    if (deletedTitle) {
      handleNotify(`Moved "${deletedTitle}" to Trash (30 days retention)`);
    }
  }

  function handleRestoreTrash(trashId) {
    let restoredTitle = '';
    setWorkspace((prev) => {
      const item = (prev.trashItems || []).find((x) => x.id === trashId);
      if (!item) return prev;
      restoredTitle = item.title;
      const remainingTrash = (prev.trashItems || []).filter((x) => x.id !== trashId);

      if (item.type === 'project' && item.data) {
        return {
          ...prev,
          trashItems: remainingTrash,
          projects: [item.data, ...prev.projects],
        };
      }

      if (item.type === 'list') {
        return {
          ...prev,
          trashItems: remainingTrash,
          projects: prev.projects.map((p) =>
            p.id === item.projectId
              ? { ...p, activeAgo: 'Active just now', lists: [...p.lists, item.data] }
              : p
          ),
        };
      }

      if (item.type === 'todo') {
        return {
          ...prev,
          trashItems: remainingTrash,
          projects: prev.projects.map((p) => {
            if (p.id !== item.projectId) return p;
            const hasTargetList = p.lists.some((l) => l.id === item.listId);
            return {
              ...p,
              activeAgo: 'Active just now',
              lists: p.lists.map((l, idx) =>
                l.id === item.listId || (!hasTargetList && idx === 0)
                  ? { ...l, todos: [...l.todos, item.data] }
                  : l
              ),
            };
          }),
        };
      }

      return { ...prev, trashItems: remainingTrash };
    });
    if (restoredTitle) {
      handleNotify(`Restored "${restoredTitle}"`);
    }
  }

  function handleDeletePermanentTrash(trashId) {
    setWorkspace((prev) => ({
      ...prev,
      trashItems: (prev.trashItems || []).filter((x) => x.id !== trashId),
    }));
  }

  function handleUpdateProfile(updatedProfile) {
    setWorkspace((prev) => ({
      ...prev,
      userName: updatedProfile.name.split(' ')[0] || updatedProfile.name,
      userProfile: updatedProfile,
    }));
    handleNotify(`Profile updated for ${updatedProfile.name}`);
  }

  function handleSwitchUser(member) {
    const newProfile = {
      id: member.id,
      name: member.name,
      email: `${member.id}@${workspace.workspaceName.toLowerCase().replace(/\s+/g, '')}.cc`,
      title: `${member.name} • Team Contributor`,
      bio: 'Collaborating in Acme Studio Basecamp.',
      initials: member.initials,
      color: member.color,
      timezone: 'America/New_York (GMT-5)',
      statusMessage: 'Available for focus',
      statusEmoji: '⚡',
    };
    setWorkspace((prev) => ({
      ...prev,
      userName: member.name,
      userProfile: newProfile,
    }));
    handleNotify(`Switched active user to ${member.name}`);
  }

  const activeProject = workspace.projects.find((p) => p.id === route.projectId);
  const activeList = activeProject?.lists.find((l) => l.id === route.listId);
  const selectedTaskProject = selectedTaskRef
    ? workspace.projects.find((p) => p.id === selectedTaskRef.projectId)
    : null;
  const selectedTaskList = selectedTaskProject?.lists.find(
    (l) => l.id === selectedTaskRef?.listId
  );
  const selectedTask = selectedTaskList?.todos.find(
    (t) => t.id === selectedTaskRef?.todoId
  );

  return (
    <AppShell
      workspace={workspace}
      activeNav={route.nav}
      onSelectNav={handleSelectNav}
      onJumpToProject={handleOpenProject}
      onJumpToList={handleOpenList}
      onOpenTrash={() => setTrashOpen(true)}
      onOpenProfile={(tab = 'profile') => setProfileModalState({ isOpen: true, tab })}
      narrow={route.screen === 'list'}
    >
      {route.screen === 'dashboard' && (
        <ProjectsDashboard
          workspace={workspace}
          onOpenProject={handleOpenProject}
          onOpenLaunchChecklist={handleOpenLaunchChecklist}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onSelectNav={handleSelectNav}
        />
      )}

      {route.screen === 'routines' && (
        <MonthlyRoutineChecklist onNavigate={(path) => handleSelectNav(path || 'home')} />
      )}

      {route.screen === 'cards' && activeProject && (
        <TodosCardsView
          project={activeProject}
          onBackHome={() => handleSelectNav('home')}
          onOpenList={(listId) => handleOpenList(activeProject.id, listId)}
          onToggleTodo={handleToggleTodo}
          onAddTodo={handleAddTodo}
          onCreateList={handleCreateList}
          onUpdateList={handleUpdateList}
          onDeleteList={handleDeleteList}
          onOpenTaskDetail={handleOpenTaskDetail}
        />
      )}

      {route.screen === 'list' && activeProject && activeList && (
        <TodosListView
          project={activeProject}
          list={activeList}
          onBackHome={() => handleSelectNav('home')}
          onBackToCards={() => handleOpenProject(activeProject.id)}
          onToggleTodo={handleToggleTodo}
          onToggleSubtask={handleToggleSubtask}
          onAddTodo={handleAddTodo}
          onAddSubtask={handleAddSubtask}
          onReorderTodos={handleReorderTodos}
          onOpenTaskDetail={handleOpenTaskDetail}
          onDeleteTodo={handleDeleteTask}
          onDeleteSubtask={handleDeleteSubtask}
          onNotify={handleNotify}
        />
      )}

      {route.screen === 'secondary' && (
        <section className="hq-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <span className="pill-tag" style={{ textTransform: 'uppercase' }}>
                {route.nav}
              </span>
              <h1 className="serif" style={{ margin: '10px 0 6px', fontSize: '2rem' }}>
                {route.nav === 'hey' ? 'Hey! Notifications' : `${route.nav[0].toUpperCase()}${route.nav.slice(1)}`}
              </h1>
              <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>
                Calm, batched updates across {workspace.projects.length} active projects.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSelectNav('home')}
            >
              Back to Home
            </button>
          </div>
        </section>
      )}

      <TaskDetailDrawer
        isOpen={Boolean(selectedTask)}
        projectId={selectedTaskRef?.projectId}
        listId={selectedTaskRef?.listId}
        task={selectedTask}
        onClose={() => setSelectedTaskRef(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onAddComment={handleAddComment}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onUpdateSubtask={handleUpdateSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      <TrashModal
        isOpen={trashOpen}
        trashItems={workspace.trashItems || []}
        onClose={() => setTrashOpen(false)}
        onRestore={handleRestoreTrash}
        onDeletePermanent={handleDeletePermanentTrash}
      />

      <ProfileModal
        isOpen={profileModalState.isOpen}
        initialTab={profileModalState.tab}
        workspace={workspace}
        onClose={() => setProfileModalState((s) => ({ ...s, isOpen: false }))}
        onUpdateProfile={handleUpdateProfile}
        onSwitchUser={handleSwitchUser}
        onOpenTrash={() => setTrashOpen(true)}
      />

      {toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-fixed)' }}>
            notifications_active
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </AppShell>
  );
}
