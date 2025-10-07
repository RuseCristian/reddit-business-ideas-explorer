// Available subreddits endpoint - /api/database/subreddits
import type { APIRoute } from "astro";
import {
	Secure,
	type SecureAPIContext,
} from "../../../lib/security/security-guard-enhanced";
import { DatabaseService } from "../../../lib/database/database-service";
import {
	CORS_CONFIG,
	RATE_LIMITS,
	SECURITY_CONFIG,
} from "../../../lib/config/api-config";

// Enhanced secure wrapper function for subreddits list
const secureGetSubreddits = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "getSubreddits", {
	value: async (context: SecureAPIContext) => {
		try {
			const url = new URL(context.request.url);

			// Parse query parameters
			const limit = Math.min(
				parseInt(url.searchParams.get("limit") || "20"),
				50
			); // Max 50 items

			// Get available subreddits
			const result = await DatabaseService.getAvailableSubreddits(limit);

			return new Response(
				JSON.stringify({
					success: true,
					data: result.subreddits,
					totalCount: result.totalCount,
					meta: {
						timestamp: new Date().toISOString(),
						requestedBy: context.user?.id || "anonymous",
						securityLevel: context.user ? "authenticated" : "public",
						endpoint: "subreddits",
					},
				}),
				{
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "public, max-age=600", // 10 minute cache
					},
				}
			);
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: "Internal server error",
					code: "INTERNAL_ERROR",
					timestamp: new Date().toISOString(),
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	},
});

export const GET: APIRoute = async (context) => {
	return secureGetSubreddits.value(context);
};
