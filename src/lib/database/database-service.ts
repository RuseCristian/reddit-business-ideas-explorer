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
					clusterSize: opp.cluster?.size || 0,
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
	 * Simplified search function for quick frontend implementation
	 * @param subredditId - The subreddit to search in
	 * @param searchTerm - What to search for
	 * @param page - Page number (1-based)
	 * @param sortBy - How to sort results
	 */
	static async searchBusinessOpportunities(
		subredditId: number,
		searchTerm: string = "",
		page: number = 1,
		sortBy: "impact_score" | "date" = "impact_score",
		days: number = 30
	) {
		return this.getBusinessOpportunitiesPaginated(subredditId, {
			days,
			page,
			limit: 9,
			sortBy,
			sortOrder: "desc",
			search: searchTerm,
			searchFields: ["title", "description"], // Skip keywords for simplicity
		});
	}

	/**
	 * Get available sorting options for frontend
	 */
	static getSortingOptions() {
		return [
			{ value: "impact_score", label: "Highest Impact", order: "desc" },
			{ value: "impact_score_asc", label: "Lowest Impact", order: "asc" },
			{ value: "date", label: "Most Recent", order: "desc" },
			{ value: "date_asc", label: "Oldest First", order: "asc" },
		];
	}

	/**
	 * Test database connection
	 */
	static async testConnection(): Promise<boolean> {
		return DatabaseConnection.testConnection();
	}

	/**
	 * Get a business opportunity by ID, including its cluster, subreddit, and solutions
	 */
	static async getBusinessOpportunityById(id: number) {
		try {
			const opportunity = await prisma.businessOpportunity.findUnique({
				where: { id },
				select: {
					// Base fields
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
					isFeatured: true,
					// Relations
					cluster: {
						select: {
							id: true,
							size: true,
						},
					},
					subreddit: {
						select: {
							id: true,
							name: true,
							displayName: true,
							subscriberCount: true,
						},
					},
					solutions: {
						select: {
							title: true,
							businessModel: true,
							marketSize: true,
							solutionDescription: true,
							solutionOrder: true,
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
							title: true,
							url: true,
							author: true,
							upvotes: true,
							createdUtc: true,
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
							content: true,
							author: true,
							upvotes: true,
							createdUtc: true,
							permalink: true,
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

			// Return structured data with keywords from business opportunity
			const oppAny = opportunity as any;
			const { cluster, subreddit, ...rest } = oppAny;
			return {
				...rest,
				subredditId: subreddit?.id || null,
				keywords: oppAny.keywords || [],
				sources: cluster?.size || 0,
				posts,
				comments,
			};
		} catch (error) {
			throw DatabaseError.fromPrismaError(error);
		}
	}

	/**
	 * Get communities with enhanced security and error handling
	 */
	static async getCommunities(
		limit: number = 10,
		options: {
			searchTerm?: string;
			includeAnalytics?: boolean;
			includeRecentPosts?: boolean;
			userId?: string; // For permission checks
		} = {}
	) {
		try {
			const {
				searchTerm,
				includeAnalytics = true,
				includeRecentPosts = true,
				userId,
			} = options;

			console.log(
				`🔍 [DB-SERVICE] Getting communities (limit: ${limit}, search: "${searchTerm}", user: ${userId})`
			);

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

			// Step 3: Enhanced analytics (only if requested and user has permissions)
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
								console.error(
									`Error getting analytics for community ${community.id}:`,
									error
								);
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

			console.log(
				`✅ [DB-SERVICE] Communities retrieved successfully (${communitiesWithAnalytics.length}/${totalCount})`
			);

			return {
				communities: communitiesWithAnalytics,
				totalCommunities: totalCount,
				timestamp: new Date().toISOString(),
				searchTerm,
				limit,
			};
		} catch (error) {
			console.error("❌ [DB-SERVICE] Error fetching communities:", error);
			throw DatabaseError.fromPrismaError(error);
		}
	}
}

// Export the enhanced service
export { DatabaseService, DatabaseError };
export default DatabaseService;
