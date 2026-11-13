import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
          subtitle: 'Core React components, accessible controls, and smooth view transitions.',
          dueLabel: 'Due Oct 28',
          isMilestone: false,
          notesCount: 12,
          phaseBadge: 'Sprint Phase 2 • Build Track',
          todos: [
            { id: 'fe-1', title: 'Setup Tailwind CSS config', done: true, assigneeId: 'liam', dueDate: 'Oct 20', comments: 3, subtasks: [] },
            { id: 'fe-2', title: 'Implement standard App Shell', done: false, assigneeId: 'liam', dueDate: 'Oct 27', comments: 4, subtasks: [] },
            { id: 'fe-3', title: 'Fast navigation state sync', done: false, assigneeId: 'alex', dueDate: 'Oct 28', comments: 2, subtasks: [] },
            { id: 'fe-4', title: 'Performance audit & zero CLS', done: false, assigneeId: 'devon', dueDate: 'Oct 29', comments: 0, subtasks: [] },
          ],
        },
      ],
    },
    {
      id: 'mobile-app-v3',
      title: 'Mobile App v3.0',
      description: 'Offline syncing, redesigned inbox swipe actions, and smoother typography rendering.',
      status: 'In Progress',
      statusTone: 'green',
      highlightType: 'quote',
      highlightAuthor: 'Latest update from Liam',
      highlightText: '"TestFlight build #448 is live for internal test..."',
      members: ['liam', 'sarah', 'devon'],
      activeAgo: 'Active 2h ago',
      lists: [
        {
          id: 'mobile-sync',
          trackLabel: 'TRACK 01',
          dotColor: '#006946',
          title: 'Offline Sync Engine',
          subtitle: 'Conflict-free queue reconciliation when reconnecting on trains or flights.',
          dueLabel: 'Due Nov 01',
          isMilestone: true,
          notesCount: 5,
          phaseBadge: 'Mobile Sprint 3 • Core',
          todos: [
            { id: 'ms-1', title: 'SQLite local cache migration', done: true, assigneeId: 'liam', dueDate: 'Oct 22', comments: 2, subtasks: [] },
            { id: 'ms-2', title: 'Optimistic swipe-to-archive action', done: true, assigneeId: 'sarah', dueDate: 'Oct 23', comments: 1, subtasks: [] },
            { id: 'ms-3', title: 'Background retry backoff tuning', done: false, assigneeId: 'liam', dueDate: 'Oct 30', comments: 3, subtasks: [] },
          ],
        },
      ],
    },
    {
      id: 'brand-design-system',
      title: 'Brand Guidelines & Design System',
      description: 'Standardizing type scale, color tokens, and editorial illustration rules for all digital products.',
      status: 'Reviewing',
      statusTone: 'amber',
      highlightType: 'tags',
      tags: [
        { label: 'Typography', tone: 'neutral' },
        { label: 'Figma Lib', tone: 'neutral' },
        { label: 'Priority 1', tone: 'amber' },
      ],
      members: ['sarah', 'alex', 'maya', 'liam', 'devon'],
      activeAgo: 'Active yesterday',
      lists: [
        {
          id: 'tokens-v2',
          trackLabel: 'TRACK 01',
          dotColor: '#feb235',
          title: 'Design Tokens & Scale',
          subtitle: 'Canonical Newsreader + Inter pairing across web and mobile.',
          dueLabel: 'In review',
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
}
