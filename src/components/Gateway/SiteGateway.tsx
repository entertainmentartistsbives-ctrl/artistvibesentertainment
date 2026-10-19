'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GATEWAY_CONFIG, SITE_ACTIVE as MASTER_SITE_ACTIVE } from '@/gateway.config';
import styles from './SiteGateway.module.css';

interface SiteGatewayProps {
  children: React.ReactNode;
  siteActive?: boolean;
}

export default function SiteGateway({
  children,
  siteActive = MASTER_SITE_ACTIVE,
}: SiteGatewayProps) {
  const [mounted, setMounted] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFailedNotice, setRetryFailedNotice] = useState(false);
  const [retryShake, setRetryShake] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInputKey, setAuthInputKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [rayId, setRayId] = useState('req_7f9e8a12c40b');
  const [isoTimestamp, setIsoTimestamp] = useState('');
  const [copiedRay, setCopiedRay] = useState(false);

  // Click tracking for triple-click on Ray ID
  const rayClickCountRef = useRef(0);
  const rayClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Terminal Logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Helper to persist developer bypass
  const persistUnlock = useCallback(() => {
    try {
      localStorage.setItem(GATEWAY_CONFIG.storageKey, GATEWAY_CONFIG.bypassKey);
      sessionStorage.setItem(GATEWAY_CONFIG.storageKey, GATEWAY_CONFIG.bypassKey);
      document.cookie = `${GATEWAY_CONFIG.cookieName}=${encodeURIComponent(
        GATEWAY_CONFIG.bypassKey
      )}; path=/; max-age=${GATEWAY_CONFIG.cookieMaxAgeDays * 86400}; SameSite=Lax`;
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setIsBypassed(true);
    // Remove temporary anti-flicker style if present
    const antiFlicker = document.getElementById('bya-gateway-anti-flicker');
    if (antiFlicker) {
      antiFlicker.remove();
    }
  }, []);

  // Helper to clear developer bypass and re-lock
  const clearUnlock = useCallback(() => {
    try {
      localStorage.removeItem(GATEWAY_CONFIG.storageKey);
      sessionStorage.removeItem(GATEWAY_CONFIG.storageKey);
      document.cookie = `${GATEWAY_CONFIG.cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    } catch {
      // Ignore
    }
    setIsBypassed(false);
    // Reload cleanly to let anti-flicker re-engage
    window.location.href = window.location.pathname;
  }, []);

  // Initial client hydration check
  useEffect(() => {
    setMounted(true);
    const now = new Date().toISOString();
    setIsoTimestamp(now);

    // Generate dynamic Ray ID
    const randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 6);
    setRayId(`req_${randomHex}`);

    // Generate realistic initial diagnostic logs
    setTerminalLogs([
      `[${now}] [prisma:client] Initializing pool connection to ${GATEWAY_CONFIG.upstreamCluster}...`,
      `[${now}] [prisma:client] SSL handshake initiated (TLSv1.3 / ECDHE-RSA-AES128-GCM-SHA256)`,
      `[${now}] [pg_pool:warn] Connection pool [primary-rw] max_connections (100) exhausted. Waiting for available socket...`,
      `[${now}] [pg_pool:error] Acquire connection timeout (15000ms) exceeded for client pooler.`,
      `[${now}] [prisma:error] P1001: Can't reach database server at \`${GATEWAY_CONFIG.upstreamCluster}\`.`,
      `[${now}] [upstream:fatal] 503 Service Unavailable: Upstream database proxy terminated TCP stream (code ECONNRESET).`,
    ]);

    // Check URL parameters for ?unlock=dev or ?lock=dev
    const params = new URLSearchParams(window.location.search);
    const unlockParam = params.get('unlock');
    const lockParam = params.get('lock');

    if (unlockParam === GATEWAY_CONFIG.bypassKey) {
      persistUnlock();
      params.delete('unlock');
      const clean = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, document.title, window.location.pathname + clean);
      return;
    }

    if (lockParam === GATEWAY_CONFIG.bypassKey) {
      clearUnlock();
      return;
    }

    // Check existing bypass in localStorage, sessionStorage, or cookie
    let hasBypass = false;
    try {
      if (localStorage.getItem(GATEWAY_CONFIG.storageKey) === GATEWAY_CONFIG.bypassKey) hasBypass = true;
      if (sessionStorage.getItem(GATEWAY_CONFIG.storageKey) === GATEWAY_CONFIG.bypassKey) hasBypass = true;
      if (document.cookie.includes(`${GATEWAY_CONFIG.cookieName}=${GATEWAY_CONFIG.bypassKey}`)) hasBypass = true;
    } catch {
      // Ignore
    }

    if (hasBypass) {
      setIsBypassed(true);
      const antiFlicker = document.getElementById('bya-gateway-anti-flicker');
      if (antiFlicker) antiFlicker.remove();
    }
  }, [persistUnlock, clearUnlock]);

  // Keyboard shortcut listener: Ctrl + Shift + U or Cmd + Shift + U
  useEffect(() => {
    if (siteActive || isBypassed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setShowAuthModal(true);
        setAuthError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [siteActive, isBypassed]);

  // Triple-click on Ray ID handler
  const handleRayClick = (e: React.MouseEvent) => {
    // Check native browser multi-click count first (e.detail === 3)
    if (e.detail >= 3) {
      setShowAuthModal(true);
      setAuthError('');
      return;
    }

    rayClickCountRef.current += 1;
    if (rayClickTimerRef.current) {
      clearTimeout(rayClickTimerRef.current);
    }

    rayClickTimerRef.current = setTimeout(() => {
      rayClickCountRef.current = 0;
    }, 800);

    if (rayClickCountRef.current >= 3) {
      rayClickCountRef.current = 0;
      if (rayClickTimerRef.current) clearTimeout(rayClickTimerRef.current);
      setShowAuthModal(true);
      setAuthError('');
    }
  };

  // Copy Ray ID helper
  const handleCopyRay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rayId);
    setCopiedRay(true);
    setTimeout(() => setCopiedRay(false), 2000);
  };

  // Retry Connection action: 2 seconds spinner then realistic failure
  const handleRetryConnection = () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryFailedNotice(false);

    const attemptTime = new Date().toISOString();
    setTerminalLogs((prev) => [
      ...prev,
      `--- RECONNECT PROBE INITIATED [${attemptTime}] ---`,
      `[${attemptTime}] [retry:client] Dispatching health check probe to ${GATEWAY_CONFIG.upstreamCluster}...`,
      `[${attemptTime}] [pg_pool] Querying pg_isready on upstream port 5432 (timeout: 2000ms)...`,
    ]);

    setTimeout(() => {
      const failTime = new Date().toISOString();
      setTerminalLogs((prev) => [
        ...prev,
        `[${failTime}] [pg_pool:fatal] Handshake rejected: upstream database connection pool saturated. Fail-safe timeout triggered.`,
        `[${failTime}] [gateway:error] 503_DATABASE_TIMEOUT: Upstream cluster failed health probe. Service remains unavailable.`,
      ]);
      setIsRetrying(false);
      setRetryFailedNotice(true);
      setRetryShake(true);
      setTimeout(() => setRetryShake(false), 600);
    }, 2000);
  };

  // Developer Bypass Modal submission
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInputKey.trim() === GATEWAY_CONFIG.bypassKey) {
      persistUnlock();
      setShowAuthModal(false);
      setAuthInputKey('');
      setAuthError('');
    } else {
      setAuthError('Invalid authorization key. Access denied.');
    }
  };

  // If master switch has restored the site, render normally
  if (siteActive) {
    return <>{children}</>;
  }

  // If developer is bypassed, render site with floating test badge
  if (isBypassed) {
    return (
      <>
        {children}
        <aside className={styles.devBadge} aria-label="Developer Mode Controls">
          <div className={styles.devBadgeDot} />
          <span className={styles.devBadgeText}>Dev Mode Active</span>
          <button
            type="button"
            className={styles.devBadgeLockBtn}
            onClick={clearUnlock}
            title="Re-test the simulated 503 database error screen"
          >
            Test Public View
          </button>
        </aside>
      </>
    );
  }

  // Not yet mounted (SSR stage) or unauthenticated visitor:
  // Render authentic 503 Database Error Screen
  return (
    <div id="bya-gateway-container" className={styles.gatewayContainer}>
      {/* Top Navbar */}
      <header className={styles.topNavbar}>
        <div className={styles.cloudBrand}>
          <div className={styles.cloudLogo}>⚡</div>
          <span className={styles.cloudTitle}>Cloud Infrastructure Gateway</span>
        </div>
        <div className={styles.systemStatusPill}>
          <span className={styles.statusDotPulse} />
          <span>Critical Outage</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.contentWrapper}>
        <div className={styles.heroHeader}>
          <div className={styles.errorPill}>
            <span>HTTP 503</span>
            <span>•</span>
            <span>DATABASE_CONNECTION_TIMEOUT</span>
          </div>
          <h1 className={styles.mainTitle}>503 Service Unavailable</h1>
          <p className={styles.mainSubtitle}>
            The application gateway encountered an upstream database connection pool timeout.
            The primary database cluster at <strong>{GATEWAY_CONFIG.upstreamCluster}</strong> failed to respond within the socket allocation window.
          </p>
        </div>

        {/* Telemetry Cards Grid */}
        <section className={styles.telemetryGrid} aria-label="System Telemetry Details">
          <div className={styles.telemetryCard}>
            <span className={styles.cardLabel}>Error Code</span>
            <span className={`${styles.cardValue} ${styles.cardValueHighlight}`}>
              {GATEWAY_CONFIG.errorCode}
            </span>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.cardLabel}>Upstream Cluster</span>
            <span className={styles.cardValue} title={GATEWAY_CONFIG.upstreamCluster}>
              {GATEWAY_CONFIG.upstreamCluster}
            </span>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.cardLabel}>Database Target</span>
            <span className={styles.cardValue}>
              {GATEWAY_CONFIG.databaseName}
            </span>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.cardLabel}>Cluster Region</span>
            <span className={styles.cardValue}>
              {GATEWAY_CONFIG.region}
            </span>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.cardLabel}>Timestamp (UTC)</span>
            <span className={styles.cardValue}>
              {isoTimestamp || '2026-10-12T10:35:42.189Z'}
            </span>
          </div>

          <div
            className={styles.telemetryCard}
            onClick={handleRayClick}
            title="Triple-click for developer bypass gateway"
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.cardLabel}>
              Ray / Trace ID {copiedRay ? '(Copied!)' : ''}
            </span>
            <span className={`${styles.cardValue} ${styles.cardValueInteractive}`}>
              {rayId}
            </span>
          </div>
        </section>

        {/* Diagnostic Terminal Output */}
        <section className={styles.terminalBox} aria-label="Upstream Diagnostic Log Stream">
          <div className={styles.terminalHeader}>
            <div className={styles.macDots}>
              <span className={`${styles.macDot} ${styles.macDotRed}`} />
              <span className={`${styles.macDot} ${styles.macDotYellow}`} />
              <span className={`${styles.macDot} ${styles.macDotGreen}`} />
            </div>
            <span className={styles.terminalTitle}>neon-pg-pool.stderr.log (Upstream Proxy Output)</span>
            <span className={styles.terminalStatusTag}>DISCONNECTED</span>
          </div>
          <div className={styles.terminalBody}>
            {terminalLogs.map((log, index) => {
              const isError = log.includes('error') || log.includes('P1001');
              const isWarn = log.includes('warn');
              const isFatal = log.includes('fatal') || log.includes('503 Service');
              const isPrisma = log.includes('prisma:');

              return (
                <div key={index} style={{ marginBottom: 4 }}>
                  {isFatal ? (
                    <span className={styles.logTagFatal}>{log}</span>
                  ) : isError ? (
                    <span className={styles.logTagError}>{log}</span>
                  ) : isWarn ? (
                    <span className={styles.logTagWarn}>{log}</span>
                  ) : isPrisma ? (
                    <span className={styles.logTagPrisma}>{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Bar */}
        <div className={styles.actionsBar}>
          <button
            type="button"
            className={`${styles.retryButton} ${retryShake ? styles.shakeAnimation : ''}`}
            onClick={handleRetryConnection}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <span className={styles.retrySpinner} />
                <span>Reconnecting to Cluster (2.0s)...</span>
              </>
            ) : (
              <>
                <span>↻</span>
                <span>Retry Connection</span>
              </>
            )}
          </button>

          {retryFailedNotice && (
            <div className={styles.retryStatusNotice}>
              <span>⚠️</span>
              <span>Connection failed: Handshake rejected by upstream pooler. Pool capacity exceeded.</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer Bar */}
      <footer className={styles.footerBar}>
        <div className={styles.footerLeft}>
          <span>Engine: {GATEWAY_CONFIG.clientRuntime}</span>
          <span>•</span>
          <span>Security Protocol: TLSv1.3</span>
        </div>
        <div className={styles.footerRight}>
          <span>Status: 503_DATABASE_TIMEOUT</span>
        </div>
      </footer>

      {/* Secret Developer Bypass Modal */}
      {showAuthModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>🔐</div>
              <h2 className={styles.modalTitle}>Developer Bypass Gateway</h2>
            </div>
            <p className={styles.modalDesc}>
              Enter developer authorization key to bypass the simulated 503 maintenance screen and browse the live site normally.
            </p>
            <form onSubmit={handleAuthSubmit}>
              <input
                type="password"
                className={styles.modalInput}
                placeholder="Enter bypass key..."
                value={authInputKey}
                onChange={(e) => setAuthInputKey(e.target.value)}
                autoFocus
              />
              {authError && (
                <div className={styles.modalError}>
                  {authError}
                </div>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                >
                  Authorize & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
