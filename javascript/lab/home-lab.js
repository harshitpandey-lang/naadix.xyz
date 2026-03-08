const auth = window.NaadixAuth;
const forms = document.querySelectorAll("form[data-role-login]");
const sessionLabel = document.getElementById("sessionLabel");
const logoutBtn = document.getElementById("logoutBtn");
const LAST_USER_KEY_PREFIX = "naadixLab:lastUser:";
const STATUS_COLORS = {
  info: "#94a3b8",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f97316"
};

const setStatus = (statusNode, message, type = "info") => {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.style.color = STATUS_COLORS[type] || STATUS_COLORS.info;
};

const refreshSession = () => {
  if (!auth || !sessionLabel) return;
  const role = auth.getRole();
  const username = auth.getUsername();
  const authTime = typeof auth.getAuthTime === "function" ? auth.getAuthTime() : 0;
  const timeLabel = authTime ? ` at ${new Date(authTime).toLocaleString()}` : "";
  sessionLabel.textContent = role
    ? `Signed in as ${username} (${role})${timeLabel}.`
    : "No active session.";
  if (logoutBtn) logoutBtn.disabled = !role;
};

forms.forEach((form) => {
  const role = form.getAttribute("data-role-login");
  const status = form.querySelector("[data-auth-status]");
  const usernameInput = form.querySelector('[name="username"]');
  const passwordInput = form.querySelector('[name="password"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (usernameInput) {
    const rememberedUser = localStorage.getItem(`${LAST_USER_KEY_PREFIX}${role}`);
    if (rememberedUser) usernameInput.value = rememberedUser;
  }

  if (passwordInput && !form.querySelector('[data-toggle-password="true"]')) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "secondary";
    toggle.setAttribute("data-toggle-password", "true");
    toggle.textContent = "Show Password";
    toggle.addEventListener("click", () => {
      const isMasked = passwordInput.type === "password";
      passwordInput.type = isMasked ? "text" : "password";
      toggle.textContent = isMasked ? "Hide Password" : "Show Password";
    });
    form.insertBefore(toggle, submitBtn);
  }

  if (passwordInput) {
    passwordInput.addEventListener("keyup", (event) => {
      if (event.getModifierState && event.getModifierState("CapsLock")) {
        setStatus(status, "Warning: Caps Lock is on.", "warning");
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!auth) {
      setStatus(status, "Authentication service is unavailable.", "error");
      return;
    }

    const username = (usernameInput || {}).value;
    const password = (passwordInput || {}).value;

    if (!String(username || "").trim()) {
      setStatus(status, "Username is required.", "error");
      return;
    }
    if (!String(password || "").trim()) {
      setStatus(status, "Password is required.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";
    }

    const result = auth.login(username, password, role);
    if (!result.ok) {
      setStatus(status, result.message, "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = `${role[0].toUpperCase()}${role.slice(1)} Login`;
      }
      return;
    }

    localStorage.setItem(`${LAST_USER_KEY_PREFIX}${role}`, String(username).trim().toLowerCase());
    setStatus(status, "Login successful. Redirecting...", "success");
    refreshSession();
    setTimeout(() => {
      window.location.href = result.redirect;
    }, 250);
  });
});

if (logoutBtn && auth) {
  logoutBtn.addEventListener("click", () => {
    auth.clearRole();
    refreshSession();
  });
}

document.addEventListener("keydown", (event) => {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const roleByKey = { 1: "founder", 2: "family", 3: "guest" };
  const role = roleByKey[event.key];
  if (!role) return;
  const form = document.querySelector(`form[data-role-login="${role}"]`);
  const usernameInput = form && form.querySelector('[name="username"]');
  if (usernameInput) {
    event.preventDefault();
    usernameInput.focus();
  }
});

refreshSession();
