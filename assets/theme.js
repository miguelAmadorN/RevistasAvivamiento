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


  const injectBaseButtonStyles = () => {
    const style = document.createElement("style");
    style.textContent = `
      .theme-toggle-button {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 1000;
        border: none;
        border-radius: 999px;
        padding: 0.65rem 1rem;
        background: #22c55e;
        color: #052e16;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(0,0,0,0.18);
      }
    `;
    document.head.appendChild(style);
  };

  const injectArticleThemeStyles = () => {
    if (!document.querySelector(".container")) return;

    const style = document.createElement("style");
    style.textContent = `
      html[data-theme="dark"] body {
        background: #0f172a !important;
        color: #e2e8f0 !important;
      }

      html[data-theme="dark"] .container,
      html[data-theme="dark"] .content-section,
      html[data-theme="dark"] .editorial-container,
      html[data-theme="dark"] .intro-box,
      html[data-theme="dark"] .scripture,
      html[data-theme="dark"] .highlight-box,
      html[data-theme="dark"] .warning-box,
      html[data-theme="dark"] .editors-note {
        background: #1e293b !important;
        color: #e2e8f0 !important;
        border-color: #334155 !important;
      }

      html[data-theme="dark"] h1,
      html[data-theme="dark"] h2,
      html[data-theme="dark"] h3,
      html[data-theme="dark"] p,
      html[data-theme="dark"] li,
      html[data-theme="dark"] span,
      html[data-theme="dark"] strong,
      html[data-theme="dark"] footer {
        color: #e2e8f0 !important;
      }

      html[data-theme="dark"] .scripture-ref,
      html[data-theme="dark"] .subtitle,
      html[data-theme="dark"] .red-emphasis {
        color: #93c5fd !important;
      }

      html[data-theme="dark"] footer {
        border-color: #334155 !important;
      }
    `;

    document.head.appendChild(style);
  };

  const addThemeButton = () => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle-button";

    const updateLabel = () => {
      const current = document.documentElement.getAttribute("data-theme");
      button.textContent = current === "dark" ? "☀️ Vista día" : "🌙 Vista noche";
    };

    button.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      updateLabel();
    });

    updateLabel();
    document.body.appendChild(button);
  };

  applyTheme(getInitialTheme());
  injectBaseButtonStyles();
  injectArticleThemeStyles();

  window.addEventListener("DOMContentLoaded", () => {
    addThemeButton();
  });
})();
