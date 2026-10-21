const STORAGE_KEY = "day-planner-tasks";
const LEGACY_STORAGE_KEY = "platinum-planner-tasks";
const TIME_ZONE = "Asia/Kolkata";
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getDateKeyInDelhi = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDateKey = (dateKey, numberOfDays) => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + numberOfDays);
  return formatDateKey(date);
};

let todayKey = getDateKeyInDelhi();
const appState = {
  selectedDate: todayKey,
  viewingMonth: parseDateKey(todayKey).getMonth(),
  viewingYear: parseDateKey(todayKey).getFullYear(),
  editingTaskId: null,
};

const seedTasks = [
  {
    id: crypto.randomUUID(),
    title: "Plan the day",
    date: todayKey,
    time: "09:00",
    duration: 30,
    priority: "High",
    category: "Personal",
    notes: "Pick the three things that matter most.",
    completed: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Focused work session",
    date: todayKey,
    time: "10:00",
    duration: 60,
    priority: "High",
    category: "Work",
    notes: "",
    completed: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Take a proper break",
    date: todayKey,
    time: "13:00",
    duration: 30,
    priority: "Low",
    category: "Health",
    notes: "",
    completed: false,
  },
  {
    id: crypto.randomUUID(),
    title: "Evening walk",
    date: shiftDateKey(todayKey, 1),
    time: "18:30",
    duration: 45,
    priority: "Medium",
    category: "Health",
    notes: "",
    completed: false,
  },
];

const normalizeTasks = (value) => {
  if (!Array.isArray(value)) {
    throw new TypeError("Saved planner data must be a list of tasks.");
  }

  return value
    .filter((task) => task && typeof task.title === "string" && typeof task.date === "string")
    .map((task) => ({
      id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
      title: task.title,
      date: task.date,
      time: /^\d{2}:\d{2}$/.test(task.time) ? task.time : "09:00",
      duration: Number.isFinite(Number(task.duration)) ? Number(task.duration) : 30,
      priority: ["Low", "Medium", "High"].includes(task.priority) ? task.priority : "Medium",
      category: typeof task.category === "string" ? task.category : "Personal",
      notes: typeof task.notes === "string" ? task.notes : "",
      completed: task.completed === true || task.isCompleted === true,
    }));
};

const loadTasks = () => {
  const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTasks));
    return [...seedTasks];
  }

  try {
    const loadedTasks = normalizeTasks(JSON.parse(stored));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTasks));
    return loadedTasks;
  } catch (error) {
    console.error("Could not read saved Day Planner tasks; starting with a fresh sample schedule.", error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTasks));
    return [...seedTasks];
  }
};

let tasks = loadTasks();

const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const calendarWeekdays = document.getElementById("calendar-weekdays");
const agendaList = document.getElementById("agenda-list");
const headlineDate = document.getElementById("headline-date");
const agendaTitle = document.getElementById("agenda-title");
const agendaCount = document.getElementById("agenda-count");
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskDateInput = document.getElementById("task-date");
const taskTimeInput = document.getElementById("task-time");
const taskDurationInput = document.getElementById("task-duration");
const taskPriorityInput = document.getElementById("task-priority");
const taskCategoryInput = document.getElementById("task-category");
const taskNotesInput = document.getElementById("task-notes");
const taskSearchInput = document.getElementById("task-search");
const taskFilterInput = document.getElementById("task-filter");
const statToday = document.getElementById("stat-today");
const statTodayCaption = document.getElementById("stat-today-caption");
const statCompleted = document.getElementById("stat-completed");
const statPriority = document.getElementById("stat-priority");
const statFocus = document.getElementById("stat-focus");
const statProgressCaption = document.getElementById("stat-progress-caption");

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character];
  });

const formatDay = (dateKey) =>
  parseDateKey(dateKey).toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const formatClockInDelhi = (date = new Date()) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

const getMonthMatrix = (year, month) => {
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let index = startDay - 1; index >= 0; index--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - index), isCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), isCurrentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (daysInMonth + startDay) + 1;
    cells.push({ date: new Date(year, month + 1, nextDay), isCurrentMonth: false });
  }
  return cells;
};

const getPriorityClass = (priority) => `priority-${priority.toLowerCase()}`;

const persistTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const renderWeekdays = () => {
  calendarWeekdays.innerHTML = weekdayNames.map((day) => `<div>${day}</div>`).join("");
};

const renderCalendar = () => {
  monthLabel.textContent = `${monthNames[appState.viewingMonth]} ${appState.viewingYear}`;
  const cells = getMonthMatrix(appState.viewingYear, appState.viewingMonth);

  calendarGrid.innerHTML = cells
    .map(({ date, isCurrentMonth }) => {
      const dateKey = formatDateKey(date);
      const dayTasks = tasks.filter((task) => task.date === dateKey);
      const indicators = dayTasks
        .slice(0, 4)
        .map((task) => `<span class="event-pill ${getPriorityClass(task.priority)}"></span>`)
        .join("");
      const moreCount = dayTasks.length > 4 ? `<span class="event-more">+${dayTasks.length - 4}</span>` : "";

      return `
        <button class="day-cell ${isCurrentMonth ? "" : "muted"} ${dateKey === appState.selectedDate ? "selected" : ""} ${dateKey === todayKey ? "today" : ""}"
          type="button" data-date="${dateKey}" aria-label="${formatDay(dateKey)}, ${dayTasks.length} tasks">
          <span class="day-number">${date.getDate()}</span>
          <span class="day-events">${indicators}${moreCount}</span>
        </button>`;
    })
    .join("");

  calendarGrid.querySelectorAll(".day-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      appState.selectedDate = cell.dataset.date;
      taskDateInput.value = appState.selectedDate;
      render();
    });
  });
};

const getAgendaTasks = () => {
  const query = taskSearchInput.value.trim().toLocaleLowerCase();
  const status = taskFilterInput.value;

  return tasks
    .filter((task) => task.date === appState.selectedDate)
    .filter((task) => status === "all" || (status === "open" ? !task.completed : task.completed))
    .filter((task) => `${task.title} ${task.category} ${task.notes}`.toLocaleLowerCase().includes(query))
    .sort((first, second) => first.time.localeCompare(second.time));
};

const renderAgenda = () => {
  const list = getAgendaTasks();
  const allForDate = tasks.filter((task) => task.date === appState.selectedDate);
  agendaTitle.textContent = formatDay(appState.selectedDate);
  agendaCount.textContent = `${allForDate.length} ${allForDate.length === 1 ? "task" : "tasks"}`;

  if (!list.length) {
    const hasDateTasks = allForDate.length > 0;
    agendaList.innerHTML = `<div class="empty-state">${hasDateTasks ? "No tasks match your search or filter." : "A clear day is a fresh start. Add a task to make a plan."}</div>`;
    return;
  }

  agendaList.innerHTML = list
    .map(
      (task) => `
        <article class="task-item ${task.completed ? "done" : ""}">
          <div class="task-time-rail">
            <span class="task-time">${escapeHTML(task.time)}</span>
            <span class="time-line"></span>
          </div>
          <div class="task-card-content">
            <div class="task-row">
              <div class="task-main">
                <input class="task-check" type="checkbox" ${task.completed ? "checked" : ""} data-id="${escapeHTML(task.id)}" aria-label="Mark ${escapeHTML(task.title)} as complete" />
                <div class="task-copy">
                  <div class="task-title">${escapeHTML(task.title)}</div>
                  <div class="task-meta">
                    <span>${escapeHTML(task.category)}</span><span>·</span><span>${escapeHTML(task.duration)} min</span>
                  </div>
                </div>
              </div>
              <div class="task-actions">
                <span class="priority-badge ${getPriorityClass(task.priority)}">${escapeHTML(task.priority)}</span>
                <button class="edit-btn" type="button" data-edit-id="${escapeHTML(task.id)}" aria-label="Edit ${escapeHTML(task.title)}">✎</button>
                <button class="delete-btn" type="button" data-delete-id="${escapeHTML(task.id)}" aria-label="Delete ${escapeHTML(task.title)}">×</button>
              </div>
            </div>
            ${task.notes ? `<p class="task-notes">${escapeHTML(task.notes)}</p>` : ""}
          </div>
        </article>`
    )
    .join("");

  agendaList.querySelectorAll(".task-check").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const { id } = event.currentTarget.dataset;
      tasks = tasks.map((task) => (task.id === id ? { ...task, completed: event.currentTarget.checked } : task));
      persistTasks();
      render();
    });
  });

  agendaList.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      tasks = tasks.filter((task) => task.id !== button.dataset.deleteId);
      persistTasks();
      render();
    });
  });

  agendaList.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const task = tasks.find((item) => item.id === button.dataset.editId);
      if (!task) return;
      appState.editingTaskId = task.id;
      taskTitleInput.value = task.title;
      taskDateInput.value = task.date;
      taskTimeInput.value = task.time;
      taskDurationInput.value = String(task.duration);
      taskPriorityInput.value = task.priority;
      taskCategoryInput.value = task.category;
      taskNotesInput.value = task.notes;
      taskForm.querySelector('button[type="submit"]').textContent = "Update task";
      taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
      taskTitleInput.focus({ preventScroll: true });
    });
  });
};

const renderStats = () => {
  const todaysTasks = tasks.filter((task) => task.date === todayKey);
  const completedToday = todaysTasks.filter((task) => task.completed).length;
  const completedWeek = tasks.filter((task) => {
    const dayDelta = Math.round((parseDateKey(todayKey) - parseDateKey(task.date)) / 86400000);
    return task.completed && dayDelta >= 0 && dayDelta < 7;
  }).length;
  const highPriority = tasks.filter((task) => task.priority === "High" && !task.completed).length;
  const progress = todaysTasks.length ? Math.round((completedToday / todaysTasks.length) * 100) : 0;

  statToday.textContent = `${todaysTasks.length} ${todaysTasks.length === 1 ? "task" : "tasks"}`;
  statTodayCaption.textContent = `${completedToday} completed · ${Math.max(todaysTasks.length - completedToday, 0)} to go`;
  statCompleted.textContent = String(completedWeek);
  statPriority.textContent = `${highPriority} ${highPriority === 1 ? "task" : "tasks"}`;
  statFocus.textContent = `${progress}%`;
  statProgressCaption.textContent = todaysTasks.length ? "Today's completion" : "Add a task to get started";
};

const renderHeadline = () => {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(now));
  document.getElementById("greeting").textContent = hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";
  headlineDate.textContent = appState.selectedDate === todayKey ? "Today, thoughtfully planned" : formatDay(appState.selectedDate);
  document.getElementById("header-clock").textContent = formatClockInDelhi(now);
  document.getElementById("delhi-clock").textContent = formatClockInDelhi(now);
};

const render = () => {
  renderHeadline();
  renderWeekdays();
  renderCalendar();
  renderAgenda();
  renderStats();
};

const resetForm = () => {
  appState.editingTaskId = null;
  taskForm.reset();
  taskDateInput.value = appState.selectedDate;
  taskTimeInput.value = "09:00";
  taskDurationInput.value = "30";
  taskPriorityInput.value = "Medium";
  taskCategoryInput.value = "Work";
  taskForm.querySelector('button[type="submit"]').textContent = "Save task";
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title || !taskDateInput.value || !taskTimeInput.value) return;

  const task = {
    id: appState.editingTaskId || crypto.randomUUID(),
    title,
    date: taskDateInput.value,
    time: taskTimeInput.value,
    duration: Number(taskDurationInput.value),
    priority: taskPriorityInput.value,
    category: taskCategoryInput.value,
    notes: taskNotesInput.value.trim(),
    completed: appState.editingTaskId ? tasks.find((item) => item.id === appState.editingTaskId)?.completed === true : false,
  };

  tasks = appState.editingTaskId
    ? tasks.map((existingTask) => (existingTask.id === appState.editingTaskId ? task : existingTask))
    : [...tasks, task];
  appState.selectedDate = task.date;
  const taskDate = parseDateKey(task.date);
  appState.viewingMonth = taskDate.getMonth();
  appState.viewingYear = taskDate.getFullYear();
  persistTasks();
  render();
  resetForm();
});

document.getElementById("prev-month").addEventListener("click", () => {
  const date = new Date(appState.viewingYear, appState.viewingMonth - 1, 1);
  appState.viewingMonth = date.getMonth();
  appState.viewingYear = date.getFullYear();
  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  const date = new Date(appState.viewingYear, appState.viewingMonth + 1, 1);
  appState.viewingMonth = date.getMonth();
  appState.viewingYear = date.getFullYear();
  renderCalendar();
});

document.getElementById("go-today").addEventListener("click", () => {
  appState.selectedDate = todayKey;
  const today = parseDateKey(todayKey);
  appState.viewingMonth = today.getMonth();
  appState.viewingYear = today.getFullYear();
  taskDateInput.value = todayKey;
  render();
});

document.getElementById("clear-completed").addEventListener("click", () => {
  tasks = tasks.filter((task) => task.date !== appState.selectedDate || !task.completed);
  persistTasks();
  render();
});

taskSearchInput.addEventListener("input", renderAgenda);
taskFilterInput.addEventListener("change", renderAgenda);

document.getElementById("jump-add-task").addEventListener("click", () => {
  taskDateInput.value = appState.selectedDate;
  taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
  taskTitleInput.focus({ preventScroll: true });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    document.getElementById(button.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.getElementById("export-tasks").addEventListener("click", () => {
  const headers = ["Title", "Date (Delhi)", "Time (IST)", "Duration (minutes)", "Priority", "Category", "Notes", "Completed"];
  const rows = tasks.map((task) =>
    [task.title, task.date, task.time, task.duration, task.priority, task.category, task.notes, task.completed ? "Yes" : "No"]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `day-planner-${todayKey}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

const GROWTH_KEY = "day-planner-growth";
const HABITS = [
  { id: "learn", title: "Learn something", detail: "Study, read, or practise a skill" },
  { id: "move", title: "Move your body", detail: "A walk, stretch, or workout counts" },
  { id: "plan", title: "Plan with intention", detail: "Choose what matters most today" },
];
const focusClock = document.getElementById("focus-clock");
const focusStatus = document.getElementById("focus-status");
const focusToggle = document.getElementById("focus-toggle");
const goalList = document.getElementById("goal-list");
const habitList = document.getElementById("habit-list");
const coachPrompt = document.getElementById("coach-prompt");
const coachResponse = document.getElementById("coach-response");
const focusMinutesByDate = {};
let growthData;
let focusDuration = 25 * 60;
let focusRemaining = focusDuration;
let focusInterval = null;
let booksDatabase;
let books = [];
let activeBook = null;
let activeBookUrl = null;
let readingInterval = null;
let readingElapsedSeconds = 0;
let readingStartedAt = 0;
let readingStartPage = 0;

const loadGrowthData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(GROWTH_KEY) || "{}");
    return {
      goals: Array.isArray(saved.goals) ? saved.goals : [],
      habits: saved.habits && typeof saved.habits === "object" ? saved.habits : {},
      reflections: saved.reflections && typeof saved.reflections === "object" ? saved.reflections : {},
      focusMinutes: saved.focusMinutes && typeof saved.focusMinutes === "object" ? saved.focusMinutes : {},
      readingSessions: Array.isArray(saved.readingSessions) ? saved.readingSessions : [],
      readingGoalMinutes: Number.isFinite(Number(saved.readingGoalMinutes)) ? Math.min(600, Math.max(1, Number(saved.readingGoalMinutes))) : 20,
    };
  } catch (error) {
    console.error("Could not read saved growth data; starting fresh.", error);
    return { goals: [], habits: {}, reflections: {}, focusMinutes: {}, readingSessions: [], readingGoalMinutes: 20 };
  }
};

growthData = loadGrowthData();

const persistGrowthData = () => {
  localStorage.setItem(GROWTH_KEY, JSON.stringify(growthData));
};

const READING_DB_NAME = "day-planner-library";
const READING_DB_VERSION = 1;
const PDF_MAX_BYTES = 100 * 1024 * 1024;
const readingMessage = document.getElementById("reading-message");
const readingProgressTrack = document.getElementById("reading-progress-track");
const currentPageInput = document.getElementById("current-page");
const totalPagesInput = document.getElementById("total-pages");

const setReadingMessage = (message, isError = false) => {
  readingMessage.textContent = message;
  readingMessage.classList.toggle("error", isError);
};

const openReadingDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(READING_DB_NAME, READING_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("books")) {
        database.createObjectStore("books", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open your local bookshelf."));
    request.onblocked = () => reject(new Error("Please close another Day Planner tab to finish setting up your bookshelf."));
  });

const withBookStore = (mode, action) =>
  new Promise((resolve, reject) => {
    const transaction = booksDatabase.transaction("books", mode);
    const store = transaction.objectStore("books");
    let result;
    let actionError;
    try {
      const request = action(store);
      if (request) {
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => {
          actionError = request.error;
        };
      }
    } catch (error) {
      actionError = error;
      transaction.abort();
    }
    transaction.oncomplete = () => (actionError ? reject(actionError) : resolve(result));
    transaction.onerror = () => reject(actionError || transaction.error || new Error("Could not update your local bookshelf."));
    transaction.onabort = () => reject(actionError || transaction.error || new Error("The bookshelf update was cancelled."));
  });

const loadBooks = async () => {
  try {
    if (!("indexedDB" in window)) {
      throw new Error("This browser does not support local PDF storage. Please use a recent version of Chrome, Edge, Firefox, or Safari.");
    }
    booksDatabase = await openReadingDatabase();
    books = (await withBookStore("readonly", (store) => store.getAll())).sort((a, b) => a.title.localeCompare(b.title));
    renderBookShelf();
    renderReadingSummary();
  } catch (error) {
    console.error("Could not load the local PDF bookshelf.", error);
    setReadingMessage(`${error.message} Your planner and other growth tools are still available.`, true);
  }
};

const formatReadingDuration = (seconds) => {
  if (seconds === 0) return "0 min";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds} sec`;
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} hr ${minutes % 60} min` : `${minutes} min`;
};

const getTodayReading = () => growthData.readingSessions.filter((session) => session.date === todayKey);

const renderReadingSummary = () => {
  const sessions = getTodayReading();
  const secondsRead = sessions.reduce((total, session) => total + session.seconds, 0);
  const pagesRead = sessions.reduce((total, session) => total + session.pages, 0);
  const goalMinutes = growthData.readingGoalMinutes || 20;
  const progress = Math.min(100, Math.round((secondsRead / (goalMinutes * 60)) * 100));
  document.getElementById("reading-today-total").textContent = `${formatReadingDuration(secondsRead)} today`;
  document.getElementById("reading-progress-bar").style.width = `${progress}%`;
  readingProgressTrack.setAttribute("aria-valuenow", String(progress));
  document.getElementById("reading-progress-caption").textContent =
    `${Math.floor(secondsRead / 60)} of ${goalMinutes} min${pagesRead ? ` · ${pagesRead} ${pagesRead === 1 ? "page" : "pages"} read today` : " today"}`;

  const byDate = new Map();
  growthData.readingSessions.forEach((session) => {
    const day = byDate.get(session.date) || { seconds: 0, pages: 0, books: new Set() };
    day.seconds += session.seconds;
    day.pages += session.pages;
    day.books.add(session.title);
    byDate.set(session.date, day);
  });
  const recent = [...byDate.entries()].sort(([first], [second]) => second.localeCompare(first)).slice(0, 7);
  document.getElementById("reading-log").innerHTML = recent.length
    ? recent
        .map(([date, entry]) => `
          <div class="reading-log-day">
            <div><strong>${date === todayKey ? "Today" : escapeHTML(formatDay(date))}</strong><span>${escapeHTML([...entry.books].join(", "))}</span></div>
            <div class="reading-log-totals"><strong>${formatReadingDuration(entry.seconds)}</strong><span>${entry.pages} ${entry.pages === 1 ? "page" : "pages"}</span></div>
          </div>`)
        .join("")
    : '<div class="reading-log-empty">Your daily reading progress will show up here.</div>';
};

const renderBookShelf = () => {
  document.getElementById("book-count").textContent = `${books.length} ${books.length === 1 ? "book" : "books"}`;
  const shelf = document.getElementById("book-shelf");
  shelf.innerHTML = books.length
    ? books
        .map((book) => `
          <div class="book-item ${activeBook?.id === book.id ? "active" : ""}">
            <button class="book-open" type="button" data-book-open="${escapeHTML(book.id)}" aria-label="Open ${escapeHTML(book.title)}">
              <span class="book-cover" aria-hidden="true">PDF</span>
              <span class="book-copy"><strong>${escapeHTML(book.title)}</strong><small>${book.lastPage ? `Page ${book.lastPage}${book.totalPages ? ` of ${book.totalPages}` : ""}` : "Ready to read"}</small></span>
            </button>
            <button class="book-remove" type="button" data-book-remove="${escapeHTML(book.id)}" aria-label="Remove ${escapeHTML(book.title)}" ${activeBook?.id === book.id ? "disabled" : ""}>×</button>
          </div>`)
        .join("")
    : '<div class="book-empty">Your bookshelf is waiting for its first book.</div>';

  shelf.querySelectorAll("[data-book-open]").forEach((button) => {
    button.addEventListener("click", () => void openBook(button.dataset.bookOpen));
  });
  shelf.querySelectorAll("[data-book-remove]").forEach((button) => {
    button.addEventListener("click", () => void removeBook(button.dataset.bookRemove));
  });
};

const handlePdfFiles = async (fileList) => {
  if (!booksDatabase) {
    setReadingMessage("Your local bookshelf is still setting up. Please try again in a moment.", true);
    return;
  }

  const files = [...fileList];
  if (!files.length) return;
  for (const file of files) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setReadingMessage(`${file.name} is not a PDF. Please choose a PDF book.`, true);
      continue;
    }
    if (file.size === 0 || file.size > PDF_MAX_BYTES) {
      setReadingMessage(`${file.name} is empty or larger than 100 MB. Choose a smaller PDF.`, true);
      continue;
    }

    const book = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.pdf$/i, ""),
      fileName: file.name,
      blob: file.slice(0, file.size, "application/pdf"),
      size: file.size,
      totalPages: 0,
      lastPage: 0,
      addedAt: new Date().toISOString(),
    };
    try {
      await withBookStore("readwrite", (store) => store.put(book));
      books.push(book);
      setReadingMessage(`Added “${book.title}” to your bookshelf.`);
      renderBookShelf();
      await openBook(book.id);
    } catch (error) {
      console.error("Could not save PDF to the local bookshelf.", error);
      setReadingMessage(`Could not save ${file.name}. Your browser storage may be full.`, true);
    }
  }
};

const updateActiveBookDetails = () => {
  if (!activeBook) return;
  const page = Number(currentPageInput.value) || 0;
  const total = activeBook.totalPages || Number(totalPagesInput.value) || 0;
  const progress = total ? `Page ${page} of ${total} · ${Math.min(100, Math.round((page / total) * 100))}%` : `Page ${page}`;
  document.getElementById("active-book-progress").textContent = progress;
};

const openBook = async (bookId) => {
  if (activeBook?.id !== bookId && activeBook && (readingInterval || readingElapsedSeconds > 0)) {
    const saved = await finishReadingSession();
    if (!saved) return;
  } else if (readingInterval) {
    pauseReadingSession();
  }
  const book = books.find((item) => item.id === bookId);
  if (!book) return;
  activeBook = book;
  if (activeBookUrl) URL.revokeObjectURL(activeBookUrl);
  activeBookUrl = URL.createObjectURL(book.blob);
  const reader = document.getElementById("pdf-reader");
  reader.src = activeBookUrl;
  reader.hidden = false;
  document.getElementById("reader-placeholder").hidden = true;
  document.getElementById("reader-controls").hidden = false;
  document.getElementById("active-book-title").textContent = book.title;
  currentPageInput.value = String(book.lastPage || 1);
  readingStartPage = book.lastPage || 1;
  currentPageInput.min = String(book.lastPage || 1);
  totalPagesInput.value = book.totalPages ? String(book.totalPages) : "";
  totalPagesInput.max = book.totalPages ? String(book.totalPages) : "";
  readingElapsedSeconds = 0;
  document.getElementById("reading-session-clock").textContent = "00:00";
  document.getElementById("reading-toggle").textContent = "Start reading";
  document.getElementById("reading-finish").disabled = true;
  updateActiveBookDetails();
  renderBookShelf();
  document.getElementById("reading-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
};

const pauseReadingSession = () => {
  if (!readingInterval) return;
  window.clearInterval(readingInterval);
  readingInterval = null;
  readingElapsedSeconds += Math.floor((Date.now() - readingStartedAt) / 1000);
  document.getElementById("reading-toggle").textContent = "Resume reading";
};

const refreshReadingClock = () => {
  const elapsed = readingElapsedSeconds + (readingInterval ? Math.floor((Date.now() - readingStartedAt) / 1000) : 0);
  document.getElementById("reading-session-clock").textContent =
    `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  document.getElementById("reading-finish").disabled = elapsed === 0;
};

const startReadingSession = () => {
  if (!activeBook || readingInterval) return;
  if (!readingElapsedSeconds) readingStartPage = Number(currentPageInput.value) || activeBook.lastPage || 1;
  readingStartedAt = Date.now();
  readingInterval = window.setInterval(refreshReadingClock, 1000);
  document.getElementById("reading-toggle").textContent = "Pause reading";
  refreshReadingClock();
};

const finishReadingSession = async () => {
  if (!activeBook) return;
  pauseReadingSession();
  const seconds = readingElapsedSeconds;
  const page = Math.max(0, Number(currentPageInput.value) || 0);
  const totalPages = Math.max(0, Number(totalPagesInput.value) || activeBook.totalPages || 0);
  if (totalPages && page > totalPages) {
    setReadingMessage(`Current page cannot be greater than the book's ${totalPages} pages.`, true);
    return false;
  }
  const pages = Math.max(0, page - readingStartPage);
  const book = { ...activeBook, lastPage: page, totalPages };
  try {
    await withBookStore("readwrite", (store) => store.put(book));
    books = books.map((item) => (item.id === book.id ? book : item));
    if (seconds > 0) {
      growthData.readingSessions.push({
        id: crypto.randomUUID(),
        bookId: book.id,
        title: book.title,
        date: getDateKeyInDelhi(),
        seconds,
        pages,
      });
      persistGrowthData();
    }
    activeBook = book;
    readingElapsedSeconds = 0;
    readingStartPage = page;
    document.getElementById("reading-session-clock").textContent = "00:00";
    document.getElementById("reading-toggle").textContent = "Start reading";
    document.getElementById("reading-finish").disabled = true;
    currentPageInput.min = String(page || 1);
    updateActiveBookDetails();
    renderBookShelf();
    renderReadingSummary();
    setReadingMessage(seconds ? `Saved ${formatReadingDuration(seconds)} and ${pages} ${pages === 1 ? "page" : "pages"} for “${book.title}”.` : "Page progress saved.");
    return true;
  } catch (error) {
    console.error("Could not save reading progress.", error);
    setReadingMessage("Could not save your reading progress. Please check browser storage and try again.", true);
    return false;
  }
};

const removeBook = async (bookId) => {
  const book = books.find((item) => item.id === bookId);
  if (!book || !window.confirm(`Remove “${book.title}” and its PDF from this device? Reading history will be kept.`)) return;
  try {
    await withBookStore("readwrite", (store) => store.delete(bookId));
    books = books.filter((item) => item.id !== bookId);
    if (activeBook?.id === bookId) {
      activeBook = null;
      if (activeBookUrl) URL.revokeObjectURL(activeBookUrl);
      activeBookUrl = null;
      document.getElementById("pdf-reader").removeAttribute("src");
      document.getElementById("pdf-reader").hidden = true;
      document.getElementById("reader-controls").hidden = true;
      document.getElementById("reader-placeholder").hidden = false;
    }
    renderBookShelf();
    setReadingMessage(`Removed “${book.title}” from this device.`);
  } catch (error) {
    console.error("Could not remove PDF from the bookshelf.", error);
    setReadingMessage("Could not remove this PDF. Please try again.", true);
  }
};

const renderGoals = () => {
  const activeGoals = growthData.goals.filter((goal) => !goal.completed);
  document.getElementById("goal-count").textContent = `${activeGoals.length} active`;
  goalList.innerHTML = growthData.goals.length
    ? growthData.goals
        .map(
          (goal) => `
            <div class="goal-item ${goal.completed ? "complete" : ""}">
              <label class="goal-check-label">
                <input class="goal-check" type="checkbox" data-goal-id="${escapeHTML(goal.id)}" ${goal.completed ? "checked" : ""} aria-label="Complete ${escapeHTML(goal.title)}" />
                <span class="goal-title">${escapeHTML(goal.title)}</span>
              </label>
              <button class="goal-delete" type="button" data-goal-delete="${escapeHTML(goal.id)}" aria-label="Remove ${escapeHTML(goal.title)}">×</button>
            </div>`
        )
        .join("")
    : '<div class="empty-state compact-empty">Add one meaningful goal to get started.</div>';

  goalList.querySelectorAll(".goal-check").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      growthData.goals = growthData.goals.map((goal) =>
        goal.id === checkbox.dataset.goalId ? { ...goal, completed: checkbox.checked } : goal,
      );
      persistGrowthData();
      renderGoals();
    });
  });
  goalList.querySelectorAll(".goal-delete").forEach((button) => {
    button.addEventListener("click", () => {
      growthData.goals = growthData.goals.filter((goal) => goal.id !== button.dataset.goalDelete);
      persistGrowthData();
      renderGoals();
    });
  });
};

const renderHabits = () => {
  const checked = growthData.habits[todayKey] || [];
  document.getElementById("habit-count").textContent = `${checked.length} of ${HABITS.length} today`;
  habitList.innerHTML = HABITS.map(
    (habit) => `
      <label class="habit-item ${checked.includes(habit.id) ? "checked" : ""}">
        <input class="habit-check" type="checkbox" data-habit-id="${habit.id}" ${checked.includes(habit.id) ? "checked" : ""} />
        <span class="habit-copy"><strong>${habit.title}</strong><small>${habit.detail}</small></span>
        <span class="habit-tick" aria-hidden="true">✓</span>
      </label>`,
  ).join("");
  habitList.querySelectorAll(".habit-check").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selected = new Set(growthData.habits[todayKey] || []);
      if (checkbox.checked) selected.add(checkbox.dataset.habitId);
      else selected.delete(checkbox.dataset.habitId);
      growthData.habits[todayKey] = [...selected];
      persistGrowthData();
      renderHabits();
    });
  });
};

const renderReflection = () => {
  const reflection = growthData.reflections[todayKey] || {};
  document.getElementById("reflection-date").textContent = formatDay(todayKey);
  document.getElementById("reflection-win").value = reflection.win || "";
  document.getElementById("reflection-learned").value = reflection.learned || "";
  document.getElementById("reflection-next").value = reflection.next || "";
};

const saveReflection = () => {
  growthData.reflections[todayKey] = {
    win: document.getElementById("reflection-win").value.trim(),
    learned: document.getElementById("reflection-learned").value.trim(),
    next: document.getElementById("reflection-next").value.trim(),
  };
  persistGrowthData();
  const savedLabel = document.getElementById("reflection-saved");
  savedLabel.textContent = `Saved at ${formatClockInDelhi()} IST`;
};

const formatTimer = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const renderFocusTimer = () => {
  focusClock.textContent = formatTimer(focusRemaining);
  document.getElementById("focus-total").textContent = `${growthData.focusMinutes[todayKey] || 0} min`;
};

const stopFocusTimer = (status = "READY") => {
  if (focusInterval) window.clearInterval(focusInterval);
  focusInterval = null;
  document.querySelector(".focus-panel").classList.remove("is-focusing");
  focusStatus.textContent = status;
  focusToggle.textContent = "Start focus";
};

document.getElementById("goal-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const goalInput = document.getElementById("goal-title");
  const title = goalInput.value.trim();
  if (!title) return;
  growthData.goals.push({ id: crypto.randomUUID(), title, completed: false });
  persistGrowthData();
  goalInput.value = "";
  renderGoals();
});

document.querySelectorAll(".focus-preset").forEach((button) => {
  button.addEventListener("click", () => {
    if (focusInterval) return;
    document.querySelectorAll(".focus-preset").forEach((item) => item.classList.toggle("active", item === button));
    focusDuration = Number(button.dataset.minutes) * 60;
    focusRemaining = focusDuration;
    focusStatus.textContent = "READY";
    renderFocusTimer();
  });
});

focusToggle.addEventListener("click", () => {
  if (focusInterval) {
    window.clearInterval(focusInterval);
    focusInterval = null;
    document.querySelector(".focus-panel").classList.remove("is-focusing");
    focusToggle.textContent = "Resume focus";
    focusStatus.textContent = "PAUSED";
    return;
  }

  if (focusRemaining <= 0) {
    focusRemaining = focusDuration;
    renderFocusTimer();
  }
  focusToggle.textContent = "Pause session";
  focusStatus.textContent = "FOCUSING";
  document.querySelector(".focus-panel").classList.add("is-focusing");
  focusInterval = window.setInterval(() => {
    focusRemaining -= 1;
    renderFocusTimer();
    if (focusRemaining <= 0) {
      stopFocusTimer("COMPLETE");
      growthData.focusMinutes[todayKey] = (growthData.focusMinutes[todayKey] || 0) + Math.round(focusDuration / 60);
      persistGrowthData();
      renderFocusTimer();
      coachResponse.textContent = "Focus session complete. Take a short break, then decide what matters next.";
    }
  }, 1000);
});

document.getElementById("focus-reset").addEventListener("click", () => {
  stopFocusTimer();
  focusRemaining = focusDuration;
  renderFocusTimer();
});

document.getElementById("save-reflection").addEventListener("click", saveReflection);
["reflection-win", "reflection-learned", "reflection-next"].forEach((id) => {
  document.getElementById(id).addEventListener("change", saveReflection);
});

const pdfUpload = document.getElementById("pdf-upload");
const pdfDropzone = document.getElementById("pdf-dropzone");
pdfUpload.addEventListener("change", () => {
  void handlePdfFiles(pdfUpload.files);
  pdfUpload.value = "";
});

["dragenter", "dragover"].forEach((eventName) => {
  pdfDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    pdfDropzone.classList.add("drag-over");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  pdfDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    pdfDropzone.classList.remove("drag-over");
  });
});
pdfDropzone.addEventListener("drop", (event) => void handlePdfFiles(event.dataTransfer.files));
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("drop", (event) => {
  if (!pdfDropzone.contains(event.target)) event.preventDefault();
});

document.getElementById("reading-goal").value = String(growthData.readingGoalMinutes);
document.getElementById("reading-goal").addEventListener("change", (event) => {
  const minutes = Math.min(600, Math.max(1, Number(event.currentTarget.value) || 20));
  growthData.readingGoalMinutes = minutes;
  event.currentTarget.value = String(minutes);
  persistGrowthData();
  renderReadingSummary();
});

currentPageInput.addEventListener("input", updateActiveBookDetails);
totalPagesInput.addEventListener("input", () => {
  const total = Number(totalPagesInput.value);
  currentPageInput.max = total > 0 ? String(total) : "";
  updateActiveBookDetails();
});
document.getElementById("reading-toggle").addEventListener("click", () => {
  if (readingInterval) {
    pauseReadingSession();
    document.getElementById("reading-toggle").textContent = "Resume reading";
  } else {
    startReadingSession();
  }
  refreshReadingClock();
});
document.getElementById("reading-finish").addEventListener("click", () => void finishReadingSession());
document.getElementById("close-reader").addEventListener("click", async () => {
  if (readingInterval || readingElapsedSeconds > 0) {
    const saved = await finishReadingSession();
    if (!saved) return;
  }
  activeBook = null;
  if (activeBookUrl) URL.revokeObjectURL(activeBookUrl);
  activeBookUrl = null;
  document.getElementById("pdf-reader").removeAttribute("src");
  document.getElementById("pdf-reader").hidden = true;
  document.getElementById("reader-controls").hidden = true;
  document.getElementById("reader-placeholder").hidden = false;
  renderBookShelf();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && readingInterval) {
    pauseReadingSession();
    document.getElementById("reading-toggle").textContent = "Resume reading";
    refreshReadingClock();
    setReadingMessage("Reading timer paused while this tab is hidden. Resume when you return.");
  }
});

document.querySelectorAll(".prompt-chip").forEach((button) => {
  button.addEventListener("click", () => {
    const prompts = {
      plan: `Help me make a realistic plan for ${formatDay(todayKey)}. Prioritize my tasks and leave room for breaks.`,
      breakdown: "Help me break my most important goal into small, concrete steps I can begin today.",
      reflect: "Help me reflect on today without judgment and suggest one practical thing I can try tomorrow.",
    };
    coachPrompt.value = prompts[button.dataset.prompt];
    coachPrompt.focus();
  });
});

document.getElementById("ask-coach").addEventListener("click", async () => {
  const question = coachPrompt.value.trim();
  if (!question) {
    coachPrompt.focus();
    coachResponse.textContent = "Tell the coach what you’re working on or what you need help with.";
    return;
  }

  const button = document.getElementById("ask-coach");
  button.disabled = true;
  button.textContent = "Thinking...";
  coachResponse.textContent = "Thinking through a practical next step...";
  const todayReading = getTodayReading();
  const context = {
    date: todayKey,
    timezone: "Asia/Kolkata",
    tasks: tasks
      .filter((task) => task.date === todayKey)
      .map(({ title, time, duration, priority, category, completed }) => ({ title, time, duration, priority, category, completed })),
    goals: growthData.goals.filter((goal) => !goal.completed).map(({ title }) => title),
    habitsCompleted: (growthData.habits[todayKey] || []).length,
    focusMinutes: growthData.focusMinutes[todayKey] || 0,
    readingMinutes: Math.floor(todayReading.reduce((total, session) => total + session.seconds, 0) / 60),
    readingPages: todayReading.reduce((total, session) => total + session.pages, 0),
    reflection: growthData.reflections[todayKey] || {},
  };

  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The coach could not respond.");
    coachResponse.textContent = result.answer;
  } catch (error) {
    coachResponse.textContent = error.message.includes("Failed to fetch")
      ? "Could not reach the AI coach. Start the Day Planner server with your OpenAI API key configured, then try again."
      : error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = "Ask coach <span>→</span>";
  }
});

renderGoals();
renderHabits();
renderReflection();
renderFocusTimer();
renderReadingSummary();

resetForm();
render();
void loadBooks();
window.setInterval(() => {
  const currentDateKey = getDateKeyInDelhi();
  if (currentDateKey !== todayKey) {
    const previousDateKey = todayKey;
    todayKey = currentDateKey;
    if (appState.selectedDate === previousDateKey) {
      appState.selectedDate = todayKey;
      taskDateInput.value = todayKey;
    }
    const today = parseDateKey(todayKey);
    appState.viewingMonth = today.getMonth();
    appState.viewingYear = today.getFullYear();
    render();
    return;
  }
  renderHeadline();
}, 30_000);
