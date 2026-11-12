import { INITIAL_WORKSPACE } from '../data/seedData.js';

const STORAGE_KEY = 'basecamp.taskmanager.v1';
export const API_BASE = 'http://localhost:3001/api';

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateInputDisplay(isoOrString) {
  if (!isoOrString || typeof isoOrString !== 'string') return '';
  const trimmed = isoOrString.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  return trimmed;
}

export function computeTrashExpiry(deletedAtISO, bufferDays = 30) {
  if (!deletedAtISO) return { daysRemaining: bufferDays, isExpired: false, expiryDateString: '' };
  const deletedTime = new Date(deletedAtISO).getTime();
  if (Number.isNaN(deletedTime)) {
    return { daysRemaining: bufferDays, isExpired: false, expiryDateString: '' };
  }
  const expiryTime = deletedTime + bufferDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const msRemaining = expiryTime - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const expiryDate = new Date(expiryTime);
  const expiryDateString = expiryDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return {
    daysRemaining,
    isExpired: msRemaining <= 0,
    expiryDateString,
  };
}

export function normalizeWorkspace(ws) {
  const base = ws && Array.isArray(ws.projects) ? ws : INITIAL_WORKSPACE;
  const defaultProfile = {
    id: 'alex',
    name: base.userName || 'Alex Morgan',
    email: 'alex@acme.studio',
    title: 'Product Lead & Designer',
    bio: 'Focusing on calm software, typography, and humane product pacing.',
    initials: 'AM',
    color: '#1d4e3b',
    timezone: 'America/New_York (GMT-5)',
    statusMessage: 'In deep work on Website Redesign',
    statusEmoji: '🌿',
  };

  // Clean out any items that exceeded the 30-day buffer automatically
  const rawTrash = Array.isArray(base.trashItems) ? base.trashItems : [];
  const activeTrash = rawTrash.filter((item) => {
    if (!item.deletedAt) return true;
    const { isExpired } = computeTrashExpiry(item.deletedAt, 30);
    return !isExpired;
  });

  return {
    ...base,
    userProfile: base.userProfile || defaultProfile,
    trashItems: activeTrash,
    projects: (base.projects || []).map((p) => ({
      ...p,
      lists: (p.lists || []).map((l) => ({
        ...l,
        todos: (l.todos || []).map((t) => ({
          ...t,
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
          commentList: Array.isArray(t.commentList) ? t.commentList : [],
        })),
      })),
    })),
  };
}

export function loadWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const normalized = normalizeWorkspace(INITIAL_WORKSPACE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.projects)) {
      return normalizeWorkspace(INITIAL_WORKSPACE);
    }
    return normalizeWorkspace(parsed);
  } catch {
    return normalizeWorkspace(INITIAL_WORKSPACE);
  }
}

export function saveWorkspace(workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

// -----------------------------------------------------------------------------
// BACKEND API SYNC
// -----------------------------------------------------------------------------

export async function fetchRemoteWorkspace() {
  try {
    const res = await fetch(`${API_BASE}/workspace`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return normalizeWorkspace(data);
  } catch (err) {
    // Backend offline or unreachable, fallback silently
    return null;
  }
}

let syncTimeout = null;
export function syncRemoteWorkspace(workspace) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch(`${API_BASE}/workspace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace),
      });
    } catch {
      // Offline fallback: saved to localStorage
    }
  }, 400);
}

export async function checkBackendHealth() {
  try {
    const res = await fetch('http://localhost:3001/health');
    return res.ok;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

export function parseDueDateValue(dueDate) {
  if (!dueDate || typeof dueDate !== 'string') return Number.POSITIVE_INFINITY;
  const trimmed = dueDate.trim();
  if (!trimmed) return Number.POSITIVE_INFINITY;
  const lower = trimmed.toLowerCase();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const DAY_MS = 86400000;

  if (lower.includes('overdue')) return startOfToday - DAY_MS;
  if (lower === 'today') return startOfToday;
  if (lower === 'tomorrow') return startOfToday + DAY_MS;
  if (lower === 'next week') return startOfToday + 7 * DAY_MS;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])).getTime();
  }

  const parsed = Date.parse(`${trimmed} ${now.getFullYear()}`);
  if (!Number.isNaN(parsed)) return parsed;

  const direct = Date.parse(trimmed);
  if (!Number.isNaN(direct)) return direct;

  return Number.POSITIVE_INFINITY - 1;
}

export function compareTodosByDueDate(a, b) {
  return parseDueDateValue(a?.dueDate) - parseDueDateValue(b?.dueDate);
}

export function countProjectTodos(project) {
  let total = 0;
  let done = 0;
  for (const list of project.lists || []) {
    for (const todo of list.todos || []) {
      total += 1;
      if (todo.done) done += 1;
    }
  }
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export function countListTodos(list) {
  const todos = list?.todos || [];
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}
