import { demoEmployee, courses as seedCourses, libraryItems, news, initialAttempts, initialTestSettings, employees, integrationSources } from "./data.js";
import { adapters } from "./adapters.js";

const STORE_KEY = "ruby-portal-demo-v1";
const defaultSettings = [
  { ...initialTestSettings },
  { ...initialTestSettings, title: "Знание продукта", attempts: 2, countedRule: "last", passScore: 75, bonus: 30 },
  { ...initialTestSettings, title: "Безопасность на рабочем месте", attempts: 3, countedRule: "best", passScore: 80, bonus: 40 },
];
const motivationDefaults = {
  balance: 620, ruleVersion: 1,
  rules: [
    { id: "course", event: "Курс завершён", points: 50, enabled: true, version: 1 },
    { id: "test", event: "Тест сдан с первой попытки", points: 30, enabled: true, version: 1 },
    { id: "task", event: "Рабочее задание выполнено", points: 20, enabled: true, version: 1 },
  ],
  ledger: [
    { id: "M-1003", date: "2026-11-08", reason: "Знание продукта · тест сдан", delta: 30, balance: 620, ruleVersion: 1 },
    { id: "M-1002", date: "2026-11-06", reason: "Маршрут адаптации · завершён этап", delta: 50, balance: 590, ruleVersion: 1 },
    { id: "M-1001", date: "2026-11-02", reason: "Стартовый баланс демо", delta: 540, balance: 540, ruleVersion: 1 },
  ],
  rewards: [
    { id: "R-1", title: "Термокружка RubyMarket", category: "Товары", cost: 450, stock: 4, active: true, icon: "☕" },
    { id: "R-2", title: "Подарочная карта", category: "Сертификаты", cost: 900, stock: 2, active: true, icon: "🎁" },
    { id: "R-3", title: "Цифровой бейдж «Знаток сервиса»", category: "Цифровые награды", cost: 120, stock: 0, active: true, icon: "✦" },
  ],
  auctions: [
    { id: "A-1", title: "Набор RubyMarket для команды", currentBid: 180, minStep: 20, stock: 1, ends: "2026-11-30", leader: "Участник № 08", active: true, icon: "🏆" },
    { id: "A-2", title: "Дополнительный выходной по согласованию", currentBid: 320, minStep: 40, stock: 1, ends: "2026-12-05", leader: "Участник № 14", active: true, icon: "🌟" },
  ], bids: [], redemptions: [],
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return {
      signedIn: false,
      view: "home",
      adminTab: "tests",
      role: "employee",
      courses: structuredClone(seedCourses),
      attempts: structuredClone(initialAttempts),
      testSettings: structuredClone(defaultSettings),
      assignmentRules: [{ event: "Приём сотрудника", course: "Добро пожаловать в RubyMarket", audience: "По должности и подразделению", dueDays: 14, enabled: true }, { event: "Перевод сотрудника", course: "Сервис, который запоминают", audience: "Новая должность или магазин", dueDays: 10, enabled: true }, { event: "Регулярный цикл", course: "Знание продукта", audience: "Действующие сотрудники", dueDays: 30, enabled: true }],
      notifications: { internal: true, push: true },
      avatar: demoEmployee.avatar,
      orgs: ["Управляющая компания", "Магазины Астана", "Магазины Караганда"],
      customRoles: ["Сотрудник", "Управляющий магазином", "Менеджер обучения", "Администратор портала"],
      ...saved,
    };
  } catch {
    return { signedIn: false, view: "home", adminTab: "tests", role: "employee", courses: structuredClone(seedCourses), attempts: structuredClone(initialAttempts), testSettings: structuredClone(defaultSettings), assignmentRules: [{ event: "Приём сотрудника", course: "Добро пожаловать в RubyMarket", audience: "По должности и подразделению", dueDays: 14, enabled: true }, { event: "Перевод сотрудника", course: "Сервис, который запоминают", audience: "Новая должность или магазин", dueDays: 10, enabled: true }, { event: "Регулярный цикл", course: "Знание продукта", audience: "Действующие сотрудники", dueDays: 30, enabled: true }], notifications: { internal: true, push: true }, avatar: demoEmployee.avatar, orgs: ["Управляющая компания", "Магазины Астана", "Магазины Караганда"], customRoles: ["Сотрудник", "Управляющий магазином", "Менеджер обучения", "Администратор портала"] };
  }
}

const state = loadState();
state.motivation = { ...structuredClone(motivationDefaults), ...(state.motivation || {}) };
for (const key of ["rules", "ledger", "rewards", "auctions", "bids", "redemptions"]) state.motivation[key] ||= structuredClone(motivationDefaults[key]);
const app = document.querySelector("#app");
const avatarOptions = [
  ["ruby", "💎", "Рубин"], ["star", "⭐", "Звезда"], ["leaf", "🌿", "Лист"], ["spark", "✨", "Искра"],
];

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function isManager() { return ["manager", "training", "admin"].includes(state.role); }
function canAdmin() { return ["training", "admin"].includes(state.role); }
function roleLabel() { return ({ employee: "Сотрудник", manager: "Управляющий магазином", training: "Менеджер обучения", admin: "Администратор портала" })[state.role] || "Сотрудник"; }
function toast(message) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div"); el.className = "toast"; el.textContent = message; document.body.append(el);
  setTimeout(() => el.remove(), 3000);
}
function modal(title, body, actions = "") {
  document.querySelector(".modal-backdrop")?.remove();
  const holder = document.createElement("div"); holder.className = "modal-backdrop";
  holder.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h2>${esc(title)}</h2><button class="close-btn" data-action="close-modal" aria-label="Закрыть">×</button></div><div class="modal-content">${body}</div>${actions ? `<div class="form-actions">${actions}</div>` : ""}</section>`;
  holder.addEventListener("click", (e) => { if (e.target === holder) holder.remove(); });
  document.body.append(holder);
}
function pageTitle(view) {
  return ({ home: ["Личный кабинет", "Всё важное — в одном месте"], learning: ["Моё обучение", "Назначенные курсы, маршруты и результаты"], library: ["Библиотека знаний", "Материалы и инструкции для работы"], news: ["Новости компании", "Обновления RubyMarket для вашей команды"], motivation: ["Мотивация", "Баллы, призы и соревнования RubyMarket"], reports: ["Аналитика обучения", "Прогресс команды в пределах вашей организационной области"], admin: ["Управление порталом", "Настройки контента, тестов, ролей и интеграций"] })[view] || ["Портал", ""];
}
function navButton(view, icon, label) { return `<button class="nav-button ${state.view === view ? "active" : ""}" data-view="${view}"><span class="ico">${icon}</span>${label}</button>`; }

function render() {
  if (!state.signedIn) { renderLogin(); return; }
  const [title, subtitle] = pageTitle(state.view);
  app.innerHTML = `<div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="brand"><span class="brand-gem">R</span><span><strong>RUBYMARKET</strong><small>пространство развития</small></span></div>
      <div class="nav-caption">Мой портал</div>
      <nav class="nav" aria-label="Основная навигация">
        ${navButton("home", "⌂", "Главная")}${navButton("learning", "▣", "Моё обучение")}${navButton("library", "▤", "Библиотека")}${navButton("news", "◈", "Новости")}${navButton("motivation", "✦", "Мотивация")}
        ${isManager() ? navButton("reports", "▥", "Аналитика команды") : ""}
        ${canAdmin() ? navButton("admin", "⚙", "Управление") : ""}
      </nav>
      <div class="sidebar-bottom"><div class="next-module"><small>Ваш баланс</small><h3>${state.motivation.balance.toLocaleString("ru-RU")} баллов</h3><p>Копите баллы за обучение и обменивайте их на награды.</p></div></div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="top-actions"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Меню">☰</button><div class="crumb">RubyMarket <span>›</span> <b>${esc(title)}</b></div></div>
        <div class="top-actions"><span class="demo-pill">ДЕМО · данные тестовые</span><button class="icon-btn" data-action="notifications" aria-label="Уведомления">♧<span class="dot"></span></button>
          <select class="select role-switch" aria-label="Демонстрационная роль" data-action="role-switch"><option value="employee" ${state.role === "employee" ? "selected" : ""}>Сотрудник</option><option value="manager" ${state.role === "manager" ? "selected" : ""}>Управляющий</option><option value="training" ${state.role === "training" ? "selected" : ""}>Менеджер обучения</option><option value="admin" ${state.role === "admin" ? "selected" : ""}>Администратор</option></select>
          <button class="user-menu" data-action="profile"><span class="avatar">${demoEmployee.initials}</span><span><strong>${esc(demoEmployee.name)}</strong><small>${esc(roleLabel())}</small></span></button></div>
      </header>
      <section class="content"><div class="page-head"><div><div class="eyebrow">Личный кабинет сотрудника</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${state.view === "home" ? `<span class="date-label">Сегодня · ${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>` : ""}</div>
        ${renderView()}
      </section>
    </main>
  </div>`;
}

function renderLogin() {
  app.innerHTML = `<main class="login-screen"><section class="login-card"><div class="brand"><span class="brand-gem">R</span><span><strong>RUBYMARKET</strong><small>пространство развития</small></span></div><div class="eyebrow">Портал сотрудника</div><h1>Добро пожаловать</h1><p>Войдите корпоративной учётной записью, чтобы открыть личный кабинет, обучение и библиотеку знаний.</p><button class="btn sso-button" data-action="sign-in">⌘&nbsp; Войти через корпоративную учётную запись</button><div class="login-note">Единый вход избавляет от отдельного пароля портала.<br>В рабочей версии подключается корпоративный провайдер после согласования с ИТ.</div><div class="login-demo-label">Демонстрационный режим · вход без передачи учётных данных</div></section></main>`;
}

function renderView() {
  switch (state.view) {
    case "learning": return renderLearning();
    case "library": return renderLibrary();
    case "news": return renderNews();
    case "motivation": return renderMotivation();
    case "reports": return renderReports();
    case "admin": return renderAdmin();
    default: return renderHome();
  }
}

function renderHome() {
  const pending = state.courses.filter(c => c.progress < 100);
  const complete = state.courses.filter(c => c.progress === 100).length;
  return `<section class="hero"><div class="hero-copy"><div class="hero-tag">✦ Пространство развития RubyMarket</div><h2>Расти в своём ритме.<br>Открывай новые возможности.</h2><p>Твои обучения, материалы и новости команды собраны в личном кабинете.</p><button class="btn btn-gold" data-view="learning">Продолжить обучение <span>→</span></button></div><div class="hero-gem"><span>R</span></div></section>
    <section class="grid grid-4">
      <div class="stat-card"><div><div class="stat-label">Назначено тем</div><div class="stat-value">${state.courses.length}</div><div class="stat-note">${pending.length} требуют внимания</div></div><div class="stat-icon">▣</div></div>
      <div class="stat-card"><div><div class="stat-label">Завершено</div><div class="stat-value">${complete}</div><div class="stat-note">Курсы и маршруты</div></div><div class="stat-icon">✓</div></div>
      <div class="stat-card"><div><div class="stat-label">Стаж в компании</div><div class="stat-value">${demoEmployee.tenureMonths}<span style="font-size:13px"> мес.</span></div><div class="stat-note">Рады, что ты с нами</div></div><div class="stat-icon">✦</div></div>
      <div class="stat-card"><div><div class="stat-label">Библиотека знаний</div><div class="stat-value">${libraryItems.length}</div><div class="stat-note">Материалы и инструкции</div></div><div class="stat-icon">▤</div></div>
    </section>
    <div class="section-title"><h2>Мой профиль</h2><button class="text-link" data-action="profile">Настроить аватар →</button></div>
    <section class="card profile-card"><div class="profile-big avatar-${esc(state.avatar)}">${demoEmployee.initials}</div><div class="profile-main"><h3>${esc(demoEmployee.name)}</h3><p>${esc(demoEmployee.role)} · ${esc(demoEmployee.store)}</p></div><div class="profile-meta"><div class="meta-item"><small>Должность</small><b>${esc(demoEmployee.role)}</b></div><div class="meta-item"><small>Магазин</small><b>Центральный офис</b></div><div class="meta-item"><small>Стаж</small><b>${demoEmployee.tenureMonths} месяца</b></div></div></section>
    <div class="section-title"><h2>Назначенные темы обучения</h2><button class="text-link" data-view="learning">Все обучения →</button></div>
    <section class="grid grid-3">${pending.slice(0,3).map(courseCard).join("")}</section>
    <div class="section-title"><h2>Последние новости</h2><button class="text-link" data-view="news">Все новости →</button></div>
    <section class="grid grid-3">${news.map(newsCard).join("")}</section>
    <div class="section-title"><h2>Библиотека знаний</h2><button class="text-link" data-view="library">Перейти в библиотеку →</button></div>
    <div class="library-shortcut"><div><h3>Найди ответ за пару минут</h3><p>Инструкции, видео и полезные материалы для работы в одном месте.</p></div><button class="btn btn-outline" data-view="library">Открыть библиотеку →</button></div>
    <div class="section-title"><h2>Модули личного кабинета</h2></div><section class="grid grid-2"><article class="card module-card"><div class="module-icon">◷</div><div><h3>Отпускные дни</h3><p>Подключение данных из 1С или другого согласованного источника — отдельный этап.</p></div><span class="status warn">ПОЗЖЕ</span></article><article class="card module-card"><div class="module-icon">▧</div><div><h3>Закреплённые активы</h3><p>Сведения об основных средствах появятся после согласования обмена с ИТ.</p></div><span class="status warn">ПОЗЖЕ</span></article></section>`;
}

function courseCard(course) {
  return `<article class="card course-card"><div class="course-cover ${esc(course.accent)}"><span class="course-type">${esc(course.kind)}</span><span class="cover-mark">✦</span></div><div class="course-body"><h3>${esc(course.title)}</h3><p>${esc(course.description)}</p><div class="progress" aria-label="Прогресс ${course.progress}%"><span style="width:${course.progress}%"></span></div><div class="course-foot"><span>${course.progress}% · ${course.lessons} тем</span><span>${esc(course.due)}</span></div><div style="margin-top:13px"><button class="small-btn" data-action="open-course" data-id="${esc(course.id)}">Открыть курс →</button></div></div></article>`;
}

function newsCard(item) { return `<article class="card info-card"><div class="news-row"><div class="news-icon">${item.tone === "wine" ? "◈" : item.tone === "peach" ? "▣" : "✦"}</div><div><div class="news-meta">${esc(item.category)} · ${esc(item.date)}</div><h4>${esc(item.title)}</h4><p>${esc(item.text)}</p></div></div></article>`; }

function renderLearning() {
  const finished = state.courses.filter(c => c.progress === 100).length;
  return `<div class="grid grid-3"><div class="stat-card"><div><div class="stat-label">В маршрутах</div><div class="stat-value">${state.courses.length}</div><div class="stat-note">Актуальные назначения</div></div><div class="stat-icon">▣</div></div><div class="stat-card"><div><div class="stat-label">Завершено</div><div class="stat-value">${finished}</div><div class="stat-note">В текущем списке</div></div><div class="stat-icon">✓</div></div><div class="stat-card"><div><div class="stat-label">Ближайший срок</div><div class="stat-value" style="font-size:20px">18 ноября</div><div class="stat-note">Добро пожаловать в RubyMarket</div></div><div class="stat-icon">◷</div></div></div>
    <div class="section-title"><h2>Мои маршруты и обучения</h2><span class="status ok">Адаптация + регулярное обучение</span></div><section class="grid grid-3">${state.courses.map(courseCard).join("")}</section>
    <div class="section-title"><h2>История тестирования</h2><button class="text-link" data-action="open-my-results">Мои результаты →</button></div><div class="card info-card"><p style="font-size:11px;color:var(--muted);margin:0">Результаты сохраняются по каждой попытке. В рабочей версии правила повторного прохождения, зачёта и бонусов задаются менеджером обучения.</p></div>`;
}

function renderLibrary(query = "", category = state.libraryCategory || "Все") {
  const cats = ["Все", ...new Set(libraryItems.map(x => x.category))];
  const list = libraryItems.filter(x => (category === "Все" || x.category === category) && `${x.title} ${x.category}`.toLowerCase().includes(query.toLowerCase()));
  return `<div class="toolbar"><label class="search-field"><span>⌕</span><input class="field library-search" placeholder="Поиск по материалам" value="${esc(query)}" /></label><span class="status">${list.length} материалов</span></div><div class="filter-chips">${cats.map(c => `<button class="chip ${category === c ? "active" : ""}" data-action="library-category" data-category="${esc(c)}">${esc(c)}</button>`).join("")}</div><section class="grid grid-3">${list.map(item => `<article class="card info-card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="module-icon">${item.icon}</div><span class="status">${esc(item.category)}</span></div><h3 style="margin-top:15px;margin-bottom:7px">${esc(item.title)}</h3><p style="font-size:11px;color:var(--muted);margin:0">${esc(item.type)}</p><div class="course-foot"><span>${esc(item.updated)}</span><button class="text-link" data-action="open-library-item" data-title="${esc(item.title)}">Открыть →</button></div></article>`).join("") || `<div class="empty">Ничего не найдено. Попробуйте изменить запрос.</div>`}</section>`;
}

function renderNews() { return `<section class="grid grid-2">${news.map(newsCard).join("")}</section><div class="section-title"><h2>Настройки уведомлений</h2><button class="text-link" data-action="notifications">Управлять каналами →</button></div><div class="card info-card"><p style="font-size:11px;color:var(--muted);margin:0">Уведомления доступны внутри портала и через push на телефон. Сотрудник управляет каналами в настройках.</p></div>`; }

function renderMotivation() {
  const m=state.motivation;
  const tab=state.motivationTab||"store";
  const tabs=[["store","Магазин призов"],["auction","Аукцион"],["history","История баллов"],...(canAdmin()?[["rules","Правила и остатки"]]:[])];
  const tabBody=tab==="auction"?renderAuctions():tab==="history"?renderPointsHistory():tab==="rules"&&canAdmin()?renderMotivationAdmin():renderRewardStore();
  return `<section class="hero motivation-hero"><div class="hero-copy"><div class="hero-tag">✦ МОТИВАЦИЯ RUBYMARKET</div><h2>Ваши достижения превращаются в награды</h2><p>Получайте баллы за обучение и рабочие активности. Выбирайте призы или участвуйте в аукционе.</p></div><div class="motivation-balance"><small>ДОСТУПНО БАЛЛОВ</small><strong>${m.balance.toLocaleString("ru-RU")}</strong><span>Баллы демо-портала</span></div></section>
    <div class="tabs motivation-tabs">${tabs.map(([id,label])=>`<button class="${tab===id?"active":""}" data-action="motivation-tab" data-tab="${id}">${label}</button>`).join("")}</div>${tabBody}`;
}

function renderRewardStore(){const items=state.motivation.rewards.filter(r=>r.active);return `<div class="section-title"><h2>Каталог наград</h2><span class="status ok">${items.length} доступны</span></div><section class="grid grid-3">${items.map(r=>`<article class="card reward-card"><div class="reward-icon">${esc(r.icon)}</div><span class="status">${esc(r.category)}</span><h3>${esc(r.title)}</h3><div class="reward-meta"><b>${r.cost.toLocaleString("ru-RU")} баллов</b><span>${r.stock>0?`Остаток: ${r.stock}`:"Нет в наличии"}</span></div><button class="btn ${r.stock<=0?"btn-outline":""}" data-action="redeem-reward" data-id="${esc(r.id)}" ${r.stock<=0?"disabled":""}>${r.stock>0?"Обменять баллы":"Ожидается пополнение"}</button></article>`).join("")||`<div class="empty">Каталог пока пуст.</div>`}</section><div class="notice-bar">Обмен спишет баллы и уменьшит остаток. В демо заявка фиксируется в истории; реальную выдачу подтверждает ответственный сотрудник.</div>`;}

function renderAuctions(){const items=state.motivation.auctions.filter(a=>a.active);return `<div class="section-title"><h2>Активные аукционы</h2><span class="status warn">Ставка списывается только при победе</span></div><section class="grid grid-2">${items.map(a=>`<article class="card auction-card"><div class="auction-icon">${esc(a.icon)}</div><div class="auction-end">До ${esc(a.ends)}</div><h3>${esc(a.title)}</h3><p>Текущая ставка · <b>${a.currentBid.toLocaleString("ru-RU")} баллов</b></p><p>Шаг ставки · ${a.minStep} баллов · Лидер: ${esc(a.leader||"Пока нет ставок")}</p><button class="btn" data-action="bid-auction" data-id="${esc(a.id)}" ${state.motivation.balance<a.currentBid+a.minStep?"disabled":""}>Сделать ставку от ${(a.currentBid+a.minStep).toLocaleString("ru-RU")}</button></article>`).join("")||`<div class="empty">Активных аукционов нет.</div>`}</section>`;}

function renderPointsHistory(){const rows=state.motivation.ledger;return `<div class="section-title"><h2>История операций</h2><span class="status">${rows.length} записей</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Дата</th><th>Операция</th><th>Баллы</th><th>Версия правила</th><th>Остаток после операции</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td class="primary">${esc(x.reason)}</td><td class="${x.delta<0?"points-out":"points-in"}">${x.delta>0?"+":""}${x.delta}</td><td>${x.ruleVersion||"—"}</td><td>${Number(x.balance).toLocaleString("ru-RU")}</td></tr>`).join("")||`<tr><td colspan="5" class="empty">Операций пока нет.</td></tr>`}</tbody></table></div>`;}

function renderMotivationAdmin(){const m=state.motivation;return `<div class="notice-bar"><b>Правила версии ${m.ruleVersion} влияют только на будущие события.</b> История начислений и списаний сохраняет применённую версию и не пересчитывается.</div><section class="card settings-card"><h2 style="font:700 16px Manrope;margin:0 0 15px">Добавить механику начисления</h2><form id="motivation-rule-form"><div class="form-grid"><div class="form-field"><label>Событие / триггер</label><input class="field" name="event" required maxlength="100" placeholder="Например: участие в соревновании"></div><div class="form-field"><label>Баллы</label><input class="field" name="points" type="number" min="1" max="100000" required value="25"></div></div><div class="form-actions"><button class="btn" type="submit">Добавить правило</button></div></form></section><div class="section-title"><h2>Правила начисления</h2><span class="status ok">${m.rules.filter(r=>r.enabled).length} активны</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Триггер</th><th>Начисление</th><th>Версия</th><th>Статус</th><th></th></tr></thead><tbody>${m.rules.map((r,i)=>`<tr><td class="primary">${esc(r.event)}</td><td>+${r.points} баллов</td><td>${r.version}</td><td><span class="status ${r.enabled?"ok":"warn"}">${r.enabled?"Активно":"Отключено"}</span></td><td><button class="small-btn" data-action="edit-points-rule" data-index="${i}">Изменить</button> <button class="small-btn" data-action="toggle-points-rule" data-index="${i}">${r.enabled?"Отключить":"Включить"}</button></td></tr>`).join("")}</tbody></table></div><section class="card settings-card trigger-card"><h2 style="font:700 16px Manrope;margin:0 0 8px">Проверить внешнее событие</h2><p class="hint">Демо имитирует получение сигнала от интеграционного шлюза и начисляет баллы по выбранному активному правилу.</p><form id="motivation-trigger-form"><div class="form-grid"><div class="form-field"><label>Триггер</label><select class="select" name="ruleId">${m.rules.filter(r=>r.enabled).map(r=>`<option value="${esc(r.id)}">${esc(r.event)} · +${r.points}</option>`).join("")}</select></div><div class="form-field"><label>Комментарий / ID события</label><input class="field" name="reason" maxlength="120" placeholder="Например: задание #1234"></div></div><div class="form-actions"><button class="btn btn-outline" type="submit" ${m.rules.every(r=>!r.enabled)?"disabled":""}>Выполнить тестовое начисление</button></div></form></section><div class="section-title"><h2>Остатки магазина призов</h2><button class="btn btn-outline" data-action="add-reward">＋ Добавить приз</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Награда</th><th>Категория</th><th>Цена</th><th>Остаток</th><th>Статус</th><th></th></tr></thead><tbody>${m.rewards.map(r=>`<tr><td class="primary">${esc(r.icon)} ${esc(r.title)}</td><td>${esc(r.category)}</td><td>${r.cost}</td><td>${r.stock}</td><td>${r.active?"В каталоге":"Скрыт"}</td><td><button class="small-btn" data-action="edit-reward" data-id="${esc(r.id)}">Изменить</button> <button class="small-btn" data-action="toggle-reward" data-id="${esc(r.id)}">${r.active?"Скрыть":"В каталог"}</button></td></tr>`).join("")}</tbody></table></div><div class="section-title"><h2>Аукционы</h2><button class="btn btn-outline" data-action="add-auction">＋ Создать аукцион</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Приз</th><th>Лидер</th><th>Ставка</th><th>Шаг</th><th>Окончание</th><th>Статус</th><th></th></tr></thead><tbody>${m.auctions.map(a=>`<tr><td class="primary">${esc(a.title)}</td><td>${esc(a.leader||"—")}</td><td>${a.currentBid}</td><td>${a.minStep}</td><td>${esc(a.ends)}</td><td>${a.active?"Активен":"Завершён"}</td><td>${a.active?`<button class="small-btn" data-action="close-auction" data-id="${esc(a.id)}">Завершить</button>`:"—"}</td></tr>`).join("")}</tbody></table></div>`;}

function renderReports() {
  const visibleEmployees = state.role === "manager" ? employees.filter(e => e.store.includes("№12")) : employees;
  return `<div class="toolbar"><label class="form-field"><span class="stat-label">Период</span><select class="select" id="report-period"><option>Текущий месяц</option><option>Последние 90 дней</option><option>Настроить календарь</option></select></label><label class="form-field"><span class="stat-label">Магазин</span><select class="select" id="report-store"><option>Все в моей области</option><option>Магазин №12 · Астана</option><option>Магазин №08 · Астана</option><option>Магазин №21 · Караганда</option></select></label><button class="btn btn-outline" data-action="export-report">⇩ Выгрузить таблицу</button></div>
    <section class="grid grid-3" style="margin-top:17px"><div class="stat-card"><div><div class="stat-label">Сотрудники в области</div><div class="stat-value">${visibleEmployees.length}</div></div><div class="stat-icon">♙</div></div><div class="stat-card"><div><div class="stat-label">Обучение завершено</div><div class="stat-value">78%</div><div class="stat-note">За выбранный период</div></div><div class="stat-icon">✓</div></div><div class="stat-card"><div><div class="stat-label">Просроченные темы</div><div class="stat-value">4</div><div class="stat-note" style="color:#9b5860">Требуют внимания</div></div><div class="stat-icon">◷</div></div></section>
    <div class="split" style="margin-top:17px"><section class="card report-card"><h3 style="font:700 15px Manrope;margin:0 0 8px">Прохождение по курсам</h3><div class="report-row"><span>Адаптация</span><div class="bar"><span style="width:84%"></span></div><b>84%</b></div><div class="report-row"><span>Сервис</span><div class="bar"><span style="width:71%"></span></div><b>71%</b></div><div class="report-row"><span>Продукт</span><div class="bar"><span style="width:65%"></span></div><b>65%</b></div><div class="report-row"><span>Безопасность</span><div class="bar"><span style="width:90%"></span></div><b>90%</b></div></section><section class="card report-card"><h3 style="font:700 15px Manrope;margin:0 0 13px">Нужны действия</h3><p style="font-size:11px;color:var(--muted);line-height:1.6">Есть сотрудники с приближающимся сроком или незавершёнными темами. Откройте список ниже, чтобы посмотреть детали по своей области.</p><button class="btn btn-outline" data-action="scroll-employees">Список сотрудников ↓</button></section></div>
    <div class="section-title" id="employee-report"><h2>Статистика сотрудников</h2><span class="status">Полная история доступна по периодам</span></div>${employeeTable(visibleEmployees)}`;
}

function employeeTable(rows) { return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Сотрудник</th><th>Магазин</th><th>Обучение</th><th>Статус</th><th>Результаты</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="primary">${esc(e.name)}<span class="secondary">${esc(e.title)}</span></td><td>${esc(e.store)}</td><td>${esc(e.progress)}</td><td><span class="status ${e.progress.startsWith("12") ? "ok" : "warn"}">${esc(e.state)}</span></td><td><button class="small-btn" data-action="employee-results" data-name="${esc(e.name)}">Подробно →</button></td></tr>`).join("")}</tbody></table></div>`; }

function renderAdmin() {
  const tabs = [["courses","Курсы и маршруты"],["tests","Тесты и попытки"],["assignments","Назначения"],["motivation","Мотивация"],["people","Оргструктура и роли"],["integrations","Интеграции"]];
  return `<div class="tabs">${tabs.map(([id,label])=>`<button class="${state.adminTab===id?"active":""}" data-action="admin-tab" data-tab="${id}">${label}</button>`).join("")}</div>${state.adminTab === "tests" ? renderTestAdmin() : state.adminTab === "people" ? renderPeopleAdmin() : state.adminTab === "integrations" ? renderIntegrationsAdmin() : state.adminTab === "assignments" ? renderAssignmentsAdmin() : state.adminTab === "motivation" ? renderMotivationAdmin() : renderCoursesAdmin()}`;
}

function renderCoursesAdmin() {
  return `<div class="notice-bar"><b>Материалы готовятся отдельно и загружаются в портал.</b> Менеджер обучения самостоятельно создаёт, проверяет и публикует курсы. Маршрут может объединять несколько материалов и тестов.</div><div class="page-head" style="margin-bottom:14px"><div><h2 style="font:700 17px Manrope;margin:0">Учебный каталог</h2><p style="font-size:11px;color:var(--muted);margin:6px 0 0">Курсы, отдельные обучения и маршруты адаптации</p></div><button class="btn" data-action="create-course">＋ Создать курс</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Название</th><th>Формат</th><th>Материалы</th><th>Прогресс</th><th>Публикация</th><th></th></tr></thead><tbody>${state.courses.map(c=>`<tr><td class="primary">${esc(c.title)}<span class="secondary">${esc(c.description)}</span></td><td>${esc(c.kind)}</td><td>${(c.materials||[]).length ? esc(c.materials.join(", ")) : `${c.lessons} элементов`}</td><td>${c.progress}%</td><td><span class="status ${c.status==="Опубликован"?"ok":"warn"}">${esc(c.status||"Опубликован")}</span></td><td><div class="actions"><button class="small-btn" data-action="edit-course" data-id="${esc(c.id)}">Настроить</button><button class="small-btn" data-action="publish-course" data-id="${esc(c.id)}">Опубликовать</button></div></td></tr>`).join("")}</tbody></table></div><div class="section-title"><h2>Материалы</h2></div><div class="card info-card"><p style="font-size:11px;color:var(--muted);margin:0">Поддерживаются видео, документы/PDF, тесты, интерактивные курсы и SCORM-пакеты. В этой демонстрации сохраняются только названия выбранных файлов; для рабочей загрузки нужен корпоративный модуль хранения и проверки файлов.</p></div>`;
}

function renderAssignmentsAdmin() {
  return `<div class="notice-bar">Правила назначают маршруты автоматически при приёме, переводе и по регулярному циклу. Реальное кадровое событие поступает через интеграционный слой после согласования источника с ИТ.</div><section class="card settings-card"><h2 style="font:700 16px Manrope;margin:0 0 15px">Добавить правило назначения</h2><form id="assignment-rule-form"><div class="form-grid"><div class="form-field"><label>Триггер</label><select class="select" name="event"><option>Приём сотрудника</option><option>Перевод сотрудника</option><option>Регулярный цикл</option></select></div><div class="form-field"><label>Учебный маршрут или курс</label><select class="select" name="course">${state.courses.map(c=>`<option>${esc(c.title)}</option>`).join("")}</select></div><div class="form-field"><label>Аудитория</label><select class="select" name="audience"><option>По должности и подразделению</option><option>Новая должность или магазин</option><option>Все действующие сотрудники</option><option>Выбранная группа</option></select></div><div class="form-field"><label>Срок прохождения, дней</label><input class="field" name="dueDays" type="number" min="1" max="365" value="14" required></div></div><div class="form-actions"><button class="btn" type="submit">Добавить правило</button></div></form></section><div class="section-title"><h2>Активные правила</h2><span class="status ok">${state.assignmentRules.filter(r=>r.enabled).length} активны</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Событие</th><th>Курс / маршрут</th><th>Аудитория</th><th>Срок</th><th>Состояние</th><th></th></tr></thead><tbody>${state.assignmentRules.map((r,i)=>`<tr><td class="primary">${esc(r.event)}</td><td>${esc(r.course)}</td><td>${esc(r.audience)}</td><td>${r.dueDays} дней</td><td><span class="status ${r.enabled?"ok":"warn"}">${r.enabled?"Активно":"Отключено"}</span></td><td><button class="small-btn" data-action="toggle-assignment-rule" data-index="${i}">${r.enabled?"Отключить":"Включить"}</button></td></tr>`).join("")}</tbody></table></div>`;
}

function currentTest() { return state.testSettings.find(x=>x.title===state.selectedTest) || state.testSettings[0] || structuredClone(initialTestSettings); }
function renderTestAdmin() {
  const test = currentTest();
  const tests = state.testSettings;
  const attempts = state.attempts.filter(a => a.test === test.title);
  const ruleNames = { best: "Лучшая попытка", last: "Последняя попытка", first_pass: "Первая успешная", average: "Средний результат" };
  return `<div class="notice-bar"><b>Настройки применяются к будущим попыткам.</b> Уже сохранённые результаты не пересчитываются при изменении параметров. Каждая ручная корректировка записывается в журнал.</div>
    <section class="card settings-card"><div class="page-head" style="margin-bottom:16px"><div><h2 style="font:700 17px Manrope;margin:0">Настройка теста</h2><p style="font-size:11px;color:var(--muted);margin:6px 0 0">Попытки, зачёт и бонус за результат</p></div><div class="toolbar"><select class="select" id="test-picker">${tests.map(t=>`<option value="${esc(t.title)}" ${t.title===test.title?"selected":""}>${esc(t.title)}</option>`).join("")}</select><button class="btn btn-outline" data-action="add-test">＋ Создать тест</button></div></div>
      <form id="test-settings-form"><input type="hidden" name="originalTitle" value="${esc(test.title)}"/><div class="form-grid">
        <div class="form-field"><label for="test-title">Название теста</label><input class="field" id="test-title" name="title" value="${esc(test.title)}" required maxlength="100" ${state.attempts.some(a=>a.test===test.title)?"readonly":""}/><div class="hint">Если по тесту уже есть попытки, название закреплено за историей. Для нового содержания создайте отдельный тест.</div></div>
        <div class="form-field"><label for="test-attempts">Количество попыток</label><input class="field" id="test-attempts" type="number" min="1" max="99" name="attempts" value="${test.attempts}" required/><div class="hint">Количество доступных сотруднику попыток.</div></div>
        <div class="form-field"><label for="counted-rule">Что идёт в зачёт</label><select class="select" id="counted-rule" name="countedRule"><option value="best" ${test.countedRule==="best"?"selected":""}>Лучшая попытка</option><option value="last" ${test.countedRule==="last"?"selected":""}>Последняя попытка</option><option value="first_pass" ${test.countedRule==="first_pass"?"selected":""}>Первая успешная</option><option value="average" ${test.countedRule==="average"?"selected":""}>Средний результат</option></select></div>
        <div class="form-field"><label for="pass-score">Порог успешного прохождения, %</label><input class="field" id="pass-score" type="number" min="0" max="100" name="passScore" value="${test.passScore}" required/></div>
        <div class="form-field"><label for="bonus">Бонус за результат, баллы</label><input class="field" id="bonus" type="number" min="0" max="100000" name="bonus" value="${test.bonus}" required/><div class="hint">Настраиваемое вознаграждение; фактическое начисление баллов включается с модулем «Мотивация».</div></div>
        <div class="form-field"><label for="bonus-condition">Условие получения бонуса</label><select class="select" id="bonus-condition" name="bonusCondition"><option value="pass" ${test.bonusCondition==="pass"?"selected":""}>За успешное прохождение</option><option value="score90" ${test.bonusCondition==="score90"?"selected":""}>Результат 90% и выше</option><option value="first_try" ${test.bonusCondition==="first_try"?"selected":""}>Успешно с первой попытки</option><option value="none" ${test.bonusCondition==="none"?"selected":""}>Без бонуса</option></select></div>
      </div><div class="form-actions"><button type="reset" class="btn btn-outline">Сбросить изменения</button><button class="btn" type="submit">Сохранить настройки</button></div></form></section>
      <div class="section-title"><h2>Попытки сотрудников</h2><div class="toolbar"><label class="search-field"><span>⌕</span><input class="field attempt-search" placeholder="Поиск сотрудника"/></label><button class="btn btn-outline" data-action="export-attempts">⇩ Выгрузить таблицу</button></div></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Сотрудник</th><th>Попытка / версия</th><th>Результат</th><th>Статус</th><th>Дата</th><th>В зачёте</th><th>Бонус</th><th>Действия</th></tr></thead><tbody id="attempt-rows">${attemptsTableRows(attempts)}</tbody></table></div>
      <div class="section-title"><h2>Журнал изменений</h2></div><div class="card info-card"><p style="font-size:11px;color:var(--muted);margin:0">${state.audit?.length ? state.audit.slice(-3).reverse().map(a=>`${esc(a.date)} · ${esc(a.text)}`).join("<br>") : "Изменения настроек и результатов будут отображаться здесь."}</p></div>`;
}

function attemptsTableRows(list) {
  if (!list.length) return `<tr><td colspan="8" class="empty">Попыток пока нет</td></tr>`;
  return list.map(a=>`<tr class="${a.deleted?"muted-row":""}"><td class="primary">${esc(a.employee)}<span class="secondary">${esc(a.store)}</span></td><td>№ ${a.attempt}<span class="secondary">Версия ${a.settingsVersion || 1}</span></td><td>${a.score}%</td><td><span class="status ${a.deleted?"removed":a.status==="Зачтено"?"pass":"fail"}">${a.deleted?"Исключена":esc(a.status)}</span></td><td>${esc(a.date)}</td><td>${a.deleted?"—":a.counted?"Да":"Нет"}</td><td>${a.bonusEarned ?? 0}</td><td><div class="actions"><button class="small-btn" data-action="review-attempt" data-id="${esc(a.id)}">Результат</button><button class="small-btn" data-action="edit-attempt" data-id="${esc(a.id)}">Изменить</button><button class="small-btn" data-action="delete-attempt" data-id="${esc(a.id)}" ${a.deleted?"disabled":""}>Исключить</button></div></td></tr>`).join("");
}

function renderPeopleAdmin() {
  const roleList = state.customRoles.map((r,i)=>`<tr><td>${esc(r)}</td><td>${i===0?"Сотрудник":i===1?"Магазин":i===2?"Учебный контент":"Настройки"}</td><td><span class="status ok">Активна</span></td><td><button class="small-btn" data-action="edit-role" data-role="${esc(r)}">Настроить →</button></td></tr>`).join("");
  return `<div class="grid grid-3"><div class="stat-card"><div><div class="stat-label">Пользователи в демонстрации</div><div class="stat-value">250</div><div class="stat-note">Масштабирование до 1 000</div></div><div class="stat-icon">♙</div></div><div class="stat-card"><div><div class="stat-label">Орггруппы</div><div class="stat-value">${state.orgs.length}</div><div class="stat-note">Редактируемые в админ-панели</div></div><div class="stat-icon">⌂</div></div><div class="stat-card"><div><div class="stat-label">Роли</div><div class="stat-value">${state.customRoles.length}</div><div class="stat-note">Автоматические и ручные назначения</div></div><div class="stat-icon">⚙</div></div></div>
    <div class="section-title"><h2>Организационные группы</h2><button class="btn btn-outline" data-action="add-org">＋ Добавить группу</button></div><section class="grid grid-3">${state.orgs.map((o,i)=>`<article class="card module-card"><div class="module-icon">⌂</div><div style="flex:1"><h3>${esc(o)}</h3><p>${i===0?"Корпоративный уровень":"Иерархия подразделений и магазинов"}</p><button class="text-link" style="padding:9px 0 0" data-action="edit-org" data-name="${esc(o)}">Управлять связями →</button></div></article>`).join("")}</section>
    <div class="section-title"><h2>Роли и группы доступа</h2><button class="btn btn-outline" data-action="add-role">＋ Создать роль</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Роль</th><th>Область по умолчанию</th><th>Назначение</th><th></th></tr></thead><tbody>${roleList}</tbody></table></div><div class="notice-bar">В рабочем портале роли будут ограничены оргструктурой и проверяться на сервере. Здесь редактируется только демонстрационная конфигурация.</div>`;
}

function renderIntegrationsAdmin() { return `<div class="notice-bar"><b>Защищённый обмен.</b> Портал не подключается напрямую к базам 1С, KEDO и другим корпоративным системам. Источники подключаются через промежуточный интеграционный слой по решению ИТ.</div><section class="grid grid-2">${integrationSources.map(s=>`<article class="card module-card"><div class="module-icon">${s.icon}</div><div style="flex:1"><h3>${esc(s.name)}</h3><p>${esc(s.sub)}</p><div style="margin-top:11px"><span class="status warn">${esc(s.status)}</span></div></div></article>`).join("")}</section><div class="section-title"><h2>Модульные точки подключения</h2></div><section class="grid grid-3"><article class="card info-card"><h3>Идентификация</h3><p style="font-size:11px;color:var(--muted)">Заменяемый адаптер корпоративного входа. В демо логин не проверяет реальные аккаунты.</p></article><article class="card info-card"><h3>Кадровый профиль</h3><p style="font-size:11px;color:var(--muted)">Адаптер данных профиля; источник и схема сопоставления назначаются ИТ.</p></article><article class="card info-card"><h3>События обучения</h3><p style="font-size:11px;color:var(--muted)">События назначений и результатов можно передавать в подключаемые сервисы.</p></article></section>`; }

function audit(text) { state.audit = state.audit || []; state.audit.push({ date: new Date().toLocaleString("ru-RU"), text }); save(); }

function recordPoints(delta, reason, ruleVersion = state.motivation.ruleVersion) {
  const m = state.motivation;
  m.balance = Math.max(0, Number(m.balance || 0) + Number(delta));
  m.ledger.unshift({ id: `M-${Date.now()}`, date: new Date().toISOString().slice(0, 10), reason, delta: Number(delta), balance: m.balance, ruleVersion });
  save();
}
function activePointsRule(id) { return state.motivation.rules.find(r => r.id === id && r.enabled); }
function addRulePoints(id, reason) {
  const rule = activePointsRule(id);
  if (rule) recordPoints(rule.points, reason, rule.version);
  return rule?.points || 0;
}
function addReward() {
  modal("Добавить награду", `<form id="reward-form"><div class="form-grid"><div class="form-field"><label>Название</label><input class="field" name="title" required maxlength="90" placeholder="Например, бутылка RubyMarket"></div><div class="form-field"><label>Категория</label><select class="select" name="category"><option>Товары</option><option>Сертификаты</option><option>Цифровые награды</option><option>Привилегии</option></select></div><div class="form-field"><label>Цена в баллах</label><input class="field" type="number" name="cost" min="1" required value="100"></div><div class="form-field"><label>Начальный остаток</label><input class="field" type="number" name="stock" min="0" required value="1"></div><div class="form-field"><label>Значок</label><input class="field" name="icon" maxlength="4" value="🎁"></div></div></form>`, `<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-reward">Сохранить приз</button>`);
}
function editPointsRule(index) {
  const r=state.motivation.rules[index]; if(!r)return;
  modal("Настроить механику",`<form id="points-rule-edit-form"><input type="hidden" name="index" value="${index}"><div class="form-field"><label>Событие / триггер</label><input class="field" name="event" required maxlength="100" value="${esc(r.event)}"></div><div class="form-field" style="margin-top:12px"><label>Баллы за событие</label><input class="field" name="points" type="number" min="1" max="100000" value="${r.points}" required></div><p class="hint">Изменение создаст новую версию правила и будет применяться только к будущим событиям.</p></form>`,`<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-points-rule">Сохранить версию</button>`);
}
function editReward(id) {
  const r=state.motivation.rewards.find(x=>x.id===id); if(!r)return;
  modal("Изменить награду",`<form id="reward-edit-form"><input type="hidden" name="id" value="${esc(r.id)}"><div class="form-grid"><div class="form-field" style="grid-column:1/-1"><label>Название</label><input class="field" name="title" value="${esc(r.title)}" required maxlength="90"></div><div class="form-field"><label>Категория</label><select class="select" name="category">${["Товары","Сертификаты","Цифровые награды","Привилегии"].map(c=>`<option ${r.category===c?"selected":""}>${c}</option>`).join("")}</select></div><div class="form-field"><label>Цена в баллах</label><input class="field" type="number" name="cost" min="1" value="${r.cost}" required></div><div class="form-field"><label>Остаток</label><input class="field" type="number" name="stock" min="0" value="${r.stock}" required></div><div class="form-field"><label>Значок</label><input class="field" name="icon" maxlength="4" value="${esc(r.icon)}"></div></div></form>`,`<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-reward-edit">Сохранить</button>`);
}
function addAuction() {
  modal("Создать аукцион", `<form id="auction-form"><div class="form-grid"><div class="form-field" style="grid-column:1/-1"><label>Приз</label><input class="field" name="title" required maxlength="90" placeholder="Например, набор RubyMarket"></div><div class="form-field"><label>Стартовая ставка</label><input class="field" type="number" name="bid" min="0" required value="0"></div><div class="form-field"><label>Минимальный шаг</label><input class="field" type="number" name="step" min="1" required value="20"></div><div class="form-field"><label>Дата завершения</label><input class="field" type="date" name="ends" required value="2026-12-15"></div><div class="form-field"><label>Значок</label><input class="field" name="icon" maxlength="4" value="🏆"></div></div><p class="hint">Ставки не резервируют и не списывают баллы. С баланса победителя баллы спишутся после закрытия аукциона.</p></form>`, `<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-auction">Создать</button>`);
}
function redeemReward(id) {
  const reward=state.motivation.rewards.find(r=>r.id===id&&r.active);
  if(!reward||reward.stock<1){toast("Приз закончился");return;}
  if(state.motivation.balance<reward.cost){toast("Недостаточно баллов для обмена");return;}
  modal("Подтвердить обмен",`<div class="confirm-reward"><span>${esc(reward.icon)}</span><div><b>${esc(reward.title)}</b><small>${reward.cost.toLocaleString("ru-RU")} баллов · остаток ${reward.stock}</small></div></div><p>После подтверждения баллы будут списаны, а заявка на получение сохранится в истории.</p>`,`<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="confirm-redeem" data-id="${esc(reward.id)}">Обменять</button>`);
}
function openBid(id) {
  const auction=state.motivation.auctions.find(a=>a.id===id&&a.active); if(!auction)return;
  const minimum=auction.currentBid+auction.minStep;
  modal("Сделать ставку",`<p>${esc(auction.title)}</p><div class="form-field"><label for="bid-amount">Ваша ставка · минимум ${minimum} баллов</label><input class="field" id="bid-amount" type="number" min="${minimum}" max="${state.motivation.balance}" value="${minimum}" style="width:100%"></div><p class="hint">Ставка не блокирует баллы. Они спишутся только если вы победите в аукционе.</p>`,`<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="confirm-bid" data-id="${esc(id)}">Подтвердить ставку</button>`);
}

function renderNotifications() {
  modal("Уведомления", `<p>Выберите каналы, по которым портал будет сообщать о новых назначениях и важных событиях.</p><label class="toggle-row"><span><b>Внутри портала</b><small>Новые курсы, напоминания и новости</small></span><input type="checkbox" id="notify-internal" ${state.notifications.internal?"checked":""}></label><label class="toggle-row"><span><b>Push на телефон</b><small>Короткие уведомления на устройстве</small></span><input type="checkbox" id="notify-push" ${state.notifications.push?"checked":""}></label><div class="notice-bar">Push-разрешение в браузере будет запрашиваться только в рабочей версии и с согласия сотрудника.</div>`, `<button class="btn" data-action="save-notifications">Сохранить</button>`);
}

function reviewAttempt(id) {
  const a = state.attempts.find(x=>x.id===id); if (!a) return;
  const answers = (a.answers || []).map((x,i)=>`<div class="answer-row"><b>Вопрос ${i+1}</b><span>${esc(x)}</span></div>`).join("");
  modal("Результат попытки", `<div class="result-summary"><div><small>Сотрудник</small><b>${esc(a.employee)}</b></div><div><small>Тест</small><b>${esc(a.test)}</b></div><div><small>Попытка / дата</small><b>№ ${a.attempt} · ${esc(a.date)}</b></div><div><small>Итог</small><b>${a.score}% · ${a.deleted?"Исключена":esc(a.status)}</b></div><div><small>Версия настроек</small><b>${a.settingsVersion||1}</b></div><div><small>Бонус по правилу</small><b>${a.bonusEarned??0} баллов</b></div></div><h3 style="font:700 13px Manrope;margin:20px 0 7px">Ответы и проверка</h3>${answers || `<p>Подробные ответы не приложены к демонстрационной записи.</p>`}<p style="font-size:10px;color:var(--muted);margin-top:14px">Изменения результата сохраняются в журнале с указанием автора, времени и причины.</p>`);
}

function editAttempt(id) {
  const a = state.attempts.find(x=>x.id===id); if (!a || a.deleted) return;
  modal("Корректировка попытки", `<form id="edit-attempt-form"><input type="hidden" name="id" value="${esc(id)}"><div class="form-grid"><div class="form-field"><label>Результат, %</label><input class="field" name="score" type="number" min="0" max="100" value="${a.score}" required></div><div class="form-field"><label>Зачётный статус</label><select class="select" name="status"><option ${a.status==="Зачтено"?"selected":""}>Зачтено</option><option ${a.status==="Не зачтено"?"selected":""}>Не зачтено</option></select></div><div class="form-field" style="grid-column:1/-1"><label>Основание корректировки</label><input class="field" style="width:100%" name="reason" required maxlength="250" placeholder="Например: исправлена ошибка проверки"></div></div></form>`, `<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-attempt-edit">Сохранить исправление</button>`);
}

function makeCSV(rows, filename) {
  const data = "\ufeff" + rows.map(r=>r.map(v=>`"${String(v ?? "").replaceAll('"','""')}"`).join(";")).join("\r\n");
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function exportAttempts() {
  const selected = currentTest();
  const rows = [["ID попытки","Сотрудник","Подразделение","Тест","Попытка","Версия настроек","Дата","Результат, %","Статус","В зачёте","Бонус по правилу","Исключена"], ...state.attempts.filter(a=>a.test===selected.title).map(a=>[a.id,a.employee,a.store,a.test,a.attempt,a.settingsVersion||1,a.date,a.score,a.status,a.counted?"Да":"Нет",a.bonusEarned??0,a.deleted?"Да":"Нет"])];
  makeCSV(rows, "rezultaty_testirovaniya.csv"); toast("Таблица результатов подготовлена");
}
function exportReport() { makeCSV([["Сотрудник","Должность","Магазин","Обучение","Статус"], ...employees.map(e=>[e.name,e.title,e.store,e.progress,e.state])], "analitika_obucheniya.csv"); toast("Отчёт выгружен"); }

app.addEventListener("click", async (event) => {
  const viewLink = event.target.closest("[data-view]");
  if (viewLink) { state.view = viewLink.dataset.view; save(); render(); document.querySelector("#sidebar")?.classList.remove("open"); return; }
  const button = event.target.closest("[data-action]"); if (!button) return;
  const { action } = button.dataset;
  if (action === "sign-in") { await adapters.identity.signIn(); state.signedIn = true; save(); render(); toast("Демонстрационный вход выполнен"); }
  else if (action === "menu") document.querySelector("#sidebar")?.classList.toggle("open");
  else if (action === "notifications") renderNotifications();
  else if (action === "close-modal") document.querySelector(".modal-backdrop")?.remove();
  else if (action === "save-notifications") { state.notifications.internal = document.querySelector("#notify-internal").checked; state.notifications.push = document.querySelector("#notify-push").checked; save(); document.querySelector(".modal-backdrop")?.remove(); toast("Настройки уведомлений сохранены"); }
  else if (action === "profile") openAvatarPicker();
  else if (action === "choose-avatar") { state.avatar = button.dataset.avatar; save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Аватар обновлён"); }
  else if (action === "open-course") openCourse(button.dataset.id);
  else if (action === "complete-lesson") completeLesson(button.dataset.id);
  else if (action === "start-test") openTestAttempt(button.dataset.id);
  else if (action === "submit-demo-test") submitDemoTest(button.dataset.id);
  else if (action === "motivation-tab") { state.motivationTab = button.dataset.tab; save(); render(); }
  else if (action === "redeem-reward") redeemReward(button.dataset.id);
  else if (action === "bid-auction") openBid(button.dataset.id);
  else if (action === "toggle-points-rule") { const rule=state.motivation.rules[Number(button.dataset.index)]; if(rule){ state.motivation.ruleVersion+=1; rule.enabled=!rule.enabled; rule.version=state.motivation.ruleVersion; audit(`${rule.enabled?"Включено":"Отключено"} правило баллов «${rule.event}», версия ${rule.version}`); save(); render(); toast("Правило обновлено; история не пересчитана"); } }
  else if (action === "edit-points-rule") editPointsRule(Number(button.dataset.index));
  else if (action === "add-reward") addReward();
  else if (action === "edit-reward") editReward(button.dataset.id);
  else if (action === "toggle-reward") { const reward=state.motivation.rewards.find(r=>r.id===button.dataset.id); if(reward){reward.active=!reward.active;audit(`${reward.active?"Опубликована":"Скрыта"} награда «${reward.title}»`);save();render();} }
  else if (action === "add-auction") addAuction();
  else if (action === "library-category") { state.libraryCategory = button.dataset.category; render(); }
  else if (action === "open-library-item") modal(button.dataset.title, `<p>Материал из демонстрационной библиотеки RubyMarket.</p><p>В рабочем портале здесь открывается соответствующий документ, видео или интерактивный курс.</p><div class="status">Источник: библиотека знаний</div>`);
  else if (action === "admin-tab") { state.adminTab = button.dataset.tab; save(); render(); }
  else if (action === "add-test") { const n=state.testSettings.length+1; const title=`Новый тест ${n}`; state.testSettings.push({ title, attempts:2, countedRule:"best", passScore:80, bonus:0, bonusCondition:"none" }); state.selectedTest=title; save(); render(); toast("Черновик теста добавлен"); }
  else if (action === "create-course") createCourse();
  else if (action === "edit-course") editCourse(button.dataset.id);
  else if (action === "publish-course") publishCourse(button.dataset.id);
  else if (action === "toggle-assignment-rule") { const rule=state.assignmentRules[Number(button.dataset.index)]; rule.enabled=!rule.enabled; audit(`${rule.enabled?"Включено":"Отключено"} правило «${rule.event}»`); save(); render(); }
  else if (action === "review-attempt") reviewAttempt(button.dataset.id);
  else if (action === "edit-attempt") editAttempt(button.dataset.id);
  else if (action === "delete-attempt") removeAttempt(button.dataset.id);
  else if (action === "save-attempt-edit") saveAttemptEdit();
  else if (action === "export-attempts") exportAttempts();
  else if (action === "export-report") exportReport();
  else if (action === "add-org") createOrg();
  else if (action === "edit-org") modal("Организационная группа", `<p><b>${esc(button.dataset.name)}</b></p><p>Связи с руководителями и сотрудниками поступают из утверждённого кадрового источника. В демонстрации доступна только структура интерфейса.</p>`);
  else if (action === "add-role") createRole();
  else if (action === "edit-role") modal("Настройка роли", `<p><b>${esc(button.dataset.role)}</b></p><p>В рабочей версии здесь задаются разрешённые действия и область видимости. Система проверяет права на сервере для каждого запроса.</p><div class="filter-chips"><span class="chip active">Просмотр</span><span class="chip">Изменение</span><span class="chip">Назначение</span><span class="chip">Экспорт</span></div>`);
  else if (action === "employee-results") modal(`Обучение · ${button.dataset.name}`, `<p>Детальная история сотрудника за выбранный календарный период.</p><div class="result-summary"><div><small>Пройдено</small><b>8 тем</b></div><div><small>В процессе</small><b>2 темы</b></div><div><small>Просрочено</small><b>1 тема</b></div><div><small>Средний результат</small><b>86%</b></div></div>`);
  else if (action === "scroll-employees") document.querySelector("#employee-report")?.scrollIntoView({ behavior: "smooth" });
  else if (action === "open-my-results") modal("Мои результаты", `<p>История попыток и итоговые результаты ваших тестов отображаются здесь.</p>${attemptsTableRows(state.attempts.filter(a=>a.employee===demoEmployee.name))}`);
});

app.addEventListener("change", (event) => {
  if (event.target.matches("[data-action='role-switch']")) {
    state.role = event.target.value; if (!isManager() && state.view === "reports") state.view = "home"; if (!canAdmin() && state.view === "admin") state.view = "home"; save(); render();
  }
  if (event.target.matches("#test-picker")) { state.selectedTest = event.target.value; save(); render(); }
  if (event.target.matches("#report-period")) {
    if (event.target.value === "Настроить календарь") modal("Выбор периода", `<div class="form-grid"><div class="form-field"><label>С</label><input class="field" type="date" value="2026-11-01"></div><div class="form-field"><label>По</label><input class="field" type="date" value="2026-11-30"></div></div><p>История обучения доступна за весь период.</p>`);
  }
});

app.addEventListener("input", (event) => {
  if (event.target.matches(".library-search")) {
    const pos=event.target.selectionStart; const value=event.target.value; const category=state.libraryCategory||"Все";
    const list=libraryItems.filter(x=>(category==="Все"||x.category===category)&&`${x.title} ${x.category}`.toLowerCase().includes(value.toLowerCase()));
    const grid=event.target.closest(".content").querySelector(".grid.grid-3");
    grid.innerHTML=list.map(item=>`<article class="card info-card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="module-icon">${item.icon}</div><span class="status">${esc(item.category)}</span></div><h3 style="margin-top:15px;margin-bottom:7px">${esc(item.title)}</h3><p style="font-size:11px;color:var(--muted);margin:0">${esc(item.type)}</p><div class="course-foot"><span>${esc(item.updated)}</span><button class="text-link" data-action="open-library-item" data-title="${esc(item.title)}">Открыть →</button></div></article>`).join("") || `<div class="empty">Ничего не найдено.</div>`;
    event.target.setSelectionRange(pos,pos);
  }
  if (event.target.matches(".attempt-search")) {
    const query=event.target.value.toLowerCase(); const selected=currentTest();
    document.querySelector("#attempt-rows").innerHTML=attemptsTableRows(state.attempts.filter(a=>a.test===selected.title&&`${a.employee} ${a.store}`.toLowerCase().includes(query)));
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id === "motivation-rule-form") {
    event.preventDefault(); const fd=new FormData(event.target); const eventName=String(fd.get("event")||"").trim(); const points=Number(fd.get("points"));
    if(!eventName||!Number.isFinite(points)||points<1)return;
    const version=++state.motivation.ruleVersion; state.motivation.rules.push({id:`rule-${Date.now()}`,event:eventName,points,enabled:true,version}); audit(`Добавлено правило мотивации «${eventName}»: +${points}, версия ${version}`); save(); render(); toast("Правило добавлено для будущих событий");
  }
  if (event.target.id === "motivation-trigger-form") {
    event.preventDefault(); const fd=new FormData(event.target); const rule=activePointsRule(String(fd.get("ruleId"))); if(!rule){toast("Выберите активное правило");return;}
    const suffix=String(fd.get("reason")||"").trim(); const amount=addRulePoints(rule.id,`Внешний триггер: ${rule.event}${suffix?` · ${suffix}`:""}`); audit(`Тестовый запуск внешнего триггера «${rule.event}» начислил ${amount} баллов`); render(); toast(`Начислено ${amount} баллов`);
  }
  if (event.target.id === "test-settings-form") {
    event.preventDefault(); const form=new FormData(event.target); const original=form.get("originalTitle");
    const target=state.testSettings.find(t=>t.title===original); if (!target) return;
    const previous=target.title; const next={ title:String(form.get("title")).trim(), attempts:Number(form.get("attempts")), countedRule:String(form.get("countedRule")), passScore:Number(form.get("passScore")), bonus:Number(form.get("bonus")), bonusCondition:String(form.get("bonusCondition")) };
    const changed=Object.keys(next).some(key=>String(target[key])!==String(next[key])); Object.assign(target,next); if(changed) target.version=Number(target.version||1)+1;
    if (previous !== target.title) { state.attempts.filter(a=>a.test===previous).forEach(a=>a.test=target.title); state.selectedTest=target.title; }
    audit(`Обновлены настройки теста «${target.title}». Настройки применяются к новым попыткам.`); render(); toast("Настройки теста сохранены");
  }
  if (event.target.id === "edit-attempt-form") event.preventDefault();
  if (event.target.id === "assignment-rule-form") {
    event.preventDefault(); const fd=new FormData(event.target); state.assignmentRules.push({ event:String(fd.get("event")), course:String(fd.get("course")), audience:String(fd.get("audience")), dueDays:Number(fd.get("dueDays")), enabled:true }); audit(`Создано правило назначения: ${fd.get("event")} → ${fd.get("course")}`); save(); render(); toast("Правило добавлено");
  }
  if (event.target.id === "reward-form" || event.target.id === "auction-form") event.preventDefault();
});

function openAvatarPicker() {
  modal("Выберите аватар", `<p>На старте доступны готовые варианты. Конструктор аватара можно добавить отдельным этапом.</p><div class="avatar-options">${avatarOptions.map(([id,emoji,label])=>`<button class="avatar-option ${state.avatar===id?"chosen":""}" data-action="choose-avatar" data-avatar="${id}"><span>${emoji}</span><b>${label}</b></button>`).join("")}</div>`);
}

function openCourse(id) {
  const course=state.courses.find(x=>x.id===id); if (!course) return;
  const steps=Array.from({length:course.lessons},(_,i)=>`<div class="step-row"><span class="step-check">${i<Math.round(course.progress/100*course.lessons)?"✓":i+1}</span><span><b>Тема ${i+1}</b><small>${i===course.lessons-1?"Итоговый тест":"Учебный материал · около 8 минут"}</small></span>${i<Math.round(course.progress/100*course.lessons)?`<span class="status ok">Завершено</span>`:`<button class="small-btn" data-action="complete-lesson" data-id="${esc(course.id)}">Открыть</button>`}</div>`).join("");
  modal(course.title, `<div class="course-progress-head"><div><span class="status">${esc(course.kind)}</span><p style="margin:10px 0 0">${esc(course.description)}</p></div><div class="course-ring">${course.progress}%</div></div><div class="progress"><span style="width:${course.progress}%"></span></div><div class="step-list">${steps}</div><div class="notice-bar">Материалы и ответы теста относятся к версии курса, по которой проходит сотрудник. Попытки и результаты сохраняются отдельно.</div>`, `<button class="btn btn-outline" data-action="start-test" data-id="${esc(course.id)}">Перейти к тесту</button>`);
}

function completeLesson(id) {
  const course=state.courses.find(x=>x.id===id); if (!course) return;
  const wasComplete=course.progress>=100; course.progress=Math.min(100,course.progress+Math.ceil(100/course.lessons));
  const earned=!wasComplete&&course.progress>=100?addRulePoints("course",`Курс завершён: ${course.title}`):0;
  save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast(course.progress===100?`Маршрут завершён${earned?` · +${earned} баллов`:""}`:"Прогресс сохранён");
}

function openTestAttempt(id) {
  const course=state.courses.find(x=>x.id===id); const testName=state.testSettings.find(t=>t.title.toLowerCase().includes(course.title.toLowerCase().split(" ")[0]))?.title || state.testSettings[0]?.title || "Проверка знаний";
  modal("Демонстрационный тест", `<p>В рабочем портале вопросы и ответы загружаются как часть учебного материала. Здесь показан интерфейс проверки результата.</p><div class="form-field"><label for="demo-score">Результат попытки, %</label><input class="field" style="width:100%" type="number" min="0" max="100" value="88" id="demo-score"></div><p style="font-size:10px;color:var(--muted)">Тест: ${esc(testName)} · сотрудник: ${esc(demoEmployee.name)}</p>`, `<button class="btn" data-action="submit-demo-test" data-id="${esc(id)}">Завершить попытку</button>`);
}

function submitDemoTest(id) {
  const score=Math.max(0,Math.min(100,Number(document.querySelector("#demo-score")?.value||0))); const course=state.courses.find(x=>x.id===id);
  const testName = id === "product" ? "Знание продукта" : "Стандарты обслуживания";
  const setting=state.testSettings.find(x=>x.title===testName)||state.testSettings[0];
  const version=Number(setting?.version||1);
  const cohort=state.attempts.filter(a=>a.employee===demoEmployee.name&&a.test===setting?.title&&!a.deleted&&(a.settingsVersion||1)===version);
  if (cohort.length >= Number(setting?.attempts||1)) { toast("Лимит попыток по этому тесту исчерпан"); return; }
  const attemptNo=cohort.length+1; const pass=score>=Number(setting?.passScore||80);
  const bonusCondition=setting?.bonusCondition||"none";
  const bonusEligible=bonusCondition==="pass"?pass:bonusCondition==="score90"?score>=90:bonusCondition==="first_try"?pass&&attemptNo===1:false;
  const next={ id:`A-${Date.now().toString().slice(-6)}`,employee:demoEmployee.name,store:demoEmployee.store,test:setting?.title||course?.title||"Проверка знаний",attempt:attemptNo,score,status:pass?"Зачтено":"Не зачтено",date:new Date().toISOString().slice(0,10),counted:true,settingsVersion:version,bonusEarned:bonusEligible?Number(setting?.bonus||0):0,answers:["Демонстрационный вопрос: результат записан", "Попытка привязана к версии курса"] };
  const sameVersion=[...cohort,next];
  if(setting?.countedRule==="best") { const best=[...sameVersion].sort((a,b)=>b.score-a.score)[0]; sameVersion.forEach(a=>a.counted=a.id===best.id); }
  else if(setting?.countedRule==="last") { const last=[...sameVersion].sort((a,b)=>b.attempt-a.attempt)[0]; sameVersion.forEach(a=>a.counted=a.id===last.id); }
  else if(setting?.countedRule==="first_pass") { const first=sameVersion.filter(a=>a.status==="Зачтено").sort((a,b)=>a.attempt-b.attempt)[0]; sameVersion.forEach(a=>a.counted=first?a.id===first.id:false); }
  else sameVersion.forEach(a=>a.counted=true);
  state.attempts.unshift(next);
  if(next.bonusEarned>0) recordPoints(next.bonusEarned,`Бонус за тест «${next.test}» · попытка №${attemptNo}`,version);
  const points=pass&&attemptNo===1?addRulePoints("test",`Тест «${next.test}» сдан с первой попытки`):0;
  adapters.gateway.publishLearningEvent({ type:"test.completed", courseId:id, score, bonus:next.bonusEarned, settingsVersion:version }); save(); document.querySelector(".modal-backdrop")?.remove(); toast(`${pass?"Зачтено":"Требуется повторение"} · бонус ${next.bonusEarned+points} баллов`);
}

function removeAttempt(id) {
  const a=state.attempts.find(x=>x.id===id); if (!a || a.deleted) return;
  modal("Исключить попытку?", `<p>Попытка сотрудника <b>${esc(a.employee)}</b> останется в журнале аудита, но будет исключена из текущих рабочих отчётов.</p><div class="form-field"><label>Основание</label><input class="field" id="delete-reason" style="width:100%" required placeholder="Укажите причину"></div>`, `<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="confirm-delete-attempt" data-id="${esc(id)}">Исключить</button>`);
}

function saveAttemptEdit() {
  const form=document.querySelector("#edit-attempt-form"); if (!form) return;
  const fd=new FormData(form); const a=state.attempts.find(x=>x.id===fd.get("id")); const reason=String(fd.get("reason")||"").trim();
  if (!reason) { toast("Укажите основание корректировки"); return; }
  const before=`${a.score}% · ${a.status}`; a.score=Number(fd.get("score")); a.status=String(fd.get("status")); a.counted=true; a.corrected=true; a.correctionReason=reason; audit(`Попытка ${a.id} скорректирована (${before} → ${a.score}% · ${a.status}). Причина: ${reason}`); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Корректировка записана в журнал");
}

function createOrg() {
  modal("Новая организационная группа", `<form id="new-org-form"><div class="form-field"><label>Название группы</label><input class="field" name="name" style="width:100%" required placeholder="Например, Магазины Алматы"></div></form>`, `<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-org">Создать группу</button>`);
}
function createRole() {
  modal("Создать роль", `<form id="new-role-form"><div class="form-field"><label>Название роли</label><input class="field" name="name" style="width:100%" required placeholder="Например, Региональный руководитель"></div><p>Права и область видимости можно будет настроить отдельно.</p></form>`, `<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-role">Создать роль</button>`);
}

function createCourse() { showCourseForm(null); }
function editCourse(id) { const course=state.courses.find(c=>c.id===id); if(course) showCourseForm(course); }
function showCourseForm(course) {
  const isEdit=Boolean(course); const item=course||{id:"",title:"",kind:"Самостоятельное обучение",lessons:3,due:"До 30 ноября",description:"",materials:[]};
  const body=`<form id="course-form"><input type="hidden" name="id" value="${esc(item.id)}"><div class="form-grid"><div class="form-field"><label>Название</label><input class="field" name="title" value="${esc(item.title)}" required maxlength="120"></div><div class="form-field"><label>Тип</label><select class="select" name="kind"><option ${item.kind==="Учебный маршрут"?"selected":""}>Учебный маршрут</option><option ${item.kind==="Самостоятельное обучение"?"selected":""}>Самостоятельное обучение</option><option ${item.kind==="Обязательный курс"?"selected":""}>Обязательный курс</option></select></div><div class="form-field"><label>Число шагов</label><input class="field" name="lessons" type="number" min="1" max="100" value="${item.lessons}" required></div><div class="form-field"><label>Срок для отображения</label><input class="field" name="due" value="${esc(item.due)}" placeholder="Например, до 30 ноября"></div><div class="form-field" style="grid-column:1/-1"><label>Описание</label><input class="field" style="width:100%" name="description" value="${esc(item.description)}" maxlength="250"></div><div class="form-field" style="grid-column:1/-1"><label>Загрузка готовых материалов</label><input class="field" style="width:100%;height:auto;padding:9px" name="materials" type="file" multiple accept=".pdf,.mp4,.mov,.zip,.scorm,.doc,.docx,.ppt,.pptx"><div class="hint">Демо сохраняет имена файлов. В рабочей версии нужен серверный модуль хранения и проверки файлов.</div>${item.materials?.length?`<div class="hint">Уже добавлены: ${esc(item.materials.join(", "))}</div>`:""}</div></div></form>`;
  modal(isEdit?"Настроить курс":"Создать курс или маршрут",body,`<button class="btn btn-outline" data-action="close-modal">Отмена</button><button class="btn" data-action="save-course" data-edit="${isEdit}">Сохранить и опубликовать</button>`);
}
function saveCourse() {
  const form=document.querySelector("#course-form"); if(!form)return;
  const fd=new FormData(form); const files=[...(form.elements.materials.files||[])].map(f=>f.name); const id=String(fd.get("id")||"");
  const existing=state.courses.find(c=>c.id===id); const item={ id:id||`course-${Date.now()}`,title:String(fd.get("title")).trim(),kind:String(fd.get("kind")),lessons:Number(fd.get("lessons")),due:String(fd.get("due")||""),description:String(fd.get("description")||""),progress:existing?.progress||0,accent:existing?.accent||"rose",status:"Опубликован",materials:files.length?files:(existing?.materials||[]) };
  if(existing) Object.assign(existing,item); else state.courses.push(item);
  audit(`${existing?"Обновлён":"Создан и опубликован"} курс «${item.title}» без дополнительного согласования`); save(); state.adminTab="courses"; document.querySelector(".modal-backdrop")?.remove(); render(); toast("Курс сохранён и опубликован");
}
function publishCourse(id) { const c=state.courses.find(x=>x.id===id); if(!c)return; c.status="Опубликован"; audit(`Опубликован курс «${c.title}»`); save(); render(); toast("Курс опубликован"); }

app.addEventListener("click", (event) => {
  const btn=event.target.closest("[data-action]"); if (!btn) return;
  if (btn.dataset.action === "confirm-delete-attempt") {
    const id=btn.dataset.id; const reason=String(document.querySelector("#delete-reason")?.value||"").trim(); if(!reason){toast("Укажите основание исключения");return;}
    const a=state.attempts.find(x=>x.id===id); a.deleted=true; a.counted=false; audit(`Попытка ${a.id} исключена из отчётов. Причина: ${reason}`); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Попытка исключена; запись сохранена в аудите");
  }
  if (btn.dataset.action === "confirm-redeem") {
    const r=state.motivation.rewards.find(x=>x.id===btn.dataset.id&&x.active); if(!r||r.stock<1||state.motivation.balance<r.cost){toast("Обмен сейчас недоступен");return;}
    r.stock-=1; recordPoints(-r.cost,`Обмен на награду: ${r.title}`); state.motivation.redemptions.unshift({id:`X-${Date.now()}`,rewardId:r.id,title:r.title,cost:r.cost,date:new Date().toISOString().slice(0,10),status:"Ожидает выдачи"}); audit(`Сотрудник оформил обмен на «${r.title}» за ${r.cost} баллов`); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Обмен оформлен; заявка ожидает выдачи");
  }
  if (btn.dataset.action === "confirm-bid") {
    const a=state.motivation.auctions.find(x=>x.id===btn.dataset.id&&x.active); const amount=Number(document.querySelector("#bid-amount")?.value);
    if(!a||!Number.isFinite(amount)||amount<a.currentBid+a.minStep||amount>state.motivation.balance){toast("Ставка не прошла проверку");return;}
    a.currentBid=amount; a.leader=demoEmployee.name; state.motivation.bids.unshift({id:`B-${Date.now()}`,auctionId:a.id,employee:demoEmployee.name,amount,date:new Date().toISOString().slice(0,10)}); save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Ставка принята; баллы пока не списаны");
  }
  if (btn.dataset.action === "save-reward") {
    const form=document.querySelector("#reward-form"); if(!form?.reportValidity())return; const fd=new FormData(form); state.motivation.rewards.push({id:`R-${Date.now()}`,title:String(fd.get("title")).trim(),category:String(fd.get("category")),cost:Number(fd.get("cost")),stock:Number(fd.get("stock")),active:true,icon:String(fd.get("icon")||"🎁")}); audit(`Добавлена награда «${fd.get("title") }»`); save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Награда добавлена в каталог");
  }
  if (btn.dataset.action === "save-points-rule") {
    const form=document.querySelector("#points-rule-edit-form"); if(!form?.reportValidity())return; const fd=new FormData(form); const rule=state.motivation.rules[Number(fd.get("index"))]; if(!rule)return;
    const version=++state.motivation.ruleVersion; rule.event=String(fd.get("event")).trim(); rule.points=Number(fd.get("points")); rule.version=version; audit(`Правило мотивации изменено: «${rule.event}», +${rule.points}, версия ${version}`); save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Изменения действуют для новых событий");
  }
  if (btn.dataset.action === "save-reward-edit") {
    const form=document.querySelector("#reward-edit-form"); if(!form?.reportValidity())return; const fd=new FormData(form); const reward=state.motivation.rewards.find(r=>r.id===fd.get("id")); if(!reward)return;
    Object.assign(reward,{title:String(fd.get("title")).trim(),category:String(fd.get("category")),cost:Number(fd.get("cost")),stock:Number(fd.get("stock")),icon:String(fd.get("icon")||"🎁")}); audit(`Изменена награда «${reward.title}», цена ${reward.cost}, остаток ${reward.stock}`); save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Каталог и остаток обновлены");
  }
  if (btn.dataset.action === "save-auction") {
    const form=document.querySelector("#auction-form"); if(!form?.reportValidity())return; const fd=new FormData(form); state.motivation.auctions.push({id:`A-${Date.now()}`,title:String(fd.get("title")).trim(),currentBid:Number(fd.get("bid")),minStep:Number(fd.get("step")),ends:String(fd.get("ends")),leader:"",active:true,stock:1,icon:String(fd.get("icon")||"🏆")}); audit(`Создан аукцион «${fd.get("title") }»`); save(); document.querySelector(".modal-backdrop")?.remove(); render(); toast("Аукцион опубликован");
  }
  if (btn.dataset.action === "close-auction") {
    const a=state.motivation.auctions.find(x=>x.id===btn.dataset.id&&x.active); if(!a)return;
    if(a.leader===demoEmployee.name){ if(state.motivation.balance<a.currentBid){toast("У победителя недостаточно баллов; проверьте ставку");return;} recordPoints(-a.currentBid,`Победа в аукционе: ${a.title}`); }
    a.active=false; a.winner=a.leader||"Нет ставок"; audit(`Аукцион «${a.title}» завершён. Победитель: ${a.winner}`); save(); render(); toast(`Аукцион завершён · ${a.winner}`);
  }
  if (btn.dataset.action === "save-org") {
    const name=String(document.querySelector("#new-org-form [name=name]")?.value||"").trim(); if(!name){toast("Введите название");return;} state.orgs.push(name); audit(`Создана организационная группа «${name}»`); save(); render(); toast("Группа создана");
  }
  if (btn.dataset.action === "save-role") {
    const name=String(document.querySelector("#new-role-form [name=name]")?.value||"").trim(); if(!name){toast("Введите название роли");return;} state.customRoles.push(name); audit(`Создана роль «${name}»`); save(); render(); toast("Роль создана");
  }
  if (btn.dataset.action === "save-course") saveCourse();
});

render();
