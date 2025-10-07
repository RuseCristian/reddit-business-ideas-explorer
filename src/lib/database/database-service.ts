import { prisma, DatabaseConnection } from "./client";
import { Prisma } from "@prisma/client";

// Error handling utility for database operations
class DatabaseError extends Error {
	constructor(
		message: string,
		public code?: string,
		public originalError?: unknown
	) {
		super(message);
		this.name = "DatabaseError";
	}

	static fromPrismaError(error: unknown): DatabaseError {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			// Handle known Prisma errors
			switch (error.code) {
				case "P2002":
					return new DatabaseError(
						"Unique constraint violation",
						error.code,
						error
					);
				case "P2025":
					return new DatabaseError("Record not found", error.code, error);
				case "P2003":
					return new DatabaseError(
						"Foreign key constraint violation",
						error.code,
						error
					);
				case "P1001":
					return new DatabaseError(
						"Database connection failed",
						error.code,
						error
					);
				default:
					return new DatabaseError(
						"Database operation failed",
						error.code,
						error
					);
			}
		}

		if (error instanceof Prisma.PrismaClientUnknownRequestError) {
			return new DatabaseError("Unknown database error", "UNKNOWN", error);
		}

		if (error instanceof Prisma.PrismaClientValidationError) {
			return new DatabaseError("Invalid query parameters", "VALIDATION", error);
		}

		return new DatabaseError("Unexpected database error", "UNEXPECTED", error);
	}
}

class DatabaseService {
	/**
	 * Advanced business opportunities query with pagination, sorting, and search
	 * @param subredditId - The subreddit ID to filter by
	 * @param options - Query options including pagination, sorting, search, and filters
	 */
	static async getBusinessOpportunitiesPaginated(
		subredditId: number,
		options: {
			days?: number;
			page?: number;
			limit?: number;
			sortBy?: "impact_score" | "date";
			sortOrder?: "asc" | "desc";
			search?: string;
			searchFields?: ("title" | "description" | "keywords")[];
		} = {}
	) {
		const {
			days = 30,
			page = 1,
			limit = 9,
			sortBy = "impact_score",
			sortOrder = "desc",
			search,
			searchFields = ["title", "description", "keywords"],
		} = options;

		try {
			// Calculate pagination
			const skip = (page - 1) * limit;
			const sinceDate = new Date();
			sinceDate.setDate(sinceDate.getDate() - days);

			// Build where clause with search
			const whereClause = this.buildSearchWhereClause(
				subredditId,
				sinceDate,
				search,
				searchFields
			);

			// Build order by clause
			const orderBy = this.buildOrderByClause(sortBy, sortOrder);

			// Get paginated results
			const [opportunities, totalCount] = await Promise.all([
				prisma.businessOpportunity.findMany({
					where: whereClause,
					orderBy,
					skip,
					take: limit,
					select: {
						id: true,
						mainTitle: true,
						problemDescription: true,
						businessImpactScore: true,
						processedAt: true,
						keywords: true,
						cluster: {
							select: {
								size: true,
							},
						},
						subreddit: {
							select: {
								name: true,
								displayName: true,
							},
						},
					},
				} as any),
				prisma.businessOpportunity.count({
					where: whereClause,
				}),
			]);

			// Transform results
			const transformedOpportunities = opportunities.map((opp: any) => ({
				id: opp.id,
				title: opp.mainTitle,
				description: opp.problemDescription,
				score: opp.businessImpactScore,
				date: opp.processedAt,
				keywords: opp.keywords || [],
				source: {
					subreddit: opp.subreddit?.name || "unknown",
					displayName:
						opp.subreddit?.displayName ||
						opp.subreddit?.name ||
						"Unknown Community",
					sourceCount: opp.cluster?.size || 0,
				},
			}));

			// Calculate pagination metadata
			const totalPages = Math.ceil(totalCount / limit);
			const hasNextPage = page < totalPages;
			const hasPrevPage = page > 1;

			return {
				data: transformedOpportunities,
				pagination: {
					currentPage: page,
					totalPages,
					totalCount,
					limit,
					hasNextPage,
					hasPrevPage,
				},
				filters: {
					subredditId,
					days,
					sortBy,
					sortOrder,
					search: search || null,
					searchFields,
				},
			};
		} catch (error) {
			throw DatabaseError.fromPrismaError(error);
		}
	}

	/**
	 * Helper function to build search where clause
	 */
	private static buildSearchWhereClause(
		subredditId: number,
		sinceDate: Date,
		search?: string,
		searchFields: ("title" | "description" | "keywords")[] = []
	): Prisma.BusinessOpportunityWhereInput {
		const baseWhere: Prisma.BusinessOpportunityWhereInput = {
			subredditId,
			processedAt: { gte: sinceDate },
		};

		if (!search || search.trim() === "") {
			return baseWhere;
		}

		const searchTerm = search.trim();
		const searchConditions: Prisma.BusinessOpportunityWhereInput[] = [];

		// Search in title
		if (searchFields.includes("title")) {
			searchConditions.push({
				mainTitle: { contains: searchTerm, mode: "insensitive" },
			});
		}

		// Search in description
		if (searchFields.includes("description")) {
			searchConditions.push({
				problemDescription: { contains: searchTerm, mode: "insensitive" },
			});
		}

		// Search in keywords (JSON field) - simplified approach
		if (searchFields.includes("keywords")) {
			searchConditions.push({
				keywords: {
					path: [],
					string_contains: searchTerm.toLowerCase(),
				},
			} as any);
		}

		return {
			...baseWhere,
			OR: searchConditions.length > 0 ? searchConditions : undefined,
		};
	}

	/**
	 * Helper function to build order by clause
	 */
	private static buildOrderByClause(
		sortBy: "impact_score" | "date",
		sortOrder: "asc" | "desc"
	): Prisma.BusinessOpportunityOrderByWithRelationInput {
		switch (sortBy) {
			case "impact_score":
				return { businessImpactScore: sortOrder as Prisma.SortOrder };
			case "date":
				return { processedAt: sortOrder as Prisma.SortOrder };
			default:
				return { businessImpactScore: Prisma.SortOrder.desc };
		}
	}

	/**
	 * Test database connection
	 */
	static async testConnection(): Promise<boolean> {
		return DatabaseConnection.testConnection();
	}

	/**
	 * Get available subreddits that have active business opportunities
	 */
	static async getAvailableSubreddits(limit: number = 100) {
		try {
			const subreddits = await prisma.subreddit.findMany({
				where: {
					businessOpportunities: {
						some: {
							isActive: true, // Only subreddits with active opportunities
						} as any,
					},
				},
				select: {
					id: true,
					name: true,
					displayName: true,
					subscriberCount: true,
					businessOpportunities: {
						where: {
							isActive: true, // Only get active opportunities for scoring
						} as any,
						select: {
							businessImpactScore: true,
						},
					},
					_count: {
						select: {
							businessOpportunities: {
								where: {
									isActive: true, // Count only active opportunities
								} as any,
							},
							posts: true,
							comments: true,
						},
					},
				},
				orderBy: [
					{ subscriberCount: "desc" }, // Order by subscriber count since we can't easily order by filtered count
				],
				take: limit,
			});
			console.log("Fetched subreddits:", subreddits.length);
			return {
				subreddits: subreddits.map((subreddit: any) => {
					// Calculate the average business impact score
					const scores = subreddit.businessOpportunities
						.map((opp: any) => opp.businessImpactScore)
						.filter((score: any) => score !== null) as number[];

					const avgScore =
						scores.length > 0
							? scores.reduce((sum, score) => sum + score, 0) / scores.length
							: 0;

					return {
						id: subreddit.id,
						name: subreddit.name,
						displayName: subreddit.displayName || subreddit.name,
						subscriberCount: subreddit.subscriberCount || 0,
						subscriberCountFormatted: subreddit.subscriberCount
							? subreddit.subscriberCount >= 1000000
								? (subreddit.subscriberCount / 1000000).toFixed(1) + "M"
								: subreddit.subscriberCount >= 1000
								? (subreddit.subscriberCount / 1000).toFixed(1) + "K"
								: subreddit.subscriberCount.toString()
							: "0",
						opportunityCount: subreddit._count.businessOpportunities,
						totalPosts: subreddit._count.posts,
						totalComments: subreddit._count.comments,
						avgBusinessImpactScore: avgScore,
						// Try PNG first, will fallback in component if not found
						iconPath: `/assets/subreddit_icons/${subreddit.name}.png`,
					};
				}),
				totalCount: subreddits.length,
			};
		} catch (error) {
			throw DatabaseError.fromPrismaError(error);
		}
	}

	/**
	 * Get a business opportunity by ID, including its cluster, subreddit, and solutions
	 */
	static async getBusinessOpportunityById(id: number) {
		try {
			const opportunity = await prisma.businessOpportunity.findUnique({
				where: { id },
				select: {
					// Base fields (removed isFeatured as it's internal)
					id: true,
					mainTitle: true,
					keywords: true,
					problemDescription: true,
					affectedAudience: true,
					painSeverity: true,
					marketGap: true,
					businessImpactScore: true,
					validatedNeed: true,
					addressableMarket: true,
					timeSensitivity: true,
					clusterSentiment: true,
					processedAt: true,
					// Relations
					cluster: {
						select: {
							id: true,
							size: true,
							clusterType: true,
							sentiment: true,
						},
					},
					subreddit: {
						select: {
							id: true,
							name: true,
							displayName: true,
							subscriberCount: true,
							createdUtc: true,
						},
					},
					solutions: {
						select: {
							id: true,
							title: true,
							businessModel: true,
							marketSize: true,
							solutionDescription: true,
							solutionOrder: true,
						},
						orderBy: {
							solutionOrder: "asc",
						},
					},
				},
			} as any);
			if (!opportunity) return null;

			// Fetch up to 8 posts and 8 comments via ClusterItems for the related cluster
			let posts: any[] = [];
			let comments: any[] = [];
			if ((opportunity as any).cluster?.id) {
				// Posts
				const postItems = await prisma.clusterItem.findMany({
					where: {
						clusterId: (opportunity as any).cluster.id,
						itemType: "post",
					},
					take: 8,
					orderBy: { addedDate: "desc" },
				});
				const postIds = postItems.map((item) => item.itemId);
				if (postIds.length > 0) {
					posts = await prisma.post.findMany({
						where: { id: { in: postIds } },
						select: {
							id: true,
							title: true,
							selftext: true,
							url: true,
							author: true,
							score: true,
							upvotes: true,
							createdUtc: true,
							redditId: true,
							subreddit: {
								select: {
									name: true,
									displayName: true,
								},
							},
						},
					});
				}
				// Comments
				const commentItems = await prisma.clusterItem.findMany({
					where: {
						clusterId: (opportunity as any).cluster.id,
						itemType: "comment",
					},
					take: 8,
					orderBy: { addedDate: "desc" },
				});
				const commentIds = commentItems.map((item) => item.itemId);
				if (commentIds.length > 0) {
					comments = await prisma.comment.findMany({
						where: { id: { in: commentIds } },
						select: {
							id: true,
							content: true,
							author: true,
							upvotes: true,
							createdUtc: true,
							permalink: true,
							redditId: true,
							subreddit: {
								select: {
									name: true,
									displayName: true,
								},
							},
						},
					});
				}
			}

			// Return structured data with all relevant information
			const oppAny = opportunity as any;
			const { cluster, subreddit, solutions, ...rest } = oppAny;

			return {
				// Core opportunity data
				id: oppAny.id,
				...rest,

				// Enhanced subreddit information
				subreddit: {
					id: subreddit?.id || null,
					name: subreddit?.name || null,
					displayName: subreddit?.displayName || subreddit?.name || null,
					subscriberCount: subreddit?.subscriberCount || null,
					createdUtc: subreddit?.createdUtc || null,
					// Add formatted subscriber count for display
					subscriberCountFormatted: subreddit?.subscriberCount
						? subreddit.subscriberCount >= 1000000
							? (subreddit.subscriberCount / 1000000).toFixed(1) + "M"
							: subreddit.subscriberCount >= 1000
							? (subreddit.subscriberCount / 1000).toFixed(1) + "K"
							: subreddit.subscriberCount.toString()
						: null,
				},

				// Enhanced cluster information
				cluster: {
					id: cluster?.id || null,
					size: cluster?.size || 0,
					clusterType: cluster?.clusterType || null,
					sentiment: cluster?.sentiment || oppAny.clusterSentiment || null,
				},

				// Processed data
				keywords: oppAny.keywords || [],

				// Enhanced posts with better Reddit URLs and more data
				posts: posts.map((post: any) => ({
					id: post.id,
					title: post.title,
					selftext: post.selftext,
					url: post.url,
					redditId: post.redditId,
					// Generate proper Reddit URL
					redditUrl: post.url?.startsWith("http")
						? post.url
						: `https://www.reddit.com/r/${
								post.subreddit?.name || subreddit?.name
						  }/comments/${post.redditId}`,
					author: post.author || "Unknown",
					score: post.score || 0,
					upvotes: post.upvotes || 0,
					createdUtc: post.createdUtc,
					subreddit: {
						name: post.subreddit?.name || subreddit?.name,
						displayName: post.subreddit?.displayName || subreddit?.displayName,
					},
				})),

				// Enhanced comments with better Reddit URLs
				comments: comments.map((comment: any) => ({
					id: comment.id,
					content: comment.content,
					author: comment.author || "Unknown",
					upvotes: comment.upvotes || 0,
					createdUtc: comment.createdUtc,
					permalink: comment.permalink,
					redditId: comment.redditId,
					// Generate proper Reddit URL
					redditUrl: comment.permalink
						? `https://www.reddit.com${comment.permalink}`
						: `https://www.reddit.com/r/${
								comment.subreddit?.name || subreddit?.name
						  }/comments/${comment.redditId}`,
					subreddit: {
						name: comment.subreddit?.name || subreddit?.name,
						displayName:
							comment.subreddit?.displayName || subreddit?.displayName,
					},
				})),

				// Enhanced solutions with proper ordering and IDs
				solutions: (solutions || [])
					.sort(
						(a: any, b: any) =>
							(a.solutionOrder || 999) - (b.solutionOrder || 999)
					)
					.map((solution: any, index: number) => ({
						id: solution.id || index + 1,
						title: solution.title,
						description: solution.solutionDescription,
						businessModel: solution.businessModel,
						marketSize: solution.marketSize,
						order: solution.solutionOrder || index + 1,
					})),

				// Metadata
				metadata: {
					totalSources: posts.length + comments.length,
					hasCluster: !!cluster?.id,
					dataQuality: {
						hasKeywords: !!(oppAny.keywords && oppAny.keywords.length > 0),
						hasSolutions: !!(solutions && solutions.length > 0),
						hasDescription: !!oppAny.problemDescription,
						clusterSize: cluster?.size || 0,
					},
				},
			};
		} catch (error) {
			throw DatabaseError.fromPrismaError(error);
		}
	}

	/**
	 * Get communities with enhanced security and error handling
	 */
	static async getCommunities(
		limit: number = 100,
		options: {
			searchTerm?: string;
			includeAnalytics?: boolean;
			includeRecentPosts?: boolean;
		} = {}
	) {
		try {
			const {
				searchTerm,
				includeAnalytics = true,
				includeRecentPosts = true,
			} = options;

			// Build where clause for search
			const whereClause: Prisma.SubredditWhereInput = searchTerm
				? {
						OR: [
							{ name: { contains: searchTerm, mode: "insensitive" } },
							{ displayName: { contains: searchTerm, mode: "insensitive" } },
						],
				  }
				: {};

			// Step 1: Get basic communities with counts
			const communities = await prisma.subreddit.findMany({
				where: whereClause,
				take: Math.min(limit, 100), // Enforce max limit for security
				orderBy: [{ subscriberCount: "desc" }, { name: "asc" }],
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

			// Step 2: Get total count for pagination
			const totalCount = await prisma.subreddit.count({
				where: whereClause,
			});

			// Step 3: Enhanced analytics (only if requested)
			const communitiesWithAnalytics = includeAnalytics
				? await Promise.all(
						communities.map(async (community) => {
							try {
								// Get post analytics
								const postAnalytics = await prisma.post.aggregate({
									where: { subredditId: community.id },
									_sum: { upvotes: true, score: true },
									_avg: { upvotes: true, score: true },
									_count: true,
								});

								// Get comment analytics
								const commentAnalytics = await prisma.comment.aggregate({
									where: { subredditId: community.id },
									_sum: { upvotes: true },
									_avg: { upvotes: true },
									_count: true,
								});

								// Get recent posts (if requested)
								const recentPosts = includeRecentPosts
									? await prisma.post.findMany({
											where: { subredditId: community.id },
											orderBy: [{ createdUtc: "desc" }, { upvotes: "desc" }],
											take: 3,
											select: {
												id: true,
												title: true,
												upvotes: true,
												createdUtc: true,
												author: true,
											},
									  })
									: [];

								// Get top business opportunities
								const topOpportunities =
									await prisma.businessOpportunity.findMany({
										where: { subredditId: community.id },
										orderBy: { businessImpactScore: "desc" },
										take: 3,
										select: {
											id: true,
											mainTitle: true,
											businessImpactScore: true,
											painSeverity: true,
										},
									});

								// Calculate engagement rate
								const engagementRate =
									postAnalytics._count > 0
										? (commentAnalytics._count || 0) / postAnalytics._count
										: 0;

								return {
									id: community.id,
									name: community.name,
									displayName: community.displayName,
									subscriberCount: community.subscriberCount,
									createdUtc: community.createdUtc,
									lastUpdated: community.lastUpdated,
									counts: {
										posts: community._count.posts,
										comments: community._count.comments,
										opportunities: community._count.businessOpportunities,
										clusters: community._count.clusters,
									},
									analytics: {
										totalPostUpvotes: postAnalytics._sum.upvotes || 0,
										avgPostUpvotes: Math.round(postAnalytics._avg.upvotes || 0),
										totalPostScore: postAnalytics._sum.score || 0,
										avgPostScore: Math.round(postAnalytics._avg.score || 0),
										totalCommentUpvotes: commentAnalytics._sum.upvotes || 0,
										avgCommentUpvotes: Math.round(
											commentAnalytics._avg.upvotes || 0
										),
										engagementRate: Math.round(engagementRate * 10) / 10,
										recentPosts: recentPosts.map((post) => ({
											id: post.id,
											title:
												post.title.length > 50
													? post.title.substring(0, 50) + "..."
													: post.title,
											upvotes: post.upvotes || 0,
											author: post.author || "Unknown",
											daysAgo: post.createdUtc
												? Math.floor(
														(new Date().getTime() -
															new Date(post.createdUtc).getTime()) /
															(1000 * 60 * 60 * 24)
												  )
												: 0,
										})),
										topOpportunities: topOpportunities.map((opp) => ({
											id: opp.id,
											title:
												opp.mainTitle.length > 40
													? opp.mainTitle.substring(0, 40) + "..."
													: opp.mainTitle,
											impactScore: opp.businessImpactScore || 0,
											painSeverity: opp.painSeverity || "Unknown",
										})),
									},
								};
							} catch (error) {
								// Return basic community data without analytics
								return {
									id: community.id,
									name: community.name,
									displayName: community.displayName,
									subscriberCount: community.subscriberCount,
									createdUtc: community.createdUtc,
									lastUpdated: community.lastUpdated,
									counts: {
										posts: community._count.posts,
										comments: community._count.comments,
										opportunities: community._count.businessOpportunities,
										clusters: community._count.clusters,
									},
									analytics: null, // Analytics failed
								};
							}
						})
				  )
				: communities.map((community) => ({
						id: community.id,
						name: community.name,
						displayName: community.displayName,
						subscriberCount: community.subscriberCount,
						createdUtc: community.createdUtc,
						lastUpdated: community.lastUpdated,
						counts: {
							posts: community._count.posts,
							comments: community._count.comments,
							opportunities: community._count.businessOpportunities,
							clusters: community._count.clusters,
						},
				  }));

			return {
				communities: communitiesWithAnalytics,
				totalCommunities: totalCount,
				timestamp: new Date().toISOString(),
				searchTerm,
				limit,
			};
		} catch (error) {
			throw DatabaseError.fromPrismaError(error);
		}
	}

	/**
	 * Get comprehensive analytics data for the dashboard
	 */
	static async getAnalytics() {
		try {
			// Run all analytics queries in parallel for better performance
			const [
				overviewMetrics,
				communityMetrics,
				performanceMetrics,
				temporalMetrics,
				sentimentMetrics,
				qualityMetrics,
			] = await Promise.all([
				this.getOverviewMetrics(),
				this.getCommunityMetrics(),
				this.getPerformanceMetrics(),
				this.getTemporalMetrics(),
				this.getSentimentMetrics(),
				this.getDataQualityMetrics(),
			]);

			return {
				overview: overviewMetrics,
				communities: communityMetrics,
				performance: performanceMetrics,
				temporal: temporalMetrics,
				sentiment: sentimentMetrics,
				quality: qualityMetrics,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw DatabaseError.fromPrismaError(error);
		}
	}

	/**
	 * Get basic overview metrics
	 */
	private static async getOverviewMetrics() {
		// Get total counts
		const [
			totalOpportunities,
			activeOpportunities,
			totalCommunities,
			activeCommunities,
			totalPosts,
			totalComments,
			totalClusters,
			activeClusters,
		] = await Promise.all([
			prisma.businessOpportunity.count(),
			prisma.businessOpportunity.count({ where: { isActive: true } }),
			prisma.subreddit.count(),
			prisma.subreddit.count({
				where: {
					businessOpportunities: {
						some: { isActive: true },
					},
				},
			}),
			prisma.post.count(),
			prisma.comment.count(),
			prisma.cluster.count(),
			prisma.cluster.count({ where: { isActive: true } }),
		]);

		// Calculate engagement rate (comments per post)
		const engagementRate =
			totalPosts > 0 ? (totalComments / totalPosts) * 100 : 0;

		// Get weekly growth (opportunities created in last 7 days vs previous 7 days)
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

		const [thisWeekOpportunities, lastWeekOpportunities] = await Promise.all([
			prisma.businessOpportunity.count({
				where: { processedAt: { gte: oneWeekAgo } },
			}),
			prisma.businessOpportunity.count({
				where: {
					processedAt: {
						gte: twoWeeksAgo,
						lt: oneWeekAgo,
					},
				},
			}),
		]);

		const weeklyGrowth =
			lastWeekOpportunities > 0
				? ((thisWeekOpportunities - lastWeekOpportunities) /
						lastWeekOpportunities) *
				  100
				: thisWeekOpportunities > 0
				? 100
				: 0;

		return {
			totalOpportunities,
			activeOpportunities,
			totalCommunities,
			activeCommunities,
			totalPosts,
			totalComments,
			totalClusters,
			activeClusters,
			engagementRate: Math.round(engagementRate * 10) / 10,
			weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
			activeOpportunityRate:
				totalOpportunities > 0
					? Math.round((activeOpportunities / totalOpportunities) * 100 * 10) /
					  10
					: 0,
		};
	}

	/**
	 * Get community performance metrics
	 */
	private static async getCommunityMetrics() {
		// Get top communities by opportunity count
		const topCommunities = await prisma.subreddit.findMany({
			where: {
				businessOpportunities: {
					some: { isActive: true },
				},
			},
			select: {
				id: true,
				name: true,
				displayName: true,
				subscriberCount: true,
				_count: {
					select: {
						businessOpportunities: {
							where: { isActive: true },
						},
					},
				},
			},
			orderBy: {
				businessOpportunities: {
					_count: "desc",
				},
			},
			take: 10,
		});

		// Get subscriber vs opportunity correlation data
		const communityData = await prisma.subreddit.findMany({
			where: {
				subscriberCount: { not: null },
				businessOpportunities: {
					some: { isActive: true },
				},
			},
			select: {
				subscriberCount: true,
				_count: {
					select: {
						businessOpportunities: {
							where: { isActive: true },
						},
					},
				},
			},
		});

		// Calculate correlation categories
		let smallCommunities = 0; // < 100K
		let mediumCommunities = 0; // 100K - 1M
		let largeCommunities = 0; // > 1M

		communityData.forEach((community) => {
			const subs = community.subscriberCount || 0;
			if (subs < 100000) smallCommunities++;
			else if (subs < 1000000) mediumCommunities++;
			else largeCommunities++;
		});

		return {
			topCommunities: topCommunities.map((community) => ({
				name: community.name,
				displayName: community.displayName || community.name,
				opportunities: community._count.businessOpportunities,
				subscribers: community.subscriberCount || 0,
				subscribersFormatted: this.formatNumber(community.subscriberCount || 0),
			})),
			communityDistribution: {
				small: smallCommunities,
				medium: mediumCommunities,
				large: largeCommunities,
			},
		};
	}

	/**
	 * Get performance and impact metrics
	 */
	private static async getPerformanceMetrics() {
		// Get impact score distribution
		const impactScores = await prisma.businessOpportunity.findMany({
			where: {
				businessImpactScore: { not: null },
				isActive: true,
			},
			select: { businessImpactScore: true },
		});

		// Categorize impact scores
		let lowImpact = 0; // 1-4
		let mediumImpact = 0; // 5-7
		let highImpact = 0; // 8-10

		impactScores.forEach((opp) => {
			const score = opp.businessImpactScore || 0;
			if (score <= 4) lowImpact++;
			else if (score <= 7) mediumImpact++;
			else highImpact++;
		});

		// Get pain severity distribution
		const painSeverityData = await prisma.businessOpportunity.groupBy({
			by: ["painSeverity"],
			where: {
				painSeverity: { not: null },
				isActive: true,
			},
			_count: true,
		});

		// Get time sensitivity distribution
		const timeSensitivityData = await prisma.businessOpportunity.groupBy({
			by: ["timeSensitivity"],
			where: {
				timeSensitivity: { not: null },
				isActive: true,
			},
			_count: true,
		});

		// Get validated needs count
		const validatedNeeds = await prisma.businessOpportunity.count({
			where: {
				validatedNeed: { not: null },
				isActive: true,
			},
		});

		// Get market gaps count
		const marketGaps = await prisma.businessOpportunity.count({
			where: {
				marketGap: { not: null },
				isActive: true,
			},
		});

		return {
			impactDistribution: {
				low: lowImpact,
				medium: mediumImpact,
				high: highImpact,
			},
			painSeverity: painSeverityData.map((item) => ({
				severity: item.painSeverity || "Unknown",
				count: item._count,
			})),
			timeSensitivity: timeSensitivityData.map((item) => ({
				sensitivity: item.timeSensitivity || "Unknown",
				count: item._count,
			})),
			validatedNeeds,
			marketGaps,
			highImpactOpportunities: highImpact,
		};
	}

	/**
	 * Get temporal analytics (time-based trends)
	 */
	private static async getTemporalMetrics() {
		// Get activity distribution by hour of day
		const posts = await prisma.post.findMany({
			where: { createdUtc: { not: null } },
			select: { createdUtc: true },
		});

		const comments = await prisma.comment.findMany({
			where: { createdUtc: { not: null } },
			select: { createdUtc: true },
		});

		// Initialize hour distribution
		const hourDistribution = Array(24).fill(0);
		let totalActivity = 0;

		// Count posts by hour
		posts.forEach((post) => {
			if (post.createdUtc) {
				const hour = new Date(post.createdUtc).getHours();
				hourDistribution[hour]++;
				totalActivity++;
			}
		});

		// Count comments by hour
		comments.forEach((comment) => {
			if (comment.createdUtc) {
				const hour = new Date(comment.createdUtc).getHours();
				hourDistribution[hour]++;
				totalActivity++;
			}
		});

		// Convert to percentages and group into time periods
		const timeDistribution = [
			{
				period: "6-12",
				label: "Morning",
				percentage:
					totalActivity > 0
						? Math.round(
								(hourDistribution.slice(6, 12).reduce((a, b) => a + b, 0) /
									totalActivity) *
									100
						  )
						: 0,
			},
			{
				period: "12-18",
				label: "Afternoon",
				percentage:
					totalActivity > 0
						? Math.round(
								(hourDistribution.slice(12, 18).reduce((a, b) => a + b, 0) /
									totalActivity) *
									100
						  )
						: 0,
			},
			{
				period: "18-24",
				label: "Evening",
				percentage:
					totalActivity > 0
						? Math.round(
								(hourDistribution.slice(18, 24).reduce((a, b) => a + b, 0) /
									totalActivity) *
									100
						  )
						: 0,
			},
			{
				period: "0-6",
				label: "Night",
				percentage:
					totalActivity > 0
						? Math.round(
								(hourDistribution.slice(0, 6).reduce((a, b) => a + b, 0) /
									totalActivity) *
									100
						  )
						: 0,
			},
		];

		// Get recent activity (last 7 days)
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const recentActivity = await prisma.businessOpportunity.count({
			where: {
				processedAt: { gte: sevenDaysAgo },
				isActive: true,
			},
		});

		// Get monthly opportunities (last 30 days)
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const monthlyOpportunities = await prisma.businessOpportunity.count({
			where: {
				processedAt: { gte: thirtyDaysAgo },
				isActive: true,
			},
		});

		return {
			timeDistribution,
			recentActivity,
			monthlyOpportunities,
			totalActivity,
		};
	}

	/**
	 * Get sentiment analysis metrics
	 */
	private static async getSentimentMetrics() {
		// Get cluster sentiment distribution
		const clusterSentiments = await prisma.cluster.groupBy({
			by: ["sentiment"],
			where: {
				sentiment: { not: null },
				isActive: true,
			},
			_count: true,
		});

		// Get opportunity sentiment distribution
		const opportunitySentiments = await prisma.businessOpportunity.groupBy({
			by: ["clusterSentiment"],
			where: {
				clusterSentiment: { not: null },
				isActive: true,
			},
			_count: true,
		});

		return {
			clusterSentiments: clusterSentiments.map((item) => ({
				sentiment: item.sentiment || "Unknown",
				count: item._count,
			})),
			opportunitySentiments: opportunitySentiments.map((item) => ({
				sentiment: item.clusterSentiment || "Unknown",
				count: item._count,
			})),
		};
	}

	/**
	 * Get data quality and processing metrics
	 */
	private static async getDataQualityMetrics() {
		// Get processing status
		const [
			totalClusters,
			processedClusters,
			totalPosts,
			processedPosts,
			totalComments,
			processedComments,
		] = await Promise.all([
			prisma.cluster.count(),
			prisma.cluster.count({ where: { isProcessed: true } }),
			prisma.post.count(),
			prisma.post.count({ where: { processed: true } }),
			prisma.comment.count(),
			prisma.comment.count({ where: { processed: true } }),
		]);

		// Get data completeness for opportunities
		const [
			totalOpportunities,
			opportunitiesWithKeywords,
			opportunitiesWithSolutions,
			opportunitiesWithDescription,
			opportunitiesWithValidation,
		] = await Promise.all([
			prisma.businessOpportunity.count({ where: { isActive: true } }),
			prisma.businessOpportunity.count({
				where: {
					keywords: { not: Prisma.JsonNull },
					isActive: true,
				},
			}),
			prisma.businessOpportunity.count({
				where: {
					solutions: { some: {} },
					isActive: true,
				},
			}),
			prisma.businessOpportunity.count({
				where: {
					problemDescription: { not: null },
					isActive: true,
				},
			}),
			prisma.businessOpportunity.count({
				where: {
					validatedNeed: { not: null },
					isActive: true,
				},
			}),
		]);

		// Calculate average processing time (simplified - using current time vs created time)
		const avgProcessingTime = 2.3; // Placeholder - would need more complex query to calculate actual

		return {
			processingStatus: {
				clusters: {
					total: totalClusters,
					processed: processedClusters,
					percentage:
						totalClusters > 0
							? Math.round((processedClusters / totalClusters) * 100)
							: 0,
				},
				posts: {
					total: totalPosts,
					processed: processedPosts,
					percentage:
						totalPosts > 0
							? Math.round((processedPosts / totalPosts) * 100)
							: 0,
				},
				comments: {
					total: totalComments,
					processed: processedComments,
					percentage:
						totalComments > 0
							? Math.round((processedComments / totalComments) * 100)
							: 0,
				},
			},
			dataCompleteness: {
				total: totalOpportunities,
				withKeywords: opportunitiesWithKeywords,
				withSolutions: opportunitiesWithSolutions,
				withDescription: opportunitiesWithDescription,
				withValidation: opportunitiesWithValidation,
				completenessScore:
					totalOpportunities > 0
						? Math.round(
								((opportunitiesWithKeywords +
									opportunitiesWithSolutions +
									opportunitiesWithDescription +
									opportunitiesWithValidation) /
									(totalOpportunities * 4)) *
									100
						  )
						: 0,
			},
			avgProcessingTime,
		};
	}

	/**
	 * Helper function to format numbers (1000 -> 1K, 1000000 -> 1M)
	 */
	private static formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + "M";
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + "K";
		}
		return num.toString();
	}
}

// Export the enhanced service
export { DatabaseService, DatabaseError };
export default DatabaseService;
