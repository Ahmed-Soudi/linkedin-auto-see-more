(() => {
  'use strict';

  // In LinkedIn's current Jobs UI, this container identifies the specific
  // "About the job" section. The suffix changes with each job listing.
  const JOB_ABOUT_SELECTOR = '[id^="JobDetails_AboutTheJob_"]';
  const JOB_EXPAND_SELECTOR = 'button[data-testid="expandable-text-button"]';
  const CONTROL_SELECTOR = 'button, [role="button"]';
  const EXCLUDED_AREAS = 'nav, [role="navigation"], [role="menu"], [role="menubar"], #global-nav';

  const TEXT_EXPAND_LABEL = /^(?:(?:\.{2,}|…|⋯)\s*)?(?:see|show|read)\s+more(?:\s+(?:text|description|content|post))?$|^(?:\.{2,}|…|⋯)\s*more$/i;
  const DESCRIPTION_LABEL = /^(?:click\s+to\s+)?(?:see|show|read)\s+more\s+(?:(?:of\s+)?(?:the\s+)?)?(?:description|post|text|content)$/i;
  const EXCLUDED_LABEL = /\b(?:comments?|replies|responses|jobs|results|people|profiles|posts|updates|notifications|messages|options|recommendations|matches|companies|opportunities|suggestions|connections|locations)\b/i;
  const DEBOUNCE_MS = 120;
  const RETRY_COOLDOWN_MS = 4000;

  let enabled = false;
  let scanTimer = null;
  const recentlyClicked = new WeakMap();

  function clean(value) {
    return (value || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function hasExpandLabel(button) {
    const labels = [
      button.innerText,
      button.textContent,
      button.getAttribute('aria-label'),
      button.getAttribute('title'),
    ];
    return labels.some(value => {
      const label = clean(value);
      return label && !EXCLUDED_LABEL.test(label) &&
        (TEXT_EXPAND_LABEL.test(label) || DESCRIPTION_LABEL.test(label));
    });
  }

  function isVisible(button) {
    if (!button.isConnected || button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
    if (button.closest(EXCLUDED_AREAS)) return false;
    if (button.getAttribute('aria-expanded') === 'true') return false;
    if (button.getClientRects().length === 0) return false;
    const style = getComputedStyle(button);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function isTextExpander(button) {
    if (!isVisible(button)) return false;

    // Explicitly support the "… more" link in the right-hand Jobs panel.
    // This identifier is more stable than LinkedIn's generated CSS classes.
    const isJobDescriptionButton = button.matches(JOB_EXPAND_SELECTOR) &&
      button.closest(JOB_ABOUT_SELECTOR);
    if (isJobDescriptionButton) {
      return hasExpandLabel(button) || button.getAttribute('aria-expanded') === 'false';
    }

    // Elsewhere on LinkedIn, only click a clearly labelled text-expander.
    // In particular, never click generic "More" menus or "more comments".
    return hasExpandLabel(button);
  }

  function contextSignature(button) {
    const jobAbout = button.closest(JOB_ABOUT_SELECTOR);
    if (jobAbout) {
      // If LinkedIn recycles the same button node for a different job,
      // re-expand it. Text before the button is sufficient to distinguish jobs.
      const jobText = clean(jobAbout.textContent).slice(0, 100);
      return `job:${jobAbout.id}:${jobText}`;
    }
    // General LinkedIn expander: use button identity and a cooldown.
    return 'general';
  }

  function scan() {
    scanTimer = null;
    if (!enabled) return;

    const now = Date.now();
    for (const button of document.querySelectorAll(CONTROL_SELECTOR)) {
      if (!isTextExpander(button)) continue;
      const signature = contextSignature(button);
      const previous = recentlyClicked.get(button);
      if (previous?.signature === signature && now - previous.at < RETRY_COOLDOWN_MS) continue;
      recentlyClicked.set(button, { signature, at: now });
      button.click();
    }
  }

  function scheduleScan() {
    if (!enabled || scanTimer !== null) return;
    scanTimer = setTimeout(scan, DEBOUNCE_MS);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-label', 'aria-expanded', 'data-testid'],
  });

  // LinkedIn loads another description without navigating when a job is selected.
  window.addEventListener('pageshow', scheduleScan);
  window.addEventListener('scroll', scheduleScan, { passive: true, capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleScan();
  });

  chrome.storage.local.get({ enabled: true }, settings => {
    enabled = settings.enabled !== false;
    scheduleScan();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.enabled) return;
    enabled = changes.enabled.newValue !== false;
    if (!enabled && scanTimer !== null) {
      clearTimeout(scanTimer);
      scanTimer = null;
    }
    if (enabled) scheduleScan();
  });
})();
