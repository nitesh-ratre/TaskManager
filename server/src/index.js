import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readWorkspace, writeWorkspace, syncFromDatabaseIfAvailable } from './storage.js';
import { initDatabase, isDatabaseConnected, checkDatabaseConnection } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// -----------------------------------------------------------------------------
// SYSTEM & HEALTH ENDPOINTS
// -----------------------------------------------------------------------------

app.get('/health', async (req, res) => {
  const dbActive = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    service: 'TaskManager Backend',
    timestamp: new Date().toISOString(),
    databaseConnected: dbActive,
    databaseEngine: 'PostgreSQL 18 (Local)',
  });
});

app.get('/api/database/status', async (req, res) => {
  const dbActive = await checkDatabaseConnection();
  res.json({
    connected: dbActive,
    engine: 'PostgreSQL 18',
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    hasPasswordConfigured: Boolean(process.env.PGPASSWORD),
    mode: dbActive ? 'PostgreSQL Active Sync' : 'Local JSON Fallback',
  });
});

// -----------------------------------------------------------------------------
// WORKSPACE ENDPOINTS
// -----------------------------------------------------------------------------

// Get complete workspace state
app.get('/api/workspace', (req, res) => {
  const ws = readWorkspace();
  res.json(ws);
});

// Full update of workspace state
app.put('/api/workspace', (req, res) => {
  const incoming = req.body;
  if (!incoming || !Array.isArray(incoming.projects)) {
    return res.status(400).json({ error: 'Invalid workspace format' });
  }
  writeWorkspace(incoming);
  res.json(incoming);
});

// -----------------------------------------------------------------------------
// PROJECTS CRUD
// -----------------------------------------------------------------------------

// List projects
app.get('/api/projects', (req, res) => {
  const ws = readWorkspace();
  res.json(ws.projects || []);
});

// Get single project
app.get('/api/projects/:projectId', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Create project
app.post('/api/projects', (req, res) => {
  const ws = readWorkspace();
  const { title, description, coverImage, status, statusTone } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const newProject = {
    id: `project-${Date.now()}`,
    title: title.trim(),
    description: (description || '').trim(),
    status: status || 'In Progress',
    statusTone: statusTone || 'green',
    coverImage: (coverImage || '').trim(),
    members: ['alex'],
    activeAgo: 'Active just now',
    lists: [
      {
        id: `list-${Date.now()}`,
        trackLabel: 'TRACK 01',
        dotColor: '#006946',
        title: 'General To-dos',
        subtitle: 'Initial track for deliverables.',
        dueLabel: 'Active',
        isMilestone: true,
        notesCount: 0,
        phaseBadge: 'Phase 1 • Active',
        todos: [],
      },
    ],
  };

  ws.projects = [newProject, ...(ws.projects || [])];
  writeWorkspace(ws);
  res.status(201).json(newProject);
});

// Update project
app.patch('/api/projects/:projectId', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const allowed = ['title', 'description', 'status', 'statusTone', 'coverImage', 'members'];
  for (const key of allowed) {
    if (key in req.body) {
      project[key] = req.body[key];
    }
  }
  project.activeAgo = 'Active just now';

  writeWorkspace(ws);
  res.json(project);
});

// Move project to Trash (30 days retention buffer)
app.delete('/api/projects/:projectId', (req, res) => {
  const ws = readWorkspace();
  const projectIdx = (ws.projects || []).findIndex((p) => p.id === req.params.projectId);
  if (projectIdx === -1) return res.status(404).json({ error: 'Project not found' });

  const [project] = ws.projects.splice(projectIdx, 1);
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

  ws.trashItems = [trashEntry, ...(ws.trashItems || [])];
  writeWorkspace(ws);
  res.json({ message: 'Project moved to trash', trashEntry });
});

// -----------------------------------------------------------------------------
// LISTS CRUD
// -----------------------------------------------------------------------------

// Create list
app.post('/api/projects/:projectId/lists', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { title, subtitle } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'List title required' });

  const trackNum = String((project.lists?.length || 0) + 1).padStart(2, '0');
  const newList = {
    id: `list-${Date.now()}`,
    trackLabel: `TRACK ${trackNum}`,
    dotColor: '#006946',
    title: title.trim(),
    subtitle: (subtitle || '').trim(),
    dueLabel: 'Active',
    isMilestone: true,
    notesCount: 0,
    phaseBadge: `Track ${trackNum} • Active`,
    todos: [],
  };

  project.lists = [...(project.lists || []), newList];
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.status(201).json(newList);
});

// Update list
app.patch('/api/projects/:projectId/lists/:listId', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const list = (project.lists || []).find((l) => l.id === req.params.listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const allowed = ['title', 'subtitle', 'dueLabel', 'isMilestone', 'dotColor'];
  for (const key of allowed) {
    if (key in req.body) {
      list[key] = req.body[key];
    }
  }
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.json(list);
});

// Move list to Trash
app.delete('/api/projects/:projectId/lists/:listId', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const listIdx = (project.lists || []).findIndex((l) => l.id === req.params.listId);
  if (listIdx === -1) return res.status(404).json({ error: 'List not found' });

  const [list] = project.lists.splice(listIdx, 1);
  const trashEntry = {
    id: `trash-list-${Date.now()}`,
    type: 'list',
    title: list.title,
    projectId: project.id,
    projectTitle: project.title,
    listId: list.id,
    listTitle: list.title,
    deletedAt: new Date().toISOString(),
    data: list,
  };

  ws.trashItems = [trashEntry, ...(ws.trashItems || [])];
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.json({ message: 'List moved to trash', trashEntry });
});

// -----------------------------------------------------------------------------
// TO-DOS CRUD
// -----------------------------------------------------------------------------

// Add to-do to list
app.post('/api/projects/:projectId/lists/:listId/todos', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const list = (project.lists || []).find((l) => l.id === req.params.listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const { title, note, assigneeId, dueDate, dueUrgent } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });

  const newTodo = {
    id: `todo-${Date.now()}`,
    title: title.trim(),
    note: (note || '').trim(),
    done: false,
    assigneeId: assigneeId || '',
    dueDate: dueDate || '',
    dueUrgent: Boolean(dueUrgent),
    comments: 0,
    subtasks: [],
    commentList: [],
  };

  list.todos = [...(list.todos || []), newTodo];
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.status(201).json(newTodo);
});

// Update to-do
app.patch('/api/projects/:projectId/lists/:listId/todos/:todoId', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const list = (project.lists || []).find((l) => l.id === req.params.listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const todo = (list.todos || []).find((t) => t.id === req.params.todoId);
  if (!todo) return res.status(404).json({ error: 'To-do not found' });

  const allowed = ['title', 'note', 'done', 'assigneeId', 'dueDate', 'dueUrgent'];
  for (const key of allowed) {
    if (key in req.body) {
      todo[key] = req.body[key];
    }
  }

  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.json(todo);
});

// Delete to-do (move to trash)
app.delete('/api/projects/:projectId/lists/:listId/todos/:todoId', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const list = (project.lists || []).find((l) => l.id === req.params.listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const todoIdx = (list.todos || []).findIndex((t) => t.id === req.params.todoId);
  if (todoIdx === -1) return res.status(404).json({ error: 'To-do not found' });

  const [todo] = list.todos.splice(todoIdx, 1);
  const trashEntry = {
    id: `trash-todo-${Date.now()}`,
    type: 'todo',
    title: todo.title,
    projectId: project.id,
    projectTitle: project.title,
    listId: list.id,
    listTitle: list.title,
    deletedAt: new Date().toISOString(),
    data: todo,
  };

  ws.trashItems = [trashEntry, ...(ws.trashItems || [])];
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.json({ message: 'To-do moved to trash', trashEntry });
});

// Reorder to-dos in list
app.put('/api/projects/:projectId/lists/:listId/todos/reorder', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const list = (project.lists || []).find((l) => l.id === req.params.listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });

  const byId = new Map((list.todos || []).map((t) => [t.id, t]));
  const reordered = [];
  for (const id of orderedIds) {
    if (byId.has(id)) {
      reordered.push(byId.get(id));
      byId.delete(id);
    }
  }
  for (const remaining of byId.values()) {
    reordered.push(remaining);
  }

  list.todos = reordered;
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.json(list.todos);
});

// -----------------------------------------------------------------------------
// SUB-TASKS & COMMENTS
// -----------------------------------------------------------------------------

// Add subtask
app.post('/api/projects/:projectId/lists/:listId/todos/:todoId/subtasks', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  const list = project?.lists.find((l) => l.id === req.params.listId);
  const todo = list?.todos.find((t) => t.id === req.params.todoId);
  if (!todo) return res.status(404).json({ error: 'Parent task not found' });

  const { title, dueDate, assigneeId } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Subtask title required' });

  const newSub = {
    id: `sub-${Date.now()}`,
    title: title.trim(),
    done: false,
    assigneeId: assigneeId || '',
    dueDate: dueDate || '',
  };

  todo.subtasks = [...(todo.subtasks || []), newSub];
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.status(201).json(newSub);
});

// Add comment
app.post('/api/projects/:projectId/lists/:listId/todos/:todoId/comments', (req, res) => {
  const ws = readWorkspace();
  const project = (ws.projects || []).find((p) => p.id === req.params.projectId);
  const list = project?.lists.find((l) => l.id === req.params.listId);
  const todo = list?.todos.find((t) => t.id === req.params.todoId);
  if (!todo) return res.status(404).json({ error: 'Task not found' });

  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });

  const newComment = {
    id: `comment-${Date.now()}`,
    author: ws.userName || 'You',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  todo.commentList = [...(todo.commentList || []), newComment];
  todo.comments = todo.commentList.length;
  project.activeAgo = 'Active just now';
  writeWorkspace(ws);
  res.status(201).json(newComment);
});

// -----------------------------------------------------------------------------
// TRASH RESTORE / PERMANENT DELETE
// -----------------------------------------------------------------------------

// Restore item from trash
app.post('/api/trash/:trashId/restore', (req, res) => {
  const ws = readWorkspace();
  const itemIdx = (ws.trashItems || []).findIndex((t) => t.id === req.params.trashId);
  if (itemIdx === -1) return res.status(404).json({ error: 'Trash item not found' });

  const [item] = ws.trashItems.splice(itemIdx, 1);

  if (item.type === 'project' && item.data) {
    ws.projects = [item.data, ...(ws.projects || [])];
  } else if (item.type === 'list' && item.data) {
    const project = (ws.projects || []).find((p) => p.id === item.projectId);
    if (project) {
      project.lists = [...(project.lists || []), item.data];
    }
  } else if (item.type === 'todo' && item.data) {
    const project = (ws.projects || []).find((p) => p.id === item.projectId);
    const list = project?.lists.find((l) => l.id === item.listId);
    if (list) {
      list.todos = [...(list.todos || []), item.data];
    }
  }

  writeWorkspace(ws);
  res.json({ message: 'Restored successfully', item });
});

// Permanent delete from trash
app.delete('/api/trash/:trashId', (req, res) => {
  const ws = readWorkspace();
  const itemIdx = (ws.trashItems || []).findIndex((t) => t.id === req.params.trashId);
  if (itemIdx === -1) return res.status(404).json({ error: 'Trash item not found' });

  const [deleted] = ws.trashItems.splice(itemIdx, 1);
  writeWorkspace(ws);
  res.json({ message: 'Permanently deleted', deleted });
});

app.listen(port, async () => {
  console.log(`TaskManager backend running on http://localhost:${port}`);
  try {
    await initDatabase();
    await syncFromDatabaseIfAvailable();
  } catch (err) {
    console.warn('Initial database connection notice:', err.message);
  }
});
