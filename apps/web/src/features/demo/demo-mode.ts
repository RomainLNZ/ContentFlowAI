const DEMO_SESSION_KEY = "flowpilot-demo-mode";

export function resolveDemoMode() {
  if (window.location.pathname === "/demo") {
    sessionStorage.setItem(DEMO_SESSION_KEY, "active");
    return true;
  }
  return sessionStorage.getItem(DEMO_SESSION_KEY) === "active";
}

export function leaveDemo(destination: "/" | "/sign-up") {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem("flowpilot-tenant");
  window.location.assign(destination);
}
