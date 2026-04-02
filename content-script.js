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
  const POINTER_SAMPLE_DELAY = 24;
  const CURSOR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path fill="#111827" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" d="M20.1 4.2l7.7 7.7-3.1 3.1-2.2-2.2-4.8 4.8 1.4 1.4-2.2 2.2-1.4-1.4-6.1 6.1c-.9.9-2.5.9-3.4 0l-.6-.6c-.9-.9-.9-2.5 0-3.4l6.1-6.1-1.4-1.4 2.2-2.2 1.4 1.4 4.8-4.8-2.2-2.2 3.1-3.1z"/>
      <circle cx="7.4" cy="24.6" r="2.6" fill="#ffffff" stroke="#111827" stroke-width="1.2"/>
    </svg>`
  )}`;

  const state = {
    active: false,
    captureToken: 0,
    canvas: null,
    context: null,
    halo: null,
    hexValue: null,
    lastPoint: { x: 0, y: 0 },
    pending: false,
    popup: null,
    popupPinned: false,
    refreshInFlight: false,
    refreshTimer: null,
    sampleTimer: null,
    rgbValue: null,
    rgbaValue: null,
    root: null,
    statusLine: null,
    styleTag: null,
    swatch: null
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
    state.popupPinned = false;
    clearTimeout(state.refreshTimer);
    state.refreshTimer = null;
    clearTimeout(state.sampleTimer);
    state.sampleTimer = null;
    state.refreshInFlight = false;

    if (state.root) {
      state.root.hidden = true;
      state.root.style.visibility = "visible";
    }

    document.documentElement.classList.remove(ACTIVE_CLASS);
  }

  function ensureUi() {
    if (!state.styleTag) {
      state.styleTag = document.createElement("style");
      state.styleTag.id = STYLE_ID;
      state.styleTag.textContent = `
        html.${ACTIVE_CLASS},
        html.${ACTIVE_CLASS} * {
          cursor: url("${CURSOR_DATA_URL}") 8 24, crosshair !important;
        }

        #${ROOT_ID} {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: none;
        }

        #${ROOT_ID}[hidden] {
          display: none !important;
        }

        #${ROOT_ID} .pipette-halo {
          position: fixed;
          width: 20px;
          height: 20px;
          margin-left: -10px;
          margin-top: -10px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 0 0 1px rgba(17, 24, 39, 0.85),
            0 0 0 8px rgba(17, 24, 39, 0.18);
          background: transparent;
        }

        #${ROOT_ID} .pipette-popup {
          position: fixed;
          width: 220px;
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
          margin-top: 2px;
          font: 10px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: rgba(249, 250, 251, 0.58);
        }

        #${ROOT_ID} .pipette-row {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 10px;
          align-items: baseline;
          padding: 4px 0;
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

    state.halo = document.createElement("div");
    state.halo.className = "pipette-halo";

    state.popup = document.createElement("div");
    state.popup.className = "pipette-popup";
    state.popup.addEventListener("pointerenter", () => {
      state.popupPinned = true;
    });
    state.popup.addEventListener("pointerleave", () => {
      state.popupPinned = false;
    });

    const header = document.createElement("div");
    header.className = "pipette-popup-header";

    state.swatch = document.createElement("div");
    state.swatch.className = "pipette-swatch";

    const headingText = document.createElement("div");

    const title = document.createElement("div");
    title.className = "pipette-title";
    title.textContent = "Pipette";

    state.statusLine = document.createElement("div");
    state.statusLine.className = "pipette-status";
    state.statusLine.textContent = "Esc closes";

    headingText.append(title, state.statusLine);
    header.append(state.swatch, headingText);

    const hexRow = buildValueRow("HEX");
    state.hexValue = hexRow.value;

    const rgbRow = buildValueRow("RGB");
    state.rgbValue = rgbRow.value;

    const rgbaRow = buildValueRow("RGBA");
    state.rgbaValue = rgbaRow.value;

    state.popup.append(header, hexRow.row, rgbRow.row, rgbaRow.row);
    state.root.append(state.halo, state.popup);
    document.documentElement.appendChild(state.root);
  }

  function buildValueRow(label) {
    const row = document.createElement("div");
    row.className = "pipette-row";

    const heading = document.createElement("span");
    heading.className = "pipette-label";
    heading.textContent = label;

    const value = document.createElement("div");
    value.className = "pipette-value";
    value.textContent = "--";

    row.append(heading, value);

    return { row, value };
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

    if (state.popupPinned || state.popup?.contains(event.target)) {
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
    clearTimeout(state.sampleTimer);

    if (options.immediate) {
      state.sampleTimer = null;
      updateColorAtPoint(clientX, clientY);
      return;
    }

    state.sampleTimer = setTimeout(() => {
      state.sampleTimer = null;
      updateColorAtPoint(clientX, clientY);
    }, POINTER_SAMPLE_DELAY);
  }

  function updateColorAtPoint(clientX, clientY) {
    if (!state.context || !state.canvas || !state.popup || !state.halo) {
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

    state.swatch.style.backgroundColor = rgba;
    state.hexValue.textContent = hex;
    state.rgbValue.textContent = rgb;
    state.rgbaValue.textContent = rgba;
    state.statusLine.textContent = "Esc or shortcut closes";

    state.halo.style.left = `${clientX}px`;
    state.halo.style.top = `${clientY}px`;

    positionPopup(clientX, clientY);
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

  function positionPopup(clientX, clientY) {
    const margin = 18;
    const width = state.popup.offsetWidth || 186;
    const height = state.popup.offsetHeight || 138;

    let left = clientX + 24;
    let top = clientY + 24;

    if (left + width + margin > window.innerWidth) {
      left = clientX - width - 24;
    }

    if (top + height + margin > window.innerHeight) {
      top = clientY - height - 24;
    }

    left = clamp(left, margin, Math.max(margin, window.innerWidth - width - margin));
    top = clamp(top, margin, Math.max(margin, window.innerHeight - height - margin));

    state.popup.style.left = `${left}px`;
    state.popup.style.top = `${top}px`;
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

    if (state.popup?.contains(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function handleKeydown(event) {
    if ((state.active || state.pending) && event.key === "Escape") {
      deactivate();
    }
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
})();
