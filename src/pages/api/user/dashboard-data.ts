// User dashboard data endpoint - /api/user/dashboard-data
import type { APIRoute } from "astro";
import {
	Secure,
	type SecureAPIContext,
} from "../../../lib/security/security-guard-enhanced";
import {
	CORS_CONFIG,
	RATE_LIMITS,
	SECURITY_CONFIG,
} from "../../../lib/config/api-config";
import { UserActivityService } from "../../../lib/database/user-activity-service";

// Enhanced secure wrapper function for dashboard data
const secureGetDashboardData = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "getDashboardData", {
	value: async (context: SecureAPIContext) => {
		try {
			// Get time window from query params (default 2 days)
			const url = new URL(context.request.url);
			const daysBack = parseInt(url.searchParams.get("days") || "2");

			// Validate days parameter (between 1 and 365)
			const validDaysBack = Math.max(1, Math.min(365, daysBack));

			// Get real dashboard data from the database
			const dashboardData = await UserActivityService.getUserDashboardData(
				context.user!.id,
				validDaysBack
			);

			return new Response(
				JSON.stringify({
					success: true,
					data: dashboardData,
					meta: {
						timestamp: new Date().toISOString(),
						requestedBy: context.user?.id || "anonymous",
						securityLevel: context.user ? "authenticated" : "public",
						endpoint: "dashboard-data",
					},
				}),
				{
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "private, no-cache", // No cache for real-time updates
					},
				}
			);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
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
	return secureGetDashboardData.value(context);
};
