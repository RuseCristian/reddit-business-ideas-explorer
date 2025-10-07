// Paginated opportunities list endpoint - /api/database/opportunities-list
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

// Enhanced secure wrapper function for opportunities list
const secureGetBusinessOpportunities = Secure({
	auth: "required", // Require authentication
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "getBusinessOpportunities", {
	value: async (context: SecureAPIContext) => {
		try {
			const url = new URL(context.request.url);

			// Parse query parameters
			const subredditId = parseInt(url.searchParams.get("subredditId") || "0");
			const page = parseInt(url.searchParams.get("page") || "1");
			const limit = Math.min(
				parseInt(url.searchParams.get("limit") || "9"),
				50
			); // Max 50 items
			const days = parseInt(url.searchParams.get("days") || "30");
			const search = url.searchParams.get("search") || "";
			const sortBy = (url.searchParams.get("sortBy") || "impact_score") as
				| "impact_score"
				| "date";
			const sortOrder = (url.searchParams.get("sortOrder") || "desc") as
				| "asc"
				| "desc";

			// Validate required parameters
			if (!subredditId || subredditId <= 0) {
				return new Response(
					JSON.stringify({
						error: "Missing or invalid subredditId parameter",
						code: "INVALID_SUBREDDIT_ID",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Validate pagination parameters
			if (page <= 0) {
				return new Response(
					JSON.stringify({
						error: "Page must be greater than 0",
						code: "INVALID_PAGE",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Validate sort parameters
			if (!["impact_score", "date"].includes(sortBy)) {
				return new Response(
					JSON.stringify({
						error: "Invalid sortBy parameter. Must be 'impact_score' or 'date'",
						code: "INVALID_SORT_BY",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			if (!["asc", "desc"].includes(sortOrder)) {
				return new Response(
					JSON.stringify({
						error: "Invalid sortOrder parameter. Must be 'asc' or 'desc'",
						code: "INVALID_SORT_ORDER",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Get paginated results
			const result = await DatabaseService.getBusinessOpportunitiesPaginated(
				subredditId,
				{
					days,
					page,
					limit,
					sortBy,
					sortOrder,
					search: search.trim() || undefined,
					searchFields: ["title", "description", "keywords"], // Include keywords in search
				}
			);

			return new Response(
				JSON.stringify({
					success: true,
					data: result.data,
					pagination: result.pagination,
					filters: result.filters,
					meta: {
						timestamp: new Date().toISOString(),
						requestedBy: context.user?.id || "anonymous",
						securityLevel: context.user ? "authenticated" : "public",
						endpoint: "opportunities-list",
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
	return secureGetBusinessOpportunities.value(context);
};
