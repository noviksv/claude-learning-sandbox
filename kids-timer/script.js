(() => {
  const RING_CIRCUMFERENCE = 2 * Math.PI * 90;

  const ringProgress = document.querySelector(".ring__progress");
  const timeText = document.getElementById("timeText");
  const statusText = document.getElementById("statusText");
  const actionNameText = document.getElementById("actionNameText");
  const stepIndicatorText = document.getElementById("stepIndicatorText");
  const presetButtons = document.querySelectorAll(".presets .preset-btn");
  const minutesInput = document.getElementById("minutesInput");
  const secondsInput = document.getElementById("secondsInput");
  const customStartBtn = document.getElementById("customStartBtn");
  const pauseResumeBtn = document.getElementById("pauseResumeBtn");
  const resetBtn = document.getElementById("resetBtn");

  const modeSingleBtn = document.getElementById("modeSingleBtn");
  const modeRoutineBtn = document.getElementById("modeRoutineBtn");
  const singleTimerView = document.getElementById("singleTimerView");
  const routineView = document.getElementById("routineView");
  const routineBuilderEl = document.getElementById("routineBuilder");
  const routineProgressEl = document.getElementById("routineProgress");
  const quickAddButtons = document.querySelectorAll(".quick-add-btn");
  const actionNameInput = document.getElementById("actionNameInput");
  const actionMinutesInput = document.getElementById("actionMinutesInput");
  const actionSecondsInput = document.getElementById("actionSecondsInput");
  const addActionBtn = document.getElementById("addActionBtn");
  const actionListEl = document.getElementById("actionList");
  const startRoutineBtn = document.getElementById("startRoutineBtn");
  const saveRoutineBtn = document.getElementById("saveRoutineBtn");
  const savedActionChipsEl = document.getElementById("savedActionChips");
  const savedRoutinesSection = document.getElementById("savedRoutinesSection");
  const savedRoutinesListEl = document.getElementById("savedRoutinesList");

  const STORAGE_KEY_ACTIONS = "kidsTimerSavedActions";
  const STORAGE_KEY_ROUTINES = "kidsTimerSavedRoutines";

  ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);

  let state = "idle"; // idle | running | paused | finished
  let totalSeconds = 0;
  let endTime = 0; // Date.now() timestamp when the timer should reach 0
  let remainingAtPause = 0;
  let intervalId = null;
  let audioCtx = null;

  let mode = "single"; // single | routine
  let routineActions = []; // builder list: { name, seconds }
  let routineQueue = []; // active run: { name, seconds }
  let routineIndex = -1;
  let routineAdvanceTimeoutId = null;

  function loadStored(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function saveStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private browsing, quota) - saving is best-effort
    }
  }

  function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  let savedActions = loadStored(STORAGE_KEY_ACTIONS); // [{ id, name, seconds }]
  let savedRoutines = loadStored(STORAGE_KEY_ROUTINES); // [{ id, name, actions: [{ name, seconds }] }]

  function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSecs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function updateDisplay(remainingSecs) {
    const clamped = Math.max(0, remainingSecs);
    timeText.textContent = formatTime(clamped);
    const fraction = totalSeconds > 0 ? clamped / totalSeconds : 0;
    ringProgress.style.strokeDashoffset = String(
      RING_CIRCUMFERENCE * (1 - fraction)
    );
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playAlarm() {
    const ctx = ensureAudioContext();
    const now = ctx.currentTime;

    [0, 0.35, 0.7].forEach((offset) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.3);
    });
  }

  function setDuration(seconds) {
    totalSeconds = seconds;
    updateDisplay(seconds);
  }

  function tick() {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
      finish();
      return;
    }
    updateDisplay(Math.ceil(remainingMs / 1000));
  }

  function start() {
    if (totalSeconds <= 0) return;
    ensureAudioContext();
    state = "running";
    endTime = Date.now() + totalSeconds * 1000;
    statusText.textContent = "";
    statusText.classList.remove("is-finished");
    ringProgress.classList.remove("is-finished");
    clearInterval(intervalId);
    intervalId = setInterval(tick, 200);
    updateDisplay(totalSeconds);

    pauseResumeBtn.disabled = false;
    pauseResumeBtn.textContent = "Pause";
    resetBtn.disabled = false;
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    remainingAtPause = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    clearInterval(intervalId);
    pauseResumeBtn.textContent = "Resume";
  }

  function resume() {
    if (state !== "paused") return;
    state = "running";
    endTime = Date.now() + remainingAtPause * 1000;
    intervalId = setInterval(tick, 200);
    pauseResumeBtn.textContent = "Pause";
  }

  function finish() {
    state = "finished";
    clearInterval(intervalId);
    updateDisplay(0);
    ringProgress.classList.add("is-finished");
    pauseResumeBtn.disabled = true;
    playAlarm();

    if (mode === "routine" && routineQueue.length > 0) {
      const isLastAction = routineIndex >= routineQueue.length - 1;
      statusText.classList.add("is-finished");
      if (isLastAction) {
        finishRoutine();
      } else {
        statusText.textContent = "Time's up! Next up...";
        routineAdvanceTimeoutId = setTimeout(() => {
          routineAdvanceTimeoutId = null;
          routineIndex += 1;
          startCurrentRoutineAction();
        }, 1500);
      }
      return;
    }

    statusText.textContent = "Time's up!";
    statusText.classList.add("is-finished");
  }

  function reset() {
    state = "idle";
    clearInterval(intervalId);
    totalSeconds = 0;
    updateDisplay(0);
    statusText.textContent = "";
    statusText.classList.remove("is-finished");
    ringProgress.classList.remove("is-finished");
    pauseResumeBtn.disabled = true;
    pauseResumeBtn.textContent = "Pause";
    resetBtn.disabled = true;

    if (mode === "routine" && routineQueue.length > 0) {
      clearTimeout(routineAdvanceTimeoutId);
      routineAdvanceTimeoutId = null;
      routineQueue = [];
      routineIndex = -1;
      actionNameText.textContent = "";
      stepIndicatorText.textContent = "";
      routineBuilderEl.hidden = false;
      routineProgressEl.hidden = true;
    }
  }

  // --- Routine mode ---

  function renderActionList() {
    actionListEl.innerHTML = "";
    routineActions.forEach((action, index) => {
      const li = document.createElement("li");
      li.className = "action-item";

      const label = document.createElement("span");
      label.className = "action-item__label";
      label.textContent = action.name;

      const duration = document.createElement("span");
      duration.className = "action-item__duration";
      duration.textContent = formatTime(action.seconds);

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "action-item__save";
      saveBtn.setAttribute("aria-label", `Save ${action.name} as a reusable chip`);
      saveBtn.textContent = "☆";
      saveBtn.addEventListener("click", () => saveActionAsChip(action));

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "action-item__remove";
      removeBtn.setAttribute("aria-label", `Remove ${action.name}`);
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        routineActions.splice(index, 1);
        renderActionList();
      });

      li.append(label, duration, saveBtn, removeBtn);
      actionListEl.appendChild(li);
    });

    startRoutineBtn.disabled = routineActions.length === 0;
    saveRoutineBtn.disabled = routineActions.length === 0;
  }

  function addAction(name, seconds) {
    const trimmedName = (name || "").trim();
    if (!trimmedName || seconds <= 0) return;
    routineActions.push({ name: trimmedName, seconds });
    renderActionList();
  }

  function saveActionAsChip(action) {
    const alreadySaved = savedActions.some(
      (a) => a.name === action.name && a.seconds === action.seconds
    );
    if (alreadySaved) return;
    savedActions.push({ id: generateId(), name: action.name, seconds: action.seconds });
    saveStored(STORAGE_KEY_ACTIONS, savedActions);
    renderSavedActionChips();
  }

  function renderSavedActionChips() {
    savedActionChipsEl.innerHTML = "";
    savedActions.forEach((action) => {
      const wrap = document.createElement("span");
      wrap.className = "saved-chip";

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "preset-btn quick-add-btn";
      addBtn.textContent = action.name;
      addBtn.addEventListener("click", () => addAction(action.name, action.seconds));

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "saved-chip__remove";
      removeBtn.setAttribute("aria-label", `Remove saved action ${action.name}`);
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        savedActions = savedActions.filter((a) => a.id !== action.id);
        saveStored(STORAGE_KEY_ACTIONS, savedActions);
        renderSavedActionChips();
      });

      wrap.append(addBtn, removeBtn);
      savedActionChipsEl.appendChild(wrap);
    });
  }

  function renderSavedRoutinesList() {
    savedRoutinesListEl.innerHTML = "";
    savedRoutinesSection.hidden = savedRoutines.length === 0;

    savedRoutines.forEach((routine) => {
      const li = document.createElement("li");
      li.className = "saved-routine";

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.className = "saved-routine__load";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = routine.name;

      const metaSpan = document.createElement("span");
      metaSpan.className = "saved-routine__meta";
      const stepCount = routine.actions.length;
      metaSpan.textContent = ` (${stepCount} step${stepCount === 1 ? "" : "s"})`;

      loadBtn.append(nameSpan, metaSpan);
      loadBtn.addEventListener("click", () => {
        routineActions = routine.actions.map((action) => ({ ...action }));
        renderActionList();
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "saved-routine__remove";
      removeBtn.setAttribute("aria-label", `Delete saved routine ${routine.name}`);
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        savedRoutines = savedRoutines.filter((r) => r.id !== routine.id);
        saveStored(STORAGE_KEY_ROUTINES, savedRoutines);
        renderSavedRoutinesList();
      });

      li.append(loadBtn, removeBtn);
      savedRoutinesListEl.appendChild(li);
    });
  }

  function renderRoutineProgress() {
    routineProgressEl.innerHTML = "";
    routineQueue.forEach((action, index) => {
      const li = document.createElement("li");
      li.className = "routine-progress__item";
      if (index < routineIndex) li.classList.add("is-done");
      if (index === routineIndex) li.classList.add("is-current");
      li.textContent = action.name;
      routineProgressEl.appendChild(li);
    });
  }

  function startCurrentRoutineAction() {
    const action = routineQueue[routineIndex];
    actionNameText.textContent = action.name;
    stepIndicatorText.textContent = `Step ${routineIndex + 1} of ${routineQueue.length}`;
    renderRoutineProgress();
    setDuration(action.seconds);
    start();
  }

  function startRoutine() {
    if (routineActions.length === 0) return;
    routineQueue = routineActions.map((action) => ({ ...action }));
    routineIndex = 0;
    routineBuilderEl.hidden = true;
    routineProgressEl.hidden = false;
    startCurrentRoutineAction();
  }

  function finishRoutine() {
    actionNameText.textContent = "";
    stepIndicatorText.textContent = "";
    statusText.textContent = "Routine complete! 🎉";
    routineBuilderEl.hidden = false;
    routineProgressEl.hidden = true;
    routineQueue = [];
    routineIndex = -1;
  }

  function setMode(newMode) {
    if (mode === newMode) return;
    reset();
    mode = newMode;
    const isRoutine = mode === "routine";
    singleTimerView.hidden = isRoutine;
    routineView.hidden = !isRoutine;
    modeSingleBtn.classList.toggle("is-active", !isRoutine);
    modeRoutineBtn.classList.toggle("is-active", isRoutine);
    actionNameText.textContent = "";
    stepIndicatorText.textContent = "";
  }

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const seconds = Number(btn.dataset.seconds);
      setDuration(seconds);
      start();
    });
  });

  customStartBtn.addEventListener("click", () => {
    const minutes = Math.min(
      99,
      Math.max(0, Math.floor(Number(minutesInput.value) || 0))
    );
    const seconds = Math.min(
      59,
      Math.max(0, Math.floor(Number(secondsInput.value) || 0))
    );
    const total = minutes * 60 + seconds;
    if (total <= 0) return;
    setDuration(total);
    start();
  });

  pauseResumeBtn.addEventListener("click", () => {
    if (state === "running") {
      pause();
    } else if (state === "paused") {
      resume();
    }
  });

  resetBtn.addEventListener("click", reset);

  modeSingleBtn.addEventListener("click", () => setMode("single"));
  modeRoutineBtn.addEventListener("click", () => setMode("routine"));

  quickAddButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      addAction(btn.dataset.name, Number(btn.dataset.seconds));
    });
  });

  addActionBtn.addEventListener("click", () => {
    const minutes = Math.min(
      99,
      Math.max(0, Math.floor(Number(actionMinutesInput.value) || 0))
    );
    const seconds = Math.min(
      59,
      Math.max(0, Math.floor(Number(actionSecondsInput.value) || 0))
    );
    addAction(actionNameInput.value, minutes * 60 + seconds);
    actionNameInput.value = "";
    actionMinutesInput.value = "0";
    actionSecondsInput.value = "0";
    actionNameInput.focus();
  });

  actionNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addActionBtn.click();
  });

  startRoutineBtn.addEventListener("click", startRoutine);

  saveRoutineBtn.addEventListener("click", () => {
    if (routineActions.length === 0) return;
    const name = prompt("Name this routine:", "");
    const trimmedName = (name || "").trim();
    if (!trimmedName) return;
    savedRoutines.push({
      id: generateId(),
      name: trimmedName,
      actions: routineActions.map((action) => ({ ...action })),
    });
    saveStored(STORAGE_KEY_ROUTINES, savedRoutines);
    renderSavedRoutinesList();
  });

  renderSavedActionChips();
  renderSavedRoutinesList();
  updateDisplay(0);
})();
