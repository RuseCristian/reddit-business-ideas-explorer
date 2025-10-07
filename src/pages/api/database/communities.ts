// Public communities endpoint - /api/database/communities
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

// Enhanced secure wrapper function with centralized config
const secureGetCommunities = Secure({
	auth: "required", // Require authentication for communities
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "getCommunities", {
	value: async (context: SecureAPIContext) => {
		try {
			const url = new URL(context.request.url);
			const limit = Math.min(
				parseInt(url.searchParams.get("limit") || "20"),
				50
			);

			// Get available subreddits with active business opportunities
			const result = await DatabaseService.getAvailableSubreddits(limit);

			// Transform data for communities display
			const communities = result.subreddits.map((subreddit) => ({
				id: subreddit.id,
				name: `r/${subreddit.name}`,
				displayName: subreddit.displayName,
				description: `Discussions about ${subreddit.displayName.toLowerCase()} and related topics`,
				memberCount: subreddit.subscriberCountFormatted,
				subscriberCount: subreddit.subscriberCount,
				posts: subreddit.totalPosts,
				comments: subreddit.totalComments,
				opportunities: subreddit.opportunityCount,
				// Use the actual calculated average business impact score
				avgScore: subreddit.avgBusinessImpactScore || 0,
				iconPath: subreddit.iconPath,
			}));

			return new Response(
				JSON.stringify({
					success: true,
					data: communities,
					totalCount: result.totalCount,
					meta: {
						timestamp: new Date().toISOString(),
						requestedBy: context.user?.id || "anonymous",
						securityLevel: context.user ? "authenticated" : "public",
						endpoint: "communities",
						filter: `Only showing communities with active business opportunities`,
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
	return secureGetCommunities.value(context);
};
