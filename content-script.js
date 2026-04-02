(() => {
  if (window.__pipetteInjected) {
    return;
  }

  window.__pipetteInjected = true;

  const MESSAGE = {
    CAPTURED: "PIPETTE_CAPTURED",
    PING: "PIPETTE_PING",
    PREPARE_CAPTURE: "PIPETTE_PREPARE_CAPTURE",
    TOGGLE_REQUEST: "PIPETTE_TOGGLE_REQUEST"
  };

  const ROOT_ID = "pipette-root";
  const STYLE_ID = "pipette-style";
  const ACTIVE_CLASS = "pipette-active";
  const PANEL_MARGIN = 18;
  const MAX_PANELS = 5;
  const CURSOR_URL = chrome.runtime.getURL("assets/pipette-cursor.svg");

  const state = {
    active: false,
    captureToken: 0,
    canvas: null,
    context: null,
    currentColor: null,
    lastPoint: { x: 0, y: 0 },
    panelContainer: null,
    pending: false,
    preview: null,
    savedPanels: [],
    refreshInFlight: false,
    refreshTimer: null,
    sampleTimer: null,
    root: null,
    styleTag: null,
    previewSwatch: null
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message?.type) {
      case MESSAGE.PING:
        sendResponse({ ok: true });
        return;
      case MESSAGE.TOGGLE_REQUEST:
        if (state.active || state.pending) {
          deactivate();
          sendResponse({ activate: false });
        } else {
          beginActivation();
          sendResponse({ activate: true });
        }
        return;
      case MESSAGE.PREPARE_CAPTURE:
        hideUiForCapture();
        sendResponse({ ok: true });
        return;
      case MESSAGE.CAPTURED:
        void handleCapturedImage(message);
        sendResponse({ ok: true });
        return;
      default:
        return;
    }
  });

  document.addEventListener("pointermove", handlePointerMove, true);
  document.addEventListener("pointerdown", preventPageInteraction, true);
  document.addEventListener("click", preventPageInteraction, true);
  document.addEventListener("keydown", handleKeydown, true);
  window.addEventListener("scroll", scheduleRefreshCapture, true);
  window.addEventListener("resize", scheduleRefreshCapture, true);

  function beginActivation() {
    ensureUi();
    state.pending = true;
    state.root.hidden = true;
    document.documentElement.classList.add(ACTIVE_CLASS);
  }

  function deactivate() {
    state.active = false;
    state.pending = false;
    state.currentColor = null;
    clearTimeout(state.refreshTimer);
    state.refreshTimer = null;
    if (state.sampleFrame !== null) {
      cancelAnimationFrame(state.sampleFrame);
      state.sampleFrame = null;
    }

    state.samplePoint = null;
    state.refreshInFlight = false;

    if (state.root) {
      state.root.hidden = true;
      state.root.style.visibility = "visible";
    }
    clearSavedPanels();

    document.documentElement.classList.remove(ACTIVE_CLASS);
  }

  function ensureUi() {
    if (!state.styleTag) {
      state.styleTag = document.createElement("style");
      state.styleTag.id = STYLE_ID;
      state.styleTag.textContent = `
        html.${ACTIVE_CLASS},
        html.${ACTIVE_CLASS} * {
          cursor: url("${CURSOR_URL}") 2 23, crosshair !important;
        }

        #${ROOT_ID} {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: auto;
        }

        #${ROOT_ID}[hidden] {
          display: none !important;
        }

        #${ROOT_ID} .pipette-panels {
          position: fixed;
          top: ${PANEL_MARGIN}px;
          right: ${PANEL_MARGIN}px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 220px;
          pointer-events: auto;
        }

        #${ROOT_ID} .pipette-popup {
          position: relative;
          width: 100%;
          padding: 12px 12px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(17, 24, 39, 0.94);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
          color: #f9fafb;
          font: 12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          backdrop-filter: blur(10px);
          pointer-events: auto;
          user-select: text;
          overflow: visible;
        }

        #${ROOT_ID} .pipette-preview {
          position: fixed;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.35),
            0 10px 24px rgba(0, 0, 0, 0.28);
          pointer-events: none;
        }

        #${ROOT_ID} .pipette-popup-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        #${ROOT_ID} .pipette-swatch {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.18);
          flex: none;
        }

        #${ROOT_ID} .pipette-title {
          font: 600 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #ffffff;
        }

        #${ROOT_ID} .pipette-status {
          font: 10px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: rgba(249, 250, 251, 0.58);
        }

        #${ROOT_ID} .pipette-status {
          margin-top: 2px;
        }

        #${ROOT_ID} .pipette-row {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 10px;
          align-items: baseline;
          padding: 4px 0;
        }

        #${ROOT_ID} .pipette-copy {
          width: 100%;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }

        #${ROOT_ID} .pipette-copy,
        #${ROOT_ID} .pipette-copy * {
          cursor: copy !important;
        }

        #${ROOT_ID} .pipette-copy:hover .pipette-value,
        #${ROOT_ID} .pipette-copy:focus-visible .pipette-value {
          color: #93c5fd;
        }

        #${ROOT_ID} .pipette-copy:focus-visible {
          outline: 1px solid rgba(147, 197, 253, 0.9);
          outline-offset: 6px;
          border-radius: 8px;
        }

        #${ROOT_ID} .pipette-close {
          position: absolute;
          top: -10px;
          left: -10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.94);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
          color: rgba(249, 250, 251, 0.72);
          cursor: pointer !important;
          font: 600 16px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 0;
        }

        #${ROOT_ID} .pipette-close:hover,
        #${ROOT_ID} .pipette-close:focus-visible {
          color: #ffffff;
        }

        #${ROOT_ID} .pipette-label {
          color: rgba(249, 250, 251, 0.68);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        #${ROOT_ID} .pipette-value {
          color: #ffffff;
          font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          word-break: break-word;
        }
      `;
      document.documentElement.appendChild(state.styleTag);
    }

    if (state.root) {
      return;
    }

    state.root = document.createElement("div");
    state.root.id = ROOT_ID;
    state.root.hidden = true;

    state.preview = document.createElement("div");
    state.preview.className = "pipette-preview";
    state.previewSwatch = state.preview;

    state.panelContainer = document.createElement("div");
    state.panelContainer.className = "pipette-panels";

    state.root.append(state.preview, state.panelContainer);
    document.documentElement.appendChild(state.root);
  }

  function buildValueRow(label, text) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pipette-row pipette-copy";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void copyColorValue(text);
    });

    const heading = document.createElement("span");
    heading.className = "pipette-label";
    heading.textContent = label;

    const value = document.createElement("div");
    value.className = "pipette-value";
    value.textContent = text;

    button.append(heading, value);

    return { row: button };
  }

  function hideUiForCapture() {
    if (state.root && !state.root.hidden) {
      state.root.style.visibility = "hidden";
    }
  }

  async function handleCapturedImage(message) {
    if (!state.active && !state.pending) {
      return;
    }

    const captureToken = ++state.captureToken;

    try {
      const image = await loadImage(message.dataUrl);

      if (captureToken !== state.captureToken || (!state.active && !state.pending)) {
        return;
      }

      if (!state.canvas) {
        state.canvas = document.createElement("canvas");
        state.context = state.canvas.getContext("2d", { willReadFrequently: true });
      }

      state.canvas.width = image.naturalWidth;
      state.canvas.height = image.naturalHeight;
      state.context.clearRect(0, 0, state.canvas.width, state.canvas.height);
      state.context.drawImage(image, 0, 0);

      if (message.activate && state.pending) {
        state.pending = false;
        state.active = true;
        state.root.hidden = false;
      }

      if (state.root) {
        state.root.style.visibility = "visible";
      }

      if (state.active) {
        const fallbackX = state.lastPoint.x || Math.round(window.innerWidth / 2);
        const fallbackY = state.lastPoint.y || Math.round(window.innerHeight / 2);
        scheduleColorUpdate(fallbackX, fallbackY, { immediate: true });
      }
    } catch (error) {
      console.warn("Pipette image handling failed:", error);
      deactivate();
    }
  }

  function handlePointerMove(event) {
    if (!state.active && !state.pending) {
      return;
    }

    if (state.panelContainer?.contains(event.target)) {
      return;
    }

    state.lastPoint = {
      x: event.clientX,
      y: event.clientY
    };

    if (state.active) {
      scheduleColorUpdate(event.clientX, event.clientY);
    }
  }

  function scheduleColorUpdate(clientX, clientY, options = {}) {
    if (options.immediate) {
      if (state.sampleFrame !== null) {
        cancelAnimationFrame(state.sampleFrame);
        state.sampleFrame = null;
      }

      state.samplePoint = null;
      updateColorAtPoint(clientX, clientY);
      return;
    }

    state.samplePoint = { x: clientX, y: clientY };

    if (state.sampleFrame !== null) {
      return;
    }

    state.sampleFrame = requestAnimationFrame(() => {
      state.sampleFrame = null;

      if (!state.samplePoint) {
        return;
      }

      const { x, y } = state.samplePoint;
      state.samplePoint = null;
      updateColorAtPoint(x, y);
    });
  }

  function updateColorAtPoint(clientX, clientY) {
    if (!state.context || !state.canvas || !state.preview) {
      return;
    }

    const sampled = sampleColor(clientX, clientY);

    if (!sampled) {
      return;
    }

    const { r, g, b, a } = sampled;
    const hex = toHex(r, g, b, a);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const rgba = `rgba(${r}, ${g}, ${b}, ${formatAlpha(a)})`;

    state.currentColor = { hex, rgb, rgba };
    state.previewSwatch.style.backgroundColor = rgba;
    positionPreview(clientX, clientY);
    state.preview.hidden = false;
  }

  function sampleColor(clientX, clientY) {
    if (!state.canvas || !state.context || window.innerWidth === 0 || window.innerHeight === 0) {
      return null;
    }

    const scaleX = state.canvas.width / window.innerWidth;
    const scaleY = state.canvas.height / window.innerHeight;
    const sampleX = clamp(Math.round(clientX * scaleX), 0, state.canvas.width - 1);
    const sampleY = clamp(Math.round(clientY * scaleY), 0, state.canvas.height - 1);
    const data = state.context.getImageData(sampleX, sampleY, 1, 1).data;

    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3]
    };
  }

  function positionPreview(clientX, clientY) {
    const margin = 14;
    const size = state.preview.offsetWidth || 20;
    const left = clamp(clientX + 18, margin, Math.max(margin, window.innerWidth - size - margin));
    const top = clamp(clientY - Math.round(size / 2), margin, Math.max(margin, window.innerHeight - size - margin));

    state.preview.style.left = `${left}px`;
    state.preview.style.top = `${top}px`;
  }

  function scheduleRefreshCapture() {
    if (!state.active) {
      return;
    }

    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => {
      void requestFreshCapture();
    }, 120);
  }

  async function requestFreshCapture() {
    if (!state.active || state.refreshInFlight) {
      return;
    }

    state.refreshInFlight = true;

    try {
      await chrome.runtime.sendMessage({
        type: "PIPETTE_REQUEST_CAPTURE"
      });
    } catch (error) {
      console.warn("Pipette refresh failed:", error);

      if (state.root) {
        state.root.style.visibility = "visible";
      }
    } finally {
      state.refreshInFlight = false;
    }
  }

  function preventPageInteraction(event) {
    if (!state.active && !state.pending) {
      return;
    }

    if (state.panelContainer?.contains(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.type === "click" && state.active) {
      updateColorAtPoint(event.clientX, event.clientY);
      if (state.currentColor) {
        addSavedPanel(state.currentColor);
      }
    }
  }

  async function copyColorValue(text) {
    if (!text) {
      return;
    }

    try {
      await copyText(text);
    } catch (error) {
      console.warn("Pipette clipboard copy failed:", error);
    }
  }

  function handleKeydown(event) {
    if ((state.active || state.pending) && event.key === "Escape") {
      deactivate();
    }
  }

  function addSavedPanel(color) {
    const panelData = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      color
    };

    state.savedPanels.unshift(panelData);

    if (state.savedPanels.length > MAX_PANELS) {
      state.savedPanels.length = MAX_PANELS;
    }

    renderSavedPanels();
  }

  function clearSavedPanels() {
    state.savedPanels = [];

    if (state.panelContainer) {
      state.panelContainer.replaceChildren();
    }
  }

  function removeSavedPanel(id) {
    state.savedPanels = state.savedPanels.filter((panel) => panel.id !== id);
    renderSavedPanels();
  }

  function renderSavedPanels() {
    if (!state.panelContainer) {
      return;
    }

    state.panelContainer.replaceChildren();

    for (const [index, panel] of state.savedPanels.entries()) {
      state.panelContainer.appendChild(buildSavedPanel(panel, index));
    }
  }

  function buildSavedPanel(panel, index) {
    const card = document.createElement("div");
    card.className = "pipette-popup";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "pipette-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", `Remove saved color ${index + 1}`);
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeSavedPanel(panel.id);
    });

    const header = document.createElement("div");
    header.className = "pipette-popup-header";

    const swatch = document.createElement("div");
    swatch.className = "pipette-swatch";
    swatch.style.backgroundColor = panel.color.rgba;

    const headingText = document.createElement("div");
    const title = document.createElement("div");
    title.className = "pipette-title";
    title.textContent = panel.color.hex;

    const status = document.createElement("div");
    status.className = "pipette-status";
    status.textContent = "Click a value to copy";
    headingText.append(title, status);

    header.append(swatch, headingText);
    card.append(closeButton, header, buildValueRow("HEX", panel.color.hex).row, buildValueRow("RGB", panel.color.rgb).row, buildValueRow("RGBA", panel.color.rgba).row);

    return card;
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load captured tab image."));
      image.src = dataUrl;
    });
  }

  function toHex(r, g, b, a) {
    const base = `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

    if (a === 255) {
      return base;
    }

    return `${base}${a.toString(16).padStart(2, "0").toUpperCase()}`;
  }

  function formatAlpha(alphaByte) {
    if (alphaByte === 255) {
      return "1";
    }

    return (alphaByte / 255).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.documentElement.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    try {
      const copied = document.execCommand("copy");

      if (!copied) {
        throw new Error("document.execCommand('copy') returned false.");
      }
    } finally {
      textArea.remove();
    }
  }
})();
