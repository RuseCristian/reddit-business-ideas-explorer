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
	ipRateLimit: RATE_LIMITS.PUBLIC.IP, // Centralized IP rate limiting
	corsOrigins: CORS_CONFIG.PUBLIC, // Centralized CORS config
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY, // Auto HTTPS based on environment
})({}, "getCommunities", {
	value: async (context: SecureAPIContext) => {
		const communities = await DatabaseService.getCommunities(20);

		return new Response(
			JSON.stringify({
				success: true,
				data: communities.communities,
				total: communities.totalCommunities,
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	},
});

export const GET: APIRoute = async (context) => {
	return secureGetCommunities.value(context);
};
