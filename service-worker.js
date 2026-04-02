const MESSAGE = {
  CAPTURED: "PIPETTE_CAPTURED",
  PING: "PIPETTE_PING",
  PREPARE_CAPTURE: "PIPETTE_PREPARE_CAPTURE",
  REQUEST_CAPTURE: "PIPETTE_REQUEST_CAPTURE",
  TOGGLE_REQUEST: "PIPETTE_TOGGLE_REQUEST"
};

const COMMAND_NAME = "toggle-picker";

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || typeof tab.windowId !== "number") {
    return;
  }

  await togglePicker(tab.id, tab.windowId);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMAND_NAME) {
    return;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab?.id || typeof tab.windowId !== "number") {
    return;
  }

  await togglePicker(tab.id, tab.windowId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== MESSAGE.REQUEST_CAPTURE || !sender.tab?.id) {
    return;
  }

  captureTab(sender.tab.id, sender.tab.windowId)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.warn("Pipette capture failed:", error);
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    });

  return true;
});

async function togglePicker(tabId, windowId) {
  const ready = await ensureContentScript(tabId);

  if (!ready) {
    return;
  }

  let response;

  try {
    response = await chrome.tabs.sendMessage(tabId, {
      type: MESSAGE.TOGGLE_REQUEST
    });
  } catch (error) {
    console.warn("Pipette toggle failed:", error);
    return;
  }

  if (response?.activate) {
    await captureTab(tabId, windowId, { activate: true });
  }
}

async function ensureContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: MESSAGE.PING });

    if (response?.ok) {
      return true;
    }
  } catch (error) {
    // The script probably has not been injected yet.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script.js"]
    });

    return true;
  } catch (error) {
    console.warn("Pipette could not run on this page:", error);
    return false;
  }
}

async function captureTab(tabId, windowId, options = {}) {
  await safeSendMessage(tabId, { type: MESSAGE.PREPARE_CAPTURE });

  const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
    format: "png"
  });

  await safeSendMessage(tabId, {
    type: MESSAGE.CAPTURED,
    dataUrl,
    activate: Boolean(options.activate)
  });
}

async function safeSendMessage(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    return null;
  }
}
