import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'taskmanager_monthly_routines_oct2024_v1';

// Seed initial habits matching stitch/monthly-routine-checklist/screen.html
const INITIAL_HABITS = [
  {
    id: 'habit-1',
    name: '1. Wake up Early',
    target: 'Target 6:00 AM',
    categories: ['morning'],
    dotColor: '#006946',
    // 23 done, 1 rest (day 6), 25-31 empty
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'rest', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-2',
    name: '2. Hydrate & Water',
    target: '500ml upon waking',
    categories: ['morning', 'body'],
    dotColor: '#006946',
    // 24 done, 0 rest
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'done', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-3',
    name: '3. Stretch or Exercise',
    target: '20 min mobility',
    categories: ['body'],
    dotColor: '#006946',
    // 21 done, 3 rest (days 6, 13, 20)
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'rest', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'rest', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'rest',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-4',
    name: '4. Practice Mindfulness',
    target: '10m breathing / meditation',
    categories: ['mind'],
    dotColor: '#006946',
    // 22 done, 2 rest (days 3, 11)
    days: {
      1: 'done', 2: 'done', 3: 'rest', 4: 'done', 5: 'done',
      6: 'done', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'rest', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-5',
    name: '5. Eat Healthy Breakfast',
    target: 'Protein & whole grains',
    categories: ['morning', 'body'],
    dotColor: '#006946',
    // 23 done, 1 rest (day 12)
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'done', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'rest', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-6',
    name: '6. Plan Your Day',
    target: 'Top 3 priorities list',
    categories: ['mind'],
    dotColor: '#006946',
    // 22 done, 2 rest (days 5, 6)
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'rest',
      6: 'rest', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-7',
    name: '7. Personal Hygiene',
    target: 'Cold rinse & grooming',
    categories: ['morning', 'body'],
    dotColor: '#006946',
    // 24 done, 0 rest
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'done', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-8',
    name: '8. Avoid Technology',
    target: 'First 30m no screens',
    categories: ['mind'],
    dotColor: '#006946',
    // 21 done, 3 rest (days 4, 9, 16)
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'rest', 5: 'done',
      6: 'done', 7: 'done', 8: 'done', 9: 'rest', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'rest', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-9',
    name: '9. Positive Affirmation',
    target: 'Journal 3 grateful notes',
    categories: ['mind'],
    dotColor: '#006946',
    // 23 done, 1 rest (day 15)
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'done', 7: 'done', 8: 'done', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'rest',
      16: 'done', 17: 'done', 18: 'done', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'done',
    },
  },
  {
    id: 'habit-10',
    name: '10. Evening Prep & Wind-down',
    target: 'Clothes & reading ready',
    categories: ['morning', 'mind'],
    dotColor: '#825500',
    // 21 done, 3 rest (days 8, 18, 24)
    days: {
      1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done',
      6: 'done', 7: 'done', 8: 'rest', 9: 'done', 10: 'done',
      11: 'done', 12: 'done', 13: 'done', 14: 'done', 15: 'done',
      16: 'done', 17: 'done', 18: 'rest', 19: 'done', 20: 'done',
      21: 'done', 22: 'done', 23: 'done', 24: 'rest',
    },
  },
];

// Weekday names helper for October 2024 (starts on Tuesday = index 2)
// Day 1 = Tuesday (Tu), Day 2 = Wednesday (We), etc.
const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getOctoberDayInfo(dayNum) {
  // October 2024: 1st is Tuesday
  const date = new Date(2024, 9, dayNum);
  const dayOfWeek = date.getDay(); // 0 = Su, 6 = Sa
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return {
    day: dayNum,
    weekday: WEEKDAY_NAMES[dayOfWeek],
    isWeekend,
    isToday: dayNum === 24,
  };
}

export function MonthlyRoutineChecklist({ onNavigate }) {
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_HABITS;
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [selectedWeek, setSelectedWeek] = useState(4); // Week 4 has Day 24 (Today)
  const [monthOffset, setMonthOffset] = useState(0); // 0 = Oct 2024

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitForm, setHabitForm] = useState({
    name: '',
    target: '',
    category: 'morning',
    dotColor: '#006946',
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch {
      // ignore
    }
  }, [habits]);

  // Current day in October 2024 is 24
  const currentDay = 24;
  const totalDaysInMonth = 31;
  const daysRemaining = totalDaysInMonth - currentDay;

  // Days list for October 2024
  const allDays = useMemo(() => {
    const list = [];
    for (let i = 1; i <= totalDaysInMonth; i++) {
      list.push(getOctoberDayInfo(i));
    }
    return list;
  }, []);

  // Filtered days according to viewMode
  const displayedDays = useMemo(() => {
    if (viewMode === 'month') return allDays;
    // Week definitions:
    // Week 1: 1-7
    // Week 2: 8-14
    // Week 3: 15-21
    // Week 4: 22-28
    // Week 5: 29-31
    const weekRanges = {
      1: [1, 7],
      2: [8, 14],
      3: [15, 21],
      4: [22, 28],
      5: [29, 31],
    };
    const [start, end] = weekRanges[selectedWeek] || [22, 28];
    return allDays.filter((d) => d.day >= start && d.day <= end);
  }, [allDays, viewMode, selectedWeek]);

  // Filtered habits
  const filteredHabits = useMemo(() => {
    if (activeCategory === 'all') return habits;
    return habits.filter((h) => h.categories?.includes(activeCategory));
  }, [habits, activeCategory]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let morning = 0;
    let mind = 0;
    let body = 0;
    for (const h of habits) {
      if (h.categories?.includes('morning')) morning++;
      if (h.categories?.includes('mind')) mind++;
      if (h.categories?.includes('body')) body++;
    }
    return {
      all: habits.length,
      morning,
      mind,
      body,
    };
  }, [habits]);

  // Metrics calculations
  const metrics = useMemo(() => {
    let totalCompleted = 0;
    let totalRest = 0;
    let maxCompleted = -1;
    let pillarHabit = null;

    const habitsCount = habits.length;
    const totalPossibleChecks = habitsCount * currentDay;

    for (const h of habits) {
      let habitDoneCount = 0;
      for (let d = 1; d <= currentDay; d++) {
        const state = h.days?.[d];
        if (state === 'done') habitDoneCount++;
        else if (state === 'rest') totalRest++;
      }
      totalCompleted += habitDoneCount;

      if (habitDoneCount > maxCompleted) {
        maxCompleted = habitDoneCount;
        pillarHabit = {
          name: h.name.replace(/^\d+\.\s*/, ''),
          completed: habitDoneCount,
          percent: Math.round((habitDoneCount / currentDay) * 100),
        };
      }
    }

    const consistencyPercent =
      totalPossibleChecks > 0
        ? ((totalCompleted / totalPossibleChecks) * 100).toFixed(1)
        : '0.0';

    return {
      consistency: consistencyPercent,
      streak: 22, // Active streak up to day 24
      pillar: pillarHabit || { name: 'Hydrate & Water', completed: 24, percent: 100 },
      totalCompleted,
      totalRest,
    };
  }, [habits, currentDay]);

  // Toggle cell state: done -> rest -> empty -> done
  function handleCellToggle(habitId, dayNum) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const current = h.days?.[dayNum];
        let nextState = 'done';
        if (current === 'done') {
          nextState = 'rest';
        } else if (current === 'rest') {
          nextState = undefined;
        } else {
          nextState = 'done';
        }

        const nextDays = { ...(h.days || {}) };
        if (nextState) {
          nextDays[dayNum] = nextState;
        } else {
          delete nextDays[dayNum];
        }

        return { ...h, days: nextDays };
      })
    );
  }

  // Add routine
  function handleOpenAddModal() {
    setHabitForm({
      name: '',
      target: 'Daily practice',
      category: 'morning',
      dotColor: '#006946',
    });
    setEditingHabit(null);
    setIsAddModalOpen(true);
  }

  // Edit routine
  function handleOpenEditModal(habit) {
    setEditingHabit(habit);
    setHabitForm({
      name: habit.name,
      target: habit.target || 'Daily practice',
      category: habit.categories?.[0] || 'morning',
      dotColor: habit.dotColor || '#006946',
    });
    setIsAddModalOpen(true);
  }

  // Save routine (Add or Edit)
  function handleSaveHabit(e) {
    e.preventDefault();
    if (!habitForm.name.trim()) return;

    if (editingHabit) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id
            ? {
                ...h,
                name: habitForm.name.trim(),
                target: habitForm.target.trim() || 'Daily practice',
                categories: [habitForm.category],
                dotColor: habitForm.dotColor,
              }
            : h
        )
      );
    } else {
      const newHabit = {
        id: `habit-${Date.now()}`,
        name: habitForm.name.trim(),
        target: habitForm.target.trim() || 'Daily practice',
        categories: [habitForm.category],
        dotColor: habitForm.dotColor,
        days: {
          [currentDay]: 'done',
        },
      };
      setHabits((prev) => [...prev, newHabit]);
    }

    setIsAddModalOpen(false);
  }

  // Delete routine
  function handleDeleteHabit(habitId, habitName) {
    if (window.confirm(`Delete "${habitName}" from your checklist?`)) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    }
  }

  // Reset to default seed habits
  function handleResetDefaults() {
    if (window.confirm('Reset checklist back to default October 2024 routine habits?')) {
      setHabits(INITIAL_HABITS);
    }
  }

  // Month navigation display
  const monthLabels = ['September 2024', 'October 2024', 'November 2024'];
  const currentMonthLabel = monthLabels[1 + monthOffset] || 'October 2024';

  return (
    <main className="routine-page" aria-label="Monthly Routine & Habit Tracker">
      {/* 1. Breadcrumb & Live Calm Flow Badge */}
      <div className="routine-top-row">
        <nav aria-label="Breadcrumb" className="routine-breadcrumbs">
          <a
            href="#/home"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) {
                onNavigate({ screen: 'dashboard', nav: 'home' });
              } else {
                window.location.hash = '#/home';
              }
            }}
          >
            Routines &amp; Habits
          </a>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline-variant)' }}>
            chevron_right
          </span>
          <span style={{ color: 'var(--on-surface-variant)' }}>Monthly Habit Tracker</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline-variant)' }}>
            chevron_right
          </span>
          <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{currentMonthLabel}</span>
        </nav>

        <div className="routine-live-badge">
          <span className="routine-live-dot" />
          Day 24 of 31 • Calm Flow
        </div>
      </div>

      {/* 2. Editorial Header Card & Controls */}
      <section className="routine-header-card" aria-label="Routine Overview Header">
        <div className="routine-header-left">
          <div className="routine-header-category">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>
              wb_sunny
            </span>
            Intentional Morning &amp; Daily Practice
          </div>
          <h1 className="routine-headline">Monthly Routine &amp; Habit Tracker</h1>
          <p className="routine-subtitle">
            Track daily morning routines, operational hygiene, and personal habits across the entire month.
            Designed for rhythm without rush.
          </p>
        </div>

        {/* Controls: Date navigator, View switcher, Print, Add Routine */}
        <div className="routine-controls-row">
          {/* Month Selector */}
          <div className="routine-month-selector" aria-label="Month navigator">
            <button
              type="button"
              className="routine-nav-arrow"
              onClick={() => setMonthOffset((m) => Math.max(m - 1, -1))}
              disabled={monthOffset <= -1}
              title="Previous Month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                chevron_left
              </span>
            </button>
            <span className="routine-month-title">{currentMonthLabel}</span>
            <button
              type="button"
              className="routine-nav-arrow"
              onClick={() => setMonthOffset((m) => Math.min(m + 1, 1))}
              disabled={monthOffset >= 1}
              title="Next Month"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </button>
          </div>

          {/* View Switcher: Full Month vs Week View */}
          <div className="routine-view-toggle" role="group" aria-label="View layout switch">
            <button
              type="button"
              className={`routine-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Full Month (1–31)
            </button>
            <button
              type="button"
              className={`routine-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week View
            </button>
          </div>

          {/* Print Checklist Action */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
            title="Print Monthly Routine Checklist"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              print
            </span>
            <span>Print Checklist</span>
          </button>

          {/* Add Routine Modal Trigger */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAddModal}
            id="addHabitBtn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add
            </span>
            <span>Add Routine</span>
          </button>
        </div>
      </section>

      {/* 3. Metrics Strip (4 cards) */}
      <section className="routine-metrics-grid" aria-label="Monthly Consistency Metrics">
        {/* Card 1: Month Duration */}
        <div className="routine-metric-card">
          <div>
            <span className="routine-metric-label">Month Duration</span>
            <div className="routine-metric-value">{totalDaysInMonth} Days</div>
            <div className="routine-metric-sub">{daysRemaining} days remaining</div>
          </div>
          <div className="routine-metric-icon" style={{ background: 'var(--surface-container-low)', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              calendar_month
            </span>
          </div>
        </div>

        {/* Card 2: Overall Consistency */}
        <div className="routine-metric-card">
          <div>
            <span className="routine-metric-label">Overall Consistency</span>
            <div className="routine-metric-value" style={{ color: 'var(--primary)' }}>
              {metrics.consistency}%
            </div>
            <div className="routine-metric-sub" style={{ color: 'var(--primary)' }}>
              ↑ +4.2% vs Sep
            </div>
          </div>
          <div className="routine-metric-icon" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              donut_large
            </span>
          </div>
        </div>

        {/* Card 3: Active Streak */}
        <div className="routine-metric-card">
          <div>
            <span className="routine-metric-label">Active Streak</span>
            <div className="routine-metric-value" style={{ color: 'var(--secondary)' }}>
              {metrics.streak} Days
            </div>
            <div className="routine-metric-sub">Started Oct 2nd</div>
          </div>
          <div className="routine-metric-icon" style={{ background: 'var(--secondary-fixed)', color: 'var(--secondary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              local_fire_department
            </span>
          </div>
        </div>

        {/* Card 4: Pillar Habit */}
        <div className="routine-metric-card">
          <div style={{ minWidth: 0 }}>
            <span className="routine-metric-label">Pillar Habit</span>
            <div className="routine-metric-value" style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {metrics.pillar.name}
            </div>
            <div className="routine-metric-sub" style={{ color: 'var(--primary)', fontWeight: 500 }}>
              {metrics.pillar.completed} / {currentDay} Completed ({metrics.pillar.percent}%)
            </div>
          </div>
          <div className="routine-metric-icon" style={{ background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              water_drop
            </span>
          </div>
        </div>
      </section>

      {/* 4. Filter Pills & Legend Bar */}
      <section className="routine-filter-bar" aria-label="Filters and Legend">
        <div className="routine-filter-group" role="tablist">
          <button
            type="button"
            className={`routine-filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Habits ({counts.all})
          </button>
          <button
            type="button"
            className={`routine-filter-btn ${activeCategory === 'morning' ? 'active' : ''}`}
            onClick={() => setActiveCategory('morning')}
          >
            Morning Routine ({counts.morning})
          </button>
          <button
            type="button"
            className={`routine-filter-btn ${activeCategory === 'mind' ? 'active' : ''}`}
            onClick={() => setActiveCategory('mind')}
          >
            Mind &amp; Focus ({counts.mind})
          </button>
          <button
            type="button"
            className={`routine-filter-btn ${activeCategory === 'body' ? 'active' : ''}`}
            onClick={() => setActiveCategory('body')}
          >
            Physical Health ({counts.body})
          </button>
        </div>

        <div className="routine-legend-group">
          <div className="routine-legend-item">
            <span
              style={{
                width: 15,
                height: 15,
                borderRadius: 4,
                background: 'var(--primary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                check
              </span>
            </span>
            <span>Completed</span>
          </div>

          <div className="routine-legend-item">
            <span
              style={{
                width: 15,
                height: 15,
                borderRadius: 4,
                background: 'var(--surface-container-highest)',
                color: 'var(--outline)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              –
            </span>
            <span>Rest Day</span>
          </div>

          <div className="routine-legend-item">
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: 'var(--secondary-fixed)',
                color: 'var(--secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              24
            </span>
            <span>Today</span>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset to default seed habits"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              marginLeft: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              restart_alt
            </span>
            Reset
          </button>
        </div>
      </section>

      {/* 5. Main Habit Checklist 1-31 Matrix Table Card */}
      <section className="routine-table-card" aria-label="Routine Matrix Table">
        {/* If Week View is active, show week tab navigation */}
        {viewMode === 'week' && (
          <div className="routine-week-tabs">
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginRight: 6 }}>
              Select Week:
            </span>
            {[
              { num: 1, label: 'Week 1 (Oct 1–7)' },
              { num: 2, label: 'Week 2 (Oct 8–14)' },
              { num: 3, label: 'Week 3 (Oct 15–21)' },
              { num: 4, label: 'Week 4 (Oct 22–28) • Today' },
              { num: 5, label: 'Week 5 (Oct 29–31)' },
            ].map((w) => (
              <button
                key={w.num}
                type="button"
                className={`routine-week-tab ${selectedWeek === w.num ? 'active' : ''}`}
                onClick={() => setSelectedWeek(w.num)}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}

        <div className="routine-table-scroll">
          <table className="routine-table">
            <thead>
              <tr>
                {/* Sticky Left Header: Habit Title */}
                <th className="routine-th-habit" scope="col">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Habit / Routine</span>
                    <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400, textTransform: 'none' }}>
                      {viewMode === 'week' ? 'Week View' : '31 Days'}
                    </span>
                  </div>
                </th>

                {/* Days Columns */}
                {displayedDays.map((d) => {
                  let cellClass = 'routine-th-day';
                  if (d.isWeekend) cellClass += ' weekend';
                  if (d.isToday) cellClass += ' today';

                  return (
                    <th key={d.day} className={cellClass} scope="col">
                      <div style={{ fontSize: 11, fontWeight: d.isToday ? 700 : 600 }}>{d.day}</div>
                      <div
                        style={{
                          fontSize: 9,
                          color: d.isToday
                            ? 'var(--on-primary-fixed)'
                            : d.isWeekend
                            ? 'var(--secondary)'
                            : 'var(--on-surface-variant)',
                        }}
                      >
                        {d.weekday}
                      </div>
                    </th>
                  );
                })}

                {/* Summary Score Column */}
                <th className="routine-th-score" scope="col">
                  Score
                </th>
              </tr>
            </thead>

            <tbody id="habitTableBody">
              {filteredHabits.map((habit) => {
                // Calculate completion score up to Day 24 (or all 31 days)
                let completedCount = 0;
                for (let d = 1; d <= currentDay; d++) {
                  if (habit.days?.[d] === 'done') completedCount++;
                }
                const scorePercent = Math.round((completedCount / currentDay) * 100);

                return (
                  <tr key={habit.id} className="routine-row">
                    {/* Sticky Habit Info Cell */}
                    <td className="routine-td-habit">
                      <div className="routine-habit-content">
                        <div className="routine-habit-left">
                          <span
                            className="routine-habit-dot"
                            style={{ background: habit.dotColor || 'var(--primary)' }}
                          />
                          <div className="routine-habit-text">
                            <span className="routine-habit-name" title={habit.name}>
                              {habit.name}
                            </span>
                            <span className="routine-habit-target" title={habit.target}>
                              {habit.target || 'Daily practice'}
                            </span>
                          </div>
                        </div>

                        {/* Inline actions (Edit, Delete) on hover */}
                        <div className="routine-row-actions">
                          <button
                            type="button"
                            className="routine-row-action-btn"
                            onClick={() => handleOpenEditModal(habit)}
                            title="Edit routine"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                              edit
                            </span>
                          </button>
                          <button
                            type="button"
                            className="routine-row-action-btn delete"
                            onClick={() => handleDeleteHabit(habit.id, habit.name)}
                            title="Delete routine"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Interactive 1-31 Check cells */}
                    {displayedDays.map((d) => {
                      const state = habit.days?.[d.day]; // 'done' | 'rest' | undefined
                      let tdClass = 'routine-td-day';
                      if (d.isWeekend) tdClass += ' weekend';
                      if (d.isToday) tdClass += ' today';

                      let btnClass = 'routine-cell-btn empty';
                      let btnContent = null;
                      if (state === 'done') {
                        btnClass = 'routine-cell-btn done';
                        btnContent = (
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            check
                          </span>
                        );
                      } else if (state === 'rest') {
                        btnClass = 'routine-cell-btn rest';
                        btnContent = '–';
                      }

                      return (
                        <td key={d.day} className={tdClass}>
                          <button
                            type="button"
                            className={btnClass}
                            onClick={() => handleCellToggle(habit.id, d.day)}
                            title={`Day ${d.day} (${d.weekday}): ${
                              state === 'done'
                                ? 'Completed (Click for rest day)'
                                : state === 'rest'
                                ? 'Rest Day (Click to clear)'
                                : 'Empty (Click to check)'
                            }`}
                          >
                            {btnContent}
                          </button>
                        </td>
                      );
                    })}

                    {/* Score cell with count & animated progress bar */}
                    <td className="routine-td-score">
                      <span className="routine-score-text">
                        {completedCount} / {currentDay}
                      </span>
                      <div className="routine-progress-track">
                        <div
                          className="routine-progress-fill"
                          style={{ width: `${Math.min(scorePercent, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredHabits.length === 0 && (
                <tr>
                  <td
                    colSpan={displayedDays.length + 2}
                    style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}
                  >
                    <p style={{ margin: 0, fontWeight: 500 }}>No habits found in this category.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveCategory('all')}
                      style={{ marginTop: 10 }}
                    >
                      Show all habits
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Add / Edit Routine Modal */}
      {isAddModalOpen && (
        <div
          className="routine-modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="routine-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="routine-modal-header">
              <h2 className="routine-modal-title">
                {editingHabit ? 'Edit Routine Habit' : 'Add New Routine Habit'}
              </h2>
              <button
                type="button"
                className="routine-row-action-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveHabit}>
              <div className="routine-modal-body">
                <div className="routine-form-group">
                  <label htmlFor="habitName">Routine Name</label>
                  <input
                    id="habitName"
                    type="text"
                    required
                    className="routine-form-input"
                    placeholder="e.g. Read 20 mins, Cold Shower, Evening Walk"
                    value={habitForm.name}
                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="routine-form-group">
                  <label htmlFor="habitTarget">Target / Guideline</label>
                  <input
                    id="habitTarget"
                    type="text"
                    className="routine-form-input"
                    placeholder="e.g. 15 pages before bed, 500ml water"
                    value={habitForm.target}
                    onChange={(e) => setHabitForm({ ...habitForm, target: e.target.value })}
                  />
                </div>

                <div className="routine-form-group">
                  <label htmlFor="habitCategory">Category</label>
                  <select
                    id="habitCategory"
                    className="routine-form-select"
                    value={habitForm.category}
                    onChange={(e) => setHabitForm({ ...habitForm, category: e.target.value })}
                  >
                    <option value="morning">Morning Routine</option>
                    <option value="mind">Mind &amp; Focus</option>
                    <option value="body">Physical Health</option>
                  </select>
                </div>

                <div className="routine-form-group">
                  <label htmlFor="habitColor">Accent Color</label>
                  <select
                    id="habitColor"
                    className="routine-form-select"
                    value={habitForm.dotColor}
                    onChange={(e) => setHabitForm({ ...habitForm, dotColor: e.target.value })}
                  >
                    <option value="#006946">Forest Green (Primary)</option>
                    <option value="#825500">Amber Glow (Secondary)</option>
                    <option value="#126847">Emerald Calm (Tertiary)</option>
                    <option value="#3f4942">Slate Hygiene (Neutral)</option>
                  </select>
                </div>
              </div>

              <div className="routine-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingHabit ? 'Save Changes' : 'Create Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default MonthlyRoutineChecklist;
