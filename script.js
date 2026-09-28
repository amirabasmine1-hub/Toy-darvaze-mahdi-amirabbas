// ============================================================
// توی دروازه | JavaScript اصلی سایت
// نسخه Firebase + Firestore
// ============================================================

// ---------- Firebase ----------
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-FJjxL6beXSjGjw2dFdY4AWvmV-dUKl4",
  authDomain: "toy-darvaze.firebaseapp.com",
  projectId: "toy-darvaze",
  storageBucket: "toy-darvaze.firebasestorage.app",
  messagingSenderId: "899786944597",
  appId: "1:899786944597:web:4ffc4f050b2b100ab4e4dc",
  measurementId: "G-PHJ0PC50KV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ============================================================
// ابزارهای عمومی
// ============================================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];


// ============================================================
// منوی موبایل
// ============================================================

$("#menuToggle").addEventListener("click", () => {
  $("#mainNav").classList.toggle("open");
});

$$(".nav a").forEach(a => {
  a.addEventListener("click", () => {
    $("#mainNav").classList.remove("open");
  });
});


// ============================================================
// نوار پیشرفت
// ============================================================

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;

  if (max <= 0) {
    $("#scrollProgress").style.width = "0%";
    return;
  }

  $("#scrollProgress").style.width =
    `${Math.min(100, (scrollY / max) * 100)}%`;
});


// ============================================================
// انیمیشن کارت‌ها
// ============================================================

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, {
  threshold: 0.12
});

$$(".reveal").forEach(el => observer.observe(el));


// ============================================================
// انتخاب تیم مورد علاقه
// این مورد همچنان روی همین دستگاه ذخیره می‌شود.
// ============================================================

const fanModal = $("#fanModal");

function updateFanUI() {
  const team = localStorage.getItem("favoriteTeam");

  if (!team) {
    $("#fanText").textContent =
      "هنوز تیم مورد علاقه‌ات را انتخاب نکردی ⚽";
    return;
  }

  $("#fanText").textContent =
    `تو طرفدار ${team} هستی! 🎉`;

  document.documentElement.style.setProperty(
    "--fan",
    team === "استقلال"
      ? "#1597e5"
      : team === "پرسپولیس"
        ? "#e85c78"
        : "#36aeda"
  );
}

$("#fanButton").onclick = () => {
  fanModal.classList.add("show");
};

$("#closeFan").onclick = () => {
  fanModal.classList.remove("show");
};

fanModal.addEventListener("click", e => {
  if (e.target === fanModal) {
    fanModal.classList.remove("show");
  }
});

$$(".team-options button").forEach(btn => {
  btn.addEventListener("click", () => {
    localStorage.setItem("favoriteTeam", btn.dataset.team);

    updateFanUI();

    fanModal.classList.remove("show");

    toast(`انتخاب شد: ${btn.dataset.team}`);
  });
});

updateFanUI();


// ============================================================
// شوت ذهنی
// ============================================================

$$(".choice-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const answer = btn.dataset.choice;
    const lucky = Math.random() > 0.45;

    $("#predictionText").textContent = lucky
      ? `🎉 حس ششم میگه «${answer}»! حالا برو واقعاً شوت بزن!`
      : `😄 این بار شانسی نبود؛ ولی شوت واقعی هنوز مونده!`;
  });
});


// ============================================================
// اخبار Firebase
//
// Collection:
// news
//
// نمونه:
// news/news1
// title: "اولین خبر سایت 🎮"
// text: "متن خبر"
// date: "۱۴۰۵/۰۷/۰۵"
// ============================================================

async function getNews() {
  const snapshot = await getDocs(
    collection(db, "news")
  );

  const news = [];

  snapshot.forEach(item => {
    news.push({
      id: item.id,
      ...item.data()
    });
  });

  news.sort((a, b) => {
    const da = a.createdAt?.seconds || 0;
    const dbb = b.createdAt?.seconds || 0;

    if (da !== dbb) {
      return dbb - da;
    }

    return String(b.date || "").localeCompare(
      String(a.date || ""),
      "fa"
    );
  });

  return news;
}

async function renderNews() {
  const grid = $("#newsGrid");

  grid.innerHTML =
    '<div class="loading-card">در حال خواندن اخبار از Firebase... ⚽</div>';

  try {
    const news = await getNews();

    if (!news.length) {
      grid.innerHTML =
        '<div class="loading-card">هنوز خبری ثبت نشده است.</div>';
      return;
    }

    grid.innerHTML = news.map(item => `
      <article class="news-card reveal visible">
        <time>${escapeHtml(item.date || "")}</time>
        <h3>${escapeHtml(item.title || "بدون عنوان")}</h3>
        <p>${escapeHtml(item.text || "")}</p>
      </article>
    `).join("");

    $$(".news-card.reveal").forEach(el => {
      observer.observe(el);
    });

  } catch (error) {
    console.error("Firebase News Error:", error);

    grid.innerHTML = `
      <div class="loading-card">
        ❌ اخبار بارگذاری نشد.<br>
        <small>
          اتصال Firebase یا قوانین Firestore را بررسی کنید.
        </small>
      </div>
    `;
  }
}

$("#refreshNews").onclick = renderNews;

renderNews();


// ============================================================
// تاریخ شمسی و مدرسه
// ============================================================

const weekdayNames = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه"
];

const jalaliMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
];

function jalaliDate(date) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const gdm = [
    0, 31, 59, 90, 120, 151,
    181, 212, 243, 273, 304, 334
  ];

  let gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gdm[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);

  days %= 12053;

  jy += 4 * Math.floor(days / 1461);

  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  const jm =
    days < 186
      ? 1 + Math.floor(days / 31)
      : 7 + Math.floor((days - 186) / 30);

  const jd =
    1 +
    (
      days < 186
        ? days % 31
        : (days - 186) % 30
    );

  return {
    year: jy,
    month: jm,
    day: jd
  };
}

function updateSchool() {
  const now = new Date();
  const j = jalaliDate(now);
  const day = now.getDay();

  let status;
  let icon;
  let message;
  let cls;

  if ((day >= 0 && day <= 3) || day === 6) {
    status = "مدرسه!";
    icon = "🏫";
    message = "امروز مدرسه داریم؛ بعدش وقت بازی و شوت!";
    cls = "school-day";
  } else if (day === 4) {
    status = "استراحت و تعطیل!";
    icon = "😎";
    message = "پنجشنبه‌ست؛ یک استراحت حسابی!";
    cls = "rest-day";
  } else {
    status = "تعطیل!";
    icon = "🎉";
    message = "جمعه‌ست؛ امروز تعطیله!";
    cls = "holiday";
  }

  $("#weekdayName").textContent =
    weekdayNames[day];

  $("#todayStatus").textContent =
    status;

  $("#todayDate").textContent =
    `${j.day} ${jalaliMonths[j.month - 1]} ${j.year}`;

  $("#todayMessage").textContent =
    message;

  $("#todayIcon").textContent =
    icon;

  $("#todayCard").className =
    `today-card reveal visible ${cls}`;
}

function updateClock() {
  const now = new Date();

  $("#liveClock").textContent =
    now.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
}

updateSchool();
updateClock();

setInterval(updateSchool, 60000);
setInterval(updateClock, 1000);


// ============================================================
// امتیازات «توی دروازه» - Firebase
//
// Collection:
// scores
//
// هر مسابقه:
// scores/{autoId}
// amir
// mehdi
// date
// createdAt
// ============================================================

let currentScores = [];

async function getScores() {
  const snapshot = await getDocs(
    collection(db, "scores")
  );

  const scores = [];

  snapshot.forEach(item => {
    scores.push({
      id: item.id,
      ...item.data()
    });
  });

  scores.sort((a, b) => {
    const da = a.createdAt?.seconds || 0;
    const dbb = b.createdAt?.seconds || 0;

    return dbb - da;
  });

  return scores;
}

async function renderScores() {
  const rows = $("#scoreRows");

  rows.innerHTML =
    '<tr><td colspan="4">در حال خواندن نتایج... 🏆</td></tr>';

  try {
    currentScores = await getScores();

    if (!currentScores.length) {
      rows.innerHTML =
        '<tr><td colspan="4">هنوز نتیجه‌ای ثبت نشده.</td></tr>';

      $("#winnerBox").textContent =
        "هنوز مسابقه‌ای ثبت نشده.";

      return;
    }

    rows.innerHTML = currentScores.map((s, i) => {
      const amir = Number(s.amir || 0);
      const mehdi = Number(s.mehdi || 0);

      const result =
        amir === mehdi
          ? "مساوی"
          : amir > mehdi
            ? "امیرعباس"
            : "مهدی";

      return `
        <tr>
          <td>#${i + 1}</td>
          <td>${amir}</td>
          <td>${mehdi}</td>
          <td>${result}</td>
        </tr>
      `;
    }).join("");

    const amirTotal = currentScores.reduce(
      (n, s) => n + Number(s.amir || 0),
      0
    );

    const mehdiTotal = currentScores.reduce(
      (n, s) => n + Number(s.mehdi || 0),
      0
    );

    $("#winnerBox").textContent =
      amirTotal === mehdiTotal
        ? `مجموع: ${amirTotal} - ${mehdiTotal} | مساوی! 🤝`
        : `مجموع: ${amirTotal} - ${mehdiTotal} | ${
            amirTotal > mehdiTotal
              ? "امیرعباس"
              : "مهدی"
          } فعلاً امتیاز بیشتری دارد! 🏆`;

  } catch (error) {
    console.error("Firebase Scores Error:", error);

    rows.innerHTML = `
      <tr>
        <td colspan="4">
          ❌ دریافت نتایج از Firebase ناموفق بود.
        </td>
      </tr>
    `;
  }
}

$("#scoreForm").onsubmit = async e => {
  e.preventDefault();

  const amir = Number($("#amirScore").value);
  const mehdi = Number($("#mehdiScore").value);

  if (amir < 0 || mehdi < 0) {
    toast("امتیاز نمی‌تواند منفی باشد.");
    return;
  }

  try {
    await addDoc(
      collection(db, "scores"),
      {
        amir,
        mehdi,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      }
    );

    toast("نتیجه در Firebase ذخیره شد 🏆");

    e.target.reset();

    $("#amirScore").value = 0;
    $("#mehdiScore").value = 0;

    await renderScores();

  } catch (error) {
    console.error("Firebase Save Score Error:", error);

    toast(
      "ذخیره نشد؛ قوانین Firestore را بررسی کن."
    );
  }
};

$("#clearScores").onclick = async () => {
  if (!currentScores.length) {
    toast("نتیجه‌ای برای پاک کردن وجود ندارد.");
    return;
  }

  if (!confirm("همه نتایج پاک شوند؟")) {
    return;
  }

  try {
    for (const score of currentScores) {
      await deleteDoc(
        doc(db, "scores", score.id)
      );
    }

    toast("همه نتایج پاک شدند 🗑️");

    await renderScores();

  } catch (error) {
    console.error("Firebase Delete Scores Error:", error);

    toast(
      "پاک کردن انجام نشد؛ دسترسی Firebase را بررسی کن."
    );
  }
};

renderScores();


// ============================================================
// دربی دوستانه - Firebase
//
// Collection:
// derby
//
// Document:
// derby/main
//
// amir: 0
// mehdi: 0
// ============================================================

async function getDerby() {
  const ref = doc(db, "derby", "main");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const initial = {
      amir: 0,
      mehdi: 0
    };

    await setDoc(ref, initial);

    return initial;
  }

  return snapshot.data();
}

async function renderDerby() {
  try {
    const data = await getDerby();

    $("#derbyAmir").textContent =
      Number(data.amir || 0);

    $("#derbyMehdi").textContent =
      Number(data.mehdi || 0);

  } catch (error) {
    console.error("Firebase Derby Error:", error);

    $("#derbyAmir").textContent = "—";
    $("#derbyMehdi").textContent = "—";
  }
}

$("#addDerby").onclick = async () => {
  try {
    const ref = doc(db, "derby", "main");
    const snapshot = await getDoc(ref);

    const data = snapshot.exists()
      ? snapshot.data()
      : {
          amir: 0,
          mehdi: 0
        };

    const winner =
      Math.random() > 0.5
        ? "amir"
        : "mehdi";

    data[winner] =
      Number(data[winner] || 0) + 1;

    await setDoc(ref, {
      amir: Number(data.amir || 0),
      mehdi: Number(data.mehdi || 0)
    });

    await renderDerby();

    toast("امتیاز دربی ثبت شد ⚡");

  } catch (error) {
    console.error("Firebase Derby Save Error:", error);

    toast(
      "ثبت امتیاز انجام نشد؛ Firebase را بررسی کن."
    );
  }
};

renderDerby();


// ============================================================
// بازی‌های فوتبال - Firebase
//
// Collection:
// matches
//
// نمونه document:
// matches/match1
//
// home
// away
// date
// time
// result
// status
// durationMinutes
// ============================================================

let allMatches = [];
let currentTab = "finished";

async function getMatches() {
  const snapshot = await getDocs(
    collection(db, "matches")
  );

  const matches = [];

  snapshot.forEach(item => {
    matches.push({
      id: item.id,
      ...item.data()
    });
  });

  return matches;
}

function matchStatus(match) {
  if (!match.date || !match.time) {
    return match.status || "upcoming";
  }

  const start =
    new Date(`${match.date}T${match.time}:00`);

  if (Number.isNaN(start.getTime())) {
    return match.status || "upcoming";
  }

  const duration =
    Number(match.durationMinutes || 110);

  const end =
    new Date(start.getTime() + duration * 60000);

  const now = new Date();

  if (now < start) {
    return "upcoming";
  }

  if (now >= start && now <= end) {
    return "live";
  }

  return "finished";
}

function isSpecial(name) {
  return /استقلال|پرسپولیس/i.test(
    String(name || "")
  );
}

function teamHtml(name) {
  const value = String(name || "");

  const red =
    /پرسپولیس/.test(value);

  const blue =
    /استقلال/.test(value);

  return `
    <strong>
      ${escapeHtml(value)}
      ${
        red
          ? '<span class="team-label red">پرسپولیس</span>'
          : blue
            ? '<span class="team-label">استقلال</span>'
            : ""
      }
    </strong>
  `;
}

function countdown(start) {
  const diff =
    new Date(start).getTime() -
    Date.now();

  if (diff <= 0) {
    return "در حال شروع...";
  }

  const h =
    Math.floor(diff / 3600000);

  const m =
    Math.floor(
      (diff % 3600000) / 60000
    );

  const s =
    Math.floor(
      (diff % 60000) / 1000
    );

  return `شروع تا ${h}س ${m}د ${s}ث`;
}

function renderMatches() {
  const list =
    allMatches
      .map(m => ({
        ...m,
        autoStatus: matchStatus(m)
      }))
      .filter(
        m => m.autoStatus === currentTab
      );

  $("#matchesGrid").innerHTML =
    list.length
      ? list.map(m => {
          const special =
            isSpecial(m.home) ||
            isSpecial(m.away);

          const status =
            m.autoStatus;

          const statusText =
            status === "live"
              ? '<span class="live-dot"></span> زنده'
              : status === "finished"
                ? "پایان‌یافته"
                : "آینده";

          const middle =
            status === "upcoming"
              ? `
                <div
                  class="countdown"
                  data-start="${escapeHtml(
                    `${m.date}T${m.time}:00`
                  )}"
                >
                  ${countdown(
                    `${m.date}T${m.time}:00`
                  )}
                </div>
              `
              : `
                <div class="result">
                  ${escapeHtml(
                    m.result || "—"
                  )}
                </div>
              `;

          return `
            <article
              class="match-card ${
                special ? "special" : ""
              }"
            >
              <div class="match-top">
                <span>
                  ${escapeHtml(m.date || "")}
                  |
                  ${escapeHtml(m.time || "")}
                </span>

                <span
                  class="match-status ${status}"
                >
                  ${statusText}
                </span>
              </div>

              <div class="teams">
                ${teamHtml(m.home)}
                ${middle}
                ${teamHtml(m.away)}
              </div>
            </article>
          `;
        }).join("")
      : `
        <div class="loading-card">
          در این دسته بازی‌ای وجود ندارد.
        </div>
      `;
}

async function loadMatches() {
  try {
    allMatches =
      await getMatches();

    renderMatches();

  } catch (error) {
    console.error(
      "Firebase Matches Error:",
      error
    );

    $("#matchesGrid").innerHTML = `
      <div class="loading-card">
        ❌ بازی‌ها از Firebase بارگذاری نشدند.
      </div>
    `;
  }
}

$$(".tab").forEach(tab => {
  tab.onclick = () => {
    $$(".tab").forEach(x =>
      x.classList.remove("active")
    );

    tab.classList.add("active");

    currentTab =
      tab.dataset.tab;

    renderMatches();
  };
});

loadMatches();


// هر ثانیه شمارش معکوس و وضعیت بازی‌ها را تازه می‌کنیم.
setInterval(() => {
  if (allMatches.length) {
    renderMatches();
  }
}, 1000);


// ============================================================
// نظرسنجی - Firebase
//
// Collection:
// polls
//
// Document:
// polls/main
//
// fields:
// دقت: 0
// قدرت: 0
// ============================================================

async function getPoll() {
  const ref =
    doc(db, "polls", "main");

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists()) {
    const initial = {
      دقت: 0,
      قدرت: 0
    };

    await setDoc(ref, initial);

    return initial;
  }

  return snapshot.data();
}

async function renderPoll() {
  try {
    const poll =
      await getPoll();

    $("#pollResult").textContent =
      `دقت: ${Number(poll["دقت"] || 0)} | قدرت: ${Number(poll["قدرت"] || 0)}`;

  } catch (error) {
    console.error(
      "Firebase Poll Error:",
      error
    );

    $("#pollResult").textContent =
      "نظرسنجی فعلاً در دسترس نیست.";
  }
}

$$("[data-poll]").forEach(btn => {
  btn.onclick = async () => {
    const option =
      btn.dataset.poll;

    try {
      const ref =
        doc(db, "polls", "main");

      const snapshot =
        await getDoc(ref);

      const poll =
        snapshot.exists()
          ? snapshot.data()
          : {
              دقت: 0,
              قدرت: 0
            };

      poll[option] =
        Number(poll[option] || 0) + 1;

      await setDoc(ref, {
        دقت: Number(poll["دقت"] || 0),
        قدرت: Number(poll["قدرت"] || 0)
      });

      await renderPoll();

      toast("رأی تو ثبت شد! 📊");

    } catch (error) {
      console.error(
        "Firebase Poll Save Error:",
        error
      );

      toast(
        "رأی ثبت نشد؛ اتصال Firebase را بررسی کن."
      );
    }
  };
});

renderPoll();


// ============================================================
// تماس
// ============================================================

$("#copyContact").onclick = async () => {
  const text =
    "سلام! برای سایت «توی دروازه» یک پیشنهاد دارم.";

  try {
    await navigator.clipboard.writeText(text);

    toast("متن تماس کپی شد 📋");

  } catch {
    toast(text);
  }
};


// ============================================================
// Toast
// ============================================================

function toast(message) {
  const t = $("#toast");

  t.textContent = message;

  t.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer =
    setTimeout(() => {
      t.classList.remove("show");
    }, 2300);
}


// ============================================================
// جلوگیری از HTML تزریقی
// ============================================================

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}


// ============================================================
// اتصال زنده اخبار
// اگر داده‌ای در Firestore تغییر کند، سایت خودکار تازه می‌شود.
// ============================================================

try {
  onSnapshot(
    collection(db, "news"),
    () => {
      renderNews();
    },
    error => {
      console.warn(
        "Realtime news listener:",
        error
      );
    }
  );
} catch (error) {
  console.warn(
    "Realtime news listener unavailable:",
    error
  );
}


// ============================================================
// اتصال زنده امتیازات
// ============================================================

try {
  onSnapshot(
    collection(db, "scores"),
    () => {
      renderScores();
    },
    error => {
      console.warn(
        "Realtime scores listener:",
        error
      );
    }
  );
} catch (error) {
  console.warn(
    "Realtime scores listener unavailable:",
    error
  );
}


// ============================================================
// پایان
// ============================================================

console.log(
  "⚽ توی دروازه | Firebase connected"
);
