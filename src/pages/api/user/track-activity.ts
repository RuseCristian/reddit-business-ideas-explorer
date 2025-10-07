// User activity tracking endpoint - /api/user/track-activity
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

// Enhanced secure wrapper function for user activity tracking
const secureTrackActivity = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "trackActivity", {
	value: async (context: SecureAPIContext) => {
		try {
			const body = await context.request.json();
			const { activityType, resourceId, resourceType, metadata } = body;

			// Validate required fields
			if (!activityType) {
				return new Response(
					JSON.stringify({
						error: "Missing activityType",
						code: "MISSING_ACTIVITY_TYPE",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Track the activity in the database
			await UserActivityService.trackActivity({
				userId: context.user!.id,
				activityType,
				resourceId,
				resourceType,
				metadata,
			});

			return new Response(
				JSON.stringify({
					success: true,
					message: "Activity tracked successfully",
					meta: {
						timestamp: new Date().toISOString(),
						requestedBy: context.user?.id || "anonymous",
						securityLevel: context.user ? "authenticated" : "public",
						endpoint: "track-activity",
					},
				}),
				{
					headers: { "Content-Type": "application/json" },
				}
			);
		} catch (error) {
			console.error("Error tracking user activity:", error);
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

export const POST: APIRoute = async (context) => {
	return secureTrackActivity.value(context);
};
