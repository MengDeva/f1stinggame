const app = document.getElementById("app");

const columns = document.querySelectorAll(".light-column");

const allLights = document.querySelectorAll(".light");

const startButton = document.getElementById("startButton");

const resetButton = document.getElementById("resetButton");

const status = document.getElementById("status");

const reaction = document.getElementById("reaction");

const scores = document.getElementById("scores");

/* =========================================================
   GAME STATE
========================================================= */

let state = "idle";

let currentColumn = 0;

let columnTimer = null;

let lightsOutTimer = null;

let lightsOutTime = 0;

/*
  Possible states:

  idle
  countdown
  waiting
  go
  finished
  falseStart
*/

/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "f1-reaction-leaderboard";

/* =========================================================
   AUDIO INIT
========================================================= */

function initAudio() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

/* =========================================================
   LIGHT BEEP
========================================================= */

function playBeep(index) {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();

  const gain = audioContext.createGain();

  oscillator.type = "square";

  oscillator.frequency.setValueAtTime(400 + index * 70, now);

  gain.gain.setValueAtTime(0.0001, now);

  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);

  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  oscillator.connect(gain);

  gain.connect(audioContext.destination);

  oscillator.start(now);

  oscillator.stop(now + 0.13);
}

/* =========================================================
   LIGHTS OUT SOUND
========================================================= */

function playLightsOut() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;

  const osc = audioContext.createOscillator();

  const gain = audioContext.createGain();

  osc.type = "sawtooth";

  osc.frequency.setValueAtTime(1800, now);

  osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);

  gain.gain.setValueAtTime(0.0001, now);

  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.01);

  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  osc.connect(gain);

  gain.connect(audioContext.destination);

  osc.start(now);

  osc.stop(now + 0.6);

  /* High-frequency layer */

  const high = audioContext.createOscillator();

  const highGain = audioContext.createGain();

  high.type = "triangle";

  high.frequency.setValueAtTime(2400, now);

  high.frequency.exponentialRampToValueAtTime(500, now + 0.35);

  highGain.gain.setValueAtTime(0.0001, now);

  highGain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);

  highGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

  high.connect(highGain);

  highGain.connect(audioContext.destination);

  high.start(now);

  high.stop(now + 0.45);
}

/* =========================================================
   FALSE START SOUND
========================================================= */

function playError() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;

  const osc = audioContext.createOscillator();

  const gain = audioContext.createGain();

  osc.type = "sawtooth";

  osc.frequency.setValueAtTime(150, now);

  osc.frequency.exponentialRampToValueAtTime(65, now + 0.3);

  gain.gain.setValueAtTime(0.0001, now);

  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);

  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc.connect(gain);

  gain.connect(audioContext.destination);

  osc.start(now);

  osc.stop(now + 0.4);
}

/* =========================================================
   CLEAR LIGHTS
========================================================= */

function clearLights() {
  allLights.forEach((light) => {
    light.classList.remove("on");
  });
}

/* =========================================================
   ACTIVATE COLUMN
========================================================= */

function activateColumn(index) {
  const column = columns[index];

  if (!column) {
    return;
  }

  /*
    Only the 2 RED lights
    are activated.

    Optional top lights remain
    inactive unless you choose
    to add them to the sequence.
  */

  const redLights = column.querySelectorAll(".red");

  redLights.forEach((light) => {
    light.classList.add("on");
  });

  playBeep(index);
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {
  if (state === "countdown" || state === "waiting" || state === "go") {
    return;
  }

  initAudio();

  clearInterval(columnTimer);

  clearTimeout(lightsOutTimer);

  clearLights();

  currentColumn = 0;

  state = "countdown";

  reaction.textContent = "0.000";

  reaction.classList.remove("error");

  status.textContent = "";

  status.className = "waiting";

  startButton.disabled = true;

  startButton.textContent = "Lights Starting";

  /*
    First red pair.
  */

  activateColumn(currentColumn);

  currentColumn++;

  /*
    Next pair every 1 second.
  */

  columnTimer = setInterval(() => {
    if (currentColumn >= 5) {
      clearInterval(columnTimer);

      columnTimer = null;

      randomDelay();

      return;
    }

    activateColumn(currentColumn);

    currentColumn++;
  }, 1000);
}

/* =========================================================
   RANDOM DELAY
========================================================= */

function randomDelay() {
  state = "waiting";

  status.textContent = "";

  status.className = "waiting";

  /*
    1.5 - 4 seconds
  */

  const delay = 1500 + Math.random() * 2500;

  lightsOutTimer = setTimeout(lightsOut, delay);
}

/* =========================================================
   LIGHTS OUT
========================================================= */

function lightsOut() {
  if (state !== "waiting") {
    return;
  }

  /*
    ALL RED LIGHTS OFF
    AT EXACTLY THE SAME TIME
  */

  clearLights();

  state = "go";

  lightsOutTime = performance.now();

  status.textContent = "";

  status.className = "go";

  startButton.textContent = "React Now";

  playLightsOut();
}

/* =========================================================
   REACTION
========================================================= */

function react() {
  /*
    False start
  */

  if (state === "countdown" || state === "waiting") {
    falseStart();

    return;
  }

  /*
    Ignore if not ready
  */

  if (state !== "go") {
    return;
  }

  const time = performance.now() - lightsOutTime;

  state = "finished";

  reaction.textContent = formatTime(time);

  reaction.classList.remove("error");

  status.textContent = "";

  status.className = "go";

  startButton.disabled = false;

  startButton.textContent = "Race Again";

  /*
    Ask name
  */

  setTimeout(() => {
    askName(time);
  }, 100);
}

/* =========================================================
   FALSE START
========================================================= */

function falseStart() {
  clearInterval(columnTimer);

  clearTimeout(lightsOutTimer);

  columnTimer = null;

  lightsOutTimer = null;

  clearLights();

  state = "falseStart";

  reaction.textContent = "Try Again?";

  reaction.classList.add("error");

  status.textContent = "";

  status.className = "error";

  startButton.disabled = false;

  startButton.textContent = "Try Again";

  document.body.classList.add("flash-red");

  setTimeout(() => {
    document.body.classList.remove("flash-red");
  }, 350);

  playError();
}

/* =========================================================
   FORMAT
========================================================= */

function formatTime(ms) {
  return (ms / 1000).toFixed(3);
}

/* =========================================================
   LEADERBOARD
========================================================= */

function getScores() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data)

      .filter(
        (item) =>
          item &&
          typeof item.name === "string" &&
          typeof item.time === "number",
      )

      .sort((a, b) => a.time - b.time)

      .slice(0, 5);
  } catch {
    return [];
  }
}

/* =========================================================
   SAVE SCORE
========================================================= */

function saveScore(name, time) {
  const leaderboard = getScores();

  leaderboard.push({
    name: name.trim().substring(0, 12),

    time: time,

    date: Date.now(),
  });

  leaderboard.sort((a, b) => a.time - b.time);

  const topFive = leaderboard.slice(0, 5);

  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(topFive),
  );

  renderLeaderboard();
}

/* =========================================================
   ASK NAME
========================================================= */

function askName(time) {
  const name = prompt(
    `Your reaction time: ${formatTime(time)}s\n\nEnter your name or initials:`,
    "",
  );

  if (!name || !name.trim()) {
    return;
  }

  saveScore(name, time);
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {
  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

/* =========================================================
   RENDER LEADERBOARD
========================================================= */

function renderLeaderboard() {
  const leaderboard = getScores();

  scores.innerHTML = "";

  if (leaderboard.length === 0) {
    scores.innerHTML = `

      <div class="empty-score">
        No times recorded yet.
      </div>

    `;

    return;
  }

  leaderboard.forEach((score, index) => {
    const row = document.createElement("div");

    row.className = "score";

    row.innerHTML = `

        <div class="score-left">

          <div class="score-rank">
            ${index + 1}
          </div>

          <div class="score-name">
            ${escapeHTML(score.name)}
          </div>

        </div>

        <div class="score-time">
          ${formatTime(score.time)}s
        </div>

      `;

    scores.appendChild(row);
  });
}

/* =========================================================
   START BUTTON
========================================================= */

startButton.addEventListener("click", (event) => {
  event.stopPropagation();

  startGame();
});

/* =========================================================
   RESET
========================================================= */

resetButton.addEventListener("click", (event) => {
  event.stopPropagation();

  if (confirm("Reset the leaderboard?")) {
    localStorage.removeItem(STORAGE_KEY);

    renderLeaderboard();
  }
});

/* =========================================================
   CLICK ANYWHERE TO REACT
========================================================= */

app.addEventListener("click", (event) => {
  if (event.target === startButton || event.target === resetButton) {
    return;
  }

  react();
});

/* =========================================================
   SPACEBAR
========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") {
    return;
  }

  event.preventDefault();

  /*
      Space starts a new race
    */

  if (state === "idle" || state === "finished" || state === "falseStart") {
    startGame();

    return;
  }

  /*
      Space reacts
    */

  react();
});

/* =========================================================
   INITIALIZE
========================================================= */

clearLights();

renderLeaderboard();

/* =========================================================
   MODAL
========================================================= */

const leaderboardButton = document.getElementById("leaderboardButton");

const leaderboardModal = document.getElementById("leaderboardModal");

const closeLeaderboard = document.getElementById("closeLeaderboard");

const modalLeaderboard = document.getElementById("modalLeaderboard");

const emptyLeaderboard = document.getElementById("emptyLeaderboard");

const resetLeaderboardModal = document.getElementById("resetLeaderboardModal");

function openLeaderboardModal() {
  renderModalLeaderboard();

  leaderboardModal.classList.remove("hidden");
  leaderboardModal.classList.add("flex");

  document.body.classList.add("overflow-hidden");
}

function closeLeaderboardModal() {
  leaderboardModal.classList.add("hidden");
  leaderboardModal.classList.remove("flex");

  document.body.classList.remove("overflow-hidden");
}

leaderboardButton.addEventListener("click", () => {
  openLeaderboardModal();
});

closeLeaderboard.addEventListener("click", () => {
  closeLeaderboardModal();
});

leaderboardModal.addEventListener("click", (event) => {
  if (event.target === leaderboardModal) {
    closeLeaderboardModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLeaderboardModal();
  }
});

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
leaderboardButton.addEventListener("click", () => {
  openLeaderboardModal();
});

closeLeaderboard.addEventListener("click", () => {
  closeLeaderboardModal();
});

resetLeaderboardModal.addEventListener("click", () => {
  const confirmed = confirm("Reset the entire reaction-time leaderboard?");

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);

  renderModalLeaderboard();
});

// =========================================================
// LEADERBOARD SYSTEM
// =========================================================

// const STORAGE_KEY = "f1ReactionLeaderboard";

function getLeaderboard() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const data = JSON.parse(saved);

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((item) => {
        return (
          item &&
          typeof item.name === "string" &&
          typeof item.time === "number" &&
          Number.isFinite(item.time)
        );
      })
      .sort((a, b) => a.time - b.time)
      .slice(0, 5);
  } catch (error) {
    console.error("Could not load leaderboard:", error);
    return [];
  }
}

function saveLeaderboard(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error("Could not save leaderboard:", error);
  }
}

function addScore(name, time) {
  const scores = getLeaderboard();

  scores.push({
    name: name.trim().slice(0, 12),
    time: Number(time),
    date: Date.now(),
  });

  scores.sort((a, b) => a.time - b.time);

  saveLeaderboard(scores.slice(0, 5));

  renderModalLeaderboard();
}

function renderModalLeaderboard() {
  const scores = getLeaderboard();

  modalLeaderboard.innerHTML = "";

  if (scores.length === 0) {
    modalLeaderboard.classList.add("hidden");
    emptyLeaderboard.classList.remove("hidden");

    return;
  }

  modalLeaderboard.classList.remove("hidden");
  emptyLeaderboard.classList.add("hidden");

  scores.forEach((score, index) => {
    const row = document.createElement("div");

    row.className = `
      grid grid-cols-[45px_1fr_auto]
      items-center gap-3
      rounded-xl
      border border-white/[0.05]
      bg-white/[0.025]
      px-4 py-3
      transition-all
      hover:border-red-500/20
      hover:bg-white/[0.04]
    `;

    if (index === 0) {
      row.className = `
        grid grid-cols-[45px_1fr_auto]
        items-center gap-3
        rounded-xl
        border border-yellow-500/20
        bg-yellow-500/[0.04]
        px-4 py-3
        shadow-[inset_3px_0_0_rgba(234,179,8,0.8)]
      `;
    }

    // POSITION

    const position = document.createElement("div");

    position.className = `
      flex h-8 w-8
      items-center justify-center
      rounded-lg
      bg-white/5
      text-xs font-black
      ${index === 0 ? "bg-yellow-500/10 text-yellow-400" : "text-gray-500"}
    `;

    position.textContent = index + 1;

    // DRIVER

    const driver = document.createElement("div");

    driver.className = "min-w-0";

    driver.innerHTML = `
      <div class="
        truncate
        text-sm
        font-black
        tracking-wide
        text-gray-200
      ">
        ${escapeHTML(score.name)}
      </div>

      <div class="
        mt-0.5
        text-[8px]
        font-bold
        tracking-[1.5px]
        text-gray-600
      ">
        Driver ${String(index + 1).padStart(2, "0")}
      </div>
    `;

    // TIME

    const time = document.createElement("div");

    time.className = `
      font-mono
      text-base
      font-black
      ${index === 0 ? "text-yellow-400" : "text-gray-300"}
    `;

    time.textContent = formatTime(score.time);

    row.appendChild(position);
    row.appendChild(driver);
    row.appendChild(time);

    modalLeaderboard.appendChild(row);
  });
}
