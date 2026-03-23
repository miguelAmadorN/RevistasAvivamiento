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

  const ensureFavicon = () => {
    const currentScript = document.currentScript;
    if (!currentScript?.src) return;

    const faviconUrl = new URL("candle-flame.svg", currentScript.src).toString();
    let iconLink = document.querySelector('link[rel="icon"]');

    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }

    iconLink.type = "image/svg+xml";
    iconLink.href = faviconUrl;
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

  const isMagazinePage = () => Boolean(
    document.querySelector("header .header-content")
      || document.querySelector(".editorial-container")
      || document.querySelector(".content-section")
      || document.querySelector(".scripture"),
  );

  const isMenuPage = () => Boolean(document.querySelector("#revistas-grid"));

  const getToggleHost = () => {
    if (isMenuPage()) {
      return document.querySelector(".hero") || document.body;
    }

    if (isMagazinePage()) {
      return document.querySelector("header .header-content")
        || document.querySelector("header")
        || document.body;
    }

    return null;
  };

  const addThemeButton = () => {
    const host = getToggleHost();
    if (!host) return;

    if (document.querySelector(".theme-toggle-button")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("theme-toggle-button");

    const updateLabel = () => {
      const current = document.documentElement.getAttribute("data-theme");
      button.textContent = current === "dark" ? "☀︎" : "☾";
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

    if (host.matches("header")) {
      host.classList.add("has-theme-toggle");
    }
    host.appendChild(button);
  };


  applyTheme(getInitialTheme());
  ensureSharedStylesheet();
  ensureFavicon();

  window.addEventListener("DOMContentLoaded", () => {
    addThemeButton();
  });
})();
