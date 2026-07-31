import { defineMiddleware } from "astro:middleware";
import { verifyCookie, getCookieName } from "@app/lib/auth";

// Paths that bypass auth
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, url } = context;
  const pathname = url.pathname;

  // Only guard /admin/* and /api/admin/* paths
  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/admin")
  ) {
    return next();
  }

  // Allow public admin paths (login)
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return next();
  }

  // Verify session cookie
  const cookieName = getCookieName();
  const cookie = cookies.get(cookieName)?.value;

  if (!cookie) {
    // Pages → redirect to login
    if (pathname.startsWith("/admin")) {
      return redirect("/admin/login");
    }
    // API → 401
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await verifyCookie(cookie);
  if (!session) {
    cookies.delete(cookieName, { path: "/" });

    if (pathname.startsWith("/admin")) {
      return redirect("/admin/login");
    }
    return new Response(JSON.stringify({ error: "Session expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
});
