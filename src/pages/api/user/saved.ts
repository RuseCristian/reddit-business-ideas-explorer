import type { APIRoute } from "astro";
import { DatabaseService } from "../../../lib/database/service";

export const GET: APIRoute = async ({ params, request, url }) => {
	try {
		// For now, we'll use a user ID from query params
		// In production, you'll get this from Clerk authentication
		const userId = url.searchParams.get("userId");
		if (!userId) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "User ID is required",
				}),
				{ status: 400 }
			);
		}

		const savedIdeas = await DatabaseService.getSavedIdeasForUser(userId);

		return new Response(
			JSON.stringify({
				success: true,
				data: savedIdeas,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Error fetching saved ideas:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to fetch saved ideas",
			}),
			{ status: 500 }
		);
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const { userId, ideaId } = await request.json();

		if (!userId || !ideaId) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "User ID and Idea ID are required",
				}),
				{ status: 400 }
			);
		}

		const savedIdea = await DatabaseService.saveIdeaForUser(userId, ideaId);

		return new Response(
			JSON.stringify({
				success: true,
				data: savedIdea,
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Error saving idea:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to save idea",
			}),
			{ status: 500 }
		);
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	try {
		const { userId, ideaId } = await request.json();

		if (!userId || !ideaId) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "User ID and Idea ID are required",
				}),
				{ status: 400 }
			);
		}

		await DatabaseService.unsaveIdeaForUser(userId, ideaId);

		return new Response(
			JSON.stringify({
				success: true,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Error unsaving idea:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to unsave idea",
			}),
			{ status: 500 }
		);
	}
};
