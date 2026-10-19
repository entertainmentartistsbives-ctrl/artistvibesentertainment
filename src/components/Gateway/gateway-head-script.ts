import { SITE_ACTIVE, GATEWAY_CONFIG } from '@/gateway.config';

/**
 * Returns raw JavaScript to be embedded directly into <head>
 * before any styles or body elements are parsed by the browser.
 * This guarantees zero visual flash of real website content.
 */
export function getEarlyGatewayScript(): string {
  return `
(function() {
  var SITE_ACTIVE = ${SITE_ACTIVE ? 'true' : 'false'};
  if (SITE_ACTIVE) return;

  var BYPASS_KEY = ${JSON.stringify(GATEWAY_CONFIG.bypassKey)};
  var STORAGE_KEY = ${JSON.stringify(GATEWAY_CONFIG.storageKey)};
  var COOKIE_NAME = ${JSON.stringify(GATEWAY_CONFIG.cookieName)};

  try {
    var search = window.location.search;
    var params = new URLSearchParams(search);
    var unlockVal = params.get('unlock');
    var lockVal = params.get('lock');

    if (unlockVal === BYPASS_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, BYPASS_KEY);
        sessionStorage.setItem(STORAGE_KEY, BYPASS_KEY);
        document.cookie = COOKIE_NAME + '=' + encodeURIComponent(BYPASS_KEY) + '; path=/; max-age=' + (30 * 86400) + '; SameSite=Lax';
      } catch (e) {}
      params.delete('unlock');
      var cleanQuery = params.toString();
      var cleanUrl = window.location.pathname + (cleanQuery ? '?' + cleanQuery : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      window.__BYA_DEV_MODE__ = true;
      return;
    }

    if (lockVal === BYPASS_KEY) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        document.cookie = COOKIE_NAME + '=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      } catch (e) {}
      params.delete('lock');
      var cleanQuery = params.toString();
      var cleanUrl = window.location.pathname + (cleanQuery ? '?' + cleanQuery : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      window.__BYA_DEV_MODE__ = false;
    }

    var isUnlocked = false;
    try {
      if (localStorage.getItem(STORAGE_KEY) === BYPASS_KEY) isUnlocked = true;
      if (sessionStorage.getItem(STORAGE_KEY) === BYPASS_KEY) isUnlocked = true;
      if (document.cookie && document.cookie.indexOf(COOKIE_NAME + '=' + BYPASS_KEY) !== -1) isUnlocked = true;
    } catch (e) {}

    if (isUnlocked) {
      window.__BYA_DEV_MODE__ = true;
      return;
    }

    // Site is suspended and visitor is unauthenticated:
    // Block visual rendering immediately to prevent flicker
    window.__BYA_SITE_LOCKED__ = true;
    var style = document.createElement('style');
    style.id = 'bya-gateway-anti-flicker';
    style.innerHTML = [
      'html, body {',
      '  margin: 0 !important;',
      '  padding: 0 !important;',
      '  background: #070a12 !important;',
      '  color: #e2e8f0 !important;',
      '  overflow: hidden !important;',
      '  height: 100% !important;',
      '  min-height: 100vh !important;',
      '}',
      'body > *:not(#bya-gateway-container) {',
      '  display: none !important;',
      '  visibility: hidden !important;',
      '  opacity: 0 !important;',
      '  pointer-events: none !important;',
      '}'
    ].join('\\n');

    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.documentElement.appendChild(style);
    }
  } catch (err) {
    console.error('[SiteGateway:Early] Init error:', err);
  }
})();
`.trim();
}
