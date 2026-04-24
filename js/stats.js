/**
 * Study Stats Module
 * Tracks study sessions and displays statistics
 * Data stored in localStorage, structured for easy migration to a backend
 * @module StudyStatsModule
 */
const StudyStatsModule = (function() {
  const STORAGE_KEY = 'studyspot_sessions';
  const GOAL_KEY = 'studyspot_daily_goal';
  const DEFAULT_DAILY_GOAL = 7200; // 2 hours in seconds

  const TYPE_COLORS = {
    pomodoro: { bg: 'rgba(255, 255, 255, 0.15)', text: '#ffffff', dot: '#ffffff', label: 'Focus' },
    short:    { bg: 'rgba(120, 180, 255, 0.15)', text: '#78b4ff', dot: '#78b4ff', label: 'Short Break' },
    long:     { bg: 'rgba(180, 140, 255, 0.15)', text: '#b48cff', dot: '#b48cff', label: 'Long Break' }
  };

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ── Data helpers ──

  const getSessions = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveSessions = (sessions) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  };

  const getDailyGoal = () => {
    return parseInt(localStorage.getItem(GOAL_KEY)) || DEFAULT_DAILY_GOAL;
  };

  const setDailyGoal = (seconds) => {
    localStorage.setItem(GOAL_KEY, seconds.toString());
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  const recordSession = (session) => {
    const sessions = getSessions();
    sessions.push({
      id: generateId(),
      startTime: session.startTime,
      endTime: session.endTime,
      durationSeconds: session.durationSeconds,
      type: session.type,
      completed: session.completed
    });
    saveSessions(sessions);
  };

  // ── Formatting ──

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // ── Stats calculations ──

  const getStats = () => {
    const sessions = getSessions();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    let totalSeconds = 0;
    let todaySeconds = 0;
    let weekSeconds = 0;
    let totalSessions = sessions.length;
    let todaySessions = 0;

    sessions.forEach(s => {
      totalSeconds += s.durationSeconds;
      const sessionDate = new Date(s.startTime);
      if (sessionDate >= todayStart) {
        todaySeconds += s.durationSeconds;
        todaySessions++;
      }
      if (sessionDate >= weekStart) {
        weekSeconds += s.durationSeconds;
      }
    });

    return { totalSeconds, todaySeconds, weekSeconds, totalSessions, todaySessions };
  };

  /**
   * Calculates study streak (consecutive days with at least one session)
   */
  const getStreak = () => {
    const sessions = getSessions();
    if (sessions.length === 0) return 0;

    // Get unique study dates (as date strings in local time)
    const studyDates = new Set();
    sessions.forEach(s => {
      const d = new Date(s.startTime);
      studyDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });

    // Count consecutive days going back from today
    const now = new Date();
    let streak = 0;
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if today has sessions, if not check if yesterday does (allow current day gap)
    const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (!studyDates.has(todayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (!studyDates.has(yesterdayKey)) return 0;
    }

    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (studyDates.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  /**
   * Gets study minutes for each day of the current week (Mon-Sun)
   */
  const getWeeklyChartData = () => {
    const sessions = getSessions();
    const now = new Date();
    const todayDow = now.getDay(); // 0=Sun
    // Monday of this week
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((todayDow + 6) % 7));

    const dailyMinutes = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    sessions.forEach(s => {
      const d = new Date(s.startTime);
      const sessionDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diff = Math.floor((sessionDay - monday) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) {
        dailyMinutes[diff] += Math.round(s.durationSeconds / 60);
      }
    });

    return dailyMinutes;
  };

  /**
   * Filters sessions by tab: 'today', 'week', 'all'
   */
  const getFilteredSessions = (filter) => {
    const sessions = getSessions().sort((a, b) =>
      new Date(b.startTime) - new Date(a.startTime)
    );
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    let filtered;
    if (filter === 'today') {
      filtered = sessions.filter(s => new Date(s.startTime) >= todayStart);
    } else if (filter === 'week') {
      filtered = sessions.filter(s => new Date(s.startTime) >= weekStart);
    } else {
      filtered = sessions;
    }

    // Group by date
    const grouped = {};
    filtered.forEach(s => {
      const dateKey = formatDate(s.startTime);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(s);
    });
    return grouped;
  };

  // ── Build HTML sections ──

  const buildGoalRing = (todaySeconds) => {
    const goal = getDailyGoal();
    const progress = Math.min(todaySeconds / goal, 1);
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    const percent = Math.round(progress * 100);
    const goalMinutes = Math.round(goal / 60);

    return `
      <div class="stats-goal-ring">
        <svg viewBox="0 0 100 100" class="goal-svg">
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="url(#goalGradient)" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
            transform="rotate(-90 50 50)" class="goal-progress-circle"/>
          <defs>
            <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#b48cff"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="goal-center-text">
          <span class="goal-percent">${percent}%</span>
          <span class="goal-label">of ${goalMinutes}m goal</span>
        </div>
        <button class="goal-edit-btn" title="Change daily goal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>`;
  };

  const buildStreakBadge = () => {
    const streak = getStreak();
    if (streak === 0) return '';
    return `
      <div class="stats-streak">
        <span class="streak-flame">&#128293;</span>
        <span class="streak-count">${streak}</span>
        <span class="streak-label">day streak</span>
      </div>`;
  };

  const buildWeeklyChart = () => {
    const data = getWeeklyChartData();
    const max = Math.max(...data, 1); // avoid division by 0

    let barsHTML = '';
    const now = new Date();
    const todayDow = (now.getDay() + 6) % 7; // 0=Mon

    data.forEach((mins, i) => {
      const heightPercent = Math.max((mins / max) * 100, 2); // min 2% so bar is visible
      const isToday = i === todayDow;
      const isEmpty = mins === 0;
      barsHTML += `
        <div class="chart-col ${isToday ? 'chart-col--today' : ''}">
          <div class="chart-bar-container">
            <div class="chart-bar ${isEmpty ? 'chart-bar--empty' : ''}" style="height: ${heightPercent}%">
              ${!isEmpty ? `<span class="chart-bar-tooltip">${mins}m</span>` : ''}
            </div>
          </div>
          <span class="chart-day-label">${DAY_LABELS[i]}</span>
        </div>`;
    });

    return `
      <div class="stats-chart-section">
        <h4 class="stats-section-title">This Week</h4>
        <div class="stats-chart">
          ${barsHTML}
        </div>
      </div>`;
  };

  const buildSessionHistory = (filter) => {
    const grouped = getFilteredSessions(filter);
    const dateKeys = Object.keys(grouped);

    if (dateKeys.length === 0) {
      return `
        <div class="stats-empty-state">
          <svg class="stats-empty-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5">
            <rect x="8" y="16" width="8" height="24" rx="2"/>
            <rect x="20" y="8" width="8" height="32" rx="2"/>
            <rect x="32" y="20" width="8" height="20" rx="2"/>
          </svg>
          <p class="stats-empty-text">No sessions yet</p>
          <p class="stats-empty-subtext">Start a pomodoro to begin tracking</p>
        </div>`;
    }

    let html = '';
    const limit = filter === 'all' ? 14 : 7;
    dateKeys.slice(0, limit).forEach(dateKey => {
      html += `<div class="stats-date-group"><div class="stats-date-label">${dateKey}</div>`;
      grouped[dateKey].forEach(s => {
        const tc = TYPE_COLORS[s.type] || TYPE_COLORS.pomodoro;
        html += `
          <div class="stats-session-row" style="background: ${tc.bg}">
            <span class="stats-session-dot" style="background: ${tc.dot}"></span>
            <span class="stats-session-type" style="color: ${tc.text}">${tc.label}</span>
            <span class="stats-session-time">${formatTime(s.startTime)}</span>
            <span class="stats-session-duration">${formatDuration(s.durationSeconds)}</span>
          </div>`;
      });
      html += '</div>';
    });
    return html;
  };

  // ── Export / Import ──

  const exportData = () => {
    const data = {
      sessions: getSessions(),
      dailyGoal: getDailyGoal(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyspot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (modal) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data.sessions)) {
            alert('Invalid backup file: missing sessions array.');
            return;
          }
          // Merge with existing sessions, deduplicate by id
          const existing = getSessions();
          const existingIds = new Set(existing.map(s => s.id));
          const newSessions = data.sessions.filter(s => !existingIds.has(s.id));
          saveSessions([...existing, ...newSessions]);

          if (data.dailyGoal) setDailyGoal(data.dailyGoal);

          // Refresh modal to show updated data
          modal.remove();
          showStatsModal();
        } catch {
          alert('Could not read backup file. Make sure it is a valid StudySpot export.');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  };

  // ── Goal editing ──

  const showGoalEditor = (modal) => {
    const currentGoal = getDailyGoal();
    const currentMins = Math.round(currentGoal / 60);

    const editor = document.createElement('div');
    editor.className = 'goal-editor-overlay';
    editor.innerHTML = `
      <div class="goal-editor">
        <h4>Set Daily Goal</h4>
        <div class="goal-editor-input-row">
          <input type="number" class="goal-editor-input" value="${currentMins}" min="5" max="600" />
          <span class="goal-editor-unit">minutes</span>
        </div>
        <div class="goal-editor-actions">
          <button class="goal-editor-cancel">Cancel</button>
          <button class="goal-editor-save">Save</button>
        </div>
      </div>`;

    modal.querySelector('.stats-content').appendChild(editor);

    const input = editor.querySelector('.goal-editor-input');
    input.focus();
    input.select();

    editor.querySelector('.goal-editor-cancel').addEventListener('click', () => editor.remove());
    editor.querySelector('.goal-editor-save').addEventListener('click', () => {
      const mins = parseInt(input.value);
      if (mins >= 5 && mins <= 600) {
        setDailyGoal(mins * 60);
        editor.remove();
        // Refresh modal
        modal.remove();
        showStatsModal();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') editor.querySelector('.goal-editor-save').click();
      if (e.key === 'Escape') editor.remove();
    });
  };

  // ── Main modal ──

  const showStatsModal = () => {
    const existing = document.getElementById('stats-modal');
    if (existing) existing.remove();

    const stats = getStats();
    const activeTab = 'today';

    const modal = document.createElement('div');
    modal.id = 'stats-modal';

    modal.innerHTML = `
      <div class="stats-overlay">
        <div class="stats-content">
          <div class="stats-header">
            <h3 class="stats-title">Study Stats</h3>
            ${buildStreakBadge()}
            <button class="stats-close">&times;</button>
          </div>

          <div class="stats-top-row">
            ${buildGoalRing(stats.todaySeconds)}
            <div class="stats-summary">
              <div class="stats-card">
                <div class="stats-card-value">${formatDuration(stats.todaySeconds)}</div>
                <div class="stats-card-label">Today</div>
              </div>
              <div class="stats-card">
                <div class="stats-card-value">${formatDuration(stats.weekSeconds)}</div>
                <div class="stats-card-label">This Week</div>
              </div>
              <div class="stats-card">
                <div class="stats-card-value">${stats.totalSessions}</div>
                <div class="stats-card-label">Total Sessions</div>
              </div>
            </div>
          </div>

          ${buildWeeklyChart()}

          <div class="stats-history">
            <div class="stats-tabs">
              <button class="stats-tab active" data-tab="today">Today</button>
              <button class="stats-tab" data-tab="week">Week</button>
              <button class="stats-tab" data-tab="all">All Time</button>
            </div>
            <div class="stats-history-list">
              ${buildSessionHistory(activeTab)}
            </div>
          </div>

          <div class="stats-data-actions">
            <button class="stats-export-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button class="stats-import-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);

    // Force reflow then add visible class for animation
    modal.offsetHeight;
    modal.classList.add('visible');

    // Tab switching
    modal.querySelectorAll('.stats-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const historyList = modal.querySelector('.stats-history-list');
        historyList.innerHTML = buildSessionHistory(tab.dataset.tab);
      });
    });

    // Goal editor
    const goalEditBtn = modal.querySelector('.goal-edit-btn');
    if (goalEditBtn) {
      goalEditBtn.addEventListener('click', () => showGoalEditor(modal));
    }

    // Export / Import
    modal.querySelector('.stats-export-btn').addEventListener('click', exportData);
    modal.querySelector('.stats-import-btn').addEventListener('click', () => importData(modal));

    // Close handlers
    const closeModal = () => {
      modal.classList.remove('visible');
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('.stats-close').addEventListener('click', closeModal);
    modal.querySelector('.stats-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  };

  return {
    recordSession,
    getSessions,
    showStatsModal,
    init() {
      const statsBtn = document.getElementById('stats-btn');
      if (statsBtn) {
        statsBtn.addEventListener('click', showStatsModal);
      }
    }
  };
})();
