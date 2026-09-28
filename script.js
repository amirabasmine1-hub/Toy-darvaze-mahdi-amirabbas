// ============================================
// توی دروازه | JavaScript اصلی سایت
// همه‌چیز بدون سرور اجرا می‌شود و برای GitHub Pages مناسب است.
// ============================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// ---------- منوی موبایل ----------
$("#menuToggle").addEventListener("click", () => {
  const nav = $("#mainNav");
  nav.classList.toggle("open");
});
$$(".nav a").forEach(a => a.addEventListener("click", () => $("#mainNav").classList.remove("open")));

// ---------- نوار پیشرفت ----------
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#scrollProgress").style.width = `${(scrollY / max) * 100}%`;
});

// ---------- انیمیشن ورود کارت‌ها ----------
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, {threshold: .12});
$$(".reveal").forEach(el => observer.observe(el));

// ---------- انتخاب طرفداری ----------
const fanModal = $("#fanModal");
function updateFanUI() {
  const team = localStorage.getItem("favoriteTeam");
  if (!team) {
    $("#fanText").textContent = "هنوز تیم مورد علاقه‌ات را انتخاب نکردی ⚽";
    return;
  }
  $("#fanText").textContent = `تو طرفدار ${team} هستی! 🎉`;
  document.documentElement.style.setProperty("--fan",
    team === "استقلال" ? "#1597e5" : team === "پرسپولیس" ? "#e85c78" : "#36aeda"
  );
}
$("#fanButton").onclick = () => fanModal.classList.add("show");
$("#closeFan").onclick = () => fanModal.classList.remove("show");
fanModal.addEventListener("click", e => { if(e.target === fanModal) fanModal.classList.remove("show"); });
$$(".team-options button").forEach(btn => btn.addEventListener("click", () => {
  localStorage.setItem("favoriteTeam", btn.dataset.team);
  updateFanUI();
  fanModal.classList.remove("show");
  toast(`انتخاب شد: ${btn.dataset.team}`);
}));
updateFanUI();

// ---------- شوت ذهنی ----------
$$(".choice-btn").forEach(btn => btn.addEventListener("click", () => {
  const answer = btn.dataset.choice;
  const lucky = Math.random() > .45;
  $("#predictionText").textContent = lucky
    ? `🎉 حس ششم میگه «${answer}»! حالا برو واقعاً شوت بزن!`
    : `😄 این بار شانسی نبود؛ ولی شوت واقعی هنوز مونده!`;
}));

// ---------- اخبار ----------
// برای اتصال به Firebase/Supabase، همین تابع را جایگزین کنید.
// خروجی تابع باید آرایه‌ای مثل [{title,date,text}] باشد.
async function getNews() {
  const response = await fetch("./news.json", {cache: "no-store"});
  if (!response.ok) throw new Error("news.json پیدا نشد");
  return response.json();

  // نمونه برای آینده:
  // const { data } = await supabase.from("news").select("*").order("date", {ascending:false});
  // return data;
}
async function renderNews() {
  const grid = $("#newsGrid");
  grid.innerHTML = '<div class="loading-card">در حال خواندن اخبار... ⚽</div>';
  try {
    const news = await getNews();
    grid.innerHTML = news.map(item => `
      <article class="news-card reveal visible">
        <time>${escapeHtml(item.date)}</time>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join("");
  } catch (error) {
    grid.innerHTML = '<div class="loading-card">اخبار بارگذاری نشد. مطمئن شو سایت از طریق GitHub Pages باز شده است.</div>';
    console.error(error);
  }
}
$("#refreshNews").onclick = renderNews;
renderNews();

// ---------- تاریخ شمسی و مدرسه ----------
const weekdayNames = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
const jalaliMonths = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

function jalaliDate(date) {
  // تبدیل دقیق میلادی به شمسی با الگوریتم استاندارد جلالی
  const gy = date.getFullYear(), gm = date.getMonth()+1, gd = date.getDate();
  const gdm = [0,31,59,90,120,151,181,212,243,273,304,334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + (365*gy) + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) +
    Math.floor((gy2+399)/400) + gd + gdm[gm-1];
  let jy = -1595 + 33*Math.floor(days/12053);
  days %= 12053;
  jy += 4*Math.floor(days/1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days-1)/365);
    days = (days-1)%365;
  }
  let jm = days < 186 ? 1 + Math.floor(days/31) : 7 + Math.floor((days-186)/30);
  let jd = 1 + (days < 186 ? days%31 : (days-186)%30);
  return {year: jy, month: jm, day: jd};
}
function updateSchool() {
  const now = new Date();
  const j = jalaliDate(now);
  const day = now.getDay(); // 0 یکشنبه ... 6 شنبه
  let status, icon, message, cls;
  if (day >= 6 || day === 0) { // شنبه تا چهارشنبه مدرسه؛ پنجشنبه/جمعه تعطیل
    // شنبه = 6، یکشنبه = 0، دوشنبه = 1، سه‌شنبه = 2، چهارشنبه = 3
    if (day === 6 || day <= 3) {
      status = "مدرسه!"; icon = "🏫"; message = "وقتشه بریم مدرسه و بعدش برای شوت آماده شویم!"; cls = "school-day";
    } else {
      status = day === 4 ? "استراحت و تعطیل!" : "تعطیل!"; icon = "🎉"; message = "امروز وقت استراحت و بازی بیشتره!"; cls = "holiday";
    }
  } else { status = "تعطیل!"; icon = "🎉"; message = "امروز تعطیله؛ وقت خوش‌گذرونی!"; cls = "holiday"; }

  // اصلاح دقیق: پنجشنبه day=4 و جمعه day=5
  if (day >= 0 && day <= 3 || day === 6) {
    status = "مدرسه!"; icon = "🏫"; message = "امروز مدرسه داریم؛ بعدش وقت بازی و شوت!"; cls = "school-day";
  } else if (day === 4) {
    status = "استراحت و تعطیل!"; icon = "😎"; message = "پنجشنبه‌ست؛ یک استراحت حسابی!"; cls = "rest-day";
  } else {
    status = "تعطیل!"; icon = "🎉"; message = "جمعه‌ست؛ امروز تعطیله!"; cls = "holiday";
  }

  $("#weekdayName").textContent = weekdayNames[day];
  $("#todayStatus").textContent = status;
  $("#todayDate").textContent = `${j.day} ${jalaliMonths[j.month-1]} ${j.year}`;
  $("#todayMessage").textContent = message;
  $("#todayIcon").textContent = icon;
  $("#todayCard").className = `today-card reveal visible ${cls}`;
}
function updateClock() {
  const now = new Date();
  $("#liveClock").textContent = now.toLocaleTimeString("fa-IR", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
}
updateSchool(); updateClock(); setInterval(updateSchool, 60000); setInterval(updateClock, 1000);

// ---------- امتیازات توی دروازه ----------
const SCORE_KEY = "toyDarvazeScores";
function getScores(){ return JSON.parse(localStorage.getItem(SCORE_KEY) || "[]"); }
function saveScores(scores){ localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); }
function renderScores(){
  const rows = $("#scoreRows"), scores = getScores();
  if (!scores.length) {
    rows.innerHTML = '<tr><td colspan="4">هنوز نتیجه‌ای ثبت نشده.</td></tr>';
    $("#winnerBox").textContent = "هنوز مسابقه‌ای ثبت نشده.";
    return;
  }
  rows.innerHTML = scores.map((s,i) => `<tr><td>#${i+1}</td><td>${s.amir}</td><td>${s.mehdi}</td><td>${s.amir===s.mehdi?"مساوی":s.amir>s.mehdi?"امیرعباس":"مهدی"}</td></tr>`).join("");
  const a=scores.reduce((n,s)=>n+Number(s.amir),0), m=scores.reduce((n,s)=>n+Number(s.mehdi),0);
  $("#winnerBox").textContent = a===m ? `مجموع: ${a} - ${m} | مساوی! 🤝` : `مجموع: ${a} - ${m} | ${a>m?"امیرعباس":"مهدی"} فعلاً امتیاز بیشتری دارد! 🏆`;
}
$("#scoreForm").onsubmit = e => {
  e.preventDefault();
  const scores=getScores();
  scores.unshift({amir:Number($("#amirScore").value), mehdi:Number($("#mehdiScore").value), date:new Date().toISOString()});
  saveScores(scores); renderScores(); toast("نتیجه ذخیره شد 🏆"); e.target.reset();
};
$("#clearScores").onclick = () => {
  if(confirm("همه نتایج پاک شوند؟")) { localStorage.removeItem(SCORE_KEY); renderScores(); }
};
renderScores();

// ---------- دربی دوستانه ----------
const DERBY_KEY = "toyDarvazeDerby";
function renderDerby(){ const x=JSON.parse(localStorage.getItem(DERBY_KEY)||'{"amir":0,"mehdi":0}'); $("#derbyAmir").textContent=x.amir; $("#derbyMehdi").textContent=x.mehdi; }
$("#addDerby").onclick=()=>{const x=JSON.parse(localStorage.getItem(DERBY_KEY)||'{"amir":0,"mehdi":0}'); x[Math.random()>.5?"amir":"mehdi"]++; localStorage.setItem(DERBY_KEY,JSON.stringify(x)); renderDerby();};
renderDerby();

// ---------- بازی‌های فوتبال ----------
let allMatches = [], currentTab = "finished";
async function getMatches(){
  const response=await fetch("./matches.json",{cache:"no-store"});
  if(!response.ok) throw new Error("matches.json پیدا نشد");
  return response.json();
}
function matchStatus(match){
  // وضعیت پایه از فایل خوانده می‌شود، اما اگر زمان معتبر باشد، وضعیت بر اساس ساعت فعلی هم محاسبه می‌شود.
  if(!match.date || !match.time) return match.status;
  const start = new Date(`${match.date}T${match.time}:00`);
  if(Number.isNaN(start.getTime())) return match.status;
  const end = new Date(start.getTime() + (match.durationMinutes || 110)*60000);
  const now = new Date();
  if(now < start) return "upcoming";
  if(now >= start && now <= end) return "live";
  return "finished";
}
function isSpecial(name){ return /استقلال|پرسپولیس/i.test(name); }
function teamHtml(name){
  const red=/پرسپولیس/.test(name), blue=/استقلال/.test(name);
  return `<strong>${escapeHtml(name)}${red?'<span class="team-label red">پرسپولیس</span>':blue?'<span class="team-label">استقلال</span>':''}</strong>`;
}
function countdown(start){
  const diff=new Date(start).getTime()-Date.now();
  if(diff<=0) return "در حال شروع...";
  const h=Math.floor(diff/3600000), m=Math.floor(diff%3600000/60000), s=Math.floor(diff%60000/1000);
  return `شروع تا ${h}س ${m}د ${s}ث`;
}
function renderMatches(){
  const list=allMatches.map(m=>({...m,autoStatus:matchStatus(m)})).filter(m=>m.autoStatus===currentTab);
  $("#matchesGrid").innerHTML=list.length?list.map(m=>{
    const special=isSpecial(m.home)||isSpecial(m.away);
    const status=m.autoStatus;
    const statusText=status==="live"?'<span class="live-dot"></span> زنده':status==="finished"?"پایان‌یافته":"آینده";
    const middle=status==="upcoming"?`<div class="countdown" data-start="${m.date}T${m.time}:00">${countdown(`${m.date}T${m.time}:00`)}</div>`:`<div class="result">${escapeHtml(m.result||"—")}</div>`;
    return `<article class="match-card ${special?"special":""}">
      <div class="match-top"><span>${escapeHtml(m.date)} | ${escapeHtml(m.time)}</span><span class="match-status ${status}">${statusText}</span></div>
      <div class="teams">${teamHtml(m.home)}${middle}${teamHtml(m.away)}</div>
    </article>`;
  }).join(""):'<div class="loading-card">در این دسته بازی‌ای وجود ندارد.</div>';
}
async function loadMatches(){
  try { allMatches=await getMatches(); renderMatches(); }
  catch(e){ $("#matchesGrid").innerHTML='<div class="loading-card">بازی‌ها بارگذاری نشدند.</div>'; console.error(e); }
}
$$(".tab").forEach(tab=>tab.onclick=()=>{ $$(".tab").forEach(x=>x.classList.remove("active")); tab.classList.add("active"); currentTab=tab.dataset.tab; renderMatches(); });
loadMatches();
setInterval(()=>{ if(allMatches.length){renderMatches();}},1000);

// ---------- نظرسنجی ----------
function renderPoll(){
  const p=JSON.parse(localStorage.getItem("toyPoll")||'{"دقت":0,"قدرت":0}');
  $("#pollResult").textContent=`دقت: ${p["دقت"]} | قدرت: ${p["قدرت"]}`;
}
$$("[data-poll]").forEach(btn=>btn.onclick=()=>{const p=JSON.parse(localStorage.getItem("toyPoll")||'{"دقت":0,"قدرت":0}');p[btn.dataset.poll]++;localStorage.setItem("toyPoll",JSON.stringify(p));renderPoll();});
renderPoll();

// ---------- تماس ----------
$("#copyContact").onclick=async()=>{const text="سلام! برای سایت «توی دروازه» یک پیشنهاد دارم.";try{await navigator.clipboard.writeText(text);toast("متن تماس کپی شد 📋")}catch{toast(text)}};

// ---------- ابزارهای کمکی ----------
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),2300);}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
