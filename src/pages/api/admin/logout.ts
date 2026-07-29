import type { APIRoute } from "astro";
import { getCookieName } from "@app/lib/auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const cookieName = getCookieName();
  cookies.delete(cookieName, { path: "/" });
  return redirect("/admin/login");
};
