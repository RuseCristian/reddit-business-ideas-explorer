import { prisma } from "./prisma";

// Database operations for your Reddit Business Ideas Explorer
// Based on your actual PostgreSQL database structure

export class DatabaseOperations {
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

	static async getSubreddits() {
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

	static async getUnprocessedPosts(limit: number = 100) {
		return await prisma.post.findMany({
			where: { processed: false },
			include: { subreddit: true },
			take: limit,
			orderBy: { scrapedAt: "desc" },
		});
	}

	static async markPostAsProcessed(postId: number) {
		return await prisma.post.update({
			where: { id: postId },
			data: { processed: true },
		});
	}

	// === COMMENT OPERATIONS ===

	static async createComment(data: {
		redditId: string;
		subredditId: number;
		postId?: number;
		content: string;
		author?: string;
		upvotes?: number;
		createdUtc?: Date;
		permalink: string;
	}) {
		return await prisma.comment.create({
			data: {
				redditId: data.redditId,
				subredditId: data.subredditId,
				postId: data.postId,
				content: data.content,
				author: data.author,
				upvotes: data.upvotes || 0,
				createdUtc: data.createdUtc,
				permalink: data.permalink,
			},
			include: {
				subreddit: true,
				post: true,
			},
		});
	}

	static async getUnprocessedComments(limit: number = 100) {
		return await prisma.comment.findMany({
			where: { processed: false },
			include: { subreddit: true, post: true },
			take: limit,
			orderBy: { scrapedAt: "desc" },
		});
	}

	// === CLUSTER OPERATIONS ===

	static async createCluster(data: {
		subredditId: number;
		maxSize: number;
		expiryDate: Date;
		clusterType?: string;
		sentiment?: string;
		keywordTags?: any;
	}) {
		return await prisma.cluster.create({
			data: {
				subredditId: data.subredditId,
				maxSize: data.maxSize,
				expiryDate: data.expiryDate,
				clusterType: data.clusterType,
				sentiment: data.sentiment,
				keywordTags: data.keywordTags,
			},
			include: {
				subreddit: true,
				_count: { select: { clusterItems: true } },
			},
		});
	}

	static async getActiveClusters(subredditId?: number) {
		return await prisma.cluster.findMany({
			where: {
				isActive: true,
				...(subredditId && { subredditId }),
			},
			include: {
				subreddit: true,
				clusterItems: true,
				_count: { select: { clusterItems: true } },
			},
			orderBy: { createdDate: "desc" },
		});
	}

	static async getUnprocessedClusters() {
		return await prisma.cluster.findMany({
			where: { isProcessed: false },
			include: {
				subreddit: true,
				clusterItems: true,
			},
			orderBy: { createdDate: "asc" },
		});
	}

	static async markClusterAsProcessed(clusterId: number) {
		return await prisma.cluster.update({
			where: { id: clusterId },
			data: {
				isProcessed: true,
				lastUpdated: new Date(),
			},
		});
	}

	// === CLUSTER ITEM OPERATIONS ===

	static async addItemToCluster(data: {
		clusterId: number;
		itemType: "post" | "comment";
		itemId: number;
		similarityScore?: number;
	}) {
		return await prisma.clusterItem.create({
			data: {
				clusterId: data.clusterId,
				itemType: data.itemType,
				itemId: data.itemId,
				similarityScore: data.similarityScore,
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

	static async getFeaturedOpportunities(limit: number = 20) {
		return await prisma.businessOpportunity.findMany({
			where: { isFeatured: true },
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

	static async getOpportunitiesBySubreddit(subredditId: number) {
		return await prisma.businessOpportunity.findMany({
			where: { subredditId },
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

	static async getSubredditStats(subredditId: number) {
		const stats = await prisma.subreddit.findUnique({
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
			...stats,
			processedClusters,
			featuredOpportunities,
		};
	}

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
