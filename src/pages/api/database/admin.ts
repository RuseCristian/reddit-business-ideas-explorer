// Admin data endpoint - /api/database/admin
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

// Enhanced secure wrapper function with centralized config
const secureGetAdminData = Secure({
	auth: "required",
	adminOnly: true,
	rateLimit: RATE_LIMITS.ADMIN.USER, // Centralized admin user rate limiting
	ipRateLimit: RATE_LIMITS.ADMIN.IP, // Centralized admin IP rate limiting
	corsOrigins: CORS_CONFIG.ADMIN, // Centralized admin CORS config
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY, // Auto HTTPS based on environment
})({}, "getAdminData", {
	value: async (context: SecureAPIContext) => {
		return new Response(
			JSON.stringify({
				success: true,
				message: "Admin data access granted",
				adminId: context.user?.id,
				clientIp: context.clientIp, // Show IP for admin security
				environment: SECURITY_CONFIG.ENVIRONMENT,
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	},
});

export const GET: APIRoute = async (context) => {
	return secureGetAdminData.value(context);
};
