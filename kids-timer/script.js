(() => {
  const RING_CIRCUMFERENCE = 2 * Math.PI * 90;

  const ringProgress = document.querySelector(".ring__progress");
  const timeText = document.getElementById("timeText");
  const statusText = document.getElementById("statusText");
  const presetButtons = document.querySelectorAll(".preset-btn");
  const minutesInput = document.getElementById("minutesInput");
  const secondsInput = document.getElementById("secondsInput");
  const customStartBtn = document.getElementById("customStartBtn");
  const pauseResumeBtn = document.getElementById("pauseResumeBtn");
  const resetBtn = document.getElementById("resetBtn");

  ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);

  let state = "idle"; // idle | running | paused | finished
  let totalSeconds = 0;
  let endTime = 0; // Date.now() timestamp when the timer should reach 0
  let remainingAtPause = 0;
  let intervalId = null;
  let audioCtx = null;

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
    statusText.textContent = "Time's up!";
    statusText.classList.add("is-finished");
    ringProgress.classList.add("is-finished");
    pauseResumeBtn.disabled = true;
    playAlarm();
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

  updateDisplay(0);
})();
