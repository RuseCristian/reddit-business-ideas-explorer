import { prisma } from "./prisma";

// Main database service for your Reddit Business Ideas Explorer
// Based on your actual PostgreSQL database structure

export class DatabaseService {
	// === BUSINESS OPPORTUNITIES ===

	static async getAllBusinessOpportunities(limit = 50, offset = 0) {
		return await prisma.businessOpportunity.findMany({
			take: limit,
			skip: offset,
			orderBy: { processedAt: "desc" },
			include: {
				subreddit: true,
				solutions: true,
				cluster: {
					include: {
						_count: { select: { clusterItems: true } },
					},
				},
			},
		});
	}

	static async getBusinessOpportunityById(id: number) {
		return await prisma.businessOpportunity.findUnique({
			where: { id },
			include: {
				subreddit: true,
				solutions: {
					orderBy: { solutionOrder: "asc" },
				},
				cluster: {
					include: {
						clusterItems: true,
						_count: { select: { clusterItems: true } },
					},
				},
			},
		});
	}

	static async searchBusinessOpportunities(query: string) {
		return await prisma.businessOpportunity.findMany({
			where: {
				OR: [
					{ mainTitle: { contains: query, mode: "insensitive" } },
					{ problemDescription: { contains: query, mode: "insensitive" } },
					{ affectedAudience: { contains: query, mode: "insensitive" } },
					{ subreddit: { name: { contains: query, mode: "insensitive" } } },
				],
			},
			include: {
				subreddit: true,
				solutions: true,
				cluster: {
					include: {
						_count: { select: { clusterItems: true } },
					},
				},
			},
			orderBy: { businessImpactScore: "desc" },
		});
	}

	static async getFeaturedOpportunities(limit = 20) {
		return await prisma.businessOpportunity.findMany({
			where: { isFeatured: true },
			take: limit,
			include: {
				subreddit: true,
				solutions: true,
				cluster: {
					include: {
						_count: { select: { clusterItems: true } },
					},
				},
			},
			orderBy: [{ businessImpactScore: "desc" }, { processedAt: "desc" }],
		});
	}

	static async getTopOpportunities(limit = 20) {
		return await prisma.businessOpportunity.findMany({
			take: limit,
			include: {
				subreddit: true,
				solutions: true,
				cluster: {
					include: {
						_count: { select: { clusterItems: true } },
					},
				},
			},
			orderBy: [{ businessImpactScore: "desc" }, { processedAt: "desc" }],
		});
	}

	// === SUBREDDIT OPERATIONS ===

	static async getAllSubreddits() {
		return await prisma.subreddit.findMany({
			include: {
				_count: {
					select: {
						posts: true,
						comments: true,
						businessOpportunities: true,
						clusters: true,
					},
				},
			},
			orderBy: { subscriberCount: "desc" },
		});
	}

	static async getSubredditByName(name: string) {
		return await prisma.subreddit.findUnique({
			where: { name },
			include: {
				_count: {
					select: {
						posts: true,
						comments: true,
						businessOpportunities: true,
						clusters: true,
					},
				},
			},
		});
	}

	static async getOpportunitiesBySubreddit(subredditName: string) {
		return await prisma.businessOpportunity.findMany({
			where: {
				subreddit: { name: subredditName },
			},
			include: {
				subreddit: true,
				solutions: true,
				cluster: {
					include: {
						_count: { select: { clusterItems: true } },
					},
				},
			},
			orderBy: { businessImpactScore: "desc" },
		});
	}

	// === POSTS & COMMENTS ===

	static async getRecentPosts(limit = 50) {
		return await prisma.post.findMany({
			take: limit,
			include: {
				subreddit: true,
				_count: { select: { comments: true } },
			},
			orderBy: { scrapedAt: "desc" },
		});
	}

	static async getRecentComments(limit = 50) {
		return await prisma.comment.findMany({
			take: limit,
			include: {
				subreddit: true,
				post: { select: { title: true, id: true } },
			},
			orderBy: { scrapedAt: "desc" },
		});
	}

	// === ANALYTICS & STATS ===

	static async getDashboardStats() {
		const totalSubreddits = await prisma.subreddit.count();
		const totalPosts = await prisma.post.count();
		const totalComments = await prisma.comment.count();
		const totalClusters = await prisma.cluster.count();
		const processedClusters = await prisma.cluster.count({
			where: { isProcessed: true },
		});
		const totalOpportunities = await prisma.businessOpportunity.count();
		const featuredOpportunities = await prisma.businessOpportunity.count({
			where: { isFeatured: true },
		});

		return {
			totalSubreddits,
			totalPosts,
			totalComments,
			totalClusters,
			processedClusters,
			totalOpportunities,
			featuredOpportunities,
			processingRate:
				totalClusters > 0 ? (processedClusters / totalClusters) * 100 : 0,
		};
	}

	static async getSubredditStats(subredditId: number) {
		const subreddit = await prisma.subreddit.findUnique({
			where: { id: subredditId },
			include: {
				_count: {
					select: {
						posts: true,
						comments: true,
						clusters: true,
						businessOpportunities: true,
					},
				},
			},
		});

		const processedClusters = await prisma.cluster.count({
			where: {
				subredditId,
				isProcessed: true,
			},
		});

		const featuredOpportunities = await prisma.businessOpportunity.count({
			where: {
				subredditId,
				isFeatured: true,
			},
		});

		return {
			...subreddit,
			processedClusters,
			featuredOpportunities,
		};
	}

	// === CLUSTER OPERATIONS ===

	static async getActiveClusters(subredditId?: number) {
		return await prisma.cluster.findMany({
			where: {
				isActive: true,
				...(subredditId && { subredditId }),
			},
			include: {
				subreddit: true,
				businessOpportunity: true,
				_count: { select: { clusterItems: true } },
			},
			orderBy: { createdDate: "desc" },
		});
	}

	static async getClusterDetails(clusterId: number) {
		return await prisma.cluster.findUnique({
			where: { id: clusterId },
			include: {
				subreddit: true,
				clusterItems: true,
				businessOpportunity: {
					include: {
						solutions: true,
					},
				},
				_count: { select: { clusterItems: true } },
			},
		});
	}
}
