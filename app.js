(() => {
  const cfg = Object.assign({
    githubUser: "",
    title: "Impact Zone",
    tagline: "",
    hide: [],
    includeForks: false,
    includeArchived: false,
    featured: [],
    overrides: {},
    links: [],
  }, window.SITE_CONFIG || {});

  const $ = (id) => document.getElementById(id);
  const els = {
    title: $("site-title"), tagline: $("site-tagline"), links: $("site-links"),
    search: $("search"), sort: $("sort"), filters: $("filters"),
    status: $("status"), grid: $("grid"), count: $("count"),
  };

  const LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", HTML: "#e34c26",
    CSS: "#663399", Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", "C#": "#178600",
    "C++": "#f34b7d", C: "#555555", Shell: "#89e051", PowerShell: "#012456", Ruby: "#701516",
    PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Lua: "#000080",
    Vue: "#41b883", Svelte: "#ff3e00", "Jupyter Notebook": "#DA5B0B", Batchfile: "#C1F12E",
  };

  const ICON_GH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  const ICON_STAR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 01.67.42l1.88 3.81 4.2.61a.75.75 0 01.42 1.28l-3.04 2.96.72 4.19a.75.75 0 01-1.09.79L8 12.33l-3.76 1.98a.75.75 0 01-1.09-.79l.72-4.19L.83 6.37a.75.75 0 01.42-1.28l4.2-.61L7.33.67A.75.75 0 018 .25z"/></svg>';

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const safeUrl = (u) => {
    if (typeof u !== "string" || !u.trim()) return null;
    try {
      const url = new URL(u, location.href);
      return /^https?:$/.test(url.protocol) ? url.href : null;
    } catch { return null; }
  };

  const prettyName = (slug) => slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const timeAgo = (iso) => {
    const s = (Date.now() - new Date(iso)) / 1000;
    const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600]];
    for (const [u, n] of units) {
      const v = Math.floor(s / n);
      if (v >= 1) return `${v} ${u}${v > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  // ── Header ───────────────────────────────
  document.title = cfg.title;
  els.title.textContent = cfg.title;
  els.tagline.textContent = cfg.tagline;
  const headerLinks = [];
  if (cfg.githubUser && !cfg.githubUser.startsWith("YOUR-")) {
    headerLinks.push(`<a href="https://github.com/${encodeURIComponent(cfg.githubUser)}" rel="me">${ICON_GH}@${esc(cfg.githubUser)}</a>`);
  }
  for (const l of cfg.links) {
    const u = safeUrl(l.url);
    if (u) headerLinks.push(`<a href="${esc(u)}" rel="me">${esc(l.label)}</a>`);
  }
  els.links.innerHTML = headerLinks.join("");

  // ── Data ─────────────────────────────────
  const CACHE_KEY = `iz-repos-${cfg.githubUser}`;
  const CACHE_MS = 60 * 60 * 1000;

  const readCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };
  const writeCache = (data) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch {}
  };

  async function fetchRepos() {
    const cached = readCache();
    if (cached && Date.now() - cached.t < CACHE_MS) return cached.data;

    try {
      const all = [];
      for (let page = 1; page <= 5; page++) {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(cfg.githubUser)}/repos?per_page=100&type=owner&sort=updated&page=${page}`,
          { headers: { Accept: "application/vnd.github+json" } }
        );
        if (!res.ok) throw new Error(res.status === 404 ? "User not found" : `GitHub API ${res.status}`);
        const batch = await res.json();
        all.push(...batch);
        if (batch.length < 100) break;
      }
      const slim = all.map((r) => ({
        name: r.name, description: r.description, html_url: r.html_url,
        homepage: r.homepage, has_pages: r.has_pages, language: r.language,
        stars: r.stargazers_count, updated: r.pushed_at || r.updated_at,
        fork: r.fork, archived: r.archived, topics: r.topics || [],
      }));
      writeCache(slim);
      return slim;
    } catch (err) {
      // Rate-limited or offline: fall back to stale cache if we have one.
      if (cached) return cached.data;
      throw err;
    }
  }

  function prepare(repos) {
    const hide = new Set(cfg.hide.map((n) => n.toLowerCase()));
    const featured = cfg.featured.map((n) => n.toLowerCase());
    const pagesRoot = `${cfg.githubUser.toLowerCase()}.github.io`;

    return repos
      .filter((r) => !hide.has(r.name.toLowerCase()))
      .filter((r) => r.name.toLowerCase() !== pagesRoot) // hide this landing page's own repo
      .filter((r) => cfg.includeForks || !r.fork)
      .filter((r) => cfg.includeArchived || !r.archived)
      .map((r) => {
        const o = cfg.overrides[r.name] || {};
        const live = safeUrl(o.live || r.homepage) ||
          (r.has_pages ? `https://${pagesRoot}/${r.name}/` : null);
        const rank = featured.indexOf(r.name.toLowerCase());
        return {
          ...r,
          display: o.name || prettyName(r.name),
          description: o.description ?? r.description,
          live,
          featuredRank: rank === -1 ? Infinity : rank,
        };
      });
  }

  // ── Rendering ────────────────────────────
  let repos = [];
  let activeLang = "All";

  function renderFilters() {
    const counts = {};
    for (const r of repos) if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
    const langs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (langs.length < 2) { els.filters.innerHTML = ""; return; }
    els.filters.innerHTML = ["All", ...langs].map((l) =>
      `<button class="chip" type="button" data-lang="${esc(l)}" aria-pressed="${l === activeLang}">${esc(l)}</button>`
    ).join("");
  }

  function card(r) {
    const color = LANG_COLORS[r.language] || "var(--muted)";
    const desc = r.description
      ? `<p>${esc(r.description)}</p>`
      : `<p class="empty">No description yet.</p>`;
    const primary = r.live || r.html_url;
    return `
      <article class="card${r.featuredRank !== Infinity ? " featured" : ""}">
        <h2><a href="${esc(primary)}">${esc(r.display)}</a></h2>
        ${desc}
        <div class="meta">
          ${r.language ? `<span class="lang"><span class="dot" style="background:${color}"></span>${esc(r.language)}</span>` : ""}
          ${r.stars ? `<span title="Stars">${ICON_STAR} ${r.stars}</span>` : ""}
          <span title="${esc(new Date(r.updated).toLocaleString())}">Updated ${timeAgo(r.updated)}</span>
        </div>
        <div class="actions">
          ${r.live ? `<a class="btn primary" href="${esc(r.live)}">Open tool</a>` : ""}
          <a class="btn" href="${esc(r.html_url)}">Source</a>
        </div>
      </article>`;
  }

  function render() {
    const q = els.search.value.trim().toLowerCase();
    const sort = els.sort.value;
    const list = repos
      .filter((r) => activeLang === "All" || r.language === activeLang)
      .filter((r) => !q || [r.name, r.display, r.description, r.language, ...r.topics]
        .some((f) => f && f.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (a.featuredRank !== b.featuredRank) return a.featuredRank - b.featuredRank;
        if (sort === "stars") return b.stars - a.stars || new Date(b.updated) - new Date(a.updated);
        if (sort === "name") return a.display.localeCompare(b.display);
        return new Date(b.updated) - new Date(a.updated);
      });

    els.grid.innerHTML = list.map(card).join("");
    els.status.textContent = list.length ? "" : "No tools match that search.";
    els.count.textContent = `${repos.length} tool${repos.length === 1 ? "" : "s"}`;
  }

  els.search.addEventListener("input", render);
  els.sort.addEventListener("change", render);
  els.filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeLang = btn.dataset.lang;
    renderFilters();
    render();
  });

  // ── Boot ─────────────────────────────────
  if (!cfg.githubUser || cfg.githubUser.startsWith("YOUR-")) {
    els.status.innerHTML = 'Set your username in <code>config.js</code> → <code>githubUser</code>.';
    return;
  }

  els.grid.innerHTML = '<div class="card skeleton"></div>'.repeat(6);

  fetchRepos()
    .then((data) => {
      repos = prepare(data);
      renderFilters();
      render();
    })
    .catch((err) => {
      els.grid.innerHTML = "";
      els.status.textContent = `Couldn't load repos (${err.message}). Try again in a bit.`;
    });
})();
