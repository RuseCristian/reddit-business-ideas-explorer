// User bookmark management endpoint - /api/user/bookmarks
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

// Enhanced secure wrapper function for bookmark management
const secureManageBookmarks = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "manageBookmarks", {
	value: async (context: SecureAPIContext) => {
		try {
			const userId = context.user!.id;

			if (context.request.method === "POST") {
				// Add bookmark
				const body = await context.request.json();
				const { opportunityId } = body;

				if (!opportunityId || typeof opportunityId !== "number") {
					return new Response(
						JSON.stringify({
							error: "Missing or invalid opportunityId",
							code: "INVALID_OPPORTUNITY_ID",
						}),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						}
					);
				}

				// Add bookmark to database
				const success = await UserActivityService.addBookmark(
					userId,
					opportunityId
				);

				return new Response(
					JSON.stringify({
						success: true,
						data: {
							bookmarked: success,
							wasAlreadyBookmarked: !success, // If addBookmark returns false, it was already bookmarked
							opportunityId,
						},
						meta: {
							timestamp: new Date().toISOString(),
							requestedBy: userId,
							endpoint: "add-bookmark",
						},
					}),
					{
						headers: { "Content-Type": "application/json" },
					}
				);
			} else if (context.request.method === "DELETE") {
				// Remove bookmark
				const url = new URL(context.request.url);
				const opportunityId = parseInt(
					url.searchParams.get("opportunityId") || ""
				);

				if (!opportunityId) {
					return new Response(
						JSON.stringify({
							error: "Missing opportunityId parameter",
							code: "MISSING_OPPORTUNITY_ID",
						}),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						}
					);
				}

				// Remove bookmark from database
				const success = await UserActivityService.removeBookmark(
					userId,
					opportunityId
				);

				return new Response(
					JSON.stringify({
						success: true,
						data: {
							bookmarked: false,
							wasBookmarked: success, // If removeBookmark returns true, it was previously bookmarked
							opportunityId,
						},
						meta: {
							timestamp: new Date().toISOString(),
							requestedBy: userId,
							endpoint: "remove-bookmark",
						},
					}),
					{
						headers: { "Content-Type": "application/json" },
					}
				);
			} else if (context.request.method === "GET") {
				// Get bookmark status or list bookmarks
				const url = new URL(context.request.url);
				const opportunityId = url.searchParams.get("opportunityId");

				if (opportunityId) {
					// Check if specific opportunity is bookmarked
					const isBookmarked = await UserActivityService.isBookmarked(
						userId,
						parseInt(opportunityId)
					);

					return new Response(
						JSON.stringify({
							success: true,
							data: {
								isBookmarked,
								opportunityId: parseInt(opportunityId),
							},
							meta: {
								timestamp: new Date().toISOString(),
								requestedBy: userId,
								endpoint: "check-bookmark",
							},
						}),
						{
							headers: { "Content-Type": "application/json" },
						}
					);
				} else {
					// Get all user bookmarked opportunities
					const bookmarkedOpportunities =
						await UserActivityService.getBookmarkedOpportunities(userId, 50);
					const bookmarkIds = bookmarkedOpportunities.map((opp) => opp.id);

					return new Response(
						JSON.stringify({
							success: true,
							data: {
								bookmarkIds,
								count: bookmarkIds.length,
								opportunities: bookmarkedOpportunities,
							},
							meta: {
								timestamp: new Date().toISOString(),
								requestedBy: userId,
								endpoint: "list-bookmarks",
							},
						}),
						{
							headers: { "Content-Type": "application/json" },
						}
					);
				}
			} else {
				return new Response(
					JSON.stringify({
						error: "Method not allowed",
						code: "METHOD_NOT_ALLOWED",
					}),
					{
						status: 405,
						headers: { "Content-Type": "application/json" },
					}
				);
			}
		} catch (error) {
			console.error("Error managing bookmarks:", error);
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
	return secureManageBookmarks.value(context);
};

export const POST: APIRoute = async (context) => {
	return secureManageBookmarks.value(context);
};

export const DELETE: APIRoute = async (context) => {
	return secureManageBookmarks.value(context);
};
