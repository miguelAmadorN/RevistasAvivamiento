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

  addReadAloudControls(main, article);
});

function splitTextIntoChunks(text, maxLength = 800) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) {
    return [];
  }

  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    if ((currentChunk + " " + sentence).trim().length <= maxLength) {
      currentChunk = (currentChunk + " " + sentence).trim();
      return;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (sentence.length <= maxLength) {
      currentChunk = sentence;
      return;
    }

    for (let i = 0; i < sentence.length; i += maxLength) {
      chunks.push(sentence.slice(i, i + maxLength));
    }
    currentChunk = "";
  });

  if (currentChunk) {
    chunks.push(currentChunk);
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

  const status = document.createElement("p");
  status.className = "reader-toolbar__status";

  if (!speechSupported) {
    status.textContent = "Tu navegador no soporta reproducción de texto por voz.";
    [playButton, pauseButton, stopButton].forEach((button) => {
      button.disabled = true;
    });
  } else {
    status.textContent = "Usa los controles para escuchar el contenido en español.";
  }

  const buttons = document.createElement("div");
  buttons.className = "reader-toolbar__buttons";
  buttons.append(playButton, pauseButton, stopButton);

  toolbar.append(label, buttons, status);
  main.insertBefore(toolbar, article);
  injectToolbarStyles();

  if (!speechSupported) {
    return;
  }

  const speech = window.speechSynthesis;
  let queue = [];
  let isStopped = false;
  let voiceRetryEnabled = true;

  const getVoice = () => {
    const voices = speech.getVoices();
    return (
      voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("es")) ||
      voices.find((voice) => voice.default) ||
      null
    );
  };

  const clearPlayback = () => {
    isStopped = true;
    queue = [];
    speech.cancel();
  };

  const speakNext = () => {
    if (isStopped || queue.length === 0) {
      if (!speech.speaking && !speech.paused) {
        status.textContent = "Reproducción finalizada.";
      }
      return;
    }

    const chunk = queue.shift();
    const utterance = new SpeechSynthesisUtterance(chunk);
    const voice = getVoice();

    if (voice && voiceRetryEnabled) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "es-ES";
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      status.textContent = "Reproduciendo contenido...";
    };

    utterance.onend = () => {
      if (!isStopped) {
        speakNext();
      }
    };

    utterance.onerror = (event) => {
      if (!isStopped && voiceRetryEnabled) {
        voiceRetryEnabled = false;
        queue.unshift(chunk);
        status.textContent = "Reintentando con la voz predeterminada del navegador...";
        setTimeout(() => {
          speakNext();
        }, 100);
        return;
      }

      if (!isStopped) {
        status.textContent = "No se pudo reproducir una parte del audio.";
        speakNext();
      }
    };

    speech.speak(utterance);
  };

  playButton.addEventListener("click", () => {
    if (speech.paused) {
      speech.resume();
      status.textContent = "Reproducción reanudada.";
      return;
    }

    if (speech.speaking) {
      return;
    }

    const text = article.innerText;
    const chunks = splitTextIntoChunks(text);

    if (chunks.length === 0) {
      status.textContent = "No se encontró texto para reproducir.";
      return;
    }

    isStopped = false;
    voiceRetryEnabled = true;
    queue = [...chunks];
    speakNext();
  });

  pauseButton.addEventListener("click", () => {
    if (speech.speaking && !speech.paused) {
      speech.pause();
      status.textContent = "Reproducción pausada.";
    }
  });

  stopButton.addEventListener("click", () => {
    if (speech.speaking || speech.paused) {
      clearPlayback();
      status.textContent = "Reproducción detenida.";
    }
  });

  if (speech.onvoiceschanged !== undefined) {
    speech.onvoiceschanged = () => {
      getVoice();
    };
  }

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
      padding: 16px;
      margin: 0 0 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .reader-toolbar__label {
      margin: 0 0 10px;
      font-weight: 700;
      color: #2c3e50;
    }

    .reader-toolbar__buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .reader-toolbar__button {
      border: none;
      background: #4a6491;
      color: #fff;
      border-radius: 6px;
      padding: 8px 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .reader-toolbar__button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .reader-toolbar__status {
      margin: 10px 0 0;
      color: #425a76;
      font-size: 0.95rem;
    }
  `;

  document.head.appendChild(style);
}
