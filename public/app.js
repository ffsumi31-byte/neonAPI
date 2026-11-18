const $ = (id) => document.getElementById(id);
let sessionKey = "";
function setAuthenticated(connected) {
  $("auth-screen").hidden = connected;
  $("workspace-screen").hidden = !connected;
}
function renderBalance(tokens) {
  for (const field of ["granted", "used", "remaining", "reserved"]) {
    $(field).textContent = BigInt(tokens[field] ?? "0").toLocaleString();
  }
  $("overview-remaining").textContent = $("remaining").textContent;
  const granted = BigInt(tokens.granted);
  const used = BigInt(tokens.used);
  const percent = granted > 0n ? (used * 100n) / granted : 0n;
  $("usage-meter").value = Number(percent > 100n ? 100n : percent < 0n ? 0n : percent);
}
function renderInferenceStatus(enabled) {
  const status = $("inference-status");
  status.textContent = enabled ? "Enabled" : "Disabled";
  status.classList.toggle("enabled", enabled);
}
setAuthenticated(false);
$("show").onclick = () => {
  $("key").type = $("key").type === "password" ? "text" : "password";
  $("show").textContent = $("key").type === "password" ? "Show" : "Hide";
  $("show").setAttribute("aria-pressed", String($("key").type === "text"));
  $("show").setAttribute("aria-label", $("key").type === "password" ? "Show customer key" : "Hide customer key");
};
$("logout").onclick = () => {
  sessionKey = "";
  setAuthenticated(false);
  $("key").value = "";
  $("key").type = "password";
  $("show").textContent = "Show";
  $("balance").hidden = true;
  $("balance-placeholder").hidden = false;
  $("connection-label").textContent = "Signed out";
  $("show").setAttribute("aria-pressed", "false");
  $("show").setAttribute("aria-label", "Show customer key");
  $("name").textContent = "";
  for (const field of ["granted", "used", "remaining"]) $(field).textContent = "";
  $("reserved").textContent = "";
  $("usage-meter").value = 0;
  $("overview-remaining").textContent = "—";
  $("inference-status").textContent = "Checking status";
  $("tracker-status").textContent = "Balances are fetched from the account ledger.";
  $("status").textContent = "Disconnected.";
  $("key").focus();
  for (const card of document.querySelectorAll("[data-tier]")) {
    const selected = card.dataset.tier === "fast";
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  }
  $("tier-note").textContent = "Haiku preset · 1× credit weight. Preview only.";
};
let pending = false;
$("login").onsubmit = async (event) => {
  event.preventDefault();
  if (pending) return;
  $("balance").hidden = true;
  $("balance-placeholder").hidden = false;
  $("connection-label").textContent = "Signed out";
  if (location.protocol !== "https:") {
    $("status").textContent = "Open your published HTTPS Netlify URL to connect.";
    return;
  }
  const key = $("key").value.trim();
  if (!/^sk-gw-[a-f0-9]{64}$/.test(key)) {
    $("status").textContent = "Enter your complete customer key, not a provider key.";
    return;
  }
  pending = true;
  $("connect-button").disabled = true;
  $("status").textContent = "Checking…";
  try {
    const response = await fetch("/api/account", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to connect");
    if (!data.customer?.id || typeof data.customer.name !== "string" || !data.tokens ||
        !["granted", "used", "remaining"].every((field) => /^-?\d+$/.test(String(data.tokens[field])))) {
      throw new Error("Invalid account response. Please contact the service administrator.");
    }
    $("name").textContent = data.customer.name;
    renderBalance(data.tokens);
    renderInferenceStatus(data.inferenceEnabled === true);
    $("balance").hidden = false;
    $("balance-placeholder").hidden = true;
    $("connection-label").textContent = "Account connected";
    $("status").textContent = data.inferenceEnabled ? "Connected. Hosted main-provider route is enabled." : "Connected. Hosted inference is disabled.";
    $("key").value = "";
    $("key").type = "password";
    $("show").textContent = "Show";
    $("show").setAttribute("aria-pressed", "false");
    $("show").setAttribute("aria-label", "Show customer key");
    setAuthenticated(true);
    sessionKey = key;
    $("login-heading").focus();
  } catch (error) {
    $("status").textContent = error.name === "TimeoutError" ? "Connection timed out." : error.message;
  } finally { pending = false; $("connect-button").disabled = false; }
};
$("refresh-usage").onclick = async () => {
  const key = sessionKey;
  if (!key) return;
  $("refresh-usage").disabled = true;
  try {
    const response = await fetch("/api/account", {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (key !== sessionKey) return;
    if (response.status === 401) {
      $("logout").onclick();
      $("status").textContent = "Your customer key was revoked or is no longer valid.";
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error("Cannot refresh your balance.");
    if (key !== sessionKey) return;
    renderBalance(data.tokens);
    renderInferenceStatus(data.inferenceEnabled === true);
    $("tracker-status").textContent = "Tracker refreshed from the server. Reservations are not final settled usage.";
  } catch {
    if (key === sessionKey) $("tracker-status").textContent = "Refresh failed. The previous balance may be out of date.";
  } finally { $("refresh-usage").disabled = false; }
};
// No localStorage, cookies, analytics, or key-in-URL login.
const tierDescriptions = {
  fast: "Haiku preset · 1× credit weight: direct answers.",
  balanced: "Sonnet preset · 2× credit weight: targeted checks.",
  advanced: "Opus preset · 4× credit weight: plan, implement, test, and review.",
  expert: "Fable preset · 8× credit weight: specialist assistance.",
};
for (const button of document.querySelectorAll("[data-tier]")) {
  button.onclick = () => {
    for (const card of document.querySelectorAll("[data-tier]")) {
      const selected = card === button;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    }
    $("tier-note").textContent = `${tierDescriptions[button.dataset.tier]} Preview only.`;
  };
}
