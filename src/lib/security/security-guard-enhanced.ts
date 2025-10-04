import type { APIContext } from "astro";

export interface SecurityConfig {
	auth?: "required" | "optional";
	adminOnly?: boolean;
	roles?: string[];
	permissions?: string[];
	rateLimit?: { requests: number; window: string };
	ipRateLimit?: { requests: number; window: string }; // IP-based rate limiting
	corsOrigins?: string[]; // CORS configuration
	httpsOnly?: boolean; // Force HTTPS
}

export interface SecureAPIContext extends APIContext {
	user?: { id: string; [key: string]: any } | null;
	clientIp?: string; // Client IP address
}

export class SecurityError extends Error {
	constructor(
		message: string,
		public statusCode: number = 403,
		public code: string = "SECURITY_ERROR"
	) {
		super(message);
	}
}

export class AuthenticationError extends SecurityError {
	constructor() {
		super("Authentication required", 401, "AUTH_REQUIRED");
	}
}

export class AuthorizationError extends SecurityError {
	constructor(msg = "Insufficient permissions") {
		super(msg, 403, "INSUFFICIENT_PERMISSIONS");
	}
}

export class RateLimitError extends SecurityError {
	constructor() {
		super("Rate limit exceeded", 429, "RATE_LIMIT_EXCEEDED");
	}
}

export class CorsError extends SecurityError {
	constructor() {
		super("CORS policy violation", 403, "CORS_VIOLATION");
	}
}

export class HttpsError extends SecurityError {
	constructor() {
		super("HTTPS required", 403, "HTTPS_REQUIRED");
	}
}

// Enhanced rate limiting with both user and IP tracking
const userRateLimits = new Map<string, { count: number; resetTime: number }>();
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();

// Token refresh tracking
const tokenRefreshAttempts = new Map<
	string,
	{ count: number; lastAttempt: number }
>();

class RateLimiter {
	static parseWindow(window: string): number {
		const unit = window.slice(-1);
		const value = parseInt(window.slice(0, -1));
		switch (unit) {
			case "s":
				return value * 1000;
			case "m":
				return value * 60 * 1000;
			case "h":
				return value * 60 * 60 * 1000;
			case "d":
				return value * 24 * 60 * 60 * 1000;
			default:
				return 60 * 1000;
		}
	}

	static checkUserLimit(
		userId: string,
		config: { requests: number; window: string }
	): boolean {
		return this.checkLimit(userId, config, userRateLimits);
	}

	static checkIpLimit(
		ip: string,
		config: { requests: number; window: string }
	): boolean {
		return this.checkLimit(ip, config, ipRateLimits);
	}

	private static checkLimit(
		key: string,
		config: { requests: number; window: string },
		store: Map<string, { count: number; resetTime: number }>
	): boolean {
		const limitKey = `${key}:${JSON.stringify(config)}`;
		const now = Date.now();
		const windowMs = this.parseWindow(config.window);

		const existing = store.get(limitKey);

		// DEBUG LOGGING
		console.log(`[RateLimiter] key=${limitKey}`);
		if (existing) {
			console.log(
				`[RateLimiter] count=${existing.count}, resetTime=${new Date(
					existing.resetTime
				).toISOString()}, now=${new Date(now).toISOString()}`
			);
		} else {
			console.log(`[RateLimiter] No existing entry, will create new.`);
		}

		if (!existing || now > existing.resetTime) {
			store.set(limitKey, { count: 1, resetTime: now + windowMs });
			return false;
		}

		if (existing.count >= config.requests) {
			console.log(
				`[RateLimiter] Blocked by main rate limiter: count=${existing.count}, limit=${config.requests}`
			);
			return true;
		}

		existing.count++;
		return false;
	}
}

class TokenManager {
	// Simple token refresh logic
	static shouldRefreshToken(auth: any): boolean {
		if (!auth?.sessionId) return false;

		// Check if token is close to expiry (you'd implement this based on Clerk's token structure)
		// For now, we'll just track refresh attempts to prevent abuse
		const userId = auth.userId;
		const now = Date.now();
		const attempts = tokenRefreshAttempts.get(userId);

		// Allow max 5 refresh attempts per hour
		if (attempts) {
			if (now - attempts.lastAttempt < 60 * 60 * 1000 && attempts.count >= 5) {
				return false; // Too many refresh attempts
			}
			if (now - attempts.lastAttempt >= 60 * 60 * 1000) {
				// Reset counter after an hour
				tokenRefreshAttempts.set(userId, { count: 1, lastAttempt: now });
			} else {
				attempts.count++;
				attempts.lastAttempt = now;
			}
		} else {
			tokenRefreshAttempts.set(userId, { count: 1, lastAttempt: now });
		}

		return true;
	}
}

class CorsHandler {
	static checkOrigin(origin: string | null, allowedOrigins: string[]): boolean {
		if (!origin) return true; // Same-origin requests
		return allowedOrigins.includes(origin) || allowedOrigins.includes("*");
	}

	static setCorsHeaders(
		response: Response,
		config: SecurityConfig,
		origin: string | null
	): Response {
		if (!config.corsOrigins) return response;

		const headers = new Headers(response.headers);

		if (origin && this.checkOrigin(origin, config.corsOrigins)) {
			headers.set("Access-Control-Allow-Origin", origin);
		} else if (config.corsOrigins.includes("*")) {
			headers.set("Access-Control-Allow-Origin", "*");
		}

		headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS"
		);
		headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
		headers.set("Access-Control-Max-Age", "86400"); // 24 hours

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}
}

class PermissionChecker {
	static hasRole(auth: any, roles: string[]): boolean {
		const userRoles = auth?.publicMetadata?.roles || [];
		return roles.some((role) => userRoles.includes(role));
	}

	static hasPermission(auth: any, permissions: string[]): boolean {
		const userPermissions = auth?.publicMetadata?.permissions || [];
		return permissions.every((permission) =>
			userPermissions.includes(permission)
		);
	}

	static isAdmin(auth: any): boolean {
		return auth?.publicMetadata?.roles?.includes("admin") || false;
	}
}

// Helper to get client IP
function getClientIp(context: APIContext): string {
	// Try various headers for IP detection
	const forwarded = context.request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	return (
		context.request.headers.get("x-real-ip") ||
		context.request.headers.get("cf-connecting-ip") ||
		context.clientAddress ||
		"unknown"
	);
}

// Enhanced Security Guard
export function Secure(config: SecurityConfig = {}) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (context: APIContext, ...args: any[]) {
			try {
				const origin = context.request.headers.get("origin");
				const clientIp = getClientIp(context);

				// 1. HTTPS Check
				if (
					config.httpsOnly &&
					new URL(context.request.url).protocol !== "https:"
				) {
					throw new HttpsError();
				}

				// 2. CORS Check
				if (
					config.corsOrigins &&
					origin &&
					!CorsHandler.checkOrigin(origin, config.corsOrigins)
				) {
					throw new CorsError();
				}

				// 3. IP Rate Limiting (before authentication)
				if (
					config.ipRateLimit &&
					RateLimiter.checkIpLimit(clientIp, config.ipRateLimit)
				) {
					throw new RateLimitError();
				}

				// 4. Authentication Check
				const auth = context.locals.auth?.();
				const user = auth?.userId ? auth : null;

				if (config.auth === "required" && !user?.userId) {
					throw new AuthenticationError();
				}

				// 5. Admin check
				if (config.adminOnly && user && !PermissionChecker.isAdmin(auth)) {
					throw new AuthorizationError("Admin access required");
				}

				// 6. Role check
				if (
					config.roles?.length &&
					user &&
					!PermissionChecker.hasRole(auth, config.roles)
				) {
					throw new AuthorizationError(
						`Required roles: ${config.roles.join(", ")}`
					);
				}

				// 7. Permission check
				if (
					config.permissions?.length &&
					user &&
					!PermissionChecker.hasPermission(auth, config.permissions)
				) {
					throw new AuthorizationError(
						`Required permissions: ${config.permissions.join(", ")}`
					);
				}

				// 8. User Rate limiting (after authentication)
				if (
					config.rateLimit &&
					user?.userId &&
					RateLimiter.checkUserLimit(user.userId, config.rateLimit)
				) {
					throw new RateLimitError();
				}

				// 10. Create enhanced context
				const enhancedContext = {
					...context,
					user: user ? { id: user.userId, ...auth } : null,
					clientIp,
				};

				// 11. Call original method
				const response = await originalMethod.call(
					this,
					enhancedContext,
					...args
				);

				// If handler returns nothing or a redirect, and user is not authenticated, force JSON 401 error
				if (
					(!response ||
						(response instanceof Response &&
							response.headers.get("content-type")?.includes("text/html"))) &&
					config.auth === "required" &&
					!user?.userId
				) {
					const errorResponse = new Response(
						JSON.stringify({
							error: "AUTH_REQUIRED",
							message: "Authentication required",
						}),
						{
							status: 401,
							headers: { "Content-Type": "application/json" },
						}
					);
					return CorsHandler.setCorsHeaders(errorResponse, config, origin);
				}

				// 12. Apply CORS headers to response
				return CorsHandler.setCorsHeaders(response, config, origin);
			} catch (error) {
				if (error instanceof SecurityError) {
					const errorResponse = new Response(
						JSON.stringify({
							error: error.code,
							message: error.message,
						}),
						{
							status: error.statusCode,
							headers: { "Content-Type": "application/json" },
						}
					);

					// Apply CORS to error responses too
					return CorsHandler.setCorsHeaders(
						errorResponse,
						config,
						context.request.headers.get("origin")
					);
				}
				throw error;
			}
		};

		return descriptor;
	};
}
