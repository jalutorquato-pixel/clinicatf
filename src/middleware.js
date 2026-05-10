import { NextResponse } from 'next/server';
import { decodeJwt } from './lib/rbac';

export default function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));

    try {
      const user = decodeJwt(token);
      const isAdmin = user?.roles?.some(r => r.name === 'admin');

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};