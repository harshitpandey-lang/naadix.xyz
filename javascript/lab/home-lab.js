const auth = window.NaadixAuth;
const roleButtons = document.querySelectorAll(".card-grid .span-4 .btn-link");
const conceptPanel = document.querySelector(".card-grid .span-12");

const getRoleFromHref = (href) => {
  if (href.includes("founder-dashboard")) return "founder";
  if (href.includes("family-dashboard")) return "family";
  if (href.includes("guest-dashboard")) return "guest";
  return null;
};

const buildAccessPanel = () => {
  if (!conceptPanel || !auth) return null;
  const wrap = document.createElement("div");
  wrap.className = "form-grid";
  wrap.innerHTML = `
    <select id="labRole">
      <option value="founder">Founder</option>
      <option value="family">Family</option>
      <option value="guest">Guest</option>
    </select>
    <input id="labPassword" type="password" placeholder="Enter role password">
    <button id="labLogin">Authenticate Role</button>
    <button id="labLogout" type="button">Logout</button>
  `;
  const status = document.createElement("p");
  status.className = "mini-note";
  status.id = "labAuthStatus";
  conceptPanel.appendChild(wrap);
  conceptPanel.appendChild(status);
  return { wrap, status };
};

const accessUi = buildAccessPanel();
if (accessUi && auth) {
  const roleSelect = accessUi.wrap.querySelector("#labRole");
  const passInput = accessUi.wrap.querySelector("#labPassword");
  const loginBtn = accessUi.wrap.querySelector("#labLogin");
  const logoutBtn = accessUi.wrap.querySelector("#labLogout");
  const status = accessUi.status;

  const refreshStatus = () => {
    const activeRole = auth.getRole();
    status.textContent = activeRole
      ? `Current authenticated role: ${activeRole}`
      : "No active role session. Authenticate to enter dashboards.";
  };

  loginBtn.addEventListener("click", () => {
    const role = roleSelect.value;
    const pass = passInput.value;
    if (auth.ROLE_PASSWORDS[role] === pass) {
      auth.setRole(role);
      passInput.value = "";
      refreshStatus();
      return;
    }
    status.textContent = "Invalid role password. Try again.";
  });

  logoutBtn.addEventListener("click", () => {
    auth.clearRole();
    refreshStatus();
  });

  refreshStatus();
}

roleButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const href = button.getAttribute("href") || "";
    const role = getRoleFromHref(href);
    if (!role) return;
    if (!auth || !auth.isAuthorized(role)) {
      event.preventDefault();
      if (accessUi) {
        accessUi.status.textContent = `Authenticate as ${role} to open this dashboard.`;
        const roleSelect = accessUi.wrap.querySelector("#labRole");
        if (roleSelect) roleSelect.value = role;
      }
      return;
    }
    localStorage.setItem("naadixLab:lastRole", role);
    localStorage.setItem("naadixLab:lastPath", href);
  });
});

if (conceptPanel && auth) {
  const lastPath = localStorage.getItem("naadixLab:lastPath");
  const lastRole = localStorage.getItem("naadixLab:lastRole");
  if (lastPath && lastRole && auth.isAuthorized(lastRole)) {
    const quick = document.createElement("a");
    quick.className = "btn-link";
    quick.href = lastPath;
    quick.textContent = `Continue Last Session (${lastRole})`;
    conceptPanel.appendChild(quick);
  }
}
