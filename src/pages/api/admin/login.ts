import type { APIRoute } from "astro";
import { signCookie, getCookieName } from "@app/lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const password = formData.get("password")?.toString() || "";
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "";

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (password !== adminPassword) {
      // Return JSON for API calls, form-style for form submissions
      const accept = request.headers.get("accept") || "";
      if (accept.includes("application/json")) {
        return new Response(
          JSON.stringify({ error: "Invalid password" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        '<!DOCTYPE html><html><body><script>location.href="/admin/login?error=Invalid%20password"</script></body></html>',
        { status: 401, headers: { "Content-Type": "text/html" } },
      );
    }

    const token = await signCookie();
    const cookieName = getCookieName();

    cookies.set(cookieName, token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 86400,
    });

    return redirect("/admin");
  } catch (err) {
    console.error("Login error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
