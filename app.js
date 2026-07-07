// Кеду — логика приложения: SRS, карточки, геймификация.

const STORAGE_KEY = "kedu_progress_v1";
const BOX_INTERVALS_DAYS = [0, 1, 2, 4, 7, 14, 30]; // индекс = "коробка" Лейтнера
const START_HEARTS = 5;
const XP_PER_CORRECT = 10;
const XP_LESSON_BONUS = 50;

let progress = null;
let session = null;

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

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ---------- Прогресс (localStorage) ----------

function defaultProgress() {
  return { xp: 0, streak: 0, lastStudyDate: null, wordProgress: {} };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    progress = raw ? JSON.parse(raw) : defaultProgress();
  } catch (e) {
    progress = defaultProgress();
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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

// ---------- Экраны ----------

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
  document.getElementById("stat-hearts").parentElement.classList.toggle("hidden", name !== "lesson");
}

function refreshHeader() {
  document.getElementById("stat-streak").textContent = progress.streak;
  document.getElementById("stat-xp").textContent = progress.xp;
  if (session) document.getElementById("stat-lives").textContent = session.hearts;
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

  const grid = document.getElementById("lesson-grid");
  grid.innerHTML = "";
  LESSONS.forEach((lesson) => {
    const words = WORDS.filter((w) => w.lesson === lesson.id);
    const learned = words.filter((w) => (progress.wordProgress[w.id]?.box ?? 0) >= 3).length;
    const pct = Math.round((learned / words.length) * 100);

    const node = document.createElement("div");
    node.className = "lesson-node" + (pct === 100 ? " mastered" : "");
    node.innerHTML = `
      <div class="lesson-icon">${lesson.icon}</div>
      <div class="lesson-title">${lesson.title}</div>
      <div class="lesson-progress"><div class="lesson-progress-fill" style="width:${pct}%"></div></div>
      <div class="lesson-count">${learned}/${words.length}</div>
    `;
    node.addEventListener("click", () => startLesson(lesson.id));
    grid.appendChild(node);
  });
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
  const words = dueWords();
  if (words.length === 0) return;
  session = { queue: buildQueue(words), index: 0, correct: 0, wrong: 0, hearts: START_HEARTS, xpEarned: 0, mode: "review" };
  showScreen("lesson");
  renderQuestion();
}

function startCharacters() {
  const words = singleCharacters();
  session = { queue: buildQueue(words), index: 0, correct: 0, wrong: 0, hearts: START_HEARTS, xpEarned: 0, mode: "chars" };
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
  } else {
    label.textContent = "Как будет по-китайски?";
    main.textContent = word.ru;
    distractorField = "hanzi";
    optionRenderer = (w) => `${w.hanzi} <span style="font-size:13px;color:#999">${w.pinyin}</span>`;
    speakBtn.classList.add("hidden");
  }

  const distractors = sample(
    pool.filter((w, i, arr) => arr.findIndex((x) => x[distractorField] === w[distractorField]) === i),
    3
  );
  const options = shuffle([word, ...distractors]);

  const optionsEl = document.getElementById("q-options");
  optionsEl.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.optionId = opt.id;
    btn.innerHTML = optionRenderer(opt);
    btn.addEventListener("click", () => checkAnswer(btn, word, opt.id === word.id));
    optionsEl.appendChild(btn);
  });

  speakBtn.onclick = () => speak(word.hanzi);
}

function checkAnswer(btn, word, isCorrect) {
  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));

  if (isCorrect) {
    btn.classList.add("correct");
    session.correct++;
    session.xpEarned += XP_PER_CORRECT;
    progress.xp += XP_PER_CORRECT;
  } else {
    btn.classList.add("wrong");
    session.wrong++;
    session.hearts--;
    document.querySelector(`.option-btn[data-option-id="${word.id}"]`)?.classList.add("correct");
  }

  registerAnswer(word.id, isCorrect);
  saveProgress();
  refreshHeader();

  const feedback = document.getElementById("feedback");
  feedback.classList.remove("hidden", "correct", "wrong");
  feedback.classList.add(isCorrect ? "correct" : "wrong");
  document.getElementById("feedback-text").textContent = isCorrect
    ? `Верно! +${XP_PER_CORRECT} XP`
    : `Неверно. Правильный ответ: ${word.qType === "toRu" ? word.ru : word.hanzi}`;
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
    if (session.mode === "lesson" || session.mode === "chars") {
      session.xpEarned += XP_LESSON_BONUS;
      progress.xp += XP_LESSON_BONUS;
    }
    updateStreakOnComplete();
  }
  saveProgress();

  document.getElementById("result-emoji").textContent = failed ? "💔" : "🎉";
  document.getElementById("result-title").textContent = failed ? "Жизни закончились" : "Урок пройден!";
  document.getElementById("result-correct").textContent = session.correct;
  document.getElementById("result-wrong").textContent = session.wrong;
  document.getElementById("result-xp").textContent = session.xpEarned;

  showScreen("result");
  refreshHeader();
}

// ---------- Инициализация ----------

document.getElementById("btn-review").addEventListener("click", startReview);
document.getElementById("btn-chars").addEventListener("click", startCharacters);
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

loadProgress();
showScreen("home");
renderHome();
