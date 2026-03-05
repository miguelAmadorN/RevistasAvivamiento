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
  addReadAloudControls(main, article);
});

function enhancePrintButtons() {
  const printButtons = document.querySelectorAll(".print-button");

  printButtons.forEach((button) => {
    const originalText = (button.textContent || "").trim().toLowerCase();
    if (!originalText.includes("imprimir")) {
      return;
    }

    button.setAttribute("aria-label", "Imprimir este número");
    button.setAttribute("title", "Imprimir este número");
    button.textContent = "🖨️";
  });
}

function splitTextIntoChunks(text, maxLength = 800) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) {
    return [];
  }

  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if ((current + " " + sentence).trim().length <= maxLength) {
      current = (current + " " + sentence).trim();
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

  const voiceSelect = document.createElement("select");
  voiceSelect.className = "reader-toolbar__select";
  voiceSelect.setAttribute("aria-label", "Idioma y voz de lectura");


  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "reader-toolbar__button";
  playButton.textContent = "▶ Reproducir";

  const pauseButton = document.createElement("button");
  pauseButton.type = "button";
  pauseButton.className = "reader-toolbar__button";
  pauseButton.textContent = "⏸ Pausar";

  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.className = "reader-toolbar__button";
  stopButton.textContent = "⏹ Detener";

  const buttons = document.createElement("div");
  buttons.className = "reader-toolbar__buttons";
  buttons.append(playButton, pauseButton, stopButton);

  controlsRow.append(voiceSelect, buttons);

  const status = document.createElement("p");
  status.className = "reader-toolbar__status";

  toolbar.append(label, controlsRow, status);
  main.insertBefore(toolbar, article);
  injectToolbarStyles();

  if (!speechSupported) {
    status.textContent = "Tu navegador no soporta reproducción de texto por voz.";
    [voiceSelect, playButton, pauseButton, stopButton].forEach((control) => {
      control.disabled = true;
    });
    return;
  }

  const speech = window.speechSynthesis;
  let queue = [];
  let isStopped = true;
  let isPaused = false;
  let currentUtterance = null;

  const getPreferredLanguage = () => {
    return document.documentElement.lang || navigator.language || "es-ES";
  };

  const buildVoiceOptions = () => {
    const voices = speech.getVoices();
    voiceSelect.innerHTML = "";

    const autoOption = document.createElement("option");
    autoOption.value = "auto";
    autoOption.textContent = `Automático (${getPreferredLanguage()})`;
    voiceSelect.appendChild(autoOption);

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = `${voice.lang} — ${voice.name}`;
      voiceSelect.appendChild(option);
    });
  };

  const resolveVoiceAndLang = () => {
    const voices = speech.getVoices();
    const preferredLanguage = getPreferredLanguage().toLowerCase();

    if (voiceSelect.value && voiceSelect.value !== "auto") {
      const selected = voices.find((voice) => voice.name === voiceSelect.value);
      if (selected) {
        return { voice: selected, lang: selected.lang };
      }
    }

    const byExactLang = voices.find((voice) => voice.lang.toLowerCase() === preferredLanguage);
    if (byExactLang) {
      return { voice: byExactLang, lang: byExactLang.lang };
    }

    const baseLang = preferredLanguage.split("-")[0];
    const byBaseLang = voices.find((voice) => voice.lang.toLowerCase().startsWith(baseLang));
    if (byBaseLang) {
      return { voice: byBaseLang, lang: byBaseLang.lang };
    }

    const defaultVoice = voices.find((voice) => voice.default);
    if (defaultVoice) {
      return { voice: defaultVoice, lang: defaultVoice.lang };
    }

    return { voice: null, lang: getPreferredLanguage() };
  };

  const clearPlayback = () => {
    isStopped = true;
    isPaused = false;
    queue = [];
    currentUtterance = null;
    speech.cancel();
  };

  const speakNext = () => {
    if (isStopped || isPaused) {
      return;
    }

    if (queue.length === 0) {
      if (!speech.speaking && !speech.paused) {
        status.textContent = "Reproducción finalizada.";
      }
      currentUtterance = null;
      return;
    }

    const chunk = queue.shift();
    const utterance = new SpeechSynthesisUtterance(chunk);
    const { voice, lang } = resolveVoiceAndLang();

    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      status.textContent = `Reproduciendo contenido (${utterance.lang})...`;
    };

    utterance.onend = () => {
      currentUtterance = null;
      if (!isStopped && !isPaused) {
        speakNext();
      }
    };

    utterance.onerror = () => {
      currentUtterance = null;
      if (!isStopped) {
        status.textContent = "No se pudo reproducir una parte del audio.";
        speakNext();
      }
    };

    currentUtterance = utterance;
    speech.speak(utterance);
  };

  buildVoiceOptions();

  if (speech.onvoiceschanged !== undefined) {
    speech.onvoiceschanged = () => {
      buildVoiceOptions();
    };
  }

  playButton.addEventListener("click", () => {
    if (speech.paused) {
      isPaused = false;
      speech.resume();
      status.textContent = "Reproducción reanudada.";
      return;
    }

    if (speech.speaking) {
      return;
    }

    if (!isStopped && queue.length > 0) {
      isPaused = false;
      status.textContent = "Reproducción reanudada.";
      speakNext();
      return;
    }

    const chunks = splitTextIntoChunks(article.innerText);
    if (chunks.length === 0) {
      status.textContent = "No se encontró texto para reproducir.";
      return;
    }

    clearPlayback();
    isStopped = false;
    isPaused = false;
    queue = chunks;
    speakNext();
  });

  pauseButton.addEventListener("click", () => {
    if (speech.speaking && !speech.paused) {
      isPaused = true;
      speech.pause();
      status.textContent = "Reproducción pausada.";
      return;
    }

    if (!speech.speaking && queue.length > 0) {
      isPaused = true;
      status.textContent = "Reproducción pausada.";
    }
  });

  stopButton.addEventListener("click", () => {
    if (speech.speaking || speech.paused || queue.length > 0) {
      clearPlayback();
      status.textContent = "Reproducción detenida.";
    }
  });

  status.textContent = "Usa los controles para escuchar el contenido. Puedes cambiar idioma/voz.";
  window.addEventListener("beforeunload", clearPlayback);
}

function injectToolbarStyles() {
  if (document.getElementById("reader-toolbar-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "reader-toolbar-styles";
  style.textContent = `
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

    .reader-toolbar__buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
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
      font-size: 0.95rem;
    }


    .print-button {
      width: 38px;
      height: 38px;
      padding: 0;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      line-height: 1;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.35);
      color: #fff;
    }

    .print-button:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.3);
    }

    html[data-theme="dark"] .print-button {
      background: rgba(30, 41, 59, 0.92);
      border-color: rgba(148, 163, 184, 0.35);
      color: #e2e8f0;
    }

    html[data-theme="light"] .print-button {
      background: rgba(255,255,255,0.25);
      border-color: rgba(255,255,255,0.45);
      color: #ffffff;
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
