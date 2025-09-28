// ======================================
// DATABASE SERVICE LAYER (INDUSTRY BEST PRACTICES)
// ======================================
/*
In fisierul asta doar scriem functii care interactioneaza cu baza de date ca sa facem rost de date
-o sa fie modulare fiindca o sa primeasca argumente de la api

*/

import { prisma } from "./client";

export class DatabaseService {
	// ======================================
	// DASHBOARD STATS (For your current test)
	// ======================================
	static async getDashboardStats() {
		try {
			// Execute all queries in parallel for better performance
			const [
				totalSubreddits,
				totalPosts,
				totalComments,
				totalClusters,
				processedClusters,
				totalOpportunities,
				featuredOpportunities,
			] = await Promise.all([
				prisma.subreddit.count(),
				prisma.post.count(),
				prisma.comment.count(),
				prisma.cluster.count(),
				prisma.cluster.count({ where: { isProcessed: true } }),
				prisma.businessOpportunity.count(),
				prisma.businessOpportunity.count({ where: { isFeatured: true } }),
			]);

			// Calculate processing rate
			const processingRate =
				totalClusters > 0
					? Math.round((processedClusters / totalClusters) * 100)
					: 0;

			return {
				totalSubreddits,
				totalPosts,
				totalComments,
				totalClusters,
				processedClusters,
				totalOpportunities,
				featuredOpportunities,
				processingRate,
			};
		} catch (error) {
			console.error("Error fetching dashboard stats:", error);
			throw new Error("Failed to fetch dashboard statistics");
		}
	}

	// ======================================
	// BASIC CRUD OPERATIONS (Examples for you to extend)
	// ======================================

	// Get all subreddits with pagination
	static async getSubreddits(page = 1, limit = 10) {
		try {
			const [subreddits, total] = await Promise.all([
				prisma.subreddit.findMany({
					skip: (page - 1) * limit,
					take: limit,
					orderBy: { subscriberCount: "desc" },
					select: {
						id: true,
						name: true,
						displayName: true,
						subscriberCount: true,
						_count: {
							select: {
								posts: true,
								comments: true,
							},
						},
					},
				}),
				prisma.subreddit.count(),
			]);

			return {
				data: subreddits,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error("Error fetching subreddits:", error);
			throw new Error("Failed to fetch subreddits");
		}
	}

	// Get business opportunities with filtering
	static async getBusinessOpportunities(filters = {}) {
		try {
			const {
				featured = null,
				subredditId = null,
				limit = 20,
			} = filters as any;

			const where: any = {};
			if (featured !== null) where.isFeatured = featured;
			if (subredditId) where.subredditId = subredditId;

			const opportunities = await prisma.businessOpportunity.findMany({
				where,
				take: limit,
				orderBy: { businessImpactScore: "desc" },
				include: {
					subreddit: {
						select: { name: true, displayName: true },
					},
					solutions: {
						orderBy: { solutionOrder: "asc" },
						take: 3, // Limit solutions for performance
					},
				},
			});

			return opportunities;
		} catch (error) {
			console.error("Error fetching business opportunities:", error);
			throw new Error("Failed to fetch business opportunities");
		}
	}

	/**
	 * Get top subreddits with activity metrics for dashboard display
	 * @param limit Number of subreddits to return (default: 5)
	 */
	static async getTopSubredditsWithActivity(limit: number = 5) {
		try {
			const subreddits = await prisma.subreddit.findMany({
				take: limit,
				orderBy: { subscriberCount: "desc" },
				include: {
					_count: {
						select: {
							posts: true,
							businessOpportunities: true,
						},
					},
				},
			});

			return subreddits.map((subreddit) => ({
				id: subreddit.id,
				name: subreddit.name,
				displayName: subreddit.displayName,
				subscriberCount: subreddit.subscriberCount,
				postCount: subreddit._count.posts,
				opportunityCount: subreddit._count.businessOpportunities,
			}));
		} catch (error) {
			console.error("Error fetching top subreddits:", error);
			throw new Error("Failed to fetch top subreddits");
		}
	}

	/**
	 * Get simple subreddit data (for dashboard display)
	 * @param limit Number of subreddits to return (default: 5)
	 */
	static async getSimpleSubreddits(limit: number = 5) {
		try {
			// Very simple query - just get basic subreddit info
			const subreddits = await prisma.subreddit.findMany({
				take: limit,
				orderBy: { subscriberCount: "desc" },
				select: {
					id: true,
					name: true,
					displayName: true,
					subscriberCount: true,
				},
			});

			return subreddits;
		} catch (error) {
			console.error("Error fetching simple subreddits:", error);
			throw new Error("Failed to fetch simple subreddits");
		}
	}
}
