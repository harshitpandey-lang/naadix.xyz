(() => {
  const AUTH_ROLE_KEY = "naadixLab:authRole";
  const AUTH_USER_KEY = "naadixLab:authUser";
  const AUTH_TIME_KEY = "naadixLab:authTime";
  const CREDENTIALS = {
    founder: { username: "founder", password: "SriHariVanShandam" },
    family: { username: "family", password: "SriRadha" },
    guest: { username: "guest" }
  };
  const ROLE_DASHBOARD = {
    founder: "founder-dashboard/home-founder.html",
    family: "family-dashboard/home-family.html",
    guest: "guest-dashboard/home-guest.html"
  };

  const storage = window.sessionStorage;
  const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
  const baseMatch = path.match(/^(.*?\/(?:webpages\/lab|lab))(?:\/|$)/);
  const labBasePath = baseMatch ? baseMatch[1] : null;
  const isLabPage = Boolean(labBasePath);
  if (!isLabPage) return;

  const isHomeLab = path.endsWith("/home-lab.html") || path.endsWith("/lab/") || path.endsWith("/lab");
  const requiredRole = path.includes("/founder-dashboard/")
    ? "founder"
    : path.includes("/family-dashboard/")
      ? "family"
      : path.includes("/guest-dashboard/")
        ? "guest"
        : null;

  const getRole = () => storage.getItem(AUTH_ROLE_KEY);
  const getUsername = () => storage.getItem(AUTH_USER_KEY);
  const getAuthTime = () => Number(storage.getItem(AUTH_TIME_KEY) || 0) || 0;
  const setRole = (role, username) => {
    storage.setItem(AUTH_ROLE_KEY, role);
    storage.setItem(AUTH_USER_KEY, username || role);
    storage.setItem(AUTH_TIME_KEY, String(Date.now()));
  };
  const clearRole = () => {
    storage.removeItem(AUTH_ROLE_KEY);
    storage.removeItem(AUTH_USER_KEY);
    storage.removeItem(AUTH_TIME_KEY);
  };

  const isAuthorized = (role) => getRole() === role;

  const login = (username, password, forcedRole) => {
    const uname = String(username || "").trim().toLowerCase();
    const pass = String(password || "");
    const role = forcedRole || uname;

    if (!CREDENTIALS[role] || CREDENTIALS[role].username !== uname) {
      return { ok: false, message: "Invalid username." };
    }

    if (role === "guest") {
      if (pass.length < 1) {
        return { ok: false, message: "Guest password must contain at least one character." };
      }
    } else if (CREDENTIALS[role].password !== pass) {
      return { ok: false, message: "Invalid password." };
    }

    setRole(role, uname);
    return { ok: true, role, redirect: ROLE_DASHBOARD[role] };
  };

  if (requiredRole && !isAuthorized(requiredRole)) {
    window.location.href = `${labBasePath}/home-lab.html`;
    return;
  }

  const topbar = document.querySelector(".topbar");
  if (requiredRole && topbar && !topbar.querySelector('[data-lab-logout="true"]')) {
    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.setAttribute("data-lab-logout", "true");
    logoutBtn.textContent = `Logout (${getUsername() || getRole()})`;
    logoutBtn.addEventListener("click", () => {
      clearRole();
      window.location.href = `${labBasePath}/home-lab.html`;
    });
    topbar.appendChild(logoutBtn);
  }

  const ensurePwa = () => {
    const head = document.head;
    if (!head) return;

    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement("link");
      manifest.rel = "manifest";
      manifest.href = `${labBasePath}/manifest.webmanifest`;
      head.appendChild(manifest);
    }

    if (!document.querySelector('meta[name="theme-color"]')) {
      const theme = document.createElement("meta");
      theme.name = "theme-color";
      theme.content = "#0f172a";
      head.appendChild(theme);
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register(`${labBasePath}/sw-lab.js`).catch(() => {});
      });
    }
  };
  ensurePwa();

  window.NaadixAuth = {
    CREDENTIALS,
    ROLE_DASHBOARD,
    login,
    getRole,
    getUsername,
    getAuthTime,
    setRole,
    clearRole,
    isAuthorized,
    isHomeLab
  };
})();
