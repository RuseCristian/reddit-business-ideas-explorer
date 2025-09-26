import { prisma } from "./prisma";

// Database operations for your Reddit Business Ideas Explorer
// Based on your actual PostgreSQL database structure

export class Database {
	// === SUBREDDIT OPERATIONS ===

	static async createOrUpdateSubreddit(data: {
		name: string;
		displayName?: string;
		subscriberCount?: number;
		createdUtc?: Date;
		iconPath?: string;
	}) {
		return await prisma.subreddit.upsert({
			where: { name: data.name },
			update: {
				displayName: data.displayName,
				subscriberCount: data.subscriberCount,
				iconPath: data.iconPath,
				lastUpdated: new Date(),
			},
			create: {
				name: data.name,
				displayName: data.displayName,
				subscriberCount: data.subscriberCount || 0,
				createdUtc: data.createdUtc,
				iconPath: data.iconPath,
			},
		});
	}

	static async getAllSubreddits() {
		return await prisma.subreddit.findMany({
			include: {
				_count: {
					select: {
						posts: true,
						comments: true,
						businessOpportunities: true,
					},
				},
			},
			orderBy: { subscriberCount: "desc" },
		});
	}

	// === POST OPERATIONS ===

	static async createPost(data: {
		redditId: string;
		subredditId: number;
		title: string;
		selftext?: string;
		url?: string;
		author?: string;
		score?: number;
		upvotes?: number;
		createdUtc?: Date;
	}) {
		return await prisma.post.create({
			data: {
				redditId: data.redditId,
				subredditId: data.subredditId,
				title: data.title,
				selftext: data.selftext,
				url: data.url,
				author: data.author,
				score: data.score || 0,
				upvotes: data.upvotes || 0,
				createdUtc: data.createdUtc,
			},
			include: {
				subreddit: true,
			},
		});
	}

	// === BUSINESS OPPORTUNITY OPERATIONS ===

	static async createBusinessOpportunity(data: {
		clusterId: number;
		subredditId: number;
		mainTitle: string;
		problemDescription?: string;
		affectedAudience?: string;
		painSeverity?: string;
		marketGap?: string;
		businessImpactScore?: number;
		validatedNeed?: string;
		addressableMarket?: string;
		timeSensitivity?: string;
		clusterSentiment?: string;
		solutions?: Array<{
			title: string;
			businessModel?: string;
			marketSize?: string;
			solutionDescription?: string;
			solutionOrder?: number;
		}>;
	}) {
		return await prisma.businessOpportunity.create({
			data: {
				clusterId: data.clusterId,
				subredditId: data.subredditId,
				mainTitle: data.mainTitle,
				problemDescription: data.problemDescription,
				affectedAudience: data.affectedAudience,
				painSeverity: data.painSeverity,
				marketGap: data.marketGap,
				businessImpactScore: data.businessImpactScore,
				validatedNeed: data.validatedNeed,
				addressableMarket: data.addressableMarket,
				timeSensitivity: data.timeSensitivity,
				clusterSentiment: data.clusterSentiment,
				solutions: data.solutions
					? {
							create: data.solutions,
					  }
					: undefined,
			},
			include: {
				cluster: {
					include: {
						subreddit: true,
						clusterItems: true,
					},
				},
				subreddit: true,
				solutions: true,
			},
		});
	}

	static async getTopOpportunities(limit: number = 20) {
		return await prisma.businessOpportunity.findMany({
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
			take: limit,
		});
	}

	static async searchOpportunities(query: string) {
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
}

// Export individual functions for convenience
export const {
	createOrUpdateSubreddit,
	getAllSubreddits,
	createPost,
	createBusinessOpportunity,
	getTopOpportunities,
	searchOpportunities,
	getDashboardStats,
} = Database;
