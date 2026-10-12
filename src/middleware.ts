import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SITE_ACTIVE, GATEWAY_CONFIG } from './gateway.config';

export function middleware(request: NextRequest) {
  // If master toggle is true, allow all traffic immediately
  if (SITE_ACTIVE) {
    return NextResponse.next();
  }

  const { searchParams, pathname } = request.nextUrl;
  const unlockParam = searchParams.get('unlock');
  const lockParam = searchParams.get('lock');
  const hasCookieBypass = request.cookies.get(GATEWAY_CONFIG.cookieName)?.value === GATEWAY_CONFIG.bypassKey;

  // Handle URL unlock: set cookie and redirect to clean URL
  if (unlockParam === GATEWAY_CONFIG.bypassKey) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('unlock');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(GATEWAY_CONFIG.cookieName, GATEWAY_CONFIG.bypassKey, {
      path: '/',
      maxAge: GATEWAY_CONFIG.cookieMaxAgeDays * 86400,
      sameSite: 'lax',
    });
    return response;
  }

  // Handle URL lock: delete cookie and redirect to clean URL
  if (lockParam === GATEWAY_CONFIG.bypassKey) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('lock');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.delete(GATEWAY_CONFIG.cookieName);
    return response;
  }

  // Developer is bypassed: allow request
  if (hasCookieBypass) {
    return NextResponse.next();
  }

  // For API endpoints, return authentic 503 JSON telemetry error
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: GATEWAY_CONFIG.errorCode,
        message: `Database connection pool timeout: Failed to acquire socket from upstream cluster \`${GATEWAY_CONFIG.upstreamCluster}\``,
        code: 'P1001',
        database: GATEWAY_CONFIG.databaseName,
        region: GATEWAY_CONFIG.region,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Retry-After': '120',
          'X-Database-Error': GATEWAY_CONFIG.errorCode,
        },
      }
    );
  }

  // Page routes will be rendered with the early head blocker script and SiteGateway UI
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
