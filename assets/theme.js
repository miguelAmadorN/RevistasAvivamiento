(() => {
  const STORAGE_KEY = "revistas-theme";
  const urlTheme = new URLSearchParams(window.location.search).get("theme");
  const isValidTheme = (value) => value === "light" || value === "dark";

  const getInitialTheme = () => {
    if (isValidTheme(urlTheme)) {
      localStorage.setItem(STORAGE_KEY, urlTheme);
      return urlTheme;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(saved)) {
      return saved;
    }

    return "light";
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  };

  const ensureSharedStylesheet = () => {
    const currentScript = document.currentScript;
    if (!currentScript?.src) return;

    const cssUrl = new URL("article-theme.css", currentScript.src).toString();
    if (document.querySelector(`link[href="${cssUrl}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    document.head.appendChild(link);
  };

  const isArticlePage = () => Boolean(document.querySelector(".content-section"));

  const addThemeButton = () => {
    if (!isArticlePage()) return;

    const existingHeaderButton = document.querySelector(".print-button");
    const button = existingHeaderButton || document.createElement("button");

    button.type = "button";
    button.classList.add("theme-toggle-button");

    const updateLabel = () => {
      const current = document.documentElement.getAttribute("data-theme");
      button.textContent = current === "dark" ? "☀️" : "🌙";
      button.setAttribute(
        "aria-label",
        current === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
      );
      button.title = button.getAttribute("aria-label");
    };

    button.onclick = null;
    button.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      updateLabel();
    });

    updateLabel();

    if (!existingHeaderButton) {
      const headerContent = document.querySelector("header .header-content");
      if (headerContent) {
        headerContent.appendChild(button);
        return;
      }

      const header = document.querySelector("header");
      if (header) {
        header.classList.add("has-theme-toggle");
        header.appendChild(button);
      }
    }
  };

  applyTheme(getInitialTheme());
  ensureSharedStylesheet();

  window.addEventListener("DOMContentLoaded", () => {
    addThemeButton();
  });
})();
