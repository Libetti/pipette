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
  const PANEL_MARGIN = 18;
  const MAX_PANELS = 5;
  const CURSOR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 508 508" width="32" height="32">
      <path fill="#000000" d="M 413 6 L 412 7 L 408 7 L 407 8 L 404 8 L 403 9 L 400 9 L 399 10 L 397 10 L 396 11 L 395 11 L 394 12 L 393 12 L 392 13 L 391 13 L 390 14 L 388 14 L 386 16 L 385 16 L 384 17 L 383 17 L 381 19 L 380 19 L 377 22 L 376 22 L 363 35 L 363 36 L 359 40 L 359 41 L 356 44 L 356 45 L 354 47 L 354 48 L 352 50 L 352 51 L 350 53 L 350 54 L 348 56 L 348 57 L 347 58 L 347 59 L 345 61 L 345 62 L 344 63 L 344 64 L 342 66 L 342 67 L 341 68 L 341 69 L 340 70 L 340 71 L 338 73 L 338 74 L 337 75 L 337 76 L 336 77 L 336 78 L 335 79 L 335 80 L 334 81 L 334 82 L 333 83 L 333 84 L 332 85 L 332 86 L 331 87 L 331 88 L 330 89 L 330 90 L 329 91 L 329 93 L 328 94 L 328 95 L 327 96 L 327 97 L 326 98 L 326 100 L 325 101 L 325 102 L 324 103 L 324 104 L 323 105 L 323 107 L 322 108 L 322 110 L 321 111 L 321 112 L 320 113 L 320 114 L 319 115 L 318 115 L 311 108 L 310 108 L 309 107 L 308 107 L 307 106 L 306 106 L 305 105 L 295 105 L 294 106 L 293 106 L 292 107 L 291 107 L 254 144 L 254 145 L 252 147 L 252 149 L 251 150 L 251 158 L 252 159 L 252 161 L 256 165 L 256 166 L 259 169 L 256 172 L 256 173 L 254 175 L 253 175 L 170 258 L 170 259 L 168 261 L 167 261 L 45 383 L 45 384 L 41 388 L 41 389 L 40 390 L 40 391 L 38 393 L 38 394 L 37 395 L 37 397 L 36 398 L 36 401 L 35 402 L 35 406 L 34 407 L 34 415 L 33 416 L 33 423 L 32 424 L 32 432 L 31 433 L 31 437 L 30 438 L 30 440 L 29 441 L 29 442 L 13 458 L 13 459 L 10 462 L 10 463 L 9 464 L 9 465 L 8 466 L 8 467 L 7 468 L 7 470 L 6 471 L 6 482 L 7 483 L 7 486 L 9 488 L 9 489 L 10 490 L 10 491 L 16 497 L 17 497 L 18 498 L 19 498 L 20 499 L 21 499 L 22 500 L 24 500 L 25 501 L 37 501 L 38 500 L 40 500 L 41 499 L 42 499 L 43 498 L 44 498 L 48 494 L 49 494 L 64 479 L 65 479 L 66 478 L 67 478 L 68 477 L 69 477 L 70 476 L 75 476 L 76 475 L 83 475 L 84 474 L 92 474 L 93 473 L 101 473 L 102 472 L 106 472 L 107 471 L 110 471 L 111 470 L 112 470 L 113 469 L 114 469 L 115 468 L 116 468 L 117 467 L 118 467 L 123 462 L 124 462 L 253 333 L 253 332 L 255 330 L 256 330 L 325 261 L 325 260 L 327 258 L 328 258 L 338 248 L 343 253 L 344 253 L 345 254 L 346 254 L 347 255 L 349 255 L 350 256 L 358 256 L 359 255 L 360 255 L 361 254 L 362 254 L 400 216 L 400 215 L 401 214 L 401 213 L 402 212 L 402 208 L 403 207 L 403 205 L 402 204 L 402 201 L 401 200 L 401 199 L 399 197 L 399 196 L 391 188 L 392 187 L 394 187 L 395 186 L 397 186 L 398 185 L 400 185 L 401 184 L 402 184 L 403 183 L 405 183 L 406 182 L 407 182 L 408 181 L 409 181 L 410 180 L 412 180 L 413 179 L 414 179 L 415 178 L 416 178 L 417 177 L 418 177 L 419 176 L 420 176 L 421 175 L 422 175 L 423 174 L 424 174 L 425 173 L 426 173 L 427 172 L 428 172 L 429 171 L 430 171 L 431 170 L 432 170 L 433 169 L 434 169 L 435 168 L 436 168 L 437 167 L 438 167 L 440 165 L 441 165 L 442 164 L 443 164 L 445 162 L 446 162 L 447 161 L 448 161 L 450 159 L 451 159 L 453 157 L 454 157 L 455 156 L 456 156 L 459 153 L 460 153 L 462 151 L 463 151 L 466 148 L 467 148 L 470 145 L 471 145 L 484 132 L 484 131 L 487 128 L 487 127 L 489 125 L 489 124 L 491 122 L 491 121 L 492 120 L 492 119 L 493 118 L 493 117 L 494 116 L 494 115 L 495 114 L 495 113 L 496 112 L 496 110 L 497 109 L 497 107 L 498 106 L 498 104 L 499 103 L 499 100 L 500 99 L 500 94 L 501 93 L 501 72 L 500 71 L 500 66 L 499 65 L 499 62 L 498 61 L 498 59 L 497 58 L 497 56 L 496 55 L 496 54 L 495 53 L 495 51 L 494 50 L 494 49 L 493 48 L 493 47 L 491 45 L 491 44 L 490 43 L 490 42 L 488 40 L 488 39 L 486 37 L 486 36 L 479 29 L 479 28 L 478 28 L 472 22 L 471 22 L 468 19 L 467 19 L 466 18 L 465 18 L 463 16 L 462 16 L 461 15 L 460 15 L 459 14 L 458 14 L 457 13 L 456 13 L 455 12 L 454 12 L 453 11 L 451 11 L 450 10 L 448 10 L 447 9 L 445 9 L 444 8 L 441 8 L 440 7 L 435 7 L 434 6 Z"/>
      <path fill="#ffffff" d="M 268 180 L 270 180 L 328 238 L 112 454 L 111 454 L 109 456 L 108 456 L 107 457 L 105 457 L 104 458 L 101 458 L 100 459 L 93 459 L 92 460 L 84 460 L 83 461 L 76 461 L 75 462 L 69 462 L 68 463 L 65 463 L 64 464 L 62 464 L 61 465 L 60 465 L 58 467 L 57 467 L 56 468 L 55 468 L 38 485 L 37 485 L 36 486 L 35 486 L 34 487 L 27 487 L 26 486 L 25 486 L 21 482 L 21 481 L 20 480 L 20 477 L 19 476 L 20 475 L 20 472 L 22 470 L 22 469 L 38 453 L 38 452 L 40 450 L 40 449 L 41 448 L 41 447 L 42 446 L 42 445 L 43 444 L 43 442 L 44 441 L 44 438 L 45 437 L 45 431 L 46 430 L 46 423 L 47 422 L 47 414 L 48 413 L 48 406 L 49 405 L 49 402 L 50 401 L 50 400 L 51 399 L 51 398 L 53 396 L 53 395 Z"/>
      <path fill="#ffffff" d="M 299 119 L 300 118 L 301 118 L 388 205 L 388 206 L 389 207 L 388 208 L 388 209 L 355 242 L 352 242 L 265 155 L 265 152 L 298 119 Z"/>
      <path fill="#ffffff" d="M 423 20 L 424 19 L 425 19 L 426 20 L 435 20 L 436 21 L 440 21 L 441 22 L 443 22 L 444 23 L 446 23 L 447 24 L 449 24 L 450 25 L 451 25 L 452 26 L 453 26 L 454 27 L 455 27 L 457 29 L 458 29 L 460 31 L 461 31 L 465 35 L 466 35 L 471 40 L 471 41 L 475 45 L 475 46 L 478 49 L 478 50 L 479 51 L 479 52 L 480 53 L 480 54 L 481 55 L 481 56 L 482 57 L 482 58 L 483 59 L 483 61 L 484 62 L 484 64 L 485 65 L 485 67 L 486 68 L 486 72 L 487 73 L 487 82 L 488 83 L 488 84 L 487 85 L 487 94 L 486 95 L 486 98 L 485 99 L 485 102 L 484 103 L 484 105 L 483 106 L 483 107 L 482 108 L 482 109 L 481 110 L 481 112 L 479 114 L 479 115 L 478 116 L 478 117 L 475 120 L 475 121 L 470 126 L 470 127 L 469 128 L 468 128 L 461 135 L 460 135 L 457 138 L 456 138 L 453 141 L 452 141 L 450 143 L 449 143 L 447 145 L 446 145 L 444 147 L 443 147 L 441 149 L 440 149 L 439 150 L 438 150 L 436 152 L 435 152 L 434 153 L 433 153 L 431 155 L 430 155 L 429 156 L 428 156 L 427 157 L 426 157 L 425 158 L 424 158 L 423 159 L 422 159 L 421 160 L 420 160 L 419 161 L 418 161 L 417 162 L 416 162 L 415 163 L 414 163 L 413 164 L 412 164 L 411 165 L 410 165 L 409 166 L 408 166 L 407 167 L 405 167 L 404 168 L 403 168 L 402 169 L 401 169 L 400 170 L 398 170 L 397 171 L 395 171 L 394 172 L 393 172 L 392 173 L 390 173 L 389 174 L 387 174 L 386 175 L 384 175 L 383 176 L 381 176 L 380 177 L 330 127 L 331 126 L 331 123 L 332 122 L 332 120 L 333 119 L 333 117 L 334 116 L 334 115 L 335 114 L 335 112 L 336 111 L 336 109 L 337 108 L 337 107 L 338 106 L 338 105 L 339 104 L 339 102 L 340 101 L 340 100 L 341 99 L 341 98 L 342 97 L 342 95 L 343 94 L 343 93 L 344 92 L 344 91 L 345 90 L 345 89 L 346 88 L 346 87 L 347 86 L 347 85 L 348 84 L 348 83 L 350 81 L 350 80 L 351 79 L 351 78 L 352 77 L 352 76 L 353 75 L 353 74 L 355 72 L 355 71 L 356 70 L 356 69 L 358 67 L 358 66 L 359 65 L 359 64 L 361 62 L 361 61 L 363 59 L 363 58 L 365 56 L 365 55 L 368 52 L 368 51 L 371 48 L 371 47 L 378 40 L 378 39 L 379 38 L 380 38 L 386 32 L 387 32 L 389 30 L 390 30 L 392 28 L 393 28 L 394 27 L 395 27 L 396 26 L 397 26 L 398 25 L 399 25 L 400 24 L 402 24 L 403 23 L 405 23 L 406 22 L 408 22 L 409 21 L 413 21 L 414 20 Z"/>
    </svg>`
  )}`;

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
    clearTimeout(state.sampleTimer);
    state.sampleTimer = null;
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
          cursor: url("${CURSOR_DATA_URL}") 3 29, crosshair !important;
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

        #${ROOT_ID} .pipette-panel-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
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

        #${ROOT_ID} .pipette-status,
        #${ROOT_ID} .pipette-panel-index {
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

    const meta = document.createElement("div");
    meta.className = "pipette-panel-meta";

    const indexLabel = document.createElement("div");
    indexLabel.className = "pipette-panel-index";
    indexLabel.textContent = `Saved ${index + 1}`;

    meta.append(indexLabel);
    header.append(swatch, headingText);
    card.append(closeButton, header, meta, buildValueRow("HEX", panel.color.hex).row, buildValueRow("RGB", panel.color.rgb).row, buildValueRow("RGBA", panel.color.rgba).row);

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
