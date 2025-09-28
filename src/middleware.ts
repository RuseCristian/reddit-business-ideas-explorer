import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/", "/clock-error", "/404"]);

export const onRequest = clerkMiddleware((auth, context) => {
	const { request } = context;
	const url = new URL(request.url);

	try {
		const { isAuthenticated, userId, redirectToSignIn } = auth();
		// Skip auth for public routes
		if (isPublicRoute(request)) {
			console.log("Public route accessed, skipping auth:", url.pathname);
			return;
		}

		// If user is signed in and on landing page, redirect to dashboard
		if (isAuthenticated && url.pathname === "/") {
			return context.redirect("/dashboard");
		}

		// If user is NOT signed in and tries to access protected routes, redirect to sign-in
		if (!isAuthenticated) {
			return redirectToSignIn();
		}
	} catch (error: any) {
		console.error("Clerk middleware error:", {
			error: error.message,
			code: error.code,
			path: url.pathname,
			timestamp: new Date().toISOString(),
		});

		// Check for specific clock skew related errors
		const isClockSkewError =
			error.message?.includes("token-iat-in-the-future") ||
			error.message?.includes("Clock skew") ||
			error.message?.includes("JWT issued at date claim") ||
			error.code === "TOKEN_IAT_IN_THE_FUTURE" ||
			error.code === "CLERK_JWT_EXPIRED";

		const isInfiniteLoopError =
			error.message?.includes("infinite redirect loop") ||
			error.message?.includes("Clerk instance keys do not match");

		// Handle clock skew errors by redirecting to helpful error page
		if (isClockSkewError || isInfiniteLoopError) {
			console.warn(
				"Clock skew or infinite loop detected, redirecting to error page"
			);
			return context.redirect("/clock-error?from=middleware");
		}

		// Handle other authentication errors
		if (import.meta.env.PROD) {
			// In production, fail securely - redirect to home
			console.error("Production auth error, redirecting to home");
			return context.redirect("/");
		} else {
			// In development, log warning but allow access for debugging
			console.warn("Development mode: bypassing auth error for debugging");
			console.warn("Add ?bypass-auth=true to URL to explicitly bypass auth");

			// Check if explicit bypass is requested
			if (url.searchParams.has("bypass-auth")) {
				console.info("Explicit auth bypass requested");
				return;
			}

			// Otherwise still redirect to error page for better UX
			return context.redirect("/clock-error?from=middleware");
		}
	}
});
