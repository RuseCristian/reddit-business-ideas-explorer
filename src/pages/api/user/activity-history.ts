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

// Enhanced secure wrapper function for activity history management
const secureActivityHistory = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "activityHistory", {
	value: async (context: SecureAPIContext) => {
		try {
			const userId = context.user!.id;

			if (context.request.method === "GET") {
				// Get activity history with pagination
				const url = new URL(context.request.url);
				const limit = Math.min(
					parseInt(url.searchParams.get("limit") || "50"),
					100
				); // Max 100 items
				const offset = parseInt(url.searchParams.get("offset") || "0");

				const activities = await UserActivityService.getActivityHistory(
					userId,
					{
						limit,
						offset,
						includeOpportunityDetails: true,
					}
				);

				const totalCount = await UserActivityService.getActivityCount(userId);

				// Add relative time text to activities
				const activitiesWithTime = activities.map((activity: any) => ({
					...activity,
					timeText: getRelativeTime(activity.timestamp),
				}));

				return new Response(
					JSON.stringify({
						success: true,
						data: {
							activities: activitiesWithTime,
							totalCount,
							hasMore: offset + activities.length < totalCount,
						},
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			} else if (context.request.method === "DELETE") {
				// Clear all activity history for the user
				await UserActivityService.clearUserActivity(userId);

				return new Response(
					JSON.stringify({
						success: true,
						message: "Activity history cleared successfully",
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			} else {
				return new Response(
					JSON.stringify({
						success: false,
						error: "Method not allowed",
					}),
					{
						status: 405,
						headers: {
							"Content-Type": "application/json",
							Allow: "GET, DELETE",
						},
					}
				);
			}
		} catch (error) {
			console.error("Failed to handle activity history request:", error);
			return new Response(
				JSON.stringify({
					success: false,
					error: "Internal server error",
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
	return secureActivityHistory.value(context);
};

export const DELETE: APIRoute = async (context) => {
	return secureActivityHistory.value(context);
};

// Helper function to get relative time
function getRelativeTime(timestamp: Date): string {
	const now = new Date();
	const diff = now.getTime() - timestamp.getTime();
	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days}d ago`;

	return timestamp.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}
