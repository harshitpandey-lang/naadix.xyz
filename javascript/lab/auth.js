(() => {
  const AUTH_ROLE_KEY = "naadixLab:authRole";
  const AUTH_TIME_KEY = "naadixLab:authTime";
  const ROLE_PASSWORDS = {
    founder: "founder@naadix",
    family: "family@naadix",
    guest: "guest@naadix"
  };

  const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
  const isLabPage = path.includes("/webpages/lab/");
  if (!isLabPage) return;

  const isHomeLab = path.endsWith("/home-lab.html");
  const requiredRole = path.includes("/founder-dashboard/")
    ? "founder"
    : path.includes("/family-dashboard/")
      ? "family"
      : path.includes("/guest-dashboard/")
        ? "guest"
        : null;

  const getRole = () => localStorage.getItem(AUTH_ROLE_KEY);
  const setRole = (role) => {
    localStorage.setItem(AUTH_ROLE_KEY, role);
    localStorage.setItem(AUTH_TIME_KEY, String(Date.now()));
  };
  const clearRole = () => {
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_TIME_KEY);
  };

  const isAuthorized = (role) => getRole() === role;

  if (requiredRole && !isAuthorized(requiredRole)) {
    window.location.href = "../home-lab.html";
    return;
  }

  if (requiredRole) {
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.textContent = `Logout (${getRole()})`;
      logoutBtn.addEventListener("click", () => {
        clearRole();
        window.location.href = "../home-lab.html";
      });
      topbar.appendChild(logoutBtn);
    }
  }

  window.NaadixAuth = {
    ROLE_PASSWORDS,
    getRole,
    setRole,
    clearRole,
    isAuthorized,
    isHomeLab
  };
})();
