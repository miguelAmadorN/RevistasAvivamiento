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
      return false;
    }

    let actionGroup = host.querySelector(".header-action-group");
    if (!actionGroup) {
      actionGroup = document.createElement("div");
      actionGroup.className = "header-action-group";
      host.appendChild(actionGroup);
    }

    const needsMove = printButton.parentElement !== actionGroup
      || themeButton.parentElement !== actionGroup
      || actionGroup.firstElementChild !== printButton
      || actionGroup.lastElementChild !== themeButton;

    if (needsMove) {
      actionGroup.append(printButton, themeButton);
    }

    return true;
  };

  if (regroup()) {
    return;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (regroup() || attempts >= 12) {
      clearInterval(timer);
    }
  }, 150);
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
  const storagePrefix = `reader:${window.location.pathname}`;
  const safeStorage = {
    getItem(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
  };

  const toolbar = document.createElement("section");
  toolbar.className = "reader-toolbar";
  toolbar.setAttribute("aria-label", "Controles de lectura");

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

  const languages = [
    { code: "es", label: "Español", speechLang: "es-ES" },
    { code: "en", label: "English", speechLang: "en-US" },
    { code: "pt", label: "Português", speechLang: "pt-BR" },
    { code: "fr", label: "Français", speechLang: "fr-FR" },
    { code: "it", label: "Italiano", speechLang: "it-IT" },
    { code: "de", label: "Deutsch", speechLang: "de-DE" },
    { code: "nl", label: "Nederlands", speechLang: "nl-NL" },
    { code: "pl", label: "Polski", speechLang: "pl-PL" },
    { code: "ru", label: "Русский", speechLang: "ru-RU" },
    { code: "uk", label: "Українська", speechLang: "uk-UA" },
    { code: "ro", label: "Română", speechLang: "ro-RO" },
    { code: "cs", label: "Čeština", speechLang: "cs-CZ" },
    { code: "sv", label: "Svenska", speechLang: "sv-SE" },
    { code: "tr", label: "Türkçe", speechLang: "tr-TR" },
    { code: "ar", label: "العربية", speechLang: "ar-SA" },
    { code: "hi", label: "हिन्दी", speechLang: "hi-IN" },
    { code: "ja", label: "日本語", speechLang: "ja-JP" },
    { code: "ko", label: "한국어", speechLang: "ko-KR" },
    { code: "zh", label: "中文", speechLang: "zh-CN" },
  ];

  const getLanguageConfig = (code) => (
    languages.find((language) => language.code === code) || languages[0]
  );

  languages.forEach(({ code, label: name }) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    if (code === "es") option.selected = true;
    languageSelect.appendChild(option);
  });

  languageWrap.appendChild(languageSelect);
  controlsRow.append(playButton, languageToggle, languageWrap);

  const status = document.createElement("p");
  status.className = "reader-toolbar__status";

  toolbar.append(label, controlsRow, status);
  main.insertBefore(toolbar, article);

  const separatorDock = document.createElement("div");
  separatorDock.className = "reader-separator-dock";
  separatorDock.setAttribute("aria-label", "Controles flotantes de separador");

  const bookmarkButton = document.createElement("button");
  bookmarkButton.type = "button";
  bookmarkButton.className = "reader-separator-dock__button reader-separator-dock__mark";
  bookmarkButton.innerHTML = "<span class=\"reader-separator-dock__icon\" aria-hidden=\"true\">🔖</span>";
  bookmarkButton.title = "Guardar separador en esta posición";
  bookmarkButton.setAttribute("aria-label", "Guardar separador en esta posición");

  const bookmarkGoButton = document.createElement("button");
  bookmarkGoButton.type = "button";
  bookmarkGoButton.className = "reader-separator-dock__button reader-separator-dock__go";
  bookmarkGoButton.innerHTML = "<span class=\"reader-separator-dock__icon\" aria-hidden=\"true\">📘</span>";
  bookmarkGoButton.title = "Ir al separador guardado";
  bookmarkGoButton.setAttribute("aria-label", "Ir al separador guardado");
  bookmarkGoButton.hidden = true;

  const fontSizeButton = document.createElement("button");
  fontSizeButton.type = "button";
  fontSizeButton.className = "reader-separator-dock__button reader-separator-dock__font-size";
  fontSizeButton.title = "Abrir controles de tamaño de letra";
  fontSizeButton.setAttribute("aria-label", "Abrir controles de tamaño de letra");
  fontSizeButton.innerHTML = "<span class=\"reader-separator-dock__icon\" aria-hidden=\"true\">Aa</span>";

  const fontSizePanel = document.createElement("div");
  fontSizePanel.className = "reader-separator-dock__font-panel";
  fontSizePanel.hidden = true;
  fontSizePanel.setAttribute("role", "group");
  fontSizePanel.setAttribute("aria-label", "Controles de tamaño de letra");

  const fontDecreaseButton = document.createElement("button");
  fontDecreaseButton.type = "button";
  fontDecreaseButton.className = "reader-separator-dock__font-action";
  fontDecreaseButton.textContent = "A−";
  fontDecreaseButton.title = "Disminuir tamaño de letra";
  fontDecreaseButton.setAttribute("aria-label", "Disminuir tamaño de letra");

  const fontResetButton = document.createElement("button");
  fontResetButton.type = "button";
  fontResetButton.className = "reader-separator-dock__font-action reader-separator-dock__font-action--reset";
  fontResetButton.textContent = "A";
  fontResetButton.title = "Restablecer tamaño de letra";
  fontResetButton.setAttribute("aria-label", "Restablecer tamaño de letra");

  const fontIncreaseButton = document.createElement("button");
  fontIncreaseButton.type = "button";
  fontIncreaseButton.className = "reader-separator-dock__font-action";
  fontIncreaseButton.textContent = "A+";
  fontIncreaseButton.title = "Aumentar tamaño de letra";
  fontIncreaseButton.setAttribute("aria-label", "Aumentar tamaño de letra");

  fontSizePanel.append(fontDecreaseButton, fontResetButton, fontIncreaseButton);
  separatorDock.append(bookmarkButton, bookmarkGoButton, fontSizeButton, fontSizePanel);
  document.body.appendChild(separatorDock);
  injectToolbarStyles();

  const bookmarkKey = `${storagePrefix}:bookmark`;
  const fontSizeKey = `${storagePrefix}:fontSize`;
  const baseRootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
  const minFontSize = Math.max(14, Math.round(baseRootFontSize - 2));
  const maxFontSize = Math.min(24, Math.round(baseRootFontSize + 8));
  const fontStep = 2;
  let currentFontSize = Math.round(baseRootFontSize);

  const applyFontSize = (sizePx) => {
    const boundedSize = Number.isFinite(sizePx)
      ? Math.min(Math.max(Math.round(sizePx), minFontSize), maxFontSize)
      : Math.round(baseRootFontSize);
    document.documentElement.style.fontSize = `${boundedSize}px`;
    currentFontSize = boundedSize;
  };

  const updateFontSizeButtons = () => {
    fontDecreaseButton.disabled = currentFontSize <= minFontSize;
    fontIncreaseButton.disabled = currentFontSize >= maxFontSize;
  };
  const getBookmark = () => {
    const rawBookmark = safeStorage.getItem(bookmarkKey);
    if (!rawBookmark) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawBookmark);
      if (!Number.isFinite(parsed?.scrollY)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const updateSeparatorButtonVisibility = () => {
    const bookmark = getBookmark();
    if (!bookmark) {
      bookmarkGoButton.hidden = true;
      bookmarkGoButton.classList.remove("is-visible");
      return;
    }

    const distance = Math.abs((window.scrollY || 0) - bookmark.scrollY);
    const shouldShow = distance >= 120;
    bookmarkGoButton.hidden = !shouldShow;
    bookmarkGoButton.classList.toggle("is-visible", shouldShow);
  };

  bookmarkButton.addEventListener("click", () => {
    const bookmark = {
      scrollY: Math.round(window.scrollY || 0),
      savedAt: new Date().toISOString(),
    };
    const didSave = safeStorage.setItem(bookmarkKey, JSON.stringify(bookmark));
    status.textContent = didSave
      ? "Separador guardado en esta posición."
      : "No se pudo guardar el separador en este navegador.";
    updateSeparatorButtonVisibility();
  });

  bookmarkGoButton.addEventListener("click", () => {
    const bookmark = getBookmark();
    if (!bookmark) {
      status.textContent = "Aún no tienes separador guardado.";
      return;
    }

    window.scrollTo({ top: bookmark.scrollY, behavior: "smooth" });
    status.textContent = "Te llevamos a tu separador.";
    setTimeout(updateSeparatorButtonVisibility, 250);
  });

  fontSizeButton.addEventListener("click", () => {
    const isExpanded = !fontSizePanel.hidden;
    fontSizePanel.hidden = isExpanded;
    fontSizeButton.classList.toggle("is-active", !isExpanded);
  });

  fontDecreaseButton.addEventListener("click", () => {
    const nextSize = currentFontSize - fontStep;
    applyFontSize(nextSize);
    safeStorage.setItem(fontSizeKey, String(currentFontSize));
    updateFontSizeButtons();
    status.textContent = "Tamaño de letra reducido.";
  });

  fontIncreaseButton.addEventListener("click", () => {
    const nextSize = currentFontSize + fontStep;
    applyFontSize(nextSize);
    safeStorage.setItem(fontSizeKey, String(currentFontSize));
    updateFontSizeButtons();
    status.textContent = "Tamaño de letra aumentado.";
  });

  fontResetButton.addEventListener("click", () => {
    applyFontSize(baseRootFontSize);
    safeStorage.setItem(fontSizeKey, String(currentFontSize));
    updateFontSizeButtons();
    status.textContent = "Tamaño de letra restablecido.";
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (separatorDock.contains(target)) {
      return;
    }
    fontSizePanel.hidden = true;
    fontSizeButton.classList.remove("is-active");
  });

  const storedFontSize = Number.parseFloat(safeStorage.getItem(fontSizeKey) || "");
  const initialFontSize = Number.isFinite(storedFontSize) ? storedFontSize : baseRootFontSize;
  applyFontSize(initialFontSize);
  updateFontSizeButtons();

  if (!speechSupported) {
    status.textContent = "Tu navegador no soporta lectura en voz alta, pero sí tu separador.";
    [playButton, languageToggle, languageSelect].forEach((control) => {
      control.disabled = true;
    });
    updateSeparatorButtonVisibility();
    window.addEventListener("scroll", updateSeparatorButtonVisibility, { passive: true });
    return;
  }

  const speech = window.speechSynthesis;
  const sourceText = article.innerText;
  const translationCache = new Map();
  let queue = [];
  let isStopped = true;
  let isPreparing = false;

  const setPlayState = (isPlaying) => {
    playButton.textContent = isPlaying ? "⏹ Detener" : "▶ Reproducir";
  };

  const resolveVoice = (langCode) => {
    const voices = speech.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase())) ||
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

  const translateChunk = async (chunk, targetLang) => {
    const cacheKey = `${targetLang}:${chunk}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error("translate failed");
      }

      const data = await response.json();
      const translated = (data?.[0] || []).map((entry) => entry?.[0] || "").join("").trim();
      const resolved = translated || chunk;
      translationCache.set(cacheKey, resolved);
      return resolved;
    } catch {
      return chunk;
    } finally {
      clearTimeout(timeout);
    }
  };

  const buildSpeechQueue = async (language) => {
    const baseChunks = splitTextIntoChunks(sourceText, 700);
    const langCode = language.code;
    const speechLang = language.speechLang;

    if (langCode === "es") {
      return baseChunks.map((text) => ({ text, langCode: speechLang, label: language.label }));
    }

    status.textContent = `Traduciendo a ${language.label}...`;
    const translatedChunks = [];

    for (const chunk of baseChunks) {
      const translatedChunk = await translateChunk(chunk, langCode);
      translatedChunks.push(translatedChunk);
    }

    return translatedChunks.map((text) => ({ text, langCode: speechLang, label: language.label }));
  };

  const speakNext = () => {
    if (isStopped) return;

    if (queue.length === 0) {
      status.textContent = "Reproducción finalizada.";
      clearPlayback();
      return;
    }

    const { text, langCode, label: languageLabel } = queue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = resolveVoice(langCode);

    utterance.lang = voice?.lang || langCode;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      status.textContent = `Reproduciendo en ${languageLabel || langCode}...`;
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

  playButton.addEventListener("click", async () => {
    if (isPreparing) {
      return;
    }

    if (!isStopped || speech.speaking || speech.pending) {
      clearPlayback();
      status.textContent = "Reproducción detenida.";
      return;
    }

    isPreparing = true;
    playButton.disabled = true;

    try {
      const language = getLanguageConfig(languageSelect.value || "es");
      queue = await buildSpeechQueue(language);

      if (queue.length === 0) {
        status.textContent = "No se encontró texto para reproducir.";
        return;
      }

      isStopped = false;
      speakNext();
    } finally {
      isPreparing = false;
      playButton.disabled = false;
    }
  });

  languageToggle.addEventListener("click", () => {
    languageWrap.hidden = !languageWrap.hidden;
    languageToggle.textContent = languageWrap.hidden ? "🌐 Idioma" : "✖ Ocultar idioma";
  });

  status.textContent = "Listo para leer. Tu separador está activo.";
  updateSeparatorButtonVisibility();
  window.addEventListener("scroll", updateSeparatorButtonVisibility, { passive: true });
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
      background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.96));
      border: 1px solid #d6dde8;
      border-radius: 10px;
      padding: 8px 10px;
      margin: 0 0 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      max-width: 560px;
    }

    .reader-toolbar__label {
      margin: 0 0 2px;
      font-weight: 700;
      color: #2c3e50;
      font-size: 1rem;
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
      background: linear-gradient(135deg, #4a6491, #35507f);
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

    .reader-separator-dock {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d1d9e6;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.22);
      backdrop-filter: blur(6px);
    }

    .reader-separator-dock__button {
      border: none;
      border-radius: 12px;
      width: 44px;
      height: 44px;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.35);
      transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
    }

    .reader-separator-dock__button:hover {
      transform: translateY(-1px) scale(1.04);
      filter: saturate(1.08);
    }

    .reader-separator-dock__button:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
    }

    .reader-separator-dock__icon {
      font-size: 1.18rem;
      line-height: 1;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.22));
    }

    .reader-separator-dock__go {
      background: linear-gradient(135deg, #0f766e, #0d9488);
      box-shadow: 0 8px 18px rgba(13, 148, 136, 0.33);
      display: none;
    }

    .reader-separator-dock__go.is-visible {
      display: inline-flex;
    }

    .reader-separator-dock__font-size {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      box-shadow: 0 8px 18px rgba(109, 40, 217, 0.32);
    }

    .reader-separator-dock__font-size .reader-separator-dock__icon {
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .reader-separator-dock__font-size.is-active {
      outline: 2px solid rgba(255, 255, 255, 0.85);
      outline-offset: 1px;
    }

    .reader-separator-dock__font-panel {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid #d1d9e6;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
    }

    .reader-separator-dock__font-panel[hidden] {
      display: none;
    }

    .reader-separator-dock__font-action {
      border: 1px solid #c8d4e5;
      background: #ffffff;
      color: #1e293b;
      border-radius: 10px;
      min-width: 38px;
      height: 34px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0 8px;
    }

    .reader-separator-dock__font-action:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .reader-separator-dock__font-action--reset {
      min-width: 32px;
    }

    html[data-theme="dark"] .print-button,
    html[data-theme="dark"] .theme-toggle-button {
      background: rgba(30, 41, 59, 0.92);
      border-color: rgba(148, 163, 184, 0.35);
      color: #e2e8f0;
    }

    html[data-theme="dark"] .reader-toolbar {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.96));
      border-color: #475569;
      box-shadow: 0 6px 18px rgba(2, 6, 23, 0.35);
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

    html[data-theme="dark"] .reader-toolbar__button:not(.reader-toolbar__toggle-language) {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border-color: #3b82f6;
    }

    html[data-theme="dark"] .reader-separator-dock {
      background: rgba(15, 23, 42, 0.86);
      border-color: #334155;
      box-shadow: 0 10px 25px rgba(2, 6, 23, 0.4);
    }

    html[data-theme="dark"] .reader-separator-dock__button {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    html[data-theme="dark"] .reader-separator-dock__go {
      background: linear-gradient(135deg, #14b8a6, #0d9488);
    }

    html[data-theme="dark"] .reader-separator-dock__font-size {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    }

    html[data-theme="dark"] .reader-separator-dock__font-panel {
      background: rgba(15, 23, 42, 0.96);
      border-color: #334155;
      box-shadow: 0 8px 20px rgba(2, 6, 23, 0.4);
    }

    html[data-theme="dark"] .reader-separator-dock__font-action {
      background: #1e293b;
      border-color: #475569;
      color: #e2e8f0;
    }

    @media (max-width: 640px) {
      .reader-separator-dock {
        right: 10px;
        bottom: 10px;
        padding: 6px;
      }

      .reader-separator-dock__button {
        width: 42px;
        height: 42px;
      }

      .reader-separator-dock__icon {
        font-size: 1.1rem;
      }
    }
  `;

  document.head.appendChild(style);
}
