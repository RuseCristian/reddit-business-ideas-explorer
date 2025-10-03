// User communities endpoint - /api/database/user-communities
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

// Secure decorator applied directly to the GET handler
export const GET: APIRoute = Secure({
	auth: "required",
	rateLimit: RATE_LIMITS.USER.USER, // Centralized user rate limiting
	ipRateLimit: RATE_LIMITS.USER.IP, // Centralized IP rate limiting
	corsOrigins: CORS_CONFIG.USER, // Centralized CORS config
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY, // Auto HTTPS based on environment
})({}, "getUserCommunities", {
	value: async (context: SecureAPIContext) => {
		const url = new URL(context.request.url);
		const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
		const searchTerm = url.searchParams.get("search") || undefined;

		const communities = await DatabaseService.getCommunities(limit, {
			searchTerm,
			includeAnalytics: true,
			userId: context.user?.id,
		});

		return new Response(
			JSON.stringify({
				data: communities.communities,
				meta: {
					count: communities.communities.length,
					total: communities.totalCommunities,
					limit: limit,
					searchTerm: searchTerm,
					timestamp: new Date().toISOString(),
					requestedBy: context.user?.id,
					securityLevel: "authenticated",
				},
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	},
}).value;
