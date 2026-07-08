// Кеду — логика приложения: аккаунты, SRS, карточки, геймификация.

const USERS_KEY = "kedu_users_v1";
const SESSION_KEY = "kedu_session_v1";
const BOX_INTERVALS_DAYS = [0, 1, 2, 4, 7, 14, 30]; // индекс = "коробка" Лейтнера
const START_HEARTS = 5;
const XP_PER_CORRECT = 10;
const XP_LESSON_BONUS = 50;
const XP_PER_LEVEL = 200;

let progress = null;
let session = null;
let currentUser = null; // никнейм текущего пользователя (для отображения)
let currentUserKey = null; // ключ пользователя в нижнем регистре (для localStorage)
let authMode = "login"; // "login" | "register"

// ---------- Утилиты ----------

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysStr(base, days) {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

let cachedVoices = [];
if ("speechSynthesis" in window) {
  const refreshVoices = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

const PREFERRED_ZH_VOICES = ["tingting", "meijia", "yaoyao", "xiaoxiao", "huihui", "yunxi", "yunyang"]; // системные голоса с наиболее чёткой дикцией (macOS/Windows/Edge)

function pickChineseVoice() {
  const zhCN = cachedVoices.filter((v) => v.lang === "zh-CN");
  const preferred = zhCN.find((v) => PREFERRED_ZH_VOICES.some((name) => v.name.toLowerCase().includes(name)));
  return (
    preferred ||
    zhCN[0] ||
    cachedVoices.find((v) => v.lang?.toLowerCase().startsWith("zh")) ||
    null
  );
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  const voice = pickChineseVoice();
  if (voice) u.voice = voice;
  u.rate = 0.88; // чуть медленнее для разборчивости
  u.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ---------- Звуковые эффекты (Web Audio API, без внешних файлов) ----------

const SOUND_KEY = "kedu_sound_v1";
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, startTime, duration, type = "sine", peakGain = 0.2) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration + 0.02);
}

function playSound(name) {
  if (!soundEnabled) return;
  try {
    if (name === "correct") {
      playTone(660, 0, 0.12);
      playTone(880, 0.1, 0.18);
    } else if (name === "wrong") {
      playTone(180, 0, 0.25, "sawtooth", 0.12);
    } else if (name === "complete") {
      [523, 659, 784, 1046].forEach((freq, i) => playTone(freq, i * 0.09, 0.2));
    } else if (name === "fail") {
      playTone(220, 0, 0.2, "sawtooth", 0.12);
      playTone(160, 0.15, 0.3, "sawtooth", 0.12);
    }
  } catch (e) {
    // AudioContext недоступен (например, без взаимодействия пользователя) — просто без звука
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  updateSoundButton();
  if (soundEnabled) playSound("correct");
}

function updateSoundButton() {
  const btn = document.getElementById("btn-sound");
  if (btn) btn.textContent = soundEnabled ? "🔊" : "🔇";
}

// ---------- Тема (светлая/тёмная) ----------

const THEME_KEY = "kedu_theme_v1";

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById("btn-theme");
  const theme = document.documentElement.getAttribute("data-theme");
  if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
}

// ---------- Аккаунты (localStorage, без сервера) ----------

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(userKey) {
  currentUserKey = userKey;
  if (userKey) localStorage.setItem(SESSION_KEY, userKey);
  else localStorage.removeItem(SESSION_KEY);
}

async function handleAuthSubmit(nickname, password) {
  nickname = nickname.trim();
  const key = nickname.toLowerCase();
  if (nickname.length < 2) return "Никнейм слишком короткий";
  if (password.length < 4) return "Пароль минимум 4 символа";

  const users = loadUsers();
  const passwordHash = await hashPassword(password);

  if (authMode === "register") {
    if (users[key]) return "Такой никнейм уже занят";
    users[key] = { nickname, passwordHash };
    saveUsers(users);
  } else {
    const user = users[key];
    if (!user || user.passwordHash !== passwordHash) return "Неверный никнейм или пароль";
    nickname = user.nickname;
  }

  currentUser = nickname;
  setSession(key);
  loadProgress(key);
  showScreen("home");
  renderHome();
  return null;
}

function logout() {
  setSession(null);
  currentUser = null;
  progress = null;
  document.getElementById("auth-form").reset();
  setAuthMode("login");
  showScreen("auth");
}

// ---------- Прогресс (localStorage, отдельно на пользователя) ----------

function defaultProgress() {
  return { xp: 0, streak: 0, lastStudyDate: null, wordProgress: {} };
}

function progressKey(userKey) {
  return `kedu_progress_v1_${userKey}`;
}

function loadProgress(userKey) {
  try {
    const raw = localStorage.getItem(progressKey(userKey));
    progress = raw ? JSON.parse(raw) : defaultProgress();
  } catch (e) {
    progress = defaultProgress();
  }
}

function saveProgress() {
  localStorage.setItem(progressKey(currentUserKey), JSON.stringify(progress));
}

function updateStreakOnComplete() {
  const today = todayStr();
  if (progress.lastStudyDate === today) return;
  const yesterday = addDaysStr(today, -1);
  progress.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
  progress.lastStudyDate = today;
}

function registerAnswer(wordId, isCorrect) {
  const wp = progress.wordProgress[wordId] || { box: 0, due: todayStr() };
  wp.box = isCorrect ? Math.min(BOX_INTERVALS_DAYS.length - 1, wp.box + 1) : 0;
  wp.due = addDaysStr(todayStr(), BOX_INTERVALS_DAYS[wp.box]);
  progress.wordProgress[wordId] = wp;
}

function dueWords() {
  const today = todayStr();
  return WORDS.filter((w) => {
    const wp = progress.wordProgress[w.id];
    return wp && wp.due <= today;
  });
}

function singleCharacters() {
  return WORDS.filter((w) => Array.from(w.hanzi).length === 1);
}

// ---------- Тоны ----------

const TONE_MARKS = {
  1: "āēīōūǖ",
  2: "áéíóúǘ",
  3: "ǎěǐǒǔǚ",
  4: "àèìòùǜ",
};
const TONE_SYMBOLS = { 1: "ā", 2: "á", 3: "ǎ", 4: "à" };
const TONE_LABELS = { 1: "1-й тон", 2: "2-й тон", 3: "3-й тон", 4: "4-й тон" };

function toneOf(pinyin) {
  for (const ch of pinyin) {
    for (const tone of [1, 2, 3, 4]) {
      if (TONE_MARKS[tone].includes(ch)) return tone;
    }
  }
  return null; // нейтральный тон (без диакритики) — не участвует в тренировке тонов
}

function toneableCharacters() {
  return singleCharacters().filter((w) => toneOf(w.pinyin) !== null);
}

// ---------- Экраны ----------

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
  document.getElementById("stat-hearts").classList.toggle("hidden", name !== "lesson");

  document.getElementById("topbar").classList.toggle("hidden", name === "auth");

  const bottomNav = document.getElementById("bottom-nav");
  const showNav = name === "home" || name === "profile";
  bottomNav.classList.toggle("hidden", !showNav);
  if (showNav) {
    document.getElementById("nav-home").classList.toggle("active", name === "home");
    document.getElementById("nav-profile").classList.toggle("active", name === "profile");
  }
}

let lastXpShown = null;

function refreshHeader() {
  document.getElementById("stat-streak").textContent = progress.streak;
  document.getElementById("stat-xp").textContent = progress.xp;
  if (session) document.getElementById("stat-lives").textContent = session.hearts;

  document.getElementById("stat-streak-wrap").classList.toggle("streak-active", progress.streak > 0);

  if (lastXpShown !== null && progress.xp > lastXpShown) {
    const xpWrap = document.getElementById("stat-xp-wrap");
    xpWrap.classList.remove("pop");
    void xpWrap.offsetWidth; // рестарт CSS-анимации
    xpWrap.classList.add("pop");
  }
  lastXpShown = progress.xp;
}

function launchConfetti() {
  const colors = ["#F5B400", "#171717", "#3A9A5C"];
  const container = document.getElementById("confetti");
  container.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${1.1 + Math.random() * 0.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ""; }, 2000);
}

// ---------- Главная: карта уроков ----------

function renderHome() {
  refreshHeader();

  const due = dueWords();
  const reviewCard = document.getElementById("review-card");
  if (due.length > 0) {
    reviewCard.classList.remove("hidden");
    document.getElementById("review-count").textContent = due.length;
  } else {
    reviewCard.classList.add("hidden");
  }

  const chars = singleCharacters();
  const charsLearned = chars.filter((w) => (progress.wordProgress[w.id]?.box ?? 0) >= 3).length;
  document.getElementById("chars-progress").textContent = `${charsLearned}/${chars.length}`;

  renderLessonSections();
}

const CATEGORY_TITLES = { themes: "📚 Темы" };
(typeof HSK_CATEGORIES !== "undefined" ? HSK_CATEGORIES : []).forEach((c) => {
  CATEGORY_TITLES[c.id] = c.title;
});
const CATEGORY_ORDER = ["themes", "hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6"];

function lessonNodeHtml(lesson) {
  const words = WORDS.filter((w) => w.lesson === lesson.id);
  const learned = words.filter((w) => (progress.wordProgress[w.id]?.box ?? 0) >= 3).length;
  const pct = words.length ? Math.round((learned / words.length) * 100) : 0;
  return {
    pct,
    learned,
    total: words.length,
    html: `
      <div class="lesson-node${pct === 100 ? " mastered" : ""}" data-lesson-id="${lesson.id}">
        ${pct === 100 ? '<div class="lesson-badge">✓</div>' : ""}
        <div class="lesson-icon">${lesson.icon}</div>
        <div class="lesson-title">${lesson.title}</div>
        <div class="lesson-progress"><div class="lesson-progress-fill" style="width:${pct}%"></div></div>
        <div class="lesson-count">${learned}/${words.length}</div>
      </div>
    `,
  };
}

function renderLessonSections() {
  const container = document.getElementById("lesson-sections");
  container.innerHTML = "";

  const byCategory = {};
  LESSONS.forEach((l) => {
    const cat = l.category || "themes";
    (byCategory[cat] = byCategory[cat] || []).push(l);
  });

  CATEGORY_ORDER.filter((cat) => byCategory[cat]).forEach((cat) => {
    const lessons = byCategory[cat];
    let learnedTotal = 0;
    let wordsTotal = 0;
    const nodesHtml = lessons
      .map((lesson) => {
        const { pct, learned, total, html } = lessonNodeHtml(lesson);
        learnedTotal += learned;
        wordsTotal += total;
        return html;
      })
      .join("");

    const section = document.createElement("section");
    section.className = "lesson-section";
    section.innerHTML = `
      <div class="section-header">
        <h3>${CATEGORY_TITLES[cat] || cat}</h3>
        <span class="section-progress">${learnedTotal}/${wordsTotal}</span>
      </div>
      <div class="lesson-grid">${nodesHtml}</div>
    `;
    container.appendChild(section);
  });

  container.querySelectorAll(".lesson-node").forEach((node) => {
    node.addEventListener("click", () => startLesson(Number(node.dataset.lessonId)));
  });
}

// ---------- Личный кабинет ----------

function renderProfile() {
  refreshHeader();

  const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = progress.xp % XP_PER_LEVEL;

  document.getElementById("profile-nickname").textContent = currentUser;
  document.getElementById("profile-avatar").textContent = currentUser.charAt(0).toUpperCase();
  document.getElementById("profile-level").textContent = `Уровень ${level}`;
  document.getElementById("level-xp-into").textContent = xpIntoLevel;
  document.getElementById("level-xp-total").textContent = XP_PER_LEVEL;
  document.getElementById("level-bar-fill").style.width = `${Math.round((xpIntoLevel / XP_PER_LEVEL) * 100)}%`;

  const wordsLearned = WORDS.filter((w) => (progress.wordProgress[w.id]?.box ?? 0) >= 3).length;
  const charsLearned = singleCharacters().filter((w) => (progress.wordProgress[w.id]?.box ?? 0) >= 3).length;

  document.getElementById("profile-words").textContent = wordsLearned;
  document.getElementById("profile-chars").textContent = charsLearned;
  document.getElementById("profile-streak").textContent = progress.streak;
  document.getElementById("profile-xp").textContent = progress.xp;
}

// ---------- Сессия карточек ----------

function buildQueue(words) {
  return shuffle(words).map((w) => ({ ...w, qType: Math.random() < 0.5 ? "toRu" : "toHanzi" }));
}

function startLesson(lessonId) {
  const words = WORDS.filter((w) => w.lesson === lessonId);
  session = { queue: buildQueue(words), index: 0, correct: 0, wrong: 0, hearts: START_HEARTS, xpEarned: 0, mode: "lesson", lessonId };
  showScreen("lesson");
  renderQuestion();
}

function startReview() {
  const pool = dueWords();
  if (pool.length === 0) return;
  // Сначала самые просроченные слова, а не случайные — это эффективнее для SRS
  const prioritized = pool
    .slice()
    .sort((a, b) => progress.wordProgress[a.id].due.localeCompare(progress.wordProgress[b.id].due))
    .slice(0, SESSION_CAP);
  const words = shuffle(prioritized);
  session = { queue: buildQueue(words), index: 0, correct: 0, wrong: 0, hearts: START_HEARTS, xpEarned: 0, mode: "review" };
  showScreen("lesson");
  renderQuestion();
}

const SESSION_CAP = 50; // чтобы сессия из тысяч иероглифов не превращалась в марафон

function startCharacters() {
  const pool = singleCharacters();
  const words = sample(pool, Math.min(pool.length, SESSION_CAP));
  session = { queue: buildQueue(words), index: 0, correct: 0, wrong: 0, hearts: START_HEARTS, xpEarned: 0, mode: "chars" };
  showScreen("lesson");
  renderQuestion();
}

function startTones() {
  const pool = toneableCharacters();
  const words = sample(pool, Math.min(pool.length, SESSION_CAP));
  const queue = shuffle(words).map((w) => ({ ...w, qType: "tone", tone: toneOf(w.pinyin) }));
  session = { queue, index: 0, correct: 0, wrong: 0, hearts: START_HEARTS, xpEarned: 0, mode: "tones" };
  showScreen("lesson");
  renderQuestion();
}

function renderQuestion() {
  document.getElementById("feedback").classList.add("hidden");
  refreshHeader();

  const total = session.queue.length;
  document.getElementById("progress-fill").style.width = `${Math.round((session.index / total) * 100)}%`;

  const word = session.queue[session.index];
  const label = document.getElementById("q-prompt-label");
  const main = document.getElementById("q-prompt-main");
  const speakBtn = document.getElementById("btn-speak");
  const radicalHint = document.getElementById("radical-hint");
  radicalHint.classList.add("hidden");

  if (word.qType === "tone") {
    label.textContent = "Какой это тон?";
    main.innerHTML = `${word.hanzi}<br><span class="prompt-main small">${word.pinyin}</span>`;
    speakBtn.classList.remove("hidden");
    speak(word.hanzi);
    speakBtn.onclick = () => speak(word.hanzi);

    const optionsEl = document.getElementById("q-options");
    optionsEl.innerHTML = "";
    [1, 2, 3, 4].forEach((tone) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.dataset.optionId = tone;
      btn.innerHTML = `${TONE_SYMBOLS[tone]} <span style="font-size:12px;color:#999">${TONE_LABELS[tone]}</span>`;
      btn.addEventListener("click", () => checkAnswer(btn, word, word.tone, tone === word.tone));
      optionsEl.appendChild(btn);
    });
    return;
  }

  const poolBase = session.mode === "lesson" ? WORDS.filter((w) => w.lesson === word.lesson) : session.mode === "chars" ? singleCharacters() : WORDS;
  const pool = poolBase.filter((w) => w.id !== word.id);

  let distractorField, optionRenderer;
  if (word.qType === "toRu") {
    label.textContent = "Что это значит?";
    main.innerHTML = `${word.hanzi}<br><span class="prompt-main small">${word.pinyin}</span>`;
    distractorField = "ru";
    optionRenderer = (w) => w.ru;
    speakBtn.classList.remove("hidden");
    speak(word.hanzi);

    const radical = session.mode === "chars" ? RADICALS[word.hanzi] : null;
    if (radical) {
      radicalHint.innerHTML = `Состав: <b>${radical.parts}</b> — ${radical.note}`;
      radicalHint.classList.remove("hidden");
    }
  } else {
    label.textContent = "Как будет по-китайски?";
    main.textContent = word.ru;
    distractorField = "hanzi";
    optionRenderer = (w) => `${w.hanzi} <span style="font-size:13px;color:#999">${w.pinyin}</span>`;
    speakBtn.classList.add("hidden");
  }

  const uniqueBy = (arr) => arr.filter((w, i, a) => a.findIndex((x) => x[distractorField] === w[distractorField]) === i);
  let distractors = sample(uniqueBy(pool), 3);
  if (distractors.length < 3) {
    // Маленький урок (мало слов) — добираем недостающие варианты из всего словаря
    const usedValues = new Set([word[distractorField], ...distractors.map((d) => d[distractorField])]);
    const fallbackPool = WORDS.filter((w) => w.id !== word.id && !usedValues.has(w[distractorField]));
    const extra = sample(uniqueBy(fallbackPool), 3 - distractors.length);
    distractors = distractors.concat(extra);
  }
  const options = shuffle([word, ...distractors]);

  const optionsEl = document.getElementById("q-options");
  optionsEl.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.optionId = opt.id;
    btn.innerHTML = optionRenderer(opt);
    btn.addEventListener("click", () => checkAnswer(btn, word, word.id, opt.id === word.id));
    optionsEl.appendChild(btn);
  });

  speakBtn.onclick = () => speak(word.hanzi);
}

function checkAnswer(btn, word, correctOptionId, isCorrect) {
  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));

  if (isCorrect) {
    btn.classList.add("correct");
    session.correct++;
    session.xpEarned += XP_PER_CORRECT;
    progress.xp += XP_PER_CORRECT;
    playSound("correct");
  } else {
    btn.classList.add("wrong");
    session.wrong++;
    session.hearts--;
    document.querySelector(`.option-btn[data-option-id="${correctOptionId}"]`)?.classList.add("correct");
    playSound("wrong");
  }

  registerAnswer(word.id, isCorrect);
  saveProgress();
  refreshHeader();

  const feedback = document.getElementById("feedback");
  feedback.classList.remove("hidden", "correct", "wrong");
  feedback.classList.add(isCorrect ? "correct" : "wrong");
  let correctAnswerText = word.hanzi;
  if (word.qType === "toRu") correctAnswerText = word.ru;
  else if (word.qType === "tone") correctAnswerText = TONE_LABELS[word.tone];

  document.getElementById("feedback-text").textContent = isCorrect
    ? `Верно! +${XP_PER_CORRECT} XP`
    : `Неверно. Правильный ответ: ${correctAnswerText}`;
}

function onContinue() {
  if (session.hearts <= 0) {
    finishSession(true);
    return;
  }
  session.index++;
  if (session.index >= session.queue.length) {
    finishSession(false);
  } else {
    renderQuestion();
  }
}

function finishSession(failed) {
  if (!failed) {
    if (session.mode === "lesson" || session.mode === "chars" || session.mode === "tones") {
      session.xpEarned += XP_LESSON_BONUS;
      progress.xp += XP_LESSON_BONUS;
    }
    updateStreakOnComplete();
    playSound("complete");
  } else {
    playSound("fail");
  }
  saveProgress();

  document.getElementById("result-emoji").textContent = failed ? "💔" : "🎉";
  document.getElementById("result-title").textContent = failed ? "Жизни закончились" : "Урок пройден!";
  document.getElementById("result-correct").textContent = session.correct;
  document.getElementById("result-wrong").textContent = session.wrong;
  document.getElementById("result-xp").textContent = session.xpEarned;

  showScreen("result");
  refreshHeader();
  if (!failed) launchConfetti();
}

// ---------- Инициализация ----------

document.getElementById("btn-review").addEventListener("click", startReview);
document.getElementById("btn-chars").addEventListener("click", startCharacters);
document.getElementById("btn-tones").addEventListener("click", startTones);
document.getElementById("btn-continue").addEventListener("click", onContinue);
document.getElementById("btn-home").addEventListener("click", () => {
  session = null;
  showScreen("home");
  renderHome();
});
document.getElementById("btn-exit").addEventListener("click", () => {
  if (confirm("Прервать урок? Прогресс по словам сохранится, но бонус за урок не начислится.")) {
    session = null;
    showScreen("home");
    renderHome();
  }
});

document.getElementById("btn-logout").addEventListener("click", logout);
document.getElementById("btn-sound").addEventListener("click", toggleSound);
updateSoundButton();

document.getElementById("btn-theme").addEventListener("click", toggleTheme);
updateThemeButton();

document.getElementById("nav-home").addEventListener("click", () => {
  showScreen("home");
  renderHome();
});
document.getElementById("nav-profile").addEventListener("click", () => {
  showScreen("profile");
  renderProfile();
});

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("auth-error").classList.add("hidden");
  if (mode === "register") {
    document.getElementById("auth-title").textContent = "Регистрация";
    document.getElementById("auth-submit").textContent = "Зарегистрироваться";
    document.getElementById("auth-switch-text").textContent = "Уже есть аккаунт?";
    document.getElementById("auth-switch-btn").textContent = "Войти";
  } else {
    document.getElementById("auth-title").textContent = "Вход";
    document.getElementById("auth-submit").textContent = "Войти";
    document.getElementById("auth-switch-text").textContent = "Нет аккаунта?";
    document.getElementById("auth-switch-btn").textContent = "Зарегистрироваться";
  }
}

document.getElementById("auth-switch-btn").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nickname = document.getElementById("auth-nickname").value;
  const password = document.getElementById("auth-password").value;
  const submitBtn = document.getElementById("auth-submit");
  const errorEl = document.getElementById("auth-error");

  submitBtn.disabled = true;
  errorEl.classList.add("hidden");
  const error = await handleAuthSubmit(nickname, password);
  submitBtn.disabled = false;

  if (error) {
    errorEl.textContent = error;
    errorEl.classList.remove("hidden");
  }
});

const savedSession = localStorage.getItem(SESSION_KEY);
if (savedSession) {
  const users = loadUsers();
  const user = users[savedSession];
  if (user) {
    currentUser = user.nickname;
    currentUserKey = savedSession;
    loadProgress(savedSession);
    showScreen("home");
    renderHome();
  } else {
    showScreen("auth");
  }
} else {
  showScreen("auth");
}
