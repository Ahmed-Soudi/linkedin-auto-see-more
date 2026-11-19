'use strict';
const toggle = document.getElementById('enabled');
const status = document.getElementById('status');

function displayEnabled(value) {
  toggle.checked = value;
  status.textContent = value ? 'Enabled' : 'Disabled';
}

chrome.storage.local.get({ enabled: true }, (settings) => {
  displayEnabled(settings.enabled !== false);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  displayEnabled(enabled);
  chrome.storage.local.set({ enabled });
});
