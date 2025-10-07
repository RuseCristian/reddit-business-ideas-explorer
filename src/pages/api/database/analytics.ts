import type { APIRoute } from "astro";
import {
	Secure,
	type SecureAPIContext,
} from "../../../lib/security/security-guard-enhanced";
import {
	DatabaseService,
	DatabaseError,
} from "../../../lib/database/database-service";
import {
	CORS_CONFIG,
	RATE_LIMITS,
	SECURITY_CONFIG,
} from "../../../lib/config/api-config";

/**
 * Analytics API endpoint
 * GET /api/database/analytics
 *
 * Returns comprehensive analytics data for the dashboard including:
 * - Overview metrics (total counts, growth rates)
 * - Community performance data
 * - Business opportunity insights
 * - Temporal analysis
 * - Sentiment distribution
 * - Data quality metrics
 *
 * Requires authentication.
 */

// Enhanced secure wrapper function for analytics
const secureGetAnalytics = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "getAnalytics", {
	value: async (context: SecureAPIContext) => {
		try {
			// Get analytics data from database service
			const analytics = await DatabaseService.getAnalytics();

			// Set cache headers for 10 minutes (600 seconds)
			// Analytics data can be cached longer since it doesn't change frequently
			return new Response(
				JSON.stringify({
					success: true,
					data: analytics,
					meta: {
						timestamp: new Date().toISOString(),
						requestedBy: context.user?.id || "anonymous",
						securityLevel: context.user ? "authenticated" : "public",
						endpoint: "analytics",
					},
				}),
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "public, max-age=600, s-maxage=600",
					},
				}
			);
		} catch (error) {
			console.error("Analytics API Error:", error);

			// Handle database errors
			if (error instanceof DatabaseError) {
				return new Response(
					JSON.stringify({
						error: "Database error",
						message: error.message,
						code: error.code,
						timestamp: new Date().toISOString(),
					}),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
						},
					}
				);
			}

			// Handle unexpected errors
			return new Response(
				JSON.stringify({
					error: "Internal server error",
					message: "An unexpected error occurred while fetching analytics data",
					timestamp: new Date().toISOString(),
				}),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		}
	},
});

export const GET: APIRoute = async (context) => {
	return secureGetAnalytics.value(context);
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Max-Age": "86400", // 24 hours
		},
	});
};
