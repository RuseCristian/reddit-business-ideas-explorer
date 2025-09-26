import type { APIRoute } from "astro";
import { DatabaseService } from "../../lib/database/service";
import { prisma } from "../../lib/database/prisma";

export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const offset = parseInt(url.searchParams.get("offset") || "0");
		const search = url.searchParams.get("search");
		const tag = url.searchParams.get("tag");

		let ideas;

		if (search) {
			ideas = await DatabaseService.searchBusinessIdeas(search);
		} else if (tag) {
			ideas = await DatabaseService.getIdeasByTag(tag);
		} else {
			ideas = await DatabaseService.getAllBusinessIdeas(limit, offset);
		}

		return new Response(
			JSON.stringify({
				success: true,
				data: ideas,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Error fetching business ideas:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to fetch business ideas",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const {
			title,
			description,
			subreddit,
			redditUrl,
			upvotes = 0,
			tags = [],
		} = await request.json();

		// Create the business idea
		const idea = await prisma.businessIdea.create({
			data: {
				title,
				description,
				subreddit,
				redditUrl,
				upvotes,
			},
		});

		// Add tags if provided
		if (tags.length > 0) {
			for (const tagName of tags) {
				// Create tag if it doesn't exist
				const tag = await prisma.tag.upsert({
					where: { name: tagName },
					update: {},
					create: { name: tagName },
				});

				// Link tag to idea
				await prisma.ideaTag.create({
					data: {
						ideaId: idea.id,
						tagId: tag.id,
					},
				});
			}
		}

		// Fetch the complete idea with tags
		const completeIdea = await DatabaseService.getBusinessIdeaById(idea.id);

		return new Response(
			JSON.stringify({
				success: true,
				data: completeIdea,
			}),
			{
				status: 201,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Error creating business idea:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to create business idea",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};
