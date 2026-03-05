document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");

  if (!header || !footer) {
    return;
  }

  let main = document.querySelector("main");
  if (!main) {
    main = document.createElement("main");
    main.className = "container";
    main.id = "magazine-content";
    main.setAttribute("role", "main");

    let node = header.nextElementSibling;
    const nodesToMove = [];

    while (node && node !== footer) {
      nodesToMove.push(node);
      node = node.nextElementSibling;
    }

    if (nodesToMove.length === 0) {
      return;
    }

    header.insertAdjacentElement("afterend", main);
    nodesToMove.forEach((child) => main.appendChild(child));
  }

  let article = main.querySelector("article");
  if (!article) {
    article = document.createElement("article");
    article.className = "reader-article";
    article.setAttribute("itemscope", "");
    article.setAttribute("itemtype", "https://schema.org/Article");

    while (main.firstChild) {
      article.appendChild(main.firstChild);
    }

    main.appendChild(article);
  }

  if (!article.hasAttribute("itemprop")) {
    article.setAttribute("itemprop", "articleBody");
  }

  const title = document.querySelector("h1") || document.querySelector(".main-title");
  if (title) {
    title.setAttribute("itemprop", "headline");
  }

  enhancePrintButtons();
  groupHeaderActionButtons();
  addReadAloudControls(main, article);
});

function enhancePrintButtons() {
  document.querySelectorAll(".print-button").forEach((button) => {
    const text = (button.textContent || "").trim().toLowerCase();
    if (!text.includes("imprimir") && !text.includes("🖨")) {
      return;
    }

    button.setAttribute("aria-label", "Imprimir este número");
    button.setAttribute("title", "Imprimir este número");
    button.textContent = "🖨️";
  });
}

function groupHeaderActionButtons() {
  const host = document.querySelector("header .header-content") || document.querySelector("header");
  if (!host) {
    return;
  }

  const regroup = () => {
    const printButton = host.querySelector(".print-button");
    const themeButton = host.querySelector(".theme-toggle-button");

    if (!printButton || !themeButton) {
      return;
    }

    let actionGroup = host.querySelector(".header-action-group");
    if (!actionGroup) {
      actionGroup = document.createElement("div");
      actionGroup.className = "header-action-group";
      host.appendChild(actionGroup);
    }

    actionGroup.append(printButton, themeButton);
  };

  regroup();
  const observer = new MutationObserver(regroup);
  observer.observe(host, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 2000);
}

function splitTextIntoChunks(text, maxLength = 900) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return [];

  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if ((`${current} ${sentence}`).trim().length <= maxLength) {
      current = `${current} ${sentence}`.trim();
      return;
    }

    if (current) chunks.push(current);

    if (sentence.length <= maxLength) {
      current = sentence;
      return;
    }

    for (let i = 0; i < sentence.length; i += maxLength) {
      chunks.push(sentence.slice(i, i + maxLength));
    }
    current = "";
  });

  if (current) chunks.push(current);
  return chunks;
}

function addReadAloudControls(main, article) {
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  const toolbar = document.createElement("section");
  toolbar.className = "reader-toolbar";
  toolbar.setAttribute("aria-label", "Controles de lectura en voz alta");

  const label = document.createElement("p");
  label.className = "reader-toolbar__label";
  label.textContent = "Escuchar revista";

  const controlsRow = document.createElement("div");
  controlsRow.className = "reader-toolbar__controls-row";

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "reader-toolbar__button reader-toolbar__play-toggle";
  playButton.textContent = "▶ Reproducir";

  const languageToggle = document.createElement("button");
  languageToggle.type = "button";
  languageToggle.className = "reader-toolbar__button reader-toolbar__toggle-language";
  languageToggle.textContent = "🌐 Idioma";

  const languageWrap = document.createElement("div");
  languageWrap.className = "reader-toolbar__language-wrap";
  languageWrap.hidden = true;

  const languageSelect = document.createElement("select");
  languageSelect.className = "reader-toolbar__select";
  languageSelect.setAttribute("aria-label", "Idioma de voz");

  [
    { code: "es-ES", label: "Español (España)" },
    { code: "es-MX", label: "Español (México)" },
    { code: "es-AR", label: "Español (Argentina)" },
  ].forEach(({ code, label: name }) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    if (code === "es-ES") option.selected = true;
    languageSelect.appendChild(option);
  });

  languageWrap.appendChild(languageSelect);
  controlsRow.append(playButton, languageToggle, languageWrap);

  const status = document.createElement("p");
  status.className = "reader-toolbar__status";

  toolbar.append(label, controlsRow, status);
  main.insertBefore(toolbar, article);
  injectToolbarStyles();

  if (!speechSupported) {
    status.textContent = "Tu navegador no soporta reproducción de texto por voz.";
    [playButton, languageToggle, languageSelect].forEach((control) => {
      control.disabled = true;
    });
    return;
  }

  const speech = window.speechSynthesis;
  const sourceText = article.innerText;
  let queue = [];
  let isStopped = true;

  const setPlayState = (isPlaying) => {
    playButton.textContent = isPlaying ? "⏹ Detener" : "▶ Reproducir";
  };

  const resolveVoice = (langCode) => {
    const voices = speech.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("es")) ||
      voices.find((v) => v.default) ||
      null
    );
  };

  const clearPlayback = () => {
    isStopped = true;
    queue = [];
    speech.cancel();
    setPlayState(false);
  };

  const speakNext = () => {
    if (isStopped) return;

    if (queue.length === 0) {
      status.textContent = "Reproducción finalizada.";
      clearPlayback();
      return;
    }

    const { text, langCode } = queue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = resolveVoice(langCode);

    utterance.lang = langCode;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      status.textContent = "Reproduciendo en español...";
      setPlayState(true);
    };

    utterance.onend = () => {
      if (!isStopped) speakNext();
    };

    utterance.onerror = () => {
      status.textContent = "No se pudo reproducir una parte del audio.";
      if (!isStopped) speakNext();
    };

    speech.speak(utterance);
  };

  playButton.addEventListener("click", () => {
    if (!isStopped || speech.speaking || speech.pending) {
      clearPlayback();
      status.textContent = "Reproducción detenida.";
      return;
    }

    const langCode = languageSelect.value || "es-ES";
    queue = splitTextIntoChunks(sourceText).map((text) => ({ text, langCode }));

    if (queue.length === 0) {
      status.textContent = "No se encontró texto para reproducir.";
      return;
    }

    isStopped = false;
    speakNext();
  });

  languageToggle.addEventListener("click", () => {
    languageWrap.hidden = !languageWrap.hidden;
    languageToggle.textContent = languageWrap.hidden ? "🌐 Idioma" : "✖ Ocultar idioma";
  });

  status.textContent = "Lectura en español lista. Idioma está oculto hasta que lo abras.";
  window.addEventListener("beforeunload", clearPlayback);
}

function injectToolbarStyles() {
  if (document.getElementById("reader-toolbar-styles")) return;

  const style = document.createElement("style");
  style.id = "reader-toolbar-styles";
  style.textContent = `
    .header-action-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 10px;
    }

    .print-button,
    .theme-toggle-button {
      width: 34px;
      height: 34px;
      padding: 0 !important;
      border-radius: 999px !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      line-height: 1;
    }

    .print-button {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.35);
      color: #fff;
    }

    .reader-toolbar {
      background: rgba(255,255,255,0.96);
      border: 1px solid #d6dde8;
      border-radius: 10px;
      padding: 8px 10px;
      margin: 0 0 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      max-width: 520px;
    }

    .reader-toolbar__label {
      margin: 0 0 6px;
      font-weight: 700;
      color: #2c3e50;
      font-size: 0.95rem;
    }

    .reader-toolbar__controls-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .reader-toolbar__language-wrap[hidden] {
      display: none;
    }

    .reader-toolbar__button {
      border: 1px solid #c8d4e5;
      background: #4a6491;
      color: #fff;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
    }

    .reader-toolbar__toggle-language {
      background: #eef3fb;
      color: #2c3e50;
    }

    .reader-toolbar__select {
      border: 1px solid #b7c3d6;
      border-radius: 999px;
      padding: 6px 8px;
      color: #2c3e50;
      font-size: 0.85rem;
      background: #fff;
    }

    .reader-toolbar__status {
      margin: 6px 0 0;
      font-size: 0.82rem;
      color: #5a6d86;
    }

    html[data-theme="dark"] .print-button,
    html[data-theme="dark"] .theme-toggle-button {
      background: rgba(30, 41, 59, 0.92);
      border-color: rgba(148, 163, 184, 0.35);
      color: #e2e8f0;
    }

    html[data-theme="dark"] .reader-toolbar {
      background: rgba(15, 23, 42, 0.88);
      border-color: #334155;
    }

    html[data-theme="dark"] .reader-toolbar__label,
    html[data-theme="dark"] .reader-toolbar__status,
    html[data-theme="dark"] .reader-toolbar__toggle-language {
      color: #e2e8f0;
    }

    html[data-theme="dark"] .reader-toolbar__toggle-language,
    html[data-theme="dark"] .reader-toolbar__select,
    html[data-theme="dark"] .reader-toolbar__button {
      border-color: #334155;
      background: #1e293b;
      color: #e2e8f0;
    }
  `;

  document.head.appendChild(style);
}
