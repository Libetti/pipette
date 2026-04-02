# Pipette

Very small Brave/Chrome extension that lets you toggle a hover color picker on any normal web page.

## What it does

- Click the extension icon to turn the picker on or off.
- Use the keyboard shortcut to toggle it on or off.
- When active, the cursor switches into a pipette-style picker.
- A floating popup follows your cursor and shows:
  - `HEX`
  - `RGB`
  - `RGBA`
- Click anywhere on the page to copy the current `HEX` color to the clipboard and close the picker.

## Load it in Brave

1. Open `brave://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `/Users/tooch/apps/pipette`

## Set the hotkey

1. Open `brave://extensions/shortcuts`
2. Find **Pipette**
3. Change the `Toggle the Pipette color picker` shortcut to whatever you want

The default shortcut is:

- macOS: `Command+Shift+Y`
- Windows/Linux: `Ctrl+Shift+Y`

## Notes

- Press `Esc` to close the picker.
- Click copies the current `HEX` value to your clipboard.
- The extension works on regular web pages, not Brave internal pages like `brave://...`.
