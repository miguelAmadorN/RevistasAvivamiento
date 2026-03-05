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
  const printButtons = document.querySelectorAll(".print-button");

  printButtons.forEach((button) => {
    const originalText = (button.textContent || "").trim().toLowerCase();
    if (!originalText.includes("imprimir") && !originalText.includes("🖨")) {
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

  const observer = new MutationObserver(() => {
    regroup();
  });

  observer.observe(host, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 2000);
}

function splitTextIntoChunks(text, maxLength = 900) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) {
    return [];
  }

  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if ((`${current} ${sentence}`).trim().length <= maxLength) {
      current = `${current} ${sentence}`.trim();
      return;
    }

    if (current) {
      chunks.push(current);
    }

    if (sentence.length <= maxLength) {
      current = sentence;
      return;
    }

    for (let i = 0; i < sentence.length; i += maxLength) {
      chunks.push(sentence.slice(i, i + maxLength));
    }

    current = "";
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function addReadAloudControls(main, article) {
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  const toolbar = document.createElement("section");
  toolbar.className = "reader-toolbar";
  toolbar.setAttribute("aria-label", "Controles de lectura en voz alta");

  const label = document.createElement("p");
  label.className = "reader-toolbar__label";
  label.textContent = "Escuchar esta revista";

  const controlsRow = document.createElement("div");
  controlsRow.className = "reader-toolbar__controls-row";

  const languageSelect = document.createElement("select");
  languageSelect.className = "reader-toolbar__select";
  languageSelect.setAttribute("aria-label", "Idioma de lectura");

  const languages = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "pt", label: "Português" },
    { code: "fr", label: "Français" },
    { code: "it", label: "Italiano" },
    { code: "de", label: "Deutsch" },
  ];

  languages.forEach(({ code, label: languageLabel }) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = languageLabel;
    if (code === "es") {
      option.selected = true;
    }
    languageSelect.appendChild(option);
  });

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "reader-toolbar__button reader-toolbar__play-toggle";
  playButton.textContent = "▶ Reproducir";

  controlsRow.append(languageSelect, playButton);

  const status = document.createElement("p");
  status.className = "reader-toolbar__status";

  toolbar.append(label, controlsRow, status);
  main.insertBefore(toolbar, article);
  injectToolbarStyles();

  if (!speechSupported) {
    status.textContent = "Tu navegador no soporta reproducción de texto por voz.";
    [languageSelect, playButton].forEach((control) => {
      control.disabled = true;
    });
    return;
  }

  const speech = window.speechSynthesis;
  const originalText = article.innerText;
  const translatedCache = new Map();
  let queue = [];
  let isStopped = true;
  let isBusy = false;

  const setPlayButtonState = (isPlaying) => {
    playButton.textContent = isPlaying ? "⏹ Detener" : "▶ Reproducir";
  };

  const resolveVoice = (langCode) => {
    const voices = speech.getVoices();
    const exact = voices.find((voice) => voice.lang.toLowerCase() === langCode.toLowerCase());
    if (exact) return exact;

    const sameBase = voices.find((voice) => voice.lang.toLowerCase().startsWith(langCode.toLowerCase()));
    if (sameBase) return sameBase;

    return voices.find((voice) => voice.default) || null;
  };

  const clearPlayback = () => {
    isStopped = true;
    queue = [];
    speech.cancel();
    setPlayButtonState(false);
  };

  const speakNext = () => {
    if (isStopped) {
      return;
    }

    if (queue.length === 0) {
      status.textContent = "Reproducción finalizada.";
      setPlayButtonState(false);
      isStopped = true;
      return;
    }

    const { text, langCode } = queue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = resolveVoice(langCode);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = langCode;
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      status.textContent = `Reproduciendo en ${langCode.toUpperCase()}...`;
      setPlayButtonState(true);
    };

    utterance.onend = () => {
      if (!isStopped) {
        speakNext();
      }
    };

    utterance.onerror = () => {
      if (!isStopped) {
        status.textContent = "No se pudo reproducir una parte del audio.";
        speakNext();
      }
    };

    speech.speak(utterance);
  };

  const translateText = async (text, targetLang) => {
    if (targetLang === "es") {
      return text;
    }

    const cacheKey = `${targetLang}:${text.length}`;
    if (translatedCache.has(cacheKey)) {
      return translatedCache.get(cacheKey);
    }

    const chunks = splitTextIntoChunks(text, 700);
    const translatedChunks = [];

    for (const chunk of chunks) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("No se pudo traducir");
      }

      const data = await response.json();
      const translated = (data?.[0] || []).map((entry) => entry?.[0] || "").join("");
      translatedChunks.push(translated);
    }

    const result = translatedChunks.join(" ").trim();
    translatedCache.set(cacheKey, result);
    return result;
  };

  const buildQueueForLanguage = async (langCode) => {
    let textForSpeech = originalText;

    if (langCode !== "es") {
      status.textContent = `Traduciendo contenido a ${langCode.toUpperCase()}...`;
      textForSpeech = await translateText(originalText, langCode);
    }

    const chunks = splitTextIntoChunks(textForSpeech);
    return chunks.map((chunk) => ({ text: chunk, langCode }));
  };

  playButton.addEventListener("click", async () => {
    if (isBusy) {
      return;
    }

    if (!isStopped || speech.speaking || speech.pending) {
      clearPlayback();
      status.textContent = "Reproducción detenida.";
      return;
    }

    isBusy = true;
    playButton.disabled = true;

    try {
      const langCode = languageSelect.value || "es";
      queue = await buildQueueForLanguage(langCode);

      if (queue.length === 0) {
        status.textContent = "No se encontró texto para reproducir.";
        setPlayButtonState(false);
        isStopped = true;
      } else {
        isStopped = false;
        speakNext();
      }
    } catch (error) {
      status.textContent = "No se pudo traducir o preparar el audio.";
      clearPlayback();
    } finally {
      isBusy = false;
      playButton.disabled = false;
    }
  });

  status.textContent = "Idioma por defecto: Español. El botón Reproducir cambia a Detener.";
  window.addEventListener("beforeunload", clearPlayback);
}

function injectToolbarStyles() {
  if (document.getElementById("reader-toolbar-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "reader-toolbar-styles";
  style.textContent = `
    .header-action-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 10px;
    }

    .reader-toolbar {
      background: #ffffff;
      border: 1px solid #d6dde8;
      border-left: 4px solid #4a6491;
      border-radius: 8px;
      padding: 10px 12px;
      margin: 0 0 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .reader-toolbar__label {
      margin: 0 0 6px;
      font-weight: 700;
      color: #2c3e50;
    }

    .reader-toolbar__controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .reader-toolbar__select {
      border: 1px solid #b7c3d6;
      border-radius: 6px;
      padding: 6px 8px;
      color: #2c3e50;
      max-width: 100%;
    }

    .reader-toolbar__button {
      border: none;
      background: #4a6491;
      color: #fff;
      border-radius: 6px;
      padding: 6px 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .reader-toolbar__button[disabled],
    .reader-toolbar__select[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .reader-toolbar__status {
      margin: 6px 0 0;
      color: #425a76;
      font-size: 0.92rem;
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

    .print-button:hover,
    .theme-toggle-button:hover {
      transform: translateY(-1px);
    }

    html[data-theme="dark"] .print-button,
    html[data-theme="dark"] .theme-toggle-button {
      background: rgba(30, 41, 59, 0.92);
      border-color: rgba(148, 163, 184, 0.35);
      color: #e2e8f0;
    }

    html[data-theme="dark"] body {
      background-color: #0f172a;
      color: #e2e8f0;
    }

    html[data-theme="dark"] .content-section,
    html[data-theme="dark"] .editorial-container,
    html[data-theme="dark"] .reader-toolbar,
    html[data-theme="dark"] .scripture,
    html[data-theme="dark"] .note,
    html[data-theme="dark"] .highlight-box,
    html[data-theme="dark"] .warning-box,
    html[data-theme="dark"] .math-illustration,
    html[data-theme="dark"] .intro-box,
    html[data-theme="dark"] .editorial-text {
      background-color: #1e293b !important;
      color: #e2e8f0 !important;
      border-color: #334155 !important;
    }

    html[data-theme="dark"] h1,
    html[data-theme="dark"] h2,
    html[data-theme="dark"] h3,
    html[data-theme="dark"] p,
    html[data-theme="dark"] li,
    html[data-theme="dark"] .reader-toolbar__label,
    html[data-theme="dark"] .reader-toolbar__status,
    html[data-theme="dark"] .scripture-ref,
    html[data-theme="dark"] .author,
    html[data-theme="dark"] .subtitle,
    html[data-theme="dark"] footer {
      color: #e2e8f0 !important;
    }

    html[data-theme="dark"] .reader-toolbar__select {
      background-color: #0f172a;
      color: #e2e8f0;
      border-color: #334155;
    }

    html[data-theme="dark"] .reader-toolbar__button,
    html[data-theme="dark"] .menu-button,
    html[data-theme="dark"] .button {
      background-color: #334155 !important;
      color: #e2e8f0 !important;
    }

    html[data-theme="dark"] a {
      color: #93c5fd;
    }
  `;

  document.head.appendChild(style);
}
