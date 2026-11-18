const workspace = document.getElementById("workspace-screen");
const screens = [...workspace.querySelectorAll("[data-screen]")];
const links = [...workspace.querySelectorAll("nav a")];
const sectionName = document.getElementById("section-name");

function showScreen(id, moveFocus) {
  const screen = screens.find((item) => item.id === id);
  if (!screen) return;
  for (const item of screens) item.hidden = item !== screen;
  for (const link of links) {
    if (link.hash === `#${id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  const heading = screen.querySelector("h1");
  sectionName.textContent = heading.textContent;
  if (moveFocus) heading.focus();
}

workspace.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !screens.some((screen) => link.hash === `#${screen.id}`)) return;
  event.preventDefault();
  showScreen(link.hash.slice(1), true);
  window.scrollTo(0, 0);
});

new MutationObserver(() => {
  if (workspace.hidden) showScreen("overview", false);
}).observe(workspace, { attributes: true, attributeFilter: ["hidden"] });
