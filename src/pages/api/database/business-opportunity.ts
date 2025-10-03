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
	rateLimit: RATE_LIMITS.USER.USER,
	ipRateLimit: RATE_LIMITS.USER.IP,
	corsOrigins: CORS_CONFIG.USER,
	httpsOnly: SECURITY_CONFIG.HTTPS_ONLY,
})({}, "getBusinessOpportunity", {
	value: async (context: SecureAPIContext) => {
		const url = new URL(context.request.url);
		const id = parseInt(url.searchParams.get("id") || "0");
		if (!id) {
			return new Response(
				JSON.stringify({ error: "Missing or invalid id parameter" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		const opportunity = await DatabaseService.getBusinessOpportunityById(id);
		if (!opportunity) {
			return new Response(
				JSON.stringify({ error: "Business opportunity not found" }),
				{ status: 404, headers: { "Content-Type": "application/json" } }
			);
		}
		return new Response(
			JSON.stringify({
				data: opportunity,
				meta: {
					id,
					timestamp: new Date().toISOString(),
					requestedBy: context.user?.id,
					securityLevel: "authenticated",
				},
			}),
			{ headers: { "Content-Type": "application/json" } }
		);
	},
}).value;
