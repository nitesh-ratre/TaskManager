import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveWorkspaceToDatabase, loadWorkspaceFromDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/workspace.json');

const INITIAL_WORKSPACE = {
  workspaceName: 'Acme Studio',
  userName: 'Alex',
  announcement: 'Fall Retreat & Q4 Priorities Overview',
  userProfile: {
    id: 'alex',
    name: 'Alex Morgan',
    email: 'alex@acme.studio',
    title: 'Product Lead & Designer',
    bio: 'Focusing on calm software, typography, and humane product pacing.',
    initials: 'AM',
    color: '#1d4e3b',
    timezone: 'America/New_York (GMT-5)',
    statusMessage: 'In deep work on Website Redesign',
    statusEmoji: '🌿',
  },
  trashItems: [],
  projects: [
    {
      id: 'marketing-website-redesign',
      title: 'Marketing Website Redesign',
      description: 'Rebuilding our homepage, pricing matrix, and modern visual narrative for Q4 launch.',
      status: 'In Progress',
      statusTone: 'green',
      highlightType: 'hill',
      coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=720&q=80',
      members: ['alex', 'liam', 'sarah', 'devon'],
      activeAgo: 'Active 20m ago',
      lists: [
        {
          id: 'design-concepts',
          trackLabel: 'TRACK 01',
          dotColor: '#006946',
          title: 'Design & Concepts',
          subtitle: 'Refining page flows, typography, responsive hierarchy, and brand tokens.',
          dueLabel: 'Due in 3 days',
          isMilestone: true,
          notesCount: 7,
          phaseBadge: 'Sprint Phase 1 • Design Track',
          todos: [
            {
              id: 'dc-1',
              title: 'Hero section editorial layout',
              note: '',
              done: true,
              assigneeId: 'alex',
              dueDate: 'Oct 22',
              comments: 2,
              subtasks: [],
              commentList: [
                { id: 'c-1', author: 'Alex', text: 'Checked font scale against 1440px desktop viewport.', createdAt: '2026-10-22T10:00:00Z' }
              ],
            },
            {
              id: 'dc-2',
              title: 'Warm parchment color system',
              note: '',
              done: true,
              assigneeId: 'sarah',
              dueDate: 'Oct 23',
              comments: 1,
              subtasks: [],
              commentList: [],
            },
            {
              id: 'dc-3',
              title: 'Case study interactive mockups & visual rhythm',
              note: 'Include tablet horizontal scroll behavior',
              done: false,
              assigneeId: 'sarah',
              dueDate: 'Tomorrow',
              dueUrgent: true,
              comments: 5,
              subtasks: [],
              commentList: [],
            },
            {
              id: 'dc-4',
              title: 'Asset handoff with SVG tokens & illustration packs',
              note: 'Check scale parameters on 2x Retina screens',
              done: false,
              assigneeId: 'alex',
              dueDate: 'Oct 28',
              comments: 3,
              subtasks: [],
              commentList: [],
            },
          ],
        },
        {
          id: 'frontend-engineering',
          trackLabel: 'TRACK 02',
          dotColor: '#feb235',
          title: 'Frontend Engineering',
          subtitle: 'React component system, SVG progress rings, hill chart, and calm UI transitions.',
          dueLabel: 'Due in 10 days',
          isMilestone: false,
          notesCount: 4,
          phaseBadge: 'Engineering Track • Sprint 2',
          todos: [
            { id: 'fe-1', title: 'Implement Hill Chart canvas & curve drag interactions', done: true, assigneeId: 'liam', dueDate: 'Oct 18', comments: 4, subtasks: [] },
            { id: 'fe-2', title: 'Circular SVG progress rings for Track cards', done: true, assigneeId: 'alex', dueDate: 'Oct 21', comments: 1, subtasks: [] },
            { id: 'fe-3', title: 'Refactor drag-and-drop sortable lists with calm ghost styling', done: false, assigneeId: 'liam', dueDate: 'Oct 27', comments: 0, subtasks: [] },
          ],
        },
      ],
    },
    {
      id: 'mobile-app-v3',
      title: 'Mobile App v3.0',
      description: 'Streamlined iOS and Android experiences with offline task capture and instant search.',
      status: 'In Progress',
      statusTone: 'green',
      highlightType: 'hill',
      coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=720&q=80',
      members: ['alex', 'devon'],
      activeAgo: 'Active 2h ago',
      lists: [
        {
          id: 'core-flows',
          trackLabel: 'TRACK 01',
          dotColor: '#006946',
          title: 'Core Onboarding & Sync',
          subtitle: 'First run experience and offline conflict resolution.',
          dueLabel: 'Due in 2 weeks',
          isMilestone: true,
          notesCount: 3,
          phaseBadge: 'Sprint 3 • Beta',
          todos: [
            { id: 'ma-1', title: 'Biometric unlock & session persistence', done: true, assigneeId: 'devon', dueDate: 'Oct 15', comments: 1, subtasks: [] },
            { id: 'ma-2', title: 'Offline sync queue with optimistic updates', done: false, assigneeId: 'alex', dueDate: 'Oct 30', comments: 6, subtasks: [] },
          ],
        },
      ],
    },
    {
      id: 'brand-design-system',
      title: 'Brand Guidelines & Design System',
      description: 'Unified typography, color palette, icons, and voice tokens for the studio.',
      status: 'Reviewing',
      statusTone: 'amber',
      highlightType: 'none',
      coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=720&q=80',
      members: ['sarah', 'alex'],
      activeAgo: 'Active yesterday',
      lists: [
        {
          id: 'design-tokens',
          trackLabel: 'TRACK 01',
          dotColor: '#1d4e3b',
          title: 'Design Tokens & Typography',
          subtitle: 'Newsreader serif pairing and parchment surface hierarchy.',
          dueLabel: 'Completed',
          isMilestone: true,
          notesCount: 6,
          phaseBadge: 'Design System • v2',
          todos: [
            { id: 'bd-1', title: 'Publish color palette tokens JSON', done: true, assigneeId: 'sarah', dueDate: 'Oct 20', comments: 2, subtasks: [] },
            { id: 'bd-2', title: 'Audit elevation & hairline border rules', done: false, assigneeId: 'alex', dueDate: 'Oct 29', comments: 1, subtasks: [] },
          ],
        },
      ],
    },
  ],
};

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readWorkspace() {
  ensureDirSync(path.dirname(DATA_FILE));
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_WORKSPACE, null, 2), 'utf-8');
    return INITIAL_WORKSPACE;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading workspace storage:', err);
    return INITIAL_WORKSPACE;
  }
}

export function writeWorkspace(data) {
  ensureDirSync(path.dirname(DATA_FILE));
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  // Replicate to PostgreSQL if connected
  saveWorkspaceToDatabase(data).catch(() => {});
}

export async function syncFromDatabaseIfAvailable() {
  try {
    const remote = await loadWorkspaceFromDatabase();
    if (remote && Array.isArray(remote.projects) && remote.projects.length > 0) {
      ensureDirSync(path.dirname(DATA_FILE));
      fs.writeFileSync(DATA_FILE, JSON.stringify(remote, null, 2), 'utf-8');
      console.log('Synchronized workspace from local PostgreSQL database.');
      return remote;
    }
  } catch (err) {
    console.warn('PostgreSQL initial sync notice:', err.message);
  }
  return null;
}
