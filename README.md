# TaskManager (Meru / Basecamp-Inspired Work Management)

A calm, high-craft project coordination and task management application inspired by Basecamp and Shape Up methodology. Built with a React + Vite frontend and an Express.js backend with local JSON persistence.

---

## ✨ Features

- **Project Dashboard:**
  - Grid & List view switcher.
  - Project cards with optional cover images, progress rings, and member avatars.
  - Direct project edit drawer and 30-day soft delete retention buffer.
  - Company HQ tools (Campfire, Message Board, To-Dos, Docs & Files, Chat, Automatic Check-ins).
- **Tracks & Hill Charts:**
  - Group to-dos into milestone-based Tracks (`TRACK 01`, `TRACK 02`, etc.).
  - Hill Chart progress visualization (uphill discovery vs. downhill execution).
  - SVG progress rings with real-time completion tracking.
- **To-Do Management:**
  - Add to-dos and sub-tasks with native date pickers (defaulting to today's date).
  - Drag-and-drop task reordering + manual Up/Down priority sorting with live `MOVING` indicators.
  - Slide-over Task Detail Drawer with rich notes, assignments, due dates, sub-tasks, and activity comment thread.
  - Search within lists and filter by urgency/due date.
- **Monthly Routine Checklist:**
  - 1–31 days interactive habit & routine checklist matrix with 3-state cells (completed, rest day, empty).
  - Overall consistency, streak counters, and category filtering.
  - Full routine CRUD with custom in-app confirmation modals.
- **30-Day Trash Retention & Recovery:**
  - Deleted projects, lists, and to-dos are safely buffered for 30 days before permanent deletion.
  - Trash view with remaining days countdown and one-click Restore or Permanent Delete.
- **Teammate & Profile Switching:**
  - Topbar avatar menu with full profile editing, teammate switcher, and quick access to workspace settings and trash.
- **Full-Stack Sync & Persistence:**
  - **Frontend:** React 19 + Vite with instant offline-first `localStorage` cache.
  - **Backend:** Express.js REST API with CORS and JSON file persistence (`server/data/workspace.json`).

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind-inspired calm parchment & deep green palette (`Newsreader` serif + `Inter` sans).
- **Backend:** Node.js (ESM), Express.js 4, `dotenv`, `cors`.
- **Design Inspiration:** Basecamp / 37signals (Stitch MCP design tokens).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested on Node.js 24)
- npm

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/nitesh-ratre/TaskManager.git
cd TaskManager

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server/` directory:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

*(See `server/.env.example` for reference)*

### 3. Start the Development Servers

In one terminal, start the **Express backend**:

```bash
cd server
npm start
# Server runs on http://localhost:3001
```

In another terminal, start the **Vite frontend**:

```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

---

## 📂 Project Structure

```
TaskManager/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # AppShell, Dashboard, Cards, ListView, Drawer, Modals, Routine Checklist
│   │   ├── services/           # taskApi.js (backend sync + offline fallback)
│   │   ├── data/               # seedData.js
│   │   ├── App.jsx             # Hash-based routing & top-level state
│   │   └── main.jsx
├── server/                     # Express.js backend
│   ├── data/                   # workspace.json (JSON storage)
│   ├── src/
│   │   ├── index.js            # Express REST API routes
│   │   └── storage.js          # Local JSON storage persistence
│   └── package.json
└── README.md
```

---

## 📄 License

MIT
