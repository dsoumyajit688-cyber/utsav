const $ = s => document.querySelector(s);
const KEY = "utsav_registrations";
let category = "All", current = null;

/* Utility functions */
const fmt = d => new Date(d).toLocaleString("en-IN", {day:"numeric", month:"short", year:"numeric", hour:"numeric", minute:"2-digit"});
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const upcoming = () => EVENTS.filter(e => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
const img = e => `<img src="${e.img}" alt="${esc(e.title)}" loading="lazy">`;

/* Theme toggle (saved in Local Storage) */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  const btn = $("#themeBtn");
  if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  localStorage.setItem("utsav_theme", t);
}
setTheme(localStorage.getItem("utsav_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

/* Responsive Navigation & Mobile Menu */
const menuToggle = $("#menuToggle");
const navMenu = $("#navMenu");

if (menuToggle && navMenu) {
  menuToggle.onclick = () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  };

  // Close mobile navigation when a nav link is clicked
  navMenu.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Close mobile navigation when clicking outside header
  document.addEventListener("click", e => {
    if (!e.target.closest(".nav") && navMenu.classList.contains("open")) {
      navMenu.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* Featured Events Section */
function renderFeatured() {
  const feat = EVENTS.filter(e => e.featured);
  const grid = $("#featuredGrid");
  if (!grid) return;
  grid.innerHTML = feat.map(e => `
    <article class="featured-card" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.title)} details">
      <div class="thumb">
        <span class="featured-pill">⭐ Featured</span>
        ${img(e)}
      </div>
      <div class="card-body">
        <span class="tag">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <p class="meta">
          <span>📅 ${fmt(e.date)}</span>
          <span>📍 ${esc(e.venue)}</span>
        </p>
        <p>${esc(e.desc)}</p>
        <button class="btn" type="button" aria-label="Register for ${esc(e.title)}">View and register</button>
      </div>
    </article>
  `).join("");
}

const featGrid = $("#featuredGrid");
if (featGrid) {
  featGrid.onclick = e => {
    const card = e.target.closest(".featured-card");
    if (card) openModal(+card.dataset.id);
  };
  featGrid.onkeydown = e => {
    if (e.key === "Enter" && e.target.classList.contains("featured-card")) {
      openModal(+e.target.dataset.id);
    }
  };
}

/* Category filter chips */
const cats = ["All", ...new Set(EVENTS.map(e => e.category))];
$("#chips").innerHTML = cats.map(c => `<button class="chip ${c === "All" ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
$("#chips").onclick = e => {
  if (!e.target.dataset.c) return;
  category = e.target.dataset.c;
  document.querySelectorAll(".chip").forEach(b => b.classList.toggle("on", b === e.target));
  render();
};
$("#search").oninput = render;

/* Upcoming Events Grid */
function render() {
  const q = $("#search").value.trim().toLowerCase();
  const list = upcoming().filter(e => (category === "All" || e.category === category) &&
    (e.title + e.venue + e.desc + e.category).toLowerCase().includes(q));
  $("#grid").innerHTML = list.map(e => `
    <article class="card" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.title)} details">
      <div class="thumb">${img(e)}</div>
      <div class="card-body">
        <span class="tag">${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <p class="meta">
          <span>📅 ${fmt(e.date)}</span>
          <span>📍 ${esc(e.venue)}</span>
        </p>
        <p>${esc(e.desc)}</p>
        <span class="btn">View and register</span>
      </div>
    </article>`).join("");
  $("#empty").hidden = list.length > 0;
}
$("#grid").onclick = e => { const c = e.target.closest(".card"); if (c) openModal(+c.dataset.id); };
$("#grid").onkeydown = e => { if (e.key === "Enter" && e.target.classList.contains("card")) openModal(+e.target.dataset.id); };

/* Modal dialog with details and form */
function openModal(id) {
  current = EVENTS.find(e => e.id === id);
  if (!current) return;
  $("#mImg").innerHTML = img(current);
  $("#mCat").textContent = current.category;
  $("#mTitle").textContent = current.title;
  $("#mMeta").textContent = `${fmt(current.date)} at ${current.venue}`;
  $("#mDesc").textContent = current.desc;
  $("#form").reset();
  $("#form").hidden = false;
  $("#done").hidden = true;
  $("#form").event.value = current.title;
  document.querySelectorAll("#form small").forEach(s => s.textContent = "");
  document.querySelectorAll("#form input").forEach(i => i.classList.remove("bad"));
  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
  $("#closeBtn").focus();
}

function closeModal() {
  $("#modal").hidden = true;
  document.body.style.overflow = "";
}

$("#closeBtn").onclick = closeModal;
$("#modal").onclick = e => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!$("#modal").hidden) closeModal();
    if (navMenu && navMenu.classList.contains("open")) {
      navMenu.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  }
});

/* Form validation */
const rules = {
  name: v => /^[A-Za-z][A-Za-z .'-]{2,}$/.test(v) ? "" : "Enter your full name (letters only, at least 3 characters).",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter a valid email like name@example.com.",
  phone: v => /^[6-9]\d{9}$/.test(v) ? "" : "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
};

function check(input) {
  const msg = rules[input.name] ? rules[input.name](input.value.trim()) : "";
  input.classList.toggle("bad", !!msg);
  if (input.nextElementSibling && input.nextElementSibling.tagName === "SMALL") {
    input.nextElementSibling.textContent = msg;
  }
  return !msg;
}

["name", "email", "phone"].forEach(n => {
  const field = $("#form")[n];
  if (field) field.addEventListener("input", e => check(e.target));
});

$("#form").phone.addEventListener("input", e => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

$("#form").onsubmit = e => {
  e.preventDefault();
  const f = e.target;
  const ok = ["name", "email", "phone"].map(n => check(f[n])).every(Boolean);
  if (!ok) return;

  const regs = JSON.parse(localStorage.getItem(KEY) || "[]");
  const emailVal = f.email.value.trim().toLowerCase();

  // Duplicate registration prevention for same event and email
  if (regs.some(r => r.eventId === current.id && r.email === emailVal)) {
    f.email.classList.add("bad");
    f.email.nextElementSibling.textContent = "This email is already registered for this event.";
    return;
  }

  const newReg = {
    eventId: current.id,
    event: current.title,
    eventDate: current.date,
    eventVenue: current.venue,
    name: f.name.value.trim(),
    email: emailVal,
    phone: f.phone.value,
    status: "Confirmed",
    at: Date.now()
  };

  regs.push(newReg);
  localStorage.setItem(KEY, JSON.stringify(regs));
  f.hidden = true;

  const d = $("#done");
  d.hidden = false;
  d.innerHTML = `
    <h3>You are registered!</h3>
    <p>Thanks, <b>${esc(newReg.name)}</b>. Your spot for <b>${esc(current.title)}</b> is confirmed.</p>
    <p style="margin-top:0.4rem; font-size:0.92rem;">Details have been sent to <b>${esc(newReg.email)}</b>.</p>
  `;

  renderRegs();
};

/* My registrations section */
function renderRegs() {
  const regs = JSON.parse(localStorage.getItem(KEY) || "[]");
  const list = $("#regList");
  const summary = $("#regSummary");
  if (!list) return;

  if (summary) {
    summary.textContent = regs.length ? `${regs.length} Active Registration${regs.length > 1 ? "s" : ""}` : "";
  }

  if (!regs.length) {
    list.innerHTML = `
      <div class="reg-empty">
        <p>You have not registered for any event yet. Pick one above to get started.</p>
        <a class="btn" href="#events">Browse upcoming events</a>
      </div>`;
    return;
  }

  list.innerHTML = regs.map((r, i) => {
    const eventObj = EVENTS.find(e => e.id === r.eventId);
    const eventTitle = r.event || (eventObj ? eventObj.title : "Event");
    const eventDate = r.eventDate || (eventObj ? eventObj.date : null);
    const displayEventDate = eventDate ? fmt(eventDate) : "Upcoming";
    const regDate = r.at ? fmt(r.at) : "Recent";
    const status = r.status || "Confirmed";
    const phone = r.phone || "Not provided";

    return `
      <article class="reg-card">
        <div class="reg-card-head">
          <h3>${esc(eventTitle)}</h3>
          <span class="status-badge confirmed">✓ ${esc(status)}</span>
        </div>
        <div class="reg-details">
          <div class="reg-item"><span class="reg-label">👤 Participant:</span><span class="reg-value">${esc(r.name)}</span></div>
          <div class="reg-item"><span class="reg-label">✉️ Email:</span><span class="reg-value">${esc(r.email)}</span></div>
          <div class="reg-item"><span class="reg-label">📞 Phone:</span><span class="reg-value">${esc(phone)}</span></div>
          <div class="reg-item"><span class="reg-label">📅 Event Date:</span><span class="reg-value">${displayEventDate}</span></div>
          <div class="reg-item"><span class="reg-label">🕒 Registered:</span><span class="reg-value">${regDate}</span></div>
        </div>
        <div class="reg-card-actions">
          <button class="btn-cancel" data-i="${i}" aria-label="Cancel registration for ${esc(eventTitle)}">Cancel Registration</button>
        </div>
      </article>
    `;
  }).join("");
}

$("#regList").onclick = e => {
  const cancelBtn = e.target.closest(".btn-cancel");
  if (!cancelBtn || cancelBtn.dataset.i === undefined) return;
  const idx = +cancelBtn.dataset.i;
  const regs = JSON.parse(localStorage.getItem(KEY) || "[]");
  regs.splice(idx, 1);
  localStorage.setItem(KEY, JSON.stringify(regs));
  renderRegs();
};

/* Live countdown to next upcoming event */
function tick() {
  const n = upcoming()[0];
  if (!n) {
    $("#nextTitle").textContent = "No upcoming events";
    $("#timer").innerHTML = "";
    return;
  }
  $("#nextTitle").textContent = n.title;
  $("#nextBtn").onclick = () => openModal(n.id);
  const s = Math.max(0, Math.floor((new Date(n.date) - new Date()) / 1000));
  const p = [
    ["Days", Math.floor(s / 86400)],
    ["Hours", Math.floor((s % 86400) / 3600)],
    ["Min", Math.floor((s % 3600) / 60)],
    ["Sec", s % 60]
  ];
  $("#timer").innerHTML = p.map(([l, v]) => `<div><b>${String(v).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
}

/* Initialize all views */
renderFeatured();
render();
renderRegs();
tick();
setInterval(tick, 1000);
