/* eslint-disable no-alert */
/**
 * SMART CITY INTELLIGENCE PLATFORM – Civic Problem Detection AI
 * Frontend-only SPA (no backend, no API calls)
 *
 * Pages:
 * - Landing
 * - Citizen Login/Register (UI only)
 * - Authority Login (UI only)
 * - Citizen Dashboard
 * - Authority Dashboard
 *
 * Data:
 * - Uses localStorage for "session" and citizen reports (mock persistence)
 */

// ----------------------------
// Utilities
// ----------------------------

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(
    16,
  )}`;
}

function severityToLabel(sev) {
  if (sev >= 75) return "Critical";
  if (sev >= 55) return "High";
  if (sev >= 35) return "Medium";
  return "Low";
}

function computeRiskScore({ severity, issueType }) {
  // Lightweight mock scoring (no ML). Higher severity boosts risk.
  const weights = {
    Pothole: 1.05,
    "Street Light Out": 0.85,
    "Garbage Overflow": 0.9,
    "Water Leakage": 1.0,
    "Traffic Signal Fault": 1.15,
    "Illegal Dumping": 0.95,
    "Road Crack": 0.92,
  };
  const w = weights[issueType] ?? 1.0;
  const noise = (Math.random() - 0.5) * 10; // +/- 5
  return clamp(Math.round(severity * w + noise), 0, 100);
}

function statusBadge(status) {
  const map = {
    Pending: ["badge badge--pending", "Pending"],
    Verified: ["badge badge--verified", "Verified"],
    Resolved: ["badge badge--resolved", "Resolved"],
    Flagged: ["badge badge--flagged", "Flagged"],
  };
  const [cls, label] = map[status] ?? ["badge", status];
  return `<span class="${cls}">${escapeHtml(label)}</span>`;
}

function icon(name) {
  // Inline SVG icons (no external library)
  const common =
    'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  if (name === "spark") {
    return `<svg ${common}><path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/></svg>`;
  }
  if (name === "upload") {
    return `<svg ${common}><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>`;
  }
  if (name === "pin") {
    return `<svg ${common}><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  }
  if (name === "shield") {
    return `<svg ${common}><path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z"/></svg>`;
  }
  if (name === "user") {
    return `<svg ${common}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>`;
  }
  if (name === "filter") {
    return `<svg ${common}><path d="M22 3H2l8 9v7l4 2v-9l8-9Z"/></svg>`;
  }
  if (name === "eye") {
    return `<svg ${common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
  if (name === "check") {
    return `<svg ${common}><path d="M20 6 9 17l-5-5"/></svg>`;
  }
  if (name === "flag") {
    return `<svg ${common}><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></svg>`;
  }
  if (name === "logout") {
    return `<svg ${common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`;
  }
  return "";
}

// ----------------------------
// Storage (mock persistence)
// ----------------------------

const storage = {
  getSession() {
    try {
      return JSON.parse(localStorage.getItem("scip_session") || "null");
    } catch {
      return null;
    }
  },
  setSession(session) {
    localStorage.setItem("scip_session", JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem("scip_session");
  },
  getReports() {
    try {
      return JSON.parse(localStorage.getItem("scip_reports") || "[]");
    } catch {
      return [];
    }
  },
  setReports(reports) {
    localStorage.setItem("scip_reports", JSON.stringify(reports));
  },
  seedIfEmpty() {
    const existing = this.getReports();
    if (existing.length > 0) return;
    const now = Date.now();
    const seeded = [
      {
        id: uid("rep"),
        createdAt: now - 1000 * 60 * 180,
        reporter: "demo.citizen@mock.local",
        issueType: "Pothole",
        severity: 76,
        riskScore: 84,
        locationQuery: "MG Road, Ward 12",
        locationText: "MG Road, Ward 12 • Bengaluru (mock)",
        status: "Verified",
        priorityRank: 2,
        imageName: "pothole_photo.jpg",
      },
      {
        id: uid("rep"),
        createdAt: now - 1000 * 60 * 95,
        reporter: "demo.citizen@mock.local",
        issueType: "Garbage Overflow",
        severity: 52,
        riskScore: 47,
        locationQuery: "Sector 18 Market",
        locationText: "Sector 18 Market • Noida (mock)",
        status: "Pending",
        priorityRank: 5,
        imageName: "bin_overflow.png",
      },
      {
        id: uid("rep"),
        createdAt: now - 1000 * 60 * 60,
        reporter: "someone@mock.local",
        issueType: "Traffic Signal Fault",
        severity: 88,
        riskScore: 95,
        locationQuery: "Ring Road Junction",
        locationText: "Ring Road Junction • Delhi (mock)",
        status: "Pending",
        priorityRank: 1,
        imageName: "signal.jpg",
      },
      {
        id: uid("rep"),
        createdAt: now - 1000 * 60 * 25,
        reporter: "another@mock.local",
        issueType: "Street Light Out",
        severity: 40,
        riskScore: 33,
        locationQuery: "Park Street",
        locationText: "Park Street • Kolkata (mock)",
        status: "Resolved",
        priorityRank: 8,
        imageName: "light.jpeg",
      },
    ];
    this.setReports(seeded);
  },
};

// ----------------------------
// Civic Rewards Points System
// ----------------------------

/**
 * Calculate total points for a user based on their reports.
 * Points structure:
 * - Report submission: +10 points (base)
 * - Verified status: +15 points
 * - Resolved status: +25 points
 */
function calculateUserPoints(email, reports) {
  const userReports = reports.filter((r) => r.reporter === email);

  const reportCount = userReports.length;
  const verifiedCount = userReports.filter((r) => r.status === "Verified").length;
  const resolvedCount = userReports.filter((r) => r.status === "Resolved").length;

  const reportPoints = reportCount * 10;
  const verifiedPoints = verifiedCount * 15;
  const resolvedPoints = resolvedCount * 25;
  const total = reportPoints + verifiedPoints + resolvedPoints;

  return {
    total,
    reportPoints,
    verifiedPoints,
    resolvedPoints,
    reportCount,
    verifiedCount,
    resolvedCount,
  };
}

/**
 * Update points for a specific user in their session (if logged in).
 * This is called after report submission or status changes.
 */
function updateUserPoints(email) {
  const session = storage.getSession();
  if (session && session.email === email && session.role === "citizen") {
    const reports = storage.getReports();
    const points = calculateUserPoints(email, reports);
    session.points = points;
    storage.setSession(session);
  }
}

// ----------------------------
// Router
// ----------------------------

const routes = {
  "/": renderLanding,
  "/citizen-login": renderCitizenAuth,
  "/authority-login": renderAuthorityAuth,
  "/municipal-login": renderMunicipalLogin,
  "/citizen-dashboard": renderCitizenDashboard,
  "/citizen-analytics": renderCitizenAnalytics,
  "/citizen-reports": renderCitizenReports,
  "/authority-dashboard": renderAuthorityDashboard,
  "/authority-analytics": renderAuthorityAnalytics,
  "/authority-reports": renderAuthorityReports,
};

function getRoute() {
  const hash = window.location.hash || "#/";
  const path = hash.replace(/^#/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

function navigate(path) {
  window.location.hash = path;
}

function requireRole(role, redirectTo) {
  const s = storage.getSession();
  if (!s || s.role !== role) {
    navigate(redirectTo);
    return false;
  }
  return true;
}

function render() {
  storage.seedIfEmpty();

  const appRoot = $("#appRoot");
  const route = getRoute();
  const handler = routes[route] ?? renderNotFound;
  appRoot.innerHTML = handler();
  wireCommon();
  wireRoute(route);
  updateSessionUI();
  // Focus main for accessibility after navigation
  $("#main")?.focus();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = String(new Date().getFullYear());
  render();
});

// ----------------------------
// Common UI wiring
// ----------------------------

function updateSessionUI() {
  const pill = $("#sessionPill");
  const logout = $("#navLogoutBtn");
  const s = storage.getSession();

  if (!s) {
    pill.style.display = "none";
    logout.style.display = "none";
    return;
  }
  pill.style.display = "inline-flex";
  logout.style.display = "inline-flex";
  pill.textContent =
    s.role === "citizen"
      ? `Citizen: ${s.email}`
      : `Authority: ${s.authorityId}`;
}

function wireCommon() {
  const logout = $("#navLogoutBtn");
  if (logout) {
    logout.onclick = () => {
      storage.clearSession();
      closeModal();
      navigate("/");
    };
  }
}

function wireRoute(route) {
  // Toggle body class so government page can hide the main topbar/footer
  document.body.classList.toggle("govMode", route === "/municipal-login");

  if (route === "/") wireLanding();
  if (route === "/citizen-login") wireCitizenAuth();
  if (route === "/authority-login") wireAuthorityAuth();
  if (route === "/municipal-login") wireMunicipalLogin();
  if (route === "/citizen-dashboard") wireCitizenDashboard();
  if (route === "/citizen-analytics") wireCitizenAnalytics();
  if (route === "/citizen-reports") wireCitizenReports();
  if (route === "/authority-dashboard") wireAuthorityDashboard();
  if (route === "/authority-analytics") wireAuthorityAnalytics();
  if (route === "/authority-reports") wireAuthorityReports();
}

// ----------------------------
// Modal
// ----------------------------

function openModal({ title, bodyHtml, actionsHtml }) {
  const modalRoot = $("#modalRoot");
  modalRoot.classList.add("is-open");
  modalRoot.setAttribute("aria-hidden", "false");
  modalRoot.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(
    title,
  )}">
      <div class="modal__head">
        <h3 class="modal__title">${escapeHtml(title)}</h3>
        <button class="btn btn--ghost" type="button" data-modal-close>
          Close
        </button>
      </div>
      <div class="modal__body">${bodyHtml}</div>
      <div class="modal__actions">
        ${actionsHtml || ""}
      </div>
    </div>
  `;

  modalRoot.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (t?.matches?.("[data-modal-close]")) closeModal();
      if (t === modalRoot) closeModal();
    },
    { once: true },
  );

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeModal();
    },
    { once: true },
  );
}

function closeModal() {
  const modalRoot = $("#modalRoot");
  modalRoot.classList.remove("is-open");
  modalRoot.setAttribute("aria-hidden", "true");
  modalRoot.innerHTML = "";
}

// ----------------------------
// Pages (templates)
// ----------------------------

/**
 * Reusable app shell for dashboard pages.
 * - Role-based navigation separation (Citizen vs Authority)
 * - "Analytics" and "Reports" are separate routes for clean UX
 */
function renderDashboardShell({ role, activePath, title, subtitle, contentHtml }) {
  const navItems =
    role === "citizen"
      ? [
        { label: "Dashboard", path: "/citizen-dashboard", iconName: "user" },
        { label: "Analytics", path: "/citizen-analytics", iconName: "spark" },
        { label: "Reports", path: "/citizen-reports", iconName: "filter" },
      ]
      : [
        { label: "Dashboard", path: "/authority-dashboard", iconName: "shield" },
        { label: "Analytics", path: "/authority-analytics", iconName: "spark" },
        { label: "Reports", path: "/authority-reports", iconName: "filter" },
      ];

  return `
    <section class="shell">
      <aside class="sidebar" aria-label="${role === "citizen" ? "Citizen navigation" : "Authority navigation"}">
        <div class="sidebar__card">
          <div class="sidebar__rolePill">
            ${role === "citizen" ? icon("user") : icon("shield")}
            <span>${role === "citizen" ? "Citizen" : "Authority"}</span>
          </div>
          <nav class="sideNav" aria-label="Dashboard pages">
            ${navItems
      .map(
        (i) => `
              <a class="sideNav__item ${activePath === i.path ? "is-active" : ""}" href="#${i.path}">
                <span class="sideNav__icon">${icon(i.iconName)}</span>
                <span class="sideNav__label">${escapeHtml(i.label)}</span>
              </a>
            `,
      )
      .join("")}
          </nav>
        </div>
      </aside>

      <div class="shell__main">
        <header class="pageHead">
          <div>
            <div class="kicker">${icon("spark")} Smart City • AI Insights (mock)</div>
            <h2 class="pageHead__title">${escapeHtml(title)}</h2>
            <p class="pageHead__sub">${escapeHtml(subtitle || "")}</p>
          </div>
        </header>

        ${contentHtml}
      </div>
    </section>
  `;
}

// ----------------------------
// Analytics: reusable UI (mock charts)
// ----------------------------

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function computeCitizenAnalytics(reports) {
  const total = reports.length;
  const verified = reports.filter((r) => r.status === "Verified").length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const avgRisk = avg(reports.map((r) => r.riskScore || 0));
  return { total, verified, resolved, avgRisk };
}

function groupCount(list, getKey) {
  const m = new Map();
  list.forEach((item) => {
    const k = getKey(item);
    m.set(k, (m.get(k) || 0) + 1);
  });
  return Array.from(m.entries()).map(([key, value]) => ({ key, value }));
}

function renderSummaryCards(cards) {
  return `
    <section class="grid grid--4">
      ${cards
      .map(
        (c) => `
        <div class="card">
          <div class="card__inner">
            <div class="rowBetween">
              <div class="muted">${escapeHtml(c.label)}</div>
              <span class="badge">${escapeHtml(c.badge || "Mock")}</span>
            </div>
            <div class="metric">
              <div class="metric__value"><span class="mono">${escapeHtml(c.value)}</span></div>
              ${c.sub ? `<div class="metric__sub">${escapeHtml(c.sub)}</div>` : ""}
            </div>
          </div>
        </div>
      `,
      )
      .join("")}
    </section>
  `;
}

/**
 * Lightweight inline SVG charts (no libraries).
 * These are UI-only representations.
 */
function renderBarChart({ title, series }) {
  const max = Math.max(1, ...series.map((d) => d.value));
  const bars = series
    .map((d) => {
      const pct = Math.round((d.value / max) * 100);
      return `
        <div class="barRow">
          <div class="barRow__label">${escapeHtml(d.key)}</div>
          <div class="barRow__bar" role="img" aria-label="${escapeHtml(d.key)}: ${escapeHtml(d.value)}">
            <div class="barRow__fill" style="width:${pct}%"></div>
          </div>
          <div class="barRow__value mono">${escapeHtml(d.value)}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">${escapeHtml(title)}</h3>
          <p class="card__sub">Bar chart (UI only) • Mock aggregation</p>
        </div>
        <span class="badge">${icon("filter")} Breakdown</span>
      </div>
      <div class="card__inner">
        <div class="barChart">${bars}</div>
      </div>
    </div>
  `;
}

function renderLineChart({ title, points }) {
  const w = 560;
  const h = 160;
  const pad = 16;
  const maxY = Math.max(1, ...points.map((p) => p.value));
  const minY = 0;
  const xStep = points.length <= 1 ? 1 : (w - pad * 2) / (points.length - 1);
  const scaleY = (v) => {
    const t = (v - minY) / (maxY - minY || 1);
    return h - pad - t * (h - pad * 2);
  };
  const d = points
    .map((p, i) => {
      const x = pad + i * xStep;
      const y = scaleY(p.value);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const last = points[points.length - 1];

  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">${escapeHtml(title)}</h3>
          <p class="card__sub">Line chart (UI only) • Mock time series</p>
        </div>
        <span class="badge">${escapeHtml(last ? `Latest: ${last.value}` : "—")}</span>
      </div>
      <div class="card__inner">
        <div class="lineChart" role="img" aria-label="${escapeHtml(title)}">
          <svg viewBox="0 0 ${w} ${h}" width="100%" height="160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="rgba(102, 227, 255, 0.95)" />
                <stop offset="1" stop-color="rgba(167, 139, 250, 0.95)" />
              </linearGradient>
              <linearGradient id="fillg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="rgba(102, 227, 255, 0.18)" />
                <stop offset="1" stop-color="rgba(167, 139, 250, 0.02)" />
              </linearGradient>
            </defs>
            <path d="${d} L ${pad + (points.length - 1) * xStep} ${h - pad} L ${pad} ${h - pad} Z" fill="url(#fillg)" />
            <path d="${d}" fill="none" stroke="url(#lineg)" stroke-width="3" stroke-linecap="round" />
          </svg>
          <div class="lineChart__labels">
            ${points
      .map((p) => `<span class="mono">${escapeHtml(p.label)}</span>`)
      .join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPieChart({ title, series }) {
  const total = Math.max(1, series.reduce((a, s) => a + s.value, 0));
  const colors = ["var(--aqua)", "var(--violet)", "var(--green)", "var(--amber)", "var(--red)"];
  let acc = 0;
  const slices = series
    .map((s, idx) => {
      const a0 = (acc / total) * Math.PI * 2;
      const a1 = ((acc + s.value) / total) * Math.PI * 2;
      acc += s.value;

      const r = 46;
      const cx = 60;
      const cy = 60;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(
        2,
      )} ${y1.toFixed(2)} Z`;

      return `<path d="${path}" fill="${colors[idx % colors.length]}" opacity="0.9"></path>`;
    })
    .join("");

  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">${escapeHtml(title)}</h3>
          <p class="card__sub">Pie chart (UI only) • Mock distribution</p>
        </div>
        <span class="badge">${icon("spark")} Mix</span>
      </div>
      <div class="card__inner">
        <div class="pieWrap">
          <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${escapeHtml(title)}">
            ${slices}
            <circle cx="60" cy="60" r="28" fill="rgba(7,10,18,0.95)"></circle>
          </svg>
          <div class="pieLegend">
            ${series
      .map((s, idx) => {
        const pct = Math.round((s.value / total) * 100);
        return `
                  <div class="pieLegend__item">
                    <span class="dot" style="background:${colors[idx % colors.length]}"></span>
                    <span>${escapeHtml(s.key)}</span>
                    <span class="mono pieLegend__pct">${escapeHtml(pct)}%</span>
                  </div>
                `;
      })
      .join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderHeatmap({ title, zones }) {
  return `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">${escapeHtml(title)}</h3>
          <p class="card__sub">Heatmap-style UI (no map/API) • High-risk zones (mock)</p>
        </div>
        <span class="badge badge--pending">High risk</span>
      </div>
      <div class="card__inner">
        <div class="heatmap">
          ${zones
      .map(
        (z) => `
            <div class="heatmap__cell" style="--heat:${escapeHtml(z.heat)}" role="img" aria-label="${escapeHtml(
          z.label,
        )}: heat ${escapeHtml(z.heat)}">
              <div class="heatmap__label">${escapeHtml(z.label)}</div>
              <div class="heatmap__meta mono">${escapeHtml(z.heat)}</div>
            </div>
          `,
      )
      .join("")}
        </div>
      </div>
    </div>
  `;
}

function renderLanding() {
  const s = storage.getSession();
  const quick =
    s?.role === "citizen"
      ? `<button class="btn btn--primary" type="button" id="goDash">Go to Citizen Dashboard</button>`
      : s?.role === "authority"
        ? `<button class="btn btn--violet" type="button" id="goDash">Go to Authority Dashboard</button>`
        : "";

  return `
    <section class="hero">
      <div class="heroGrid">
        <div class="heroCard">
          <div class="rowBetween">
            <div class="kicker">${icon("spark")} AI-powered civic intelligence</div>
            <div class="prototypeBadge" aria-label="Prototype mode using sample data">🧪 Prototype Mode – Sample Data</div>
          </div>
          <h1 class="h1" style="margin-top:12px;">Smart City Intelligence Platform</h1>
          <p class="lead">AI-powered civic problem detection and prioritization.</p>
          <div class="divider"></div>
          <div class="btnRow" style="margin-top:14px;">
            <button class="btn btn--primary" type="button" id="citizenBtn">
              ${icon("user")} Citizen Login
            </button>
            <button class="btn btn--violet" type="button" id="authorityBtn">
              ${icon("shield")} Authority Login
            </button>
            ${quick}
          </div>
          <div style="margin-top:14px;" class="muted">
            Demo flow: login screens are UI-only; dashboards use mock data and localStorage.
          </div>
        </div>

        <div class="heroStats">
          <!-- 
            Animated Logo Transition Component
            Positioned directly above the "Detection latency" card
            Displays three language variants (English, Hindi, Tamil) in a smooth loop.
            Only one logo visible at a time with fade + zoom transitions.
          -->
          <div class="logoWrapper">
            <div class="logoTransition" aria-label="Civic Kural logo in multiple languages">
              <div class="logoTransition__container">
                <img
                  src="./civic kural english.jpeg"
                  alt="Civic Kural - English"
                  class="logoTransition__img logoTransition__img--eng"
                />
                <img
                  src="./civic kural hindi.jpeg"
                  alt="Civic Kural - Hindi"
                  class="logoTransition__img logoTransition__img--hindi"
                />
                <img
                  src="./civic kural tamil.jpeg"
                  alt="Civic Kural - Tamil"
                  class="logoTransition__img logoTransition__img--tamil"
                />
                <div class="logoTransition__glow"></div>
              </div>
              <p class="logoCaption">Inclusive civic access across languages</p>
            </div>
          </div>
          <div class="heroNarrative">
            <div>
              <div class="heroNarrative__headline">AI-Powered Civic Issue Detection for Smarter Cities</div>
              <div class="heroNarrative__sub">Report issues. Prioritize risks. Resolve faster.</div>
            </div>
            <div class="heroNarrative__ctas">
              <button class="btn btn--primary" type="button" id="heroCitizenCta">
                ${icon("user")} Report an Issue (Citizen)
              </button>
              <button class="btn btn--violet" type="button" id="heroAuthorityCta">
                ${icon("shield")} View Authority Dashboard
              </button>
            </div>
          </div>
          <div class="stat">
            <div class="stat__label">Detection latency (mock)</div>
            <div class="stat__value">~1.2s</div>
            <div class="muted" style="margin-top:6px;">Issue type + severity preview</div>
          </div>
          <div class="stat">
            <div class="stat__label">Prioritization (mock)</div>
            <div class="stat__value">Ranked queue</div>
            <div class="muted" style="margin-top:6px;">Risk-driven sorting & filters</div>
          </div>
          <div class="stat">
            <div class="stat__label">Daily ops (mock)</div>
            <div class="stat__value">Summary cards</div>
            <div class="muted" style="margin-top:6px;">Today’s issues and resolutions</div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid--3" style="margin-top:18px;">
      <div class="card"><div class="card__inner">
        <div class="rowBetween">
          <strong>Detect</strong>
          <span class="badge">Computer Vision (mock)</span>
        </div>
        <p class="card__sub">Upload an image and preview detected issue type, severity, and risk score.</p>
      </div></div>
      <div class="card"><div class="card__inner">
        <div class="rowBetween">
          <strong>Prioritize</strong>
          <span class="badge">Risk Score 0–100</span>
        </div>
        <p class="card__sub">Queue issues by risk and severity, with filters for faster triage.</p>
      </div></div>
      <div class="card"><div class="card__inner">
        <div class="rowBetween">
          <strong>Resolve</strong>
          <span class="badge">Status workflow</span>
        </div>
        <p class="card__sub">Mark resolved or flag false reports (UI-only controls).</p>
      </div></div>
    </section>

    <section class="stack" style="margin-top:18px;">
      <div class="card">
        <div class="card__inner">
          <div class="rowBetween">
            <h2 class="card__title">Future Scope</h2>
            <span class="badge">${icon("spark")} Vision</span>
          </div>
          <p class="card__sub" style="margin-top:8px;">Planned extensions beyond this prototype.</p>
          <ul class="card__sub" style="margin-top:10px; padding-left:18px;">
            <li>🚀 Predictive risk mapping for emerging hotspots</li>
            <li>📡 IoT sensor integration for real-time signals</li>
            <li>📱 Mobile application for citizens & crews</li>
            <li>🏛 Government system APIs for seamless workflows</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

function renderCitizenAuth() {
  return `
    <section class="grid grid--2">
      <div class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Citizen Login</h2>
            <p class="card__sub">UI-only authentication with simple validation.</p>
          </div>
          <span class="badge">${icon("user")} Citizen</span>
        </div>
        <div class="card__inner">
          <div id="citizenAuthMsg"></div>
          <form class="form" id="citizenLoginForm" novalidate>
            <div class="field">
              <div class="labelRow">
                <label for="citizenEmail">Email</label>
                <span class="hint">e.g. demo.citizen@mock.local</span>
              </div>
              <input class="input" id="citizenEmail" name="email" type="email" autocomplete="email" placeholder="name@example.com" required />
            </div>
            <div class="field">
              <div class="labelRow">
                <label for="citizenPassword">Password</label>
                <span class="hint">min 6 chars</span>
              </div>
              <input class="input" id="citizenPassword" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
            </div>
            <div class="btnRow">
              <button class="btn btn--primary" type="submit">Login</button>
              <button class="btn btn--ghost" type="button" id="fillCitizenDemo">Use demo</button>
              <button class="btn btn--ghost" type="button" id="backHome">Back</button>
            </div>
            <div class="muted">
              New here? <a href="#/" class="mono">Register</a> (demo: this link only changes UI text)
              <button type="button" class="btn btn--ghost" id="registerLink" style="padding:8px 10px; margin-left:8px;">Register</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">What you can do</h2>
            <p class="card__sub">Civic issue upload, location selection, and tracking.</p>
          </div>
          <span class="badge">${icon("spark")} AI Preview</span>
        </div>
        <div class="card__inner">
          <div class="panel">
            <div class="rowBetween">
              <strong>Upload civic issue</strong>
              <span class="badge">Drag & drop</span>
            </div>
            <p class="card__sub">See a mock “Detected Issue” plus severity and risk score.</p>
          </div>
          <div class="panel" style="margin-top:12px;">
            <div class="rowBetween">
              <strong>Pick location</strong>
              <span class="badge">${icon("pin")} Map-style</span>
            </div>
            <p class="card__sub">Search bar UI with mock selected location.</p>
          </div>
          <div class="panel" style="margin-top:12px;">
            <div class="rowBetween">
              <strong>Track reports</strong>
              <span class="badge">Pending → Verified → Resolved</span>
            </div>
            <p class="card__sub">View your submitted issues with status badges and priority rank.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAuthorityAuth() {
  return `
    <section class="grid grid--2">
      <div class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Authority Login</h2>
            <p class="card__sub"><strong>Authority Access Only</strong> (UI-only validation).</p>
          </div>
          <span class="badge badge--flagged">${icon("shield")} Restricted</span>
        </div>
        <div class="card__inner">
          <div id="authorityAuthMsg"></div>
          <form class="form" id="authorityLoginForm" novalidate>
            <div class="field">
              <div class="labelRow">
                <label for="authorityId">Authority ID / Email</label>
                <span class="hint">e.g. AUTH-1024 or ops@city.gov</span>
              </div>
              <input class="input" id="authorityId" name="authorityId" type="text" placeholder="AUTH-1024" required />
            </div>
            <div class="field">
              <div class="labelRow">
                <label for="authorityPassword">Password</label>
                <span class="hint">min 6 chars</span>
              </div>
              <input class="input" id="authorityPassword" name="password" type="password" placeholder="••••••••" required />
            </div>
            <div class="btnRow">
              <button class="btn btn--violet" type="submit">Login</button>
              <button class="btn btn--ghost" type="button" id="fillAuthorityDemo">Use demo</button>
              <button class="btn btn--ghost" type="button" id="backHome2">Back</button>
            </div>
            <div class="muted">No real authentication is performed; this is a frontend prototype.</div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Operations dashboard</h2>
            <p class="card__sub">Prioritize, filter, and resolve issues (mock data).</p>
          </div>
          <span class="badge">${icon("filter")} Filters</span>
        </div>
        <div class="card__inner">
          <div class="panel">
            <div class="rowBetween">
              <strong>Issue priority table</strong>
              <span class="badge">Ranked</span>
            </div>
            <p class="card__sub">Sort by highest risk, location, issue type, status.</p>
          </div>
          <div class="panel" style="margin-top:12px;">
            <div class="rowBetween">
              <strong>Action panel</strong>
              <span class="badge">${icon("eye")} Details</span>
            </div>
            <p class="card__sub">View details, mark resolved, or flag false report.</p>
          </div>
          <div class="panel" style="margin-top:12px;">
            <div class="rowBetween">
              <strong>Daily updates</strong>
              <span class="badge">Summary</span>
            </div>
            <p class="card__sub">Cards: total today, high-risk, resolved.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ----------------------------
// Municipal (Government) Login Page
// ----------------------------

function renderMunicipalLogin() {
  // Generate a simple alphanumeric CAPTCHA
  const captchaChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let captchaVal = "";
  for (let i = 0; i < 5; i++) captchaVal += captchaChars[Math.floor(Math.random() * captchaChars.length)];
  // Store on window so the wiring function can verify it
  window._govCaptcha = captchaVal;

  return `
  <div class="govPage" role="document">

    <!-- ═══════════════════ GOVERNMENT HEADER ═══════════════════ -->
    <header class="govHdr" role="banner">
      <div class="govHdr__inner">
        <div class="govHdr__brand">
          <!-- Emblem placeholder -->
          <div class="govHdr__emblem" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <circle cx="32" cy="32" r="30" stroke="#1a3a6b" stroke-width="2.5" fill="#f7f3e8"/>
              <circle cx="32" cy="32" r="22" stroke="#1a3a6b" stroke-width="1.5" fill="none"/>
              <path d="M22 44 L22 28 L32 20 L42 28 L42 44 Z" fill="#1a3a6b" opacity="0.15"/>
              <rect x="27" y="36" width="10" height="8" rx="1" fill="#1a3a6b" opacity="0.7"/>
              <rect x="20" y="44" width="24" height="2" rx="0.5" fill="#1a3a6b"/>
              <path d="M32 20 L32 14" stroke="#c47f17" stroke-width="2" stroke-linecap="round"/>
              <circle cx="32" cy="13" r="2" fill="#c47f17"/>
              <path d="M18 31 Q32 25 46 31" stroke="#1a3a6b" stroke-width="1" fill="none" opacity="0.5"/>
              <text x="32" y="56" text-anchor="middle" font-size="5" fill="#1a3a6b" font-family="serif" font-weight="bold">सत्यमेव जयते</text>
            </svg>
          </div>
          <div class="govHdr__titles">
            <div class="govHdr__corp">MUNICIPAL CORPORATION</div>
            <div class="govHdr__dept">CITIZEN GRIEVANCE &amp; CIVIC SERVICES</div>
            <div class="govHdr__sub">Authority Administration Portal</div>
          </div>
        </div>
        <nav class="govHdr__utils" aria-label="Utility navigation">
          <a href="#/municipal-login" class="govHdr__util">English</a>
          <span class="govHdr__sep">|</span>
          <a href="#/municipal-login" class="govHdr__util" lang="hi">हिंदी</a>
          <span class="govHdr__sep">|</span>
          <a href="#/municipal-login" class="govHdr__util" lang="ta">தமிழ்</a>
          <span class="govHdr__sep">|</span>
          <a href="#/municipal-login" class="govHdr__util">Accessibility</a>
          <span class="govHdr__sep">|</span>
          <a href="#/municipal-login" class="govHdr__util">Help</a>
          <span class="govHdr__sep">|</span>
          <a href="#/municipal-login" class="govHdr__util">Contact Us</a>
        </nav>
      </div>
      <!-- Saffron-white-green tricolor stripe -->
      <div class="govHdr__stripe" aria-hidden="true">
        <div class="govHdr__stripe-saffron"></div>
        <div class="govHdr__stripe-white"></div>
        <div class="govHdr__stripe-green"></div>
      </div>
    </header>

    <!-- ═══════════════════ GOVERNMENT NAV ═══════════════════ -->
    <nav class="govNav" aria-label="Primary navigation">
      <div class="govNav__inner">
        <a href="#/" class="govNav__link">Home</a>
        <a href="#/municipal-login" class="govNav__link">About Us</a>
        <a href="#/municipal-login" class="govNav__link">Departments</a>
        <a href="#/citizen-login" class="govNav__link">Citizen Services</a>
        <a href="#/municipal-login" class="govNav__link">Grievances</a>
        <a href="#/municipal-login" class="govNav__link">Notices</a>
        <a href="#/municipal-login" class="govNav__link govNav__link--active" aria-current="page">Authority Login</a>
        <a href="#/municipal-login" class="govNav__link">Contact</a>
      </div>
    </nav>

    <!-- ═══════════════════ BREADCRUMB & PAGE TITLE ═══════════════════ -->
    <div class="govBreadcrumb">
      <div class="govBreadcrumb__inner">
        <span><a href="#/" class="govBreadcrumb__link">Home</a></span>
        <span class="govBreadcrumb__sep">›</span>
        <span>Authority Login</span>
      </div>
    </div>

    <div class="govPageTitle">
      <div class="govPageTitle__inner">
        <h1 class="govPageTitle__h1">MUNICIPAL LOGIN</h1>
        <hr class="govPageTitle__hr" />
        <p class="govPageTitle__sub">Municipal Corporation – Authorized Personnel Portal</p>
        <div class="govNotice govNotice--info" role="note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          This portal is intended for authorized municipal personnel only. Unauthorized access is strictly prohibited.
        </div>
      </div>
    </div>

    <!-- ═══════════════════ MAIN CONTENT ═══════════════════ -->
    <main class="govMain" id="govMainContent" tabindex="-1">
      <div class="govMain__inner">

        <!-- Login Panel -->
        <section class="govLoginPanel" aria-labelledby="govLoginHeading">
          <div class="govLoginPanel__head">
            <h2 class="govLoginPanel__title" id="govLoginHeading">MUNICIPAL PERSONNEL LOGIN</h2>
            <p class="govLoginPanel__subtitle">Please enter your official credentials to access the Municipal Grievance Management System.</p>
          </div>

          <div id="govAuthMsg" role="alert" aria-live="polite"></div>

          <form class="govForm" id="govLoginForm" novalidate autocomplete="off">

            <!-- Official User ID -->
            <div class="govField">
              <label class="govLabel" for="govUserId">
                OFFICIAL USER ID <span class="govLabel__req" aria-hidden="true">*</span>
              </label>
              <input
                class="govInput"
                id="govUserId"
                name="userId"
                type="text"
                placeholder="Enter Official ID (e.g. AUTH-1024)"
                required
                autocomplete="username"
                aria-required="true"
              />
            </div>

            <!-- Password -->
            <div class="govField">
              <label class="govLabel" for="govPassword">
                PASSWORD <span class="govLabel__req" aria-hidden="true">*</span>
              </label>
              <div class="govInputWrap">
                <input
                  class="govInput"
                  id="govPassword"
                  name="password"
                  type="password"
                  placeholder="Enter Password"
                  required
                  autocomplete="current-password"
                  aria-required="true"
                />
                <button type="button" class="govInputWrap__eye" id="govTogglePass" aria-label="Show or hide password" title="Toggle password visibility">
                  <svg id="govEyeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <!-- Department -->
            <div class="govField">
              <label class="govLabel" for="govDepartment">
                DEPARTMENT <span class="govLabel__req" aria-hidden="true">*</span>
              </label>
              <select class="govSelect" id="govDepartment" name="department" required aria-required="true">
                <option value="">— Select Department —</option>
                <option value="Municipal Administration">Municipal Administration</option>
                <option value="Roads &amp; Infrastructure">Roads &amp; Infrastructure</option>
                <option value="Electrical Department">Electrical Department</option>
                <option value="Sanitation Department">Sanitation Department</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Drainage Department">Drainage Department</option>
                <option value="Grievance Cell">Grievance Cell</option>
              </select>
            </div>

            <!-- CAPTCHA -->
            <div class="govField">
              <label class="govLabel" for="govCaptchaInput">
                CAPTCHA VERIFICATION <span class="govLabel__req" aria-hidden="true">*</span>
              </label>
              <div class="govCaptcha">
                <div class="govCaptcha__display" id="govCaptchaDisplay" aria-label="CAPTCHA code">${captchaVal}</div>
                <button type="button" class="govCaptcha__refresh" id="govCaptchaRefresh" title="Refresh CAPTCHA" aria-label="Refresh CAPTCHA">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0020.49 15"/></svg>
                  Refresh
                </button>
              </div>
              <input
                class="govInput govInput--captcha"
                id="govCaptchaInput"
                name="captcha"
                type="text"
                placeholder="Enter CAPTCHA shown above"
                required
                autocomplete="off"
                aria-required="true"
                maxlength="6"
                style="text-transform:uppercase; letter-spacing:3px;"
              />
            </div>

            <!-- Remember + Forgot -->
            <div class="govCheckRow">
              <label class="govCheck">
                <input type="checkbox" id="govRemember" name="remember" />
                <span>Remember this device</span>
              </label>
              <a href="#/municipal-login" class="govForgot">Forgot Password?</a>
            </div>

            <!-- Submit -->
            <button type="submit" class="govBtn" id="govSubmitBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              LOGIN
            </button>

            <div class="govBtn__note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Authorized Access Only
            </div>

            <div class="govDemoRow">
              <button type="button" class="govDemoBtn" id="govDemoFill">Use Demo Credentials</button>
              <a href="#/" class="govDemoBtn">← Back to Home</a>
            </div>

          </form>
        </section>

        <!-- Info Panel -->
        <aside class="govInfoPanel" aria-labelledby="govInfoHeading">
          <div class="govInfoPanel__head">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <h2 class="govInfoPanel__title" id="govInfoHeading">IMPORTANT INFORMATION</h2>
          </div>
          <ul class="govInfoPanel__list">
            <li>This portal is for authorized municipal personnel only.</li>
            <li>Do not share your login credentials with any other person.</li>
            <li>All activities performed through this portal are recorded for administrative and audit purposes.</li>
            <li>Unauthorized access or misuse of this system is a punishable offence.</li>
            <li>For technical support, contact your department's IT helpdesk.</li>
          </ul>
          <div class="govInfoPanel__divider"></div>
          <div class="govInfoPanel__section">
            <strong>Helpdesk</strong>
            <p>Monday – Saturday: 9:30 AM – 6:00 PM</p>
            <p>📞 1800-XXX-XXXX (Toll-free)</p>
            <p>✉ helpdesk@municipal.gov.in</p>
          </div>
          <div class="govInfoPanel__divider"></div>
          <div class="govInfoPanel__section">
            <strong>Supported Departments</strong>
            <p>Roads · Sanitation · Electrical · Water Supply · Drainage · Grievance Cell · Municipal Administration</p>
          </div>
          <div class="govInfoPanel__badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Secured Portal · SSL Encrypted
          </div>
        </aside>

      </div>
    </main>

    <!-- ═══════════════════ GOVERNMENT FOOTER ═══════════════════ -->
    <footer class="govFooter" role="contentinfo">
      <div class="govFooter__top">
        <div class="govFooter__brand">
          <div class="govFooter__name">Municipal Corporation</div>
          <div class="govFooter__tagline">Citizen Grievance &amp; Civic Services Portal</div>
        </div>
        <nav class="govFooter__links" aria-label="Footer navigation">
          <a href="#/municipal-login" class="govFooter__link">Privacy Policy</a>
          <a href="#/municipal-login" class="govFooter__link">Terms of Use</a>
          <a href="#/municipal-login" class="govFooter__link">Accessibility</a>
          <a href="#/municipal-login" class="govFooter__link">Website Policies</a>
          <a href="#/municipal-login" class="govFooter__link">Contact Us</a>
          <a href="#/municipal-login" class="govFooter__link">Helpdesk</a>
        </nav>
      </div>
      <div class="govFooter__bottom">
        <p>© 2026 Municipal Corporation. All Rights Reserved.</p>
        <p>Content owned and maintained by Municipal Corporation. Website designed and developed for civic service delivery.</p>
        <p class="govFooter__lastUpdated">Last Updated: October 2026 &nbsp;|&nbsp; Version 3.1.0</p>
      </div>
    </footer>

  </div><!-- /.govPage -->
  `;
}

function renderCitizenDashboard() {
  if (!requireRole("citizen", "/citizen-login")) return "";
  const s = storage.getSession();
  const reports = storage
    .getReports()
    .filter((r) => r.reporter === s.email)
    .sort((a, b) => b.createdAt - a.createdAt);

  const a = computeCitizenAnalytics(reports);
  const byType = groupCount(reports, (r) => r.issueType || "Unknown").sort(
    (x, y) => y.value - x.value,
  );
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    // mock trend: count of reports that match the day; if none, show small baseline
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const value = reports.filter((r) => r.createdAt >= start.getTime() && r.createdAt <= end.getTime()).length;
    return { label: label.replace(/\s/g, ""), value: value || Math.round(1 + Math.random() * 3) };
  });
  const resolvedByCitizen = reports.filter((r) => r.status === "Resolved").length;

  // Calculate rewards points
  const points = calculateUserPoints(s.email, storage.getReports());

  const contentHtml = `
    <section class="stack">
      <div class="card card--shimmer">
        <div class="card__header">
          <div>
            <h3 class="card__title">Analytics (Citizen)</h3>
            <p class="card__sub">At-a-glance insights for your submitted reports (dummy data).</p>
          </div>
          <span class="badge">${icon("spark")} Analytics</span>
        </div>
        <div class="card__inner">
          ${renderSummaryCards([
    { label: "Total Issues Reported", value: a.total, badge: "Reports" },
    { label: "Issues Verified", value: a.verified, badge: "Verified" },
    { label: "Issues Resolved", value: a.resolved, badge: "Resolved" },
    { label: "Average Risk Score", value: `${a.avgRisk} / 100`, badge: "Risk" },
  ])}

          <div class="card card--rewards" style="margin-top:14px;">
            <div class="card__header">
              <div>
                <h3 class="card__title">Civic Rewards Points</h3>
                <p class="card__sub">Earn points for meaningful civic participation.</p>
              </div>
              <div class="rewardsTotal">
                <span class="rewardsTotal__value mono">${escapeHtml(points.total)}</span>
                <span class="rewardsTotal__label">Total Points</span>
              </div>
            </div>
            <div class="card__inner">
              <div class="rewardsGrid">
                <div class="rewardItem">
                  <div class="rewardItem__val mono">${escapeHtml(points.reportCount)}</div>
                  <div class="rewardItem__label">Report +10</div>
                </div>
                <div class="rewardItem">
                  <div class="rewardItem__val mono">${escapeHtml(points.verifiedCount)}</div>
                  <div class="rewardItem__label">Verified +15</div>
                </div>
                <div class="rewardItem">
                  <div class="rewardItem__val mono">${escapeHtml(points.resolvedCount)}</div>
                  <div class="rewardItem__label">Resolved +25</div>
                </div>
              </div>
            </div>
          </div>
          <div class="panel" style="margin-top:14px;">
            <div class="rowBetween">
              <div>
                <strong>Your Impact</strong>
                <p class="card__sub" style="margin-top:4px;">Your reports helped resolve <span class="mono">${escapeHtml(
    String(resolvedByCitizen || 6),
  )}</span> civic issues (mock).</p>
              </div>
              <span class="badge badge--resolved">Citizen trust &amp; transparency</span>
            </div>
            <ul class="statusTimeline" aria-label="Example status journey for a report">
              <li class="statusTimeline__step statusTimeline__step--active">
                <div class="statusTimeline__pill">Reported</div>
                <span>Submitted by citizen</span>
              </li>
              <li class="statusTimeline__step">
                <div class="statusTimeline__pill">Verified</div>
                <span>Checked by authority</span>
              </li>
              <li class="statusTimeline__step">
                <div class="statusTimeline__pill">In Progress</div>
                <span>Work order created</span>
              </li>
              <li class="statusTimeline__step">
                <div class="statusTimeline__pill">Resolved</div>
                <span>Closed on the ground</span>
              </li>
            </ul>
          </div>
          <div class="grid grid--2" style="margin-top:16px;">
            ${renderBarChart({ title: "Issues by Type", series: byType.length ? byType : [{ key: "Pothole", value: 0 }] })}
            ${renderLineChart({ title: "Reports over time (last 7 days)", points: last7 })}
          </div>
        </div>
      </div>

      <section class="grid grid--2">
        <div class="stack">
          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Upload Civic Issue</h3>
                <p class="card__sub">Drag & drop an image to preview detection (mock).</p>
              </div>
              <span class="badge">${icon("spark")} AI Preview</span>
            </div>
            <div class="card__inner">
              <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-label="Upload civic issue image">
                <div class="dropzone__icon">${icon("upload")}</div>
                <div class="dropzone__title">Drop an image here</div>
                <div class="dropzone__sub">or click to choose a file (JPG/PNG/WebP)</div>
                <div class="filePill" id="filePill">No file selected</div>
                <input id="fileInput" type="file" accept="image/*" hidden />
              </div>

              <div class="panel" style="margin-top:14px;">
                <label for="issueTypeSelect" class="card__title" style="display:block; margin-bottom:8px;">Select Problem Type</label>
                <select id="issueTypeSelect" class="inputField">
                  <option value="">-- Choose a problem type --</option>
                  <option value="Pothole">Pothole</option>
                  <option value="Street Light Out">Street Light Out</option>
                  <option value="Garbage Overflow">Garbage Overflow</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Traffic Signal Fault">Traffic Signal Fault</option>
                  <option value="Illegal Dumping">Illegal Dumping</option>
                  <option value="Road Crack">Road Crack</option>
                  <option value="__custom__">✏️ Other (describe it yourself…)</option>
                </select>
                <div id="customIssueRow" style="display:none; margin-top:10px;">
                  <input
                    id="customIssueInput"
                    type="text"
                    class="inputField"
                    placeholder="e.g. Broken footpath, Open manhole, Fallen tree…"
                    maxlength="60"
                    style="width:100%;"
                  />
                  <div class="muted" style="font-size:0.78em; margin-top:4px;">Describe the civic issue in a few words</div>
                </div>
              </div>

              <div class="grid grid--assessment" style="margin-top:14px;">
                <div class="panel">
                  <div class="rowBetween">
                    <strong>Selected Problem</strong>
                    <span class="badge" id="issueLabelPlaceholder">—</span>
                  </div>
                  <p class="card__sub" style="margin-top:4px;" id="issueLabel">Example placeholder: “Detected Issue: Pothole”</p>
                </div>

                <div class="panel">
                  <div class="progressRow">
                    <div class="progressMeta">
                      <span><strong>Severity</strong> (<span class="mono" id="severityPct">0</span>%)</span>
                      <span class="badge" id="severityLabel">${escapeHtml(severityToLabel(0))}</span>
                    </div>
                    <div class="progressBar" aria-label="Severity progress">
                      <div id="severityBar" style="width:0%"></div>
                    </div>
                  </div>
                  <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
                    <span class="muted" id="aiSeverityNote" style="font-size:0.82em;"></span>
                    <button class="btn btn--ghost" type="button" id="overrideSevBtn" style="font-size:0.8em; padding:3px 10px; display:none;">
                      ✏️ Override
                    </button>
                    <button class="btn btn--ghost" type="button" id="resetSevBtn" style="font-size:0.8em; padding:3px 10px; display:none; color:var(--clr-warning,#e88);">
                      ↩ Use AI value
                    </button>
                  </div>
                  <div id="severityOverrideRow" style="display:none; margin-top:10px; padding:10px; background:var(--clr-surface2,#1e1e2e); border-radius:8px; border:1px solid var(--clr-border,#333);">
                    <label for="severitySlider" style="display:block; font-size:0.85em; margin-bottom:6px; font-weight:600;">
                      Custom Severity: <span id="sliderValueLabel" class="mono">Low</span> (<span id="sliderPctLabel" class="mono">20</span>%)
                    </label>
                    <input type="range" id="severitySlider" min="0" max="100" value="20" step="1"
                      style="width:100%; accent-color:var(--clr-primary,#7c3aed); cursor:pointer;" />
                    <div style="display:flex; justify-content:space-between; font-size:0.75em; margin-top:4px;" class="muted">
                      <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
                    </div>
                  </div>
                </div>

                <div class="panel">
                  <div class="rowBetween">
                    <strong>Risk Score</strong>
                    <span class="badge"><span class="mono" id="riskScore">0</span> / 100</span>
                  </div>
                  <p class="card__sub">Risk score is a mock calculation from severity + issue type.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Location Selection</h3>
                <p class="card__sub">Auto-detected from photo GPS · or search manually.</p>
              </div>
              <span class="badge">${icon("pin")} Location</span>
            </div>
            <div class="card__inner">
              <div class="searchBar">
                <span class="searchBar__icon">${icon("pin")}</span>
                <input id="locationInput" type="text" placeholder="Search location (e.g., MG Road, Ward 12)" />
              </div>
              <div id="geotagStatus" style="display:none; margin-top:8px;"></div>
              <div class="searchResult">
                <div class="muted">
                  Selected: <span class="mono" id="locationText">—</span>
                </div>
                <button class="btn btn--ghost" type="button" id="useMockLocation">Use mock suggestion</button>
              </div>
              <div class="divider"></div>
              <div class="btnRow">
                <button class="btn btn--primary" type="button" id="reportBtn" disabled>
                  Report Issue
                </button>
                <button class="btn btn--ghost" type="button" id="resetDraft">Reset</button>
              </div>
              <div class="muted" style="margin-top:10px;">
                Tip: choose an image and a location to enable “Report Issue”.
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">My Reports</h3>
              <p class="card__sub">Your previously reported issues (mock, stored locally).</p>
            </div>
            <span class="badge">${icon("user")} ${escapeHtml(s.email)}</span>
          </div>
          <div class="card__inner">
            <div class="stack" id="myReports">
              ${reports.length === 0
      ? `<div class="panel"><div class="muted">No reports yet. Upload an image and submit your first report.</div></div>`
      : reports
        .map(
          (r) => `
                  <div class="panel">
                    <div class="rowBetween">
                      <div>
                        <strong>${escapeHtml(r.issueType)}</strong>
                        <div class="muted">Submitted ${escapeHtml(formatDateTime(r.createdAt))}</div>
                      </div>
                      <div class="rowBetween">
                        ${statusBadge(r.status)}
                        <span class="badge">Priority: <span class="mono">#${escapeHtml(r.priorityRank)}</span></span>
                      </div>
                    </div>
                    <div class="divider"></div>
                    <div class="rowBetween">
                      <span class="muted">Severity: <span class="mono">${escapeHtml(r.severity)}%</span> (${escapeHtml(
            severityToLabel(r.severity),
          )})</span>
                      <span class="muted">Risk: <span class="mono">${escapeHtml(r.riskScore)}</span>/100</span>
                    </div>
                    <div class="muted" style="margin-top:8px;">${escapeHtml(r.locationText)}</div>
                  </div>
                `,
        )
        .join("")
    }
            </div>
          </div>
        </div>
      </section>
    </section>
  `;

  return renderDashboardShell({
    role: "citizen",
    activePath: "/citizen-dashboard",
    title: "Citizen Dashboard",
    subtitle: "Report issues, track status, and view basic analytics (mock).",
    contentHtml,
  });
}

function renderAuthorityDashboard() {
  if (!requireRole("authority", "/authority-login")) return "";
  const reports = storage.getReports();
  const active = reports.filter((r) => r.status !== "Resolved" && r.status !== "Flagged");
  const highRisk = active.filter((r) => (r.riskScore || 0) >= 75);

  // "today" metrics (mock)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayTs = startOfToday.getTime();
  const resolvedToday = reports.filter((r) => r.status === "Resolved" && r.createdAt >= todayTs);
  const falseFlagged = reports.filter((r) => r.status === "Flagged").length;

  const byType = groupCount(active, (r) => r.issueType || "Unknown").sort((a, b) => b.value - a.value);
  const incoming7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const value = reports.filter((r) => r.createdAt >= start.getTime() && r.createdAt <= end.getTime()).length;
    return { label: label.slice(0, 3), value: value || Math.round(4 + Math.random() * 8) };
  });

  const ranked = computeRanks(
    active
      .slice()
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0) || b.createdAt - a.createdAt)
      .map((r) => ({
        ...r,
        // dummy confidence + crowd verification for UI
        confidence: r.confidence ?? clamp(Math.round(72 + Math.random() * 26), 0, 100),
        crowdVerified: r.crowdVerified ?? Math.round(2 + Math.random() * 18),
      })),
  );

  const zones = [
    { label: "Ward 12", heat: 92 },
    { label: "Ring Rd", heat: 88 },
    { label: "Sector 18", heat: 74 },
    { label: "Old Town", heat: 61 },
    { label: "Tech Park", heat: 83 },
    { label: "Station", heat: 69 },
    { label: "Market", heat: 77 },
    { label: "Airport", heat: 58 },
  ];

  const cityRiskRatio = active.length === 0 ? 0 : highRisk.length / active.length;
  const cityRisk =
    cityRiskRatio === 0
      ? { label: "Low", level: "low", description: "City risk is calm based on current data (mock)." }
      : cityRiskRatio < 0.35
        ? { label: "Medium", level: "medium", description: "Some high-risk issues require attention (mock)." }
        : { label: "High", level: "high", description: "City risk is elevated • focus on critical issues (mock)." };

  const topCritical = ranked.slice(0, 3);

  const contentHtml = `
    <section class="stack">
      <div class="card card--shimmer">
        <div class="card__header">
          <div>
            <h3 class="card__title">Analytics Overview</h3>
            <p class="card__sub">Operational snapshot for triage and response (mock data).</p>
          </div>
          <span class="badge">${icon("spark")} Overview</span>
        </div>
        <div class="card__inner">
          <div class="rowBetween" style="margin-bottom:12px;">
            <div>
              <div class="muted">City Risk Status (mock)</div>
              <div style="margin-top:6px;">
                <span class="riskStatus riskStatus--${escapeHtml(
    cityRisk.level,
  )}"><span class="riskStatus__dot"></span>${escapeHtml(cityRisk.label)} Risk</span>
              </div>
              <p class="card__sub" style="margin-top:6px;">${escapeHtml(cityRisk.description)}</p>
            </div>
            <div class="panel" style="min-width:220px;">
              <strong>Resolved Today</strong>
              <div class="metric" style="margin-top:6px;">
                <div class="metric__value"><span class="mono">${escapeHtml(
    String(resolvedToday.length),
  )}</span></div>
                <div class="metric__sub">Issues successfully closed (mock)</div>
              </div>
            </div>
          </div>
          <div class="panel" style="margin-bottom:14px;">
            <div class="rowBetween">
              <strong>Top 3 Critical Issues</strong>
              <span class="badge badge--flagged">${icon("flag")} Highest risk first</span>
            </div>
            <div class="criticalList" style="margin-top:10px;">
              ${topCritical.length === 0
      ? `<div class="muted">No active critical issues at the moment (mock).</div>`
      : topCritical
        .map((r) => {
          const riskLevel =
            (r.riskScore || 0) >= 75
              ? "high"
              : (r.riskScore || 0) >= 40
                ? "medium"
                : "low";
          return `
                          <div class="criticalList__item">
                            <div class="criticalList__main">
                              <span class="criticalList__label">${escapeHtml(r.issueType)}</span>
                              <span class="criticalList__meta mono">${escapeHtml(
            r.locationQuery || r.locationText || "Unknown",
          )}</span>
                            </div>
                            <span class="criticalList__risk criticalList__risk--${escapeHtml(
            riskLevel,
          )}">${escapeHtml(String(r.riskScore || 0))}</span>
                          </div>
                        `;
        })
        .join("")
    }
            </div>
          </div>
          ${renderSummaryCards([
      { label: "Total Active Issues", value: active.length, badge: "Active" },
      { label: "High Risk Issues", value: highRisk.length, badge: "Risk ≥ 75" },
      { label: "Issues Resolved Today", value: resolvedToday.length, badge: "Today" },
      { label: "False Reports Flagged", value: falseFlagged, badge: "Flagged" },
    ])}
          <div class="grid grid--2" style="margin-top:16px;">
            ${renderPieChart({ title: "Issue Type Distribution", series: byType.length ? byType : [{ key: "Pothole", value: 1 }] })}
            ${renderLineChart({ title: "Daily Incoming Reports (last 7 days)", points: incoming7 })}
          </div>
          <div style="margin-top:16px;">
            ${renderHeatmap({ title: "High-Risk Zones (Heatmap UI)", zones })}
          </div>
        </div>
      </div>

      <section class="grid grid--2">
        <div class="card">
          <div class="card__header">
            <div>
              <h3 class="card__title">Priority Issue Table</h3>
              <p class="card__sub">Ranked by risk score (mock). Select a row to enable actions.</p>
            </div>
            <span class="badge">${icon("filter")} Priority</span>
          </div>
          <div class="card__inner">
            <div class="tableWrap">
              <table aria-label="Priority issue table">
                <thead>
                  <tr>
                    <th>Priority Rank</th>
                    <th>Issue Type</th>
                    <th>Severity %</th>
                    <th>Risk Score</th>
                    <th>Location</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="issueRows">
                  ${ranked
      .map(
        (r) => `
                    <tr data-issue-id="${escapeHtml(r.id)}">
                      <td><span class="badge">#<span class="mono">${escapeHtml(r.priorityRank)}</span></span></td>
                      <td>
                        <strong>${escapeHtml(r.issueType)}</strong>
                        <div class="tableTiny">${escapeHtml(formatDateTime(r.createdAt))}</div>
                      </td>
                      <td>
                        <div class="miniProgress" aria-label="Severity ${escapeHtml(r.severity)}%">
                          <div class="miniProgress__meta">
                            <span class="mono">${escapeHtml(r.severity)}%</span>
                            <span class="badge">${escapeHtml(severityToLabel(r.severity))}</span>
                          </div>
                          <div class="miniProgress__bar"><div style="width:${escapeHtml(
          clamp(r.severity, 0, 100),
        )}%"></div></div>
                        </div>
                      </td>
                      <td><span class="badge"><span class="mono">${escapeHtml(r.riskScore)}</span>/100</span></td>
                      <td>${escapeHtml(r.locationText)}</td>
                      <td><span class="badge"><span class="mono">${escapeHtml(r.confidence)}%</span></span></td>
                      <td>${statusBadge(r.status)}</td>
                    </tr>
                  `,
      )
      .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Issue Actions</h3>
                <p class="card__sub">Actions are UI-only; status changes persist locally.</p>
              </div>
              <span class="badge">${icon("eye")} Actions</span>
            </div>
            <div class="card__inner">
              <div class="panel">
                <div class="muted">Selected issue:</div>
                <div style="margin-top:8px;">
                  <strong id="selTitle">None</strong>
                  <div class="muted" id="selMeta">Select a row in the table.</div>
                </div>
              </div>
              <div class="btnRow" style="margin-top:12px;">
                <button class="btn btn--ghost" type="button" id="viewDetailsBtn" disabled>${icon("eye")} View Details</button>
                <button class="btn btn--ghost" type="button" id="assignTeamBtn" disabled>${icon("spark")} Assign Team</button>
                <button class="btn btn--primary" type="button" id="markResolvedBtn" disabled>${icon("check")} Mark as Resolved</button>
                <button class="btn btn--violet" type="button" id="flagFalseBtn" disabled>${icon("flag")} Flag as False Report</button>
              </div>
              <div class="muted" style="margin-top:12px;">
                Tip: “Assign Team” opens a mock confirmation modal (no backend).
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div>
                <h3 class="card__title">Workflow hints</h3>
                <p class="card__sub">A lightweight triage loop for high-risk issues.</p>
              </div>
              <span class="badge">${icon("spark")} Guide</span>
            </div>
            <div class="card__inner">
              <div class="panel"><strong>1) Review</strong><div class="muted">Open details and confirm AI type + confidence.</div></div>
              <div class="panel" style="margin-top:12px;"><strong>2) Assign</strong><div class="muted">Assign the right team (roads/sanitation/electrical).</div></div>
              <div class="panel" style="margin-top:12px;"><strong>3) Resolve</strong><div class="muted">Mark resolved or flag false reports (mock state).</div></div>
            </div>
          </div>
        </div>
      </section>
    </section>
  `;

  return renderDashboardShell({
    role: "authority",
    activePath: "/authority-dashboard",
    title: "Authority Dashboard",
    subtitle: "Analytics overview, priority queue, and action panel (mock).",
    contentHtml,
  });
}

function renderNotFound() {
  return `
    <section class="card">
      <div class="card__inner">
        <h2 class="card__title">Page not found</h2>
        <p class="card__sub">The page you requested doesn't exist in this prototype.</p>
        <div class="btnRow" style="margin-top:12px;">
          <button class="btn btn--ghost" type="button" id="goHome">Go Home</button>
        </div>
      </div>
    </section>
  `;
}

// ----------------------------
// Wiring: Landing
// ----------------------------

function wireLanding() {
  $("#citizenBtn")?.addEventListener("click", () => navigate("/citizen-login"));
  $("#authorityBtn")?.addEventListener("click", () => navigate("/authority-login"));
  $("#goDash")?.addEventListener("click", () => {
    const s = storage.getSession();
    if (!s) return;
    navigate(s.role === "citizen" ? "/citizen-dashboard" : "/authority-dashboard");
  });
  $("#heroCitizenCta")?.addEventListener("click", () => navigate("/citizen-login"));
  $("#heroAuthorityCta")?.addEventListener("click", () => navigate("/authority-dashboard"));
}

// ----------------------------
// Wiring: Not Found
// ----------------------------

// Small helper: if route is unknown, wire up "Go Home"
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t?.id === "goHome") navigate("/");
});

// ----------------------------
// Wiring: Citizen Auth (UI only)
// ----------------------------

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function wireCitizenAuth() {
  $("#backHome")?.addEventListener("click", () => navigate("/"));
  $("#fillCitizenDemo")?.addEventListener("click", () => {
    $("#citizenEmail").value = "demo.citizen@mock.local";
    $("#citizenPassword").value = "demo123";
  });
  $("#registerLink")?.addEventListener("click", () => {
    const msg = $("#citizenAuthMsg");
    msg.innerHTML = `<div class="success">Register UI (demo): fill the form and click Login. No backend is called.</div>`;
  });

  $("#citizenLoginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#citizenEmail").value.trim();
    const password = $("#citizenPassword").value;
    const msg = $("#citizenAuthMsg");
    msg.innerHTML = "";

    const errs = [];
    if (!validEmail(email)) errs.push("Please enter a valid email address.");
    if (password.length < 6) errs.push("Password must be at least 6 characters.");
    if (errs.length) {
      msg.innerHTML = `<div class="error">${escapeHtml(errs.join(" "))}</div>`;
      return;
    }

    // UI-only "login" - store session
    storage.setSession({ role: "citizen", email });
    msg.innerHTML = `<div class="success">Logged in (mock). Redirecting…</div>`;
    setTimeout(() => navigate("/citizen-dashboard"), 400);
  });
}

// ----------------------------
// Wiring: Authority Auth (UI only)
// ----------------------------

function wireAuthorityAuth() {
  $("#backHome2")?.addEventListener("click", () => navigate("/"));
  $("#fillAuthorityDemo")?.addEventListener("click", () => {
    $("#authorityId").value = "AUTH-1024";
    $("#authorityPassword").value = "ops12345";
  });

  $("#authorityLoginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const authorityId = $("#authorityId").value.trim();
    const password = $("#authorityPassword").value;
    const msg = $("#authorityAuthMsg");
    msg.innerHTML = "";

    const errs = [];
    if (authorityId.length < 4) errs.push("Please enter a valid Authority ID/Email.");
    if (password.length < 6) errs.push("Password must be at least 6 characters.");
    if (errs.length) {
      msg.innerHTML = `<div class="error">${escapeHtml(errs.join(" "))}</div>`;
      return;
    }

    storage.setSession({ role: "authority", authorityId });
    msg.innerHTML = `<div class="success">Authority access granted (mock). Redirecting…</div>`;
    setTimeout(() => navigate("/authority-dashboard"), 400);
  });
}

// ----------------------------
// Wiring: Municipal (Government) Login
// ----------------------------

function wireMunicipalLogin() {
  const form       = $("#govLoginForm");
  const msgEl      = $("#govAuthMsg");
  const passInput  = $("#govPassword");
  const toggleBtn  = $("#govTogglePass");
  const eyeIcon    = $("#govEyeIcon");
  const captchaEl  = $("#govCaptchaDisplay");
  const captchaIn  = $("#govCaptchaInput");
  const refreshBtn = $("#govCaptchaRefresh");
  const demoBtn    = $("#govDemoFill");

  // Helper: generate a new CAPTCHA
  function refreshCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let val = "";
    for (let i = 0; i < 5; i++) val += chars[Math.floor(Math.random() * chars.length)];
    window._govCaptcha = val;
    if (captchaEl) captchaEl.textContent = val;
    if (captchaIn) captchaIn.value = "";
  }

  // Password toggle (eye icon)
  toggleBtn?.addEventListener("click", () => {
    const isPass = passInput.type === "password";
    passInput.type = isPass ? "text" : "password";
    eyeIcon.innerHTML = isPass
      ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  });

  // CAPTCHA refresh button
  refreshBtn?.addEventListener("click", refreshCaptcha);

  // Demo fill button
  demoBtn?.addEventListener("click", () => {
    const uid  = $("#govUserId");
    const pwd  = $("#govPassword");
    const dept = $("#govDepartment");
    if (uid)  uid.value  = "AUTH-1024";
    if (pwd)  pwd.value  = "ops12345";
    if (dept) dept.value = "Grievance Cell";
    if (captchaIn && window._govCaptcha) captchaIn.value = window._govCaptcha;
  });

  // Form submission — identical auth logic to wireAuthorityAuth
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!msgEl) return;
    msgEl.innerHTML = "";

    const authorityId  = ($("#govUserId")?.value  || "").trim();
    const password     = ($("#govPassword")?.value || "");
    const dept         = ($("#govDepartment")?.value || "").trim();
    const captchaTyped = (captchaIn?.value || "").trim().toUpperCase();

    const errs = [];
    if (authorityId.length < 4) errs.push("Please enter a valid Official User ID (minimum 4 characters).");
    if (password.length < 6)    errs.push("Password must be at least 6 characters.");
    if (!dept)                  errs.push("Please select your Department.");
    if (!captchaTyped || captchaTyped !== (window._govCaptcha || "")) {
      errs.push("CAPTCHA verification failed. Please try again.");
      refreshCaptcha();
    }

    if (errs.length) {
      msgEl.innerHTML = `<div class="govMsg govMsg--error"><strong>Error:</strong> ${escapeHtml(errs.join(" "))}</div>`;
      return;
    }

    // Show loading state
    const submitBtn = $("#govSubmitBtn");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Verifying…"; }
    msgEl.innerHTML = `<div class="govMsg govMsg--info">Authenticating credentials… Please wait.</div>`;

    // Same session mechanism as wireAuthorityAuth → redirects to authority-dashboard
    setTimeout(() => {
      storage.setSession({ role: "authority", authorityId, department: dept });
      msgEl.innerHTML = `<div class="govMsg govMsg--success">✓ Access Granted. Redirecting to dashboard…</div>`;
      setTimeout(() => navigate("/authority-dashboard"), 600);
    }, 800);
  });
}

// ----------------------------
// EXIF GPS extraction (pure JS, no library)
// Parses JPEG APP1/EXIF binary to find GPSLatitude/GPSLongitude
// ----------------------------

/**
 * Reads GPS coordinates from a JPEG File's EXIF data.
 * Returns { lat, lng } or null if no GPS data found.
 */
function extractExifGps(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.includes("jpeg") && !file.type.includes("jpg")) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target.result;
        const view = new DataView(buf);

        // JPEG must start with FFD8
        if (view.getUint16(0) !== 0xFFD8) { resolve(null); return; }

        let offset = 2;
        const len = view.byteLength;

        while (offset < len - 2) {
          const marker = view.getUint16(offset);
          offset += 2;

          // APP1 marker = 0xFFE1 (contains EXIF)
          if (marker === 0xFFE1) {
            const segLen = view.getUint16(offset);
            // Check for "Exif\0\0" header
            const exifHeader = String.fromCharCode(
              view.getUint8(offset + 2), view.getUint8(offset + 3),
              view.getUint8(offset + 4), view.getUint8(offset + 5),
            );
            if (exifHeader !== "Exif") { offset += segLen; continue; }

            // TIFF header starts 8 bytes into the APP1 segment (after length + "Exif\0\0")
            const tiffStart = offset + 8; // offset is at segment length field
            const endian = view.getUint16(tiffStart);
            const littleEndian = endian === 0x4949;

            const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
            const gps = parseGpsFromIfd(view, tiffStart, tiffStart + ifdOffset, littleEndian);
            resolve(gps);
            return;
          }

          // Skip other segments
          if ((marker & 0xFF00) !== 0xFF00) { resolve(null); return; }
          offset += view.getUint16(offset);
        }
        resolve(null);
      } catch (_) {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

function parseGpsFromIfd(view, tiffStart, ifdStart, le) {
  try {
    const numEntries = view.getUint16(ifdStart, le);
    let gpsIfdOffset = null;

    // Scan IFD0 for GPS IFD pointer (tag 0x8825)
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      if (tag === 0x8825) {
        gpsIfdOffset = view.getUint32(entryOffset + 8, le);
        break;
      }
    }
    if (gpsIfdOffset === null) return null;

    const gpsIfdStart = tiffStart + gpsIfdOffset;
    const gpsEntries = view.getUint16(gpsIfdStart, le);

    let latRef = null, latVal = null, lngRef = null, lngVal = null;

    for (let i = 0; i < gpsEntries; i++) {
      const entryOffset = gpsIfdStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      const type = view.getUint16(entryOffset + 2, le);
      const count = view.getUint32(entryOffset + 4, le);
      const valOffset = entryOffset + 8;

      if (tag === 1 || tag === 3) {
        // GPSLatitudeRef / GPSLongitudeRef — ASCII, 2 chars
        const ref = String.fromCharCode(view.getUint8(valOffset));
        if (tag === 1) latRef = ref; else lngRef = ref;
      }

      if (tag === 2 || tag === 4) {
        // GPSLatitude / GPSLongitude — RATIONAL[3]: deg, min, sec
        // RATIONAL = 2 × LONG (numerator, denominator), 8 bytes each
        const dataOffset = tiffStart + view.getUint32(valOffset, le);
        const deg = view.getUint32(dataOffset, le) / view.getUint32(dataOffset + 4, le);
        const min = view.getUint32(dataOffset + 8, le) / view.getUint32(dataOffset + 12, le);
        const sec = view.getUint32(dataOffset + 16, le) / view.getUint32(dataOffset + 20, le);
        const decimal = deg + min / 60 + sec / 3600;
        if (tag === 2) latVal = decimal; else lngVal = decimal;
      }
    }

    if (latVal === null || lngVal === null) return null;
    const lat = latRef === "S" ? -latVal : latVal;
    const lng = lngRef === "W" ? -lngVal : lngVal;
    // Sanity check
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
  } catch (_) {
    return null;
  }
}

/**
 * Reverse-geocodes { lat, lng } to a human-readable address string
 * using Nominatim (free, no API key). Resolves to a string or null.
 */
async function reverseGeocode({ lat, lng }) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "CivicKural/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Build a short readable label
    const a = data.address || {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.county,
      a.state,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : data.display_name || null;
  } catch (_) {
    return null;
  }
}

// ----------------------------
// Wiring: Citizen Dashboard
// ----------------------------

function wireCitizenDashboard() {
  if (!requireRole("citizen", "/citizen-login")) return;

  // Draft state (only in-memory until "Report Issue")
  const draft = {
    file: null,
    imageName: null,
    issueType: null,
    severity: 0,
    riskScore: 0,
    locationQuery: "",
    locationText: "",
  };

  // Tracks AI's original severity so we can revert to it
  let aiSeverity = 0;
  let isOverriding = false;

  const issueTypes = [
    "Pothole",
    "Street Light Out",
    "Garbage Overflow",
    "Water Leakage",
    "Traffic Signal Fault",
    "Illegal Dumping",
    "Road Crack",
  ];

  const dropzone = $("#dropzone");
  const fileInput = $("#fileInput");
  const filePill = $("#filePill");
  const issueTypeSelect = $("#issueTypeSelect");
  const issueLabel = $("#issueLabel");
  const issueLabelPlaceholder = $("#issueLabelPlaceholder");
  const severityPct = $("#severityPct");
  const severityBar = $("#severityBar");
  const severityLabel = $("#severityLabel");
  const riskScore = $("#riskScore");
  const locationInput = $("#locationInput");
  const locationText = $("#locationText");
  const reportBtn = $("#reportBtn");
  const overrideSevBtn = $("#overrideSevBtn");
  const resetSevBtn = $("#resetSevBtn");
  const severityOverrideRow = $("#severityOverrideRow");
  const severitySlider = $("#severitySlider");
  const sliderValueLabel = $("#sliderValueLabel");
  const sliderPctLabel = $("#sliderPctLabel");
  const aiSeverityNote = $("#aiSeverityNote");
  let scanTimer = null;
  let isScanning = false;

  function updateDraftUI() {
    if (isScanning) {
      if (issueLabelPlaceholder) issueLabelPlaceholder.textContent = "Scanning…";
      issueLabel.textContent = "Analyzing image and data…";
      severityPct.textContent = "0";
      severityBar.style.width = "0%";
      severityLabel.textContent = "Scanning";
      riskScore.textContent = "0";
      // Hide override controls while scanning
      if (overrideSevBtn) overrideSevBtn.style.display = "none";
      if (resetSevBtn) resetSevBtn.style.display = "none";
      if (severityOverrideRow) severityOverrideRow.style.display = "none";
      if (aiSeverityNote) aiSeverityNote.textContent = "";
    } else {
      if (issueLabelPlaceholder) issueLabelPlaceholder.textContent = draft.issueType ? "Detected" : "—";
      issueLabel.textContent = draft.issueType ? `Detected Issue: ${draft.issueType}` : "—";
      severityPct.textContent = String(draft.severity);
      severityBar.style.width = `${draft.severity}%`;
      severityLabel.textContent = severityToLabel(draft.severity);
      riskScore.textContent = String(draft.riskScore);

      // Show/hide override controls only when a result exists
      if (draft.issueType) {
        if (isOverriding) {
          if (aiSeverityNote) aiSeverityNote.textContent = `AI suggested: ${aiSeverity}% (${severityToLabel(aiSeverity)})`;
          if (overrideSevBtn) overrideSevBtn.style.display = "none";
          if (resetSevBtn) resetSevBtn.style.display = "inline-flex";
          if (severityOverrideRow) severityOverrideRow.style.display = "block";
        } else {
          if (aiSeverityNote) aiSeverityNote.textContent = "AI detected severity";
          if (overrideSevBtn) overrideSevBtn.style.display = "inline-flex";
          if (resetSevBtn) resetSevBtn.style.display = "none";
          if (severityOverrideRow) severityOverrideRow.style.display = "none";
        }
      } else {
        if (overrideSevBtn) overrideSevBtn.style.display = "none";
        if (resetSevBtn) resetSevBtn.style.display = "none";
        if (severityOverrideRow) severityOverrideRow.style.display = "none";
        if (aiSeverityNote) aiSeverityNote.textContent = "";
      }
    }
    const locTextElem = $("#locationText");
    if (locTextElem) locTextElem.textContent = draft.locationText ? draft.locationText : "—";

    const canSubmit = Boolean(draft.file && draft.locationText && draft.issueType);
    reportBtn.disabled = !canSubmit;
  }

  // Update slider label when user drags
  function updateSliderLabel(val) {
    if (sliderValueLabel) sliderValueLabel.textContent = severityToLabel(val);
    if (sliderPctLabel) sliderPctLabel.textContent = String(val);
  }

  // Wire override button — show slider panel initialised at current AI severity
  overrideSevBtn?.addEventListener("click", () => {
    isOverriding = true;
    if (severitySlider) {
      severitySlider.value = String(aiSeverity);
      updateSliderLabel(aiSeverity);
    }
    updateDraftUI();
  });

  // Wire reset button — revert to AI severity
  resetSevBtn?.addEventListener("click", () => {
    isOverriding = false;
    draft.severity = aiSeverity;
    draft.riskScore = computeRiskScore({ severity: draft.severity, issueType: draft.issueType });
    updateDraftUI();
  });

  // Wire slider — live update severity as user drags
  severitySlider?.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    updateSliderLabel(val);
    draft.severity = val;
    draft.riskScore = computeRiskScore({ severity: draft.severity, issueType: draft.issueType });
    // Update progress bar live
    severityPct.textContent = String(val);
    severityBar.style.width = `${val}%`;
    severityLabel.textContent = severityToLabel(val);
    riskScore.textContent = String(draft.riskScore);
  });

  function simulateDetection(selectedType) {
    // Mock AI detection results
    draft.issueType = selectedType || issueTypes[Math.floor(Math.random() * issueTypes.length)];
    draft.severity = clamp(Math.round(25 + Math.random() * 70), 0, 100);
    // Store AI result separately so it can be recalled after manual override
    aiSeverity = draft.severity;
    isOverriding = false;
    draft.riskScore = computeRiskScore({
      severity: draft.severity,
      issueType: draft.issueType,
    });
    if (issueTypeSelect) issueTypeSelect.value = draft.issueType;
    updateDraftUI();
  }

  const customIssueRow = $("#customIssueRow");
  const customIssueInput = $("#customIssueInput");

  issueTypeSelect?.addEventListener("change", (e) => {
    const val = e.target.value;

    // Show or hide the custom text input
    if (val === "__custom__") {
      if (customIssueRow) customIssueRow.style.display = "block";
      if (customIssueInput) customIssueInput.focus();
      // Don't trigger scanning yet — wait for user to type
      draft.issueType = null;
      updateDraftUI();
      return;
    }

    // Hide the custom input when a predefined type is chosen
    if (customIssueRow) customIssueRow.style.display = "none";
    if (customIssueInput) customIssueInput.value = "";

    if (val) {
      if (scanTimer) clearTimeout(scanTimer);
      isScanning = true;
      updateDraftUI();

      scanTimer = setTimeout(() => {
        isScanning = false;
        simulateDetection(val);
      }, 1500);
    }
  });

  // Live-update issueType as user types their custom problem
  customIssueInput?.addEventListener("input", (e) => {
    const typed = e.target.value.trim();
    draft.issueType = typed || null;
    // Recompute risk with the typed label (uses default weight 1.0)
    if (typed) {
      draft.riskScore = computeRiskScore({ severity: draft.severity, issueType: typed });
    }
    updateDraftUI();
  });

  function acceptFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG/PNG/WebP).");
      return;
    }

    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }

    draft.file = file;
    draft.imageName = file.name;
    filePill.textContent = file.name;

    // Interactive AI "Scanning" state (2s) before mock detection results
    isScanning = true;
    dropzone.classList.add("is-scanning");
    dropzone.setAttribute("aria-busy", "true");

    // Reset the last results while scanning
    draft.issueType = null;
    draft.severity = 0;
    draft.riskScore = 0;
    updateDraftUI();

    // ---- EXIF GPS extraction ----
    const geotagStatus = $("#geotagStatus");
    if (geotagStatus) {
      geotagStatus.style.display = "block";
      geotagStatus.innerHTML = `<span class="muted">📡 Reading photo GPS data…</span>`;
    }

    extractExifGps(file).then(async (gps) => {
      if (!gps) {
        // No GPS data in this photo
        if (geotagStatus) {
          geotagStatus.innerHTML = `<span class="muted">📷 No GPS data in photo — enter location manually.</span>`;
        }
        return;
      }

      // GPS found — show coords immediately
      if (geotagStatus) {
        geotagStatus.innerHTML = `<span class="muted">📍 GPS found (${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}) — looking up address…</span>`;
      }

      // Reverse geocode
      const address = await reverseGeocode(gps);
      const locationLabel = address || `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`;

      // Auto-fill location fields
      draft.locationText = locationLabel;
      draft.locationQuery = locationLabel;
      if (locationInput) locationInput.value = locationLabel;

      if (geotagStatus) {
        geotagStatus.innerHTML = `
          <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background:var(--clr-success-bg, #ecfdf5); color:var(--clr-success, #065f46); border-radius:6px; font-size:0.85em;">
            📍 <strong>Location auto-detected from photo:</strong> ${escapeHtml(locationLabel)}
          </span>`;
      }

      updateDraftUI();
    });

    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      isScanning = false;
      dropzone.classList.remove("is-scanning");
      dropzone.setAttribute("aria-busy", "false");
      simulateDetection();
    }, 2000);
  }

  // Drag & drop behaviors
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
    const file = e.dataTransfer?.files?.[0];
    acceptFile(file);
  });
  fileInput.addEventListener("change", () => acceptFile(fileInput.files?.[0]));

  // Location behaviors
  locationInput.addEventListener("input", () => {
    draft.locationQuery = locationInput.value;
    // Keep "selected" empty until user uses suggestion or presses enter.
    updateDraftUI();
  });
  locationInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (locationInput.value.trim().length < 3) return;
      // Pick a mock formatted location
      draft.locationText = `${locationInput.value.trim()} • (mock)`;
      updateDraftUI();
    }
  });
  $("#useMockLocation")?.addEventListener("click", () => {
    const mocks = [
      "MG Road, Ward 12 • Bengaluru (mock)",
      "Sector 18 Market • Noida (mock)",
      "Ring Road Junction • Delhi (mock)",
      "Park Street • Kolkata (mock)",
      "Airport Road • Hyderabad (mock)",
    ];
    const pick = mocks[Math.floor(Math.random() * mocks.length)];
    draft.locationText = pick;
    draft.locationQuery = pick.split(" • ")[0];
    locationInput.value = draft.locationQuery;
    updateDraftUI();
  });

  $("#resetDraft")?.addEventListener("click", () => {
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    isScanning = false;
    dropzone.classList.remove("is-scanning");
    dropzone.setAttribute("aria-busy", "false");

    draft.file = null;
    draft.imageName = null;
    draft.issueType = null;
    draft.severity = 0;
    draft.riskScore = 0;
    draft.locationQuery = "";
    draft.locationText = "";
    // Reset override state
    aiSeverity = 0;
    isOverriding = false;
    // Reset custom issue type
    if (customIssueInput) customIssueInput.value = "";
    if (customIssueRow) customIssueRow.style.display = "none";
    if (issueTypeSelect) issueTypeSelect.value = "";
    filePill.textContent = "No file selected";
    locationInput.value = "";
    // Clear geotag status banner
    const geotagStatus = $("#geotagStatus");
    if (geotagStatus) { geotagStatus.style.display = "none"; geotagStatus.innerHTML = ""; }
    updateDraftUI();
  });

  $("#reportBtn")?.addEventListener("click", () => {
    const s = storage.getSession();
    if (!s) return;

    const reports = storage.getReports();
    const newReport = {
      id: uid("rep"),
      createdAt: Date.now(),
      reporter: s.email,
      issueType: draft.issueType ?? "Pothole",
      severity: draft.severity,
      riskScore: draft.riskScore,
      locationQuery: draft.locationQuery || "Unknown",
      locationText: draft.locationText || "Unknown (mock)",
      status: "Pending",
      priorityRank: 999, // recomputed in authority view; kept for citizen display
      imageName: draft.imageName || "upload.jpg",
    };
    reports.push(newReport);

    // Recompute priority rank globally so citizen can see a meaningful rank indicator
    const ranked = computeRanks(
      reports
        .filter((r) => r.status !== "Flagged")
        .slice()
        .sort((a, b) => b.riskScore - a.riskScore || b.createdAt - a.createdAt),
    );
    // apply ranks back to storage objects by id
    const rankMap = new Map(ranked.map((r) => [r.id, r.priorityRank]));
    const updated = reports.map((r) => ({
      ...r,
      priorityRank: rankMap.get(r.id) ?? r.priorityRank ?? 999,
    }));
    storage.setReports(updated);

    // Award +10 points for report submission
    updateUserPoints(s.email);

    openModal({
      title: "Issue reported (mock)",
      bodyHtml: `
        <div class="panel panel--successBurst">
          <div class="rowBetween">
            <strong>${escapeHtml(newReport.issueType)}</strong>
            ${statusBadge(newReport.status)}
          </div>
          <div class="divider"></div>
          <div class="rowBetween">
            <span class="muted">Severity: <span class="mono">${escapeHtml(
        newReport.severity,
      )}%</span></span>
            <span class="muted">Risk: <span class="mono">${escapeHtml(
        newReport.riskScore,
      )}</span>/100</span>
          </div>
          <div class="muted" style="margin-top:8px;">Location: <span class="mono">${escapeHtml(
        newReport.locationText,
      )}</span></div>
          <div class="muted" style="margin-top:8px;">Image: <span class="mono">${escapeHtml(
        newReport.imageName,
      )}</span></div>
        </div>
      `,
      actionsHtml: `
        <button class="btn btn--primary" type="button" data-modal-close>Done</button>
      `,
    });

    // Refresh view to show in "My Reports"
    render();
  });

  updateDraftUI();
}

// ----------------------------
// Wiring: Authority Dashboard
// ----------------------------

function computeRanks(sorted) {
  return sorted.map((r, idx) => ({ ...r, priorityRank: idx + 1 }));
}

function wireAuthorityDashboard() {
  if (!requireRole("authority", "/authority-login")) return;

  let selectedId = null;

  const rowsBody = $("#issueRows");
  const selTitle = $("#selTitle");
  const selMeta = $("#selMeta");

  const viewBtn = $("#viewDetailsBtn");
  const assignBtn = $("#assignTeamBtn");
  const resolvedBtn = $("#markResolvedBtn");
  const flagBtn = $("#flagFalseBtn");

  function renderRows() {
    // The Authority Dashboard table is rendered server-side (template) and doesn't
    // currently re-render on filter changes. We keep selection styling only.
    $$("#issueRows tr").forEach((tr) => {
      tr.classList.toggle("is-selected", tr.getAttribute("data-issue-id") === selectedId);
    });
  }

  function syncSelectionUI() {
    const reports = storage.getReports();
    const sel = reports.find((r) => r.id === selectedId) || null;
    if (!sel) {
      selTitle.textContent = "None";
      selMeta.textContent = "Select a row in the table.";
      viewBtn.disabled = true;
      assignBtn.disabled = true;
      resolvedBtn.disabled = true;
      flagBtn.disabled = true;
      return;
    }
    selTitle.textContent = `${sel.issueType} • ${sel.locationQuery || "Location"}`;
    selMeta.textContent = `Severity ${sel.severity}% • Risk ${sel.riskScore}/100 • Status ${sel.status}`;
    viewBtn.disabled = false;
    assignBtn.disabled = false;
    resolvedBtn.disabled = sel.status === "Resolved" || sel.status === "Flagged";
    flagBtn.disabled = sel.status === "Flagged";
  }

  function setStatus(id, status) {
    const reports = storage.getReports();
    const updated = reports.map((r) => (r.id === id ? { ...r, status } : r));
    storage.setReports(updated);

    // If status becomes Verified or Resolved, award points to the reporter
    if (status === "Verified" || status === "Resolved") {
      const report = reports.find((r) => r.id === id);
      if (report && report.reporter) {
        updateUserPoints(report.reporter);
      }
    }
  }

  // Row selection
  rowsBody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-issue-id]");
    if (!tr) return;
    selectedId = tr.getAttribute("data-issue-id");
    renderRows();
    syncSelectionUI();
  });

  viewBtn.addEventListener("click", () => {
    const reports = storage.getReports();
    const sel = reports.find((r) => r.id === selectedId);
    if (!sel) return;
    const confidence = sel.confidence ?? clamp(Math.round(72 + Math.random() * 26), 0, 100);
    const crowd = sel.crowdVerified ?? Math.round(2 + Math.random() * 18);
    openModal({
      title: "Issue details (mock)",
      bodyHtml: `
        <div class="stack">
          <div class="panel">
            <div class="rowBetween">
              <strong>Image preview (mock)</strong>
              <span class="badge"><span class="mono">${escapeHtml(sel.imageName || "upload.jpg")}</span></span>
            </div>
            <div class="divider"></div>
            <div class="imgPreview" aria-label="Enlarged image preview (placeholder)">
              <div class="imgPreview__ph">
                <div class="imgPreview__mark">${icon("spark")}</div>
                <div>
                  <div style="font-weight:800;">${escapeHtml(sel.issueType)}</div>
                  <div class="muted">Preview only • No real image loaded</div>
                </div>
              </div>
            </div>
          </div>
          <div class="panel">
            <div class="rowBetween">
              <strong>${escapeHtml(sel.issueType)}</strong>
              ${statusBadge(sel.status)}
            </div>
            <div class="divider"></div>
            <div class="rowBetween">
              <span class="muted">Severity: <span class="mono">${escapeHtml(
        sel.severity,
      )}%</span> (${escapeHtml(severityToLabel(sel.severity))})</span>
              <span class="muted">Risk: <span class="mono">${escapeHtml(
        sel.riskScore,
      )}</span>/100</span>
            </div>
            <div class="divider"></div>
            <div class="rowBetween">
              <span class="muted">AI confidence: <span class="mono">${escapeHtml(confidence)}%</span></span>
              <span class="muted">Crowd verification: <span class="mono">${escapeHtml(crowd)}</span> votes</span>
            </div>
          </div>
          <div class="panel">
            <div class="muted">Location</div>
            <div style="margin-top:6px;"><span class="mono">${escapeHtml(
        sel.locationText,
      )}</span></div>
          </div>
          <div class="panel">
            <div class="muted">Submitted</div>
            <div style="margin-top:6px;"><span class="mono">${escapeHtml(
        formatDateTime(sel.createdAt),
      )}</span></div>
          </div>
        </div>
      `,
      actionsHtml: `
        <button class="btn btn--ghost" type="button" data-modal-close>Close</button>
      `,
    });
  });

  assignBtn.addEventListener("click", () => {
    const reports = storage.getReports();
    const sel = reports.find((r) => r.id === selectedId);
    if (!sel) return;
    openModal({
      title: "Assign team (mock)",
      bodyHtml: `
        <div class="panel">
          <div class="rowBetween">
            <strong>${escapeHtml(sel.issueType)}</strong>
            ${statusBadge(sel.status)}
          </div>
          <div class="divider"></div>
          <div class="muted">Selected team (dummy)</div>
          <div style="margin-top:10px;" class="btnRow">
            <button class="btn btn--ghost" type="button" data-team="Roads">Roads</button>
            <button class="btn btn--ghost" type="button" data-team="Sanitation">Sanitation</button>
            <button class="btn btn--ghost" type="button" data-team="Electrical">Electrical</button>
          </div>
          <div class="muted" style="margin-top:10px;">This only shows UI feedback. No backend assignment occurs.</div>
        </div>
      `,
      actionsHtml: `
        <button class="btn btn--primary" type="button" data-modal-close>Done</button>
      `,
    });
    // quick inline handler (modal content is injected)
    $("#modalRoot")?.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        const team = t?.getAttribute?.("data-team");
        if (!team) return;
        // UI feedback: update meta line
        const meta = $("#selMeta");
        if (meta) meta.textContent = `${meta.textContent} • Team: ${team}`;
        closeModal();
      },
      { once: true },
    );
  });

  resolvedBtn.addEventListener("click", () => {
    if (!selectedId) return;
    setStatus(selectedId, "Resolved");
    render(); // rerender to update summaries + table
  });

  flagBtn.addEventListener("click", () => {
    if (!selectedId) return;
    setStatus(selectedId, "Flagged");
    render();
  });

  // Initial render/wiring
  renderRows();
  syncSelectionUI();
}

// ----------------------------
// New Pages: Analytics + Reports (role-based)
// ----------------------------

function renderCitizenAnalytics() {
  if (!requireRole("citizen", "/citizen-login")) return "";
  const s = storage.getSession();
  const reports = storage.getReports().filter((r) => r.reporter === s.email);
  const a = computeCitizenAnalytics(reports);
  const byType = groupCount(reports, (r) => r.issueType || "Unknown").sort((x, y) => y.value - x.value);
  const points = Array.from({ length: 7 }).map((_, i) => ({
    label: `D${i + 1}`,
    value: Math.round(1 + Math.random() * 6),
  }));

  const contentHtml = `
    ${renderSummaryCards([
    { label: "Total Issues Reported", value: a.total, badge: "Reports" },
    { label: "Issues Verified", value: a.verified, badge: "Verified" },
    { label: "Issues Resolved", value: a.resolved, badge: "Resolved" },
    { label: "Average Risk Score", value: `${a.avgRisk} / 100`, badge: "Risk" },
  ])}
    <div class="grid grid--2" style="margin-top:16px;">
      ${renderBarChart({ title: "Issues by Type", series: byType.length ? byType : [{ key: "Pothole", value: 0 }] })}
      ${renderLineChart({ title: "Reports over time", points })}
    </div>
  `;

  return renderDashboardShell({
    role: "citizen",
    activePath: "/citizen-analytics",
    title: "Citizen Analytics",
    subtitle: "Charts and summaries for your reports (mock).",
    contentHtml,
  });
}

function renderCitizenReports() {
  if (!requireRole("citizen", "/citizen-login")) return "";
  const s = storage.getSession();
  const reports = storage
    .getReports()
    .filter((r) => r.reporter === s.email)
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);

  const contentHtml = `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Reports</h3>
          <p class="card__sub">Your submitted issues with status badges (mock).</p>
        </div>
        <span class="badge">${icon("user")} ${escapeHtml(s.email)}</span>
      </div>
      <div class="card__inner">
        <div class="tableWrap">
          <table aria-label="Citizen reports table">
            <thead>
              <tr>
                <th>Issue Type</th>
                <th>Submitted</th>
                <th>Severity</th>
                <th>Risk</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reports.length === 0
      ? `<tr><td colspan="6" class="muted">No reports yet.</td></tr>`
      : reports
        .map(
          (r) => `
                  <tr>
                    <td><strong>${escapeHtml(r.issueType)}</strong></td>
                    <td class="tableTiny mono">${escapeHtml(formatDateTime(r.createdAt))}</td>
                    <td><span class="mono">${escapeHtml(r.severity)}%</span></td>
                    <td><span class="badge"><span class="mono">${escapeHtml(r.riskScore)}</span>/100</span></td>
                    <td>${escapeHtml(r.locationText)}</td>
                    <td>${statusBadge(r.status)}</td>
                  </tr>
                `,
        )
        .join("")
    }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return renderDashboardShell({
    role: "citizen",
    activePath: "/citizen-reports",
    title: "Citizen Reports",
    subtitle: "A table view of all your reported issues (mock).",
    contentHtml,
  });
}

function renderAuthorityAnalytics() {
  if (!requireRole("authority", "/authority-login")) return "";
  const reports = storage.getReports();
  const active = reports.filter((r) => r.status !== "Resolved" && r.status !== "Flagged");
  const highRisk = active.filter((r) => (r.riskScore || 0) >= 75);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const resolvedToday = reports.filter((r) => r.status === "Resolved" && r.createdAt >= startOfToday.getTime());
  const falseFlagged = reports.filter((r) => r.status === "Flagged").length;

  const byType = groupCount(active, (r) => r.issueType || "Unknown").sort((a, b) => b.value - a.value);
  const incoming = Array.from({ length: 10 }).map((_, i) => ({
    label: `D${i + 1}`,
    value: Math.round(6 + Math.random() * 10),
  }));
  const zones = [
    { label: "Ward 12", heat: 92 },
    { label: "Ring Rd", heat: 88 },
    { label: "Sector 18", heat: 74 },
    { label: "Old Town", heat: 61 },
    { label: "Tech Park", heat: 83 },
    { label: "Station", heat: 69 },
    { label: "Market", heat: 77 },
    { label: "Airport", heat: 58 },
  ];

  const contentHtml = `
    ${renderSummaryCards([
    { label: "Total Active Issues", value: active.length, badge: "Active" },
    { label: "High Risk Issues", value: highRisk.length, badge: "Risk ≥ 75" },
    { label: "Issues Resolved Today", value: resolvedToday.length, badge: "Today" },
    { label: "False Reports Flagged", value: falseFlagged, badge: "Flagged" },
  ])}
    <div class="grid grid--2" style="margin-top:16px;">
      ${renderPieChart({ title: "Issue Type Distribution", series: byType.length ? byType : [{ key: "Pothole", value: 1 }] })}
      ${renderLineChart({ title: "Daily Incoming Reports", points: incoming })}
    </div>
    <div style="margin-top:16px;">
      ${renderHeatmap({ title: "High-Risk Zones (Heatmap UI)", zones })}
    </div>
  `;

  return renderDashboardShell({
    role: "authority",
    activePath: "/authority-analytics",
    title: "Authority Analytics",
    subtitle: "Operational analytics and high-risk zone overview (mock).",
    contentHtml,
  });
}

function renderAuthorityReports() {
  if (!requireRole("authority", "/authority-login")) return "";
  const reports = storage.getReports().slice().sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
  const contentHtml = `
    <div class="card">
      <div class="card__header">
        <div>
          <h3 class="card__title">Reports</h3>
          <p class="card__sub">All incoming reports (mock). Use the main dashboard for actions.</p>
        </div>
        <span class="badge">${icon("shield")} Authority</span>
      </div>
      <div class="card__inner">
        <div class="tableWrap">
          <table aria-label="Authority reports table">
            <thead>
              <tr>
                <th>Issue Type</th>
                <th>Severity</th>
                <th>Risk</th>
                <th>Location</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${reports
      .map(
        (r) => `
                <tr>
                  <td><strong>${escapeHtml(r.issueType)}</strong></td>
                  <td class="mono">${escapeHtml(r.severity)}%</td>
                  <td><span class="badge"><span class="mono">${escapeHtml(r.riskScore)}</span>/100</span></td>
                  <td>${escapeHtml(r.locationText)}</td>
                  <td>${statusBadge(r.status)}</td>
                  <td class="tableTiny mono">${escapeHtml(formatDateTime(r.createdAt))}</td>
                </tr>
              `,
      )
      .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return renderDashboardShell({
    role: "authority",
    activePath: "/authority-reports",
    title: "Authority Reports",
    subtitle: "Full report feed (mock).",
    contentHtml,
  });
}

function wireCitizenAnalytics() {
  if (!requireRole("citizen", "/citizen-login")) return;
}
function wireCitizenReports() {
  if (!requireRole("citizen", "/citizen-login")) return;
}
function wireAuthorityAnalytics() {
  if (!requireRole("authority", "/authority-login")) return;
}
function wireAuthorityReports() {
  if (!requireRole("authority", "/authority-login")) return;
}

