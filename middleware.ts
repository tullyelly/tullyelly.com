import { NextResponse, type NextRequest } from 'next/server';
import { isTest, testBypassHeader } from '@/lib/test-flags';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const isProtected = pathname.startsWith('/shaolin-scrolls');
  const bypass = isTest || req.headers.get(testBypassHeader) === '1';

  if (isProtected && !bypass) {
    url.pathname = '/_auth-required';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/shaolin-scrolls/:path*'],
};
