import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

// ======================================
// SIMPLE ROUTE CONFIGURATION
// ======================================
const routes = {
	// Routes that bypass authentication entirely (errors, health checks)
	bypass: ["/404", "/clock-error"],

	// Public routes (anyone can access) - using correct Clerk wildcard syntax
	public: [
		"/",
		"/about",
		"/pricing",
		"/contact",
		"/blog/(.*)",
		"/api/public/(.*)",
	],

	// Protected routes (login required) - using correct Clerk wildcard syntax
	protected: ["/dashboard/(.*)", "/profile", "/settings", "/api/user/(.*)"],

	// Special redirects for authenticated users
	redirectWhenLoggedIn: {
		"/login": "/dashboard",
		"/signup": "/dashboard",
		"/": "/dashboard", // Send logged-in users from homepage to dashboard
	},
};

// ======================================
// ROUTE MATCHERS
// ======================================
const isBypassRoute = createRouteMatcher(routes.bypass);
const isPublicRoute = createRouteMatcher(routes.public);
const isProtectedRoute = createRouteMatcher(routes.protected);

// ======================================
// ERROR HANDLING
// ======================================
const handleAuthError = (error: any, url: URL) => {
	console.error("Authentication error:", error.message);

	// Development bypass
	if (!import.meta.env.PROD && url.searchParams.has("bypass-auth")) {
		console.info("Development auth bypass requested");
		return null; // Allow access
	}

	// Default: redirect to home
	return "/";
};

// ======================================
// MAIN MIDDLEWARE
// ======================================
export const onRequest = clerkMiddleware((auth, context) => {
	const { request } = context;
	const url = new URL(request.url);
	const pathname = url.pathname;

	try {
		// 1. Skip auth for bypass routes (errors, health checks)
		if (isBypassRoute(request)) {
			return;
		}

		const { isAuthenticated, redirectToSignIn } = auth();

		// 2. Redirect authenticated users from auth pages to dashboard
		const redirectTarget =
			routes.redirectWhenLoggedIn[
				pathname as keyof typeof routes.redirectWhenLoggedIn
			];
		if (isAuthenticated && redirectTarget) {
			console.log(
				`Redirecting authenticated user from ${pathname} to ${redirectTarget}`
			);
			return context.redirect(redirectTarget);
		}

		// 3. Allow public routes for everyone
		if (isPublicRoute(request)) {
			return;
		}

		// 4. Require auth for protected routes
		if (isProtectedRoute(request) && !isAuthenticated) {
			console.log(`Auth required for: ${pathname}`);
			return redirectToSignIn();
		}

		// 5. Default: require auth for any unmatched routes
		if (!isAuthenticated) {
			console.log(`Auth required for unmatched route: ${pathname}`);
			return redirectToSignIn();
		}
	} catch (error: any) {
		console.error("Middleware error:", {
			message: error.message,
			code: error.code,
			path: pathname,
			timestamp: new Date().toISOString(),
		});

		const redirect = handleAuthError(error, url);
		if (redirect) {
			return context.redirect(redirect);
		}
		// If null returned from handleAuthError, allow access (development bypass)
	}
});
