import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de rutas protegidas que requieren autenticación
const protectedRoutes = ['/dashboard', '/settings', '/trades'];

export async function middleware(req: NextRequest) {
  // Crear una respuesta inicial
  const res = NextResponse.next();
  
  // Configurar encabezados para evitar caché
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  
  // Verificar si la ruta actual es la de logout
  const isLogoutRoute = req.nextUrl.pathname === '/logout' || req.nextUrl.pathname === '/api/auth/logout';
  
  // Si es la ruta de logout, limpiar cookies y redirigir al login
  if (isLogoutRoute) {
    const redirectUrl = new URL('/login', req.url);
    const logoutResponse = NextResponse.redirect(redirectUrl);
    
    // Limpiar todas las cookies relacionadas con la sesión
    logoutResponse.cookies.delete('sb-access-token');
    logoutResponse.cookies.delete('sb-refresh-token');
    logoutResponse.cookies.delete('supabase-auth-token');
    
    // Configurar encabezados anti-caché
    logoutResponse.headers.set('Cache-Control', 'no-store, max-age=0');
    logoutResponse.headers.set('Pragma', 'no-cache');
    logoutResponse.headers.set('Expires', '0');
    
    return logoutResponse;
  }
  
  const supabase = createMiddlewareClient({ req, res });

  // Obtener la sesión actual
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  // Verificar si la ruta actual está en las rutas protegidas
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Si hay un error o no hay sesión y es una ruta protegida, redirigir al login
  if ((error || !session) && isProtectedRoute) {
    // Limpiar cookies de sesión para asegurar que no queden residuos
    res.cookies.delete('sb-access-token');
    res.cookies.delete('sb-refresh-token');
    res.cookies.delete('supabase-auth-token');
    
    // Crear una redirección con encabezados anti-caché
    const redirectUrl = new URL('/login', req.url);
    const redirectRes = NextResponse.redirect(redirectUrl);
    
    redirectRes.headers.set('Cache-Control', 'no-store, max-age=0');
    redirectRes.headers.set('Pragma', 'no-cache');
    redirectRes.headers.set('Expires', '0');
    
    return redirectRes;
  }

  // Si hay sesión y la ruta es /login o /signup, redirigir a /dashboard
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    const redirectUrl = new URL('/dashboard', req.url);
    const redirectRes = NextResponse.redirect(redirectUrl);
    
    redirectRes.headers.set('Cache-Control', 'no-store, max-age=0');
    redirectRes.headers.set('Pragma', 'no-cache');
    redirectRes.headers.set('Expires', '0');
    
    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/settings/:path*',
    '/trades/:path*',
    '/login',
    '/signup',
    '/logout',
    '/api/auth/logout'
  ],
}; 