import { clerkMiddleware } from "@clerk/astro/server";

export const onRequest = clerkMiddleware((auth, context) => {
  const { request } = context;
  const { isAuthenticated, userId, redirectToSignIn } = auth();
  const url = new URL(request.url);

  // If user is signed in and on landing page, redirect to dashboard
  if (isAuthenticated && url.pathname === "/") {
    return context.redirect("/dashboard");
  }

  // If user is NOT signed in and tries to access /dashboard (or other protected routes), redirect to sign-in
  if (!isAuthenticated && url.pathname.startsWith("/dashboard")) {
    return redirectToSignIn();
  }

});