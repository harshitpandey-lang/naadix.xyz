const auth = window.NaadixAuth;
const forms = document.querySelectorAll("form[data-role-login]");
const sessionLabel = document.getElementById("sessionLabel");
const logoutBtn = document.getElementById("logoutBtn");

const refreshSession = () => {
  if (!auth || !sessionLabel) return;
  const role = auth.getRole();
  const username = auth.getUsername();
  sessionLabel.textContent = role
    ? `Signed in as ${username} (${role}).`
    : "No active session.";
};

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!auth) return;

    const role = form.getAttribute("data-role-login");
    const status = form.querySelector("[data-auth-status]");
    const username = (form.querySelector('[name="username"]') || {}).value;
    const password = (form.querySelector('[name="password"]') || {}).value;

    const result = auth.login(username, password, role);
    if (!result.ok) {
      if (status) status.textContent = result.message;
      return;
    }

    if (status) status.textContent = "Login successful. Redirecting...";
    refreshSession();
    window.location.href = result.redirect;
  });
});

if (logoutBtn && auth) {
  logoutBtn.addEventListener("click", () => {
    auth.clearRole();
    refreshSession();
  });
}

refreshSession();