import type { APIRoute } from "astro";
import { DatabaseService } from "../../lib/database/database-service";

export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get("limit") || "5");

		const subreddits = await DatabaseService.getSimpleSubreddits(limit);

		return new Response(JSON.stringify(subreddits), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("API Error:", error);
		return new Response(
			JSON.stringify({ error: "Failed to fetch subreddits" }),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};
