import { prisma } from "./client";
import { Prisma } from "@prisma/client";

export interface UserActivityData {
	userId: string;
	activityType: "viewed_opportunity" | "searched" | "viewed_community";
	resourceId?: number;
	resourceType?: "opportunity" | "community" | "search_query";
	metadata?: Record<string, any>;
}

export interface RecentActivity {
	id: number;
	title: string;
	description: string;
	subreddit: string;
	impactScore: number;
	timeText: string;
	viewedAt: Date;
}

export interface BookmarkedOpportunity {
	id: number;
	title: string;
	description: string;
	subreddit: string;
	impactScore: number;
	timeText: string;
	savedAt: Date;
}

export class UserActivityService {
	/**
	 * Track user activity
	 */
	static async trackActivity(data: UserActivityData) {
		try {
			// For opportunity views, check if we already have this activity and update timestamp
			if (data.activityType === "viewed_opportunity" && data.resourceId) {
				const existingActivity = await prisma.userActivity.findFirst({
					where: {
						userId: data.userId,
						activityType: data.activityType,
						resourceId: data.resourceId,
						resourceType: data.resourceType,
					},
				});

				if (existingActivity) {
					// Update existing activity timestamp
					await prisma.userActivity.update({
						where: { id: existingActivity.id },
						data: {
							createdAt: new Date(), // Update to current time
							metadata: data.metadata || {},
						},
					});
					return;
				}
			}

			// Create new activity if it doesn't exist
			await prisma.userActivity.create({
				data: {
					userId: data.userId,
					activityType: data.activityType,
					resourceId: data.resourceId,
					resourceType: data.resourceType,
					metadata: data.metadata || {},
				},
			});
		} catch (error) {
			console.error("Failed to track user activity:", error);
			// Don't throw - activity tracking shouldn't break the app
		}
	}

	/**
	 * Get user's recently viewed opportunities
	 */
	static async getRecentlyViewed(
		userId: string,
		limit: number = 5,
		daysBack: number = 2 // Default to last 2 days only
	): Promise<RecentActivity[]> {
		try {
			// Calculate the cutoff date for "recent" activities
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysBack);

			const activities = await prisma.userActivity.findMany({
				where: {
					userId,
					activityType: "viewed_opportunity",
					resourceType: "opportunity",
					createdAt: {
						gte: cutoffDate, // Only activities within the time window
					},
				},
				orderBy: { createdAt: "desc" },
				take: limit,
				distinct: ["resourceId"], // Only get unique opportunities
			});

			// Get the opportunity details for each activity
			const opportunityIds = activities
				.map((a) => a.resourceId)
				.filter((id): id is number => id !== null);

			if (opportunityIds.length === 0) return [];

			const opportunities = await prisma.businessOpportunity.findMany({
				where: {
					id: { in: opportunityIds },
					isActive: true,
				},
				include: {
					subreddit: true,
				},
			});

			// Map activities to opportunities and format
			const result: RecentActivity[] = [];
			for (const activity of activities) {
				const opportunity = opportunities.find(
					(op) => op.id === activity.resourceId
				);
				if (opportunity) {
					result.push({
						id: opportunity.id,
						title: opportunity.mainTitle,
						description:
							opportunity.problemDescription || "No description available",
						subreddit: `r/${opportunity.subreddit?.name || "unknown"}`,
						impactScore: (opportunity.businessImpactScore || 0) / 10, // Convert to decimal
						timeText: this.formatTimeAgo(activity.createdAt),
						viewedAt: activity.createdAt,
					});
				}
			}

			return result;
		} catch (error) {
			console.error("Failed to get recently viewed:", error);
			return [];
		}
	}

	/**
	 * Get user's bookmarked opportunities
	 */
	static async getBookmarkedOpportunities(
		userId: string,
		limit: number = 5
	): Promise<BookmarkedOpportunity[]> {
		try {
			const bookmarks = await prisma.userBookmark.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: limit,
				include: {
					opportunity: {
						include: {
							subreddit: true,
						},
					},
				},
			});

			return bookmarks.map((bookmark) => ({
				id: bookmark.opportunity.id,
				title: bookmark.opportunity.mainTitle,
				description:
					bookmark.opportunity.problemDescription || "No description available",
				subreddit: `r/${bookmark.opportunity.subreddit?.name || "unknown"}`,
				impactScore: (bookmark.opportunity.businessImpactScore || 0) / 10,
				timeText: `Saved ${this.formatTimeAgo(bookmark.createdAt)}`,
				savedAt: bookmark.createdAt,
			}));
		} catch (error) {
			console.error("Failed to get bookmarked opportunities:", error);
			return [];
		}
	}

	/**
	 * Add bookmark for user
	 */
	static async addBookmark(userId: string, opportunityId: number) {
		try {
			await prisma.userBookmark.create({
				data: {
					userId,
					opportunityId,
				},
			});
			return true;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					// Unique constraint violation - already bookmarked
					return false;
				}
			}
			console.error("Failed to add bookmark:", error);
			return false;
		}
	}

	/**
	 * Remove bookmark for user
	 */
	static async removeBookmark(userId: string, opportunityId: number) {
		try {
			await prisma.userBookmark.delete({
				where: {
					userId_opportunityId: {
						userId,
						opportunityId,
					},
				},
			});
			return true;
		} catch (error) {
			console.error("Failed to remove bookmark:", error);
			return false;
		}
	}

	/**
	 * Check if user has bookmarked an opportunity
	 */
	static async isBookmarked(
		userId: string,
		opportunityId: number
	): Promise<boolean> {
		try {
			const bookmark = await prisma.userBookmark.findUnique({
				where: {
					userId_opportunityId: {
						userId,
						opportunityId,
					},
				},
			});
			return bookmark !== null;
		} catch (error) {
			console.error("Failed to check bookmark status:", error);
			return false;
		}
	}

	/**
	 * Format time ago text
	 */
	private static formatTimeAgo(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const diffWeeks = Math.floor(diffDays / 7);

		if (diffMinutes < 60) {
			return `${diffMinutes} minutes ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hours ago`;
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return `${diffWeeks} weeks ago`;
		}
	}

	/**
	 * Get total count of recently viewed opportunities
	 */
	static async getRecentlyViewedCount(
		userId: string,
		daysBack: number = 2 // Default to last 2 days only
	): Promise<number> {
		try {
			// Calculate the cutoff date for "recent" activities
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysBack);

			const count = await prisma.userActivity.count({
				where: {
					userId,
					activityType: "viewed_opportunity",
					resourceType: "opportunity",
					createdAt: {
						gte: cutoffDate, // Only count activities within the time window
					},
				},
			});
			return count;
		} catch (error) {
			console.error("Failed to get recently viewed count:", error);
			return 0;
		}
	}

	/**
	 * Get total count of bookmarked opportunities
	 */
	static async getBookmarkedCount(userId: string): Promise<number> {
		try {
			const count = await prisma.userBookmark.count({
				where: { userId },
			});
			return count;
		} catch (error) {
			console.error("Failed to get bookmarked count:", error);
			return 0;
		}
	}

	/**
	 * Get user activity summary for dashboard
	 */
	static async getUserDashboardData(
		userId: string,
		recentDaysBack: number = 2
	) {
		const [
			recentlyViewed,
			bookmarkedOpportunities,
			recentlyViewedCount,
			bookmarkedCount,
		] = await Promise.all([
			this.getRecentlyViewed(userId, 5, recentDaysBack),
			this.getBookmarkedOpportunities(userId, 5),
			this.getRecentlyViewedCount(userId, recentDaysBack),
			this.getBookmarkedCount(userId),
		]);

		return {
			recentlyViewed,
			bookmarkedOpportunities,
			counts: {
				recentlyViewed: recentlyViewedCount,
				bookmarked: bookmarkedCount,
			},
			timeWindow: {
				recentDaysBack,
				description: `Last ${recentDaysBack} days`,
			},
		};
	}

	/**
	 * Get recently viewed with different time windows for analytics
	 */
	static async getRecentlyViewedByTimeWindow(userId: string) {
		const [last7Days, last30Days, last90Days] = await Promise.all([
			this.getRecentlyViewedCount(userId, 7),
			this.getRecentlyViewedCount(userId, 30),
			this.getRecentlyViewedCount(userId, 90),
		]);

		return {
			last7Days,
			last30Days,
			last90Days,
			breakdown: {
				thisWeek: last7Days,
				thisMonth: last30Days - last7Days,
				older: last90Days - last30Days,
			},
		};
	}

	/**
	 * Clean up old activity data (for maintenance)
	 */
	static async getActivityHistory(
		userId: string,
		options: {
			limit?: number;
			offset?: number;
			includeOpportunityDetails?: boolean;
		} = {}
	) {
		try {
			const {
				limit = 50,
				offset = 0,
				includeOpportunityDetails = false,
			} = options;

			const activities = await prisma.userActivity.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
			});

			if (includeOpportunityDetails) {
				// Get unique opportunity IDs
				const opportunityIds = [
					...new Set(
						activities
							.filter((a) => a.resourceType === "opportunity" && a.resourceId)
							.map((a) => a.resourceId!)
					),
				];

				// Fetch opportunity details
				const opportunities = await prisma.businessOpportunity.findMany({
					where: {
						id: { in: opportunityIds },
					},
					select: {
						id: true,
						mainTitle: true,
						problemDescription: true,
						businessImpactScore: true,
						subreddit: {
							select: {
								name: true,
							},
						},
					},
				});

				// Create lookup map
				const opportunityMap = new Map(
					opportunities.map((opp) => [opp.id, opp])
				);

				// Merge data
				return activities.map((activity) => {
					const opportunity = activity.resourceId
						? opportunityMap.get(activity.resourceId)
						: null;

					return {
						id: activity.id,
						activityType: activity.activityType,
						timestamp: activity.createdAt,
						metadata: activity.metadata as Record<string, any>,
						opportunityId: activity.resourceId,
						title: opportunity?.mainTitle,
						description: opportunity?.problemDescription,
						subreddit: opportunity?.subreddit?.name,
						impactScore: opportunity?.businessImpactScore,
					};
				});
			} else {
				return activities.map((activity) => ({
					id: activity.id,
					activityType: activity.activityType,
					timestamp: activity.createdAt,
					metadata: activity.metadata as Record<string, any>,
					opportunityId: activity.resourceId,
				}));
			}
		} catch (error) {
			console.error("Failed to fetch activity history:", error);
			return [];
		}
	}

	static async getActivityCount(userId: string): Promise<number> {
		try {
			return await prisma.userActivity.count({
				where: { userId },
			});
		} catch (error) {
			console.error("Failed to get activity count:", error);
			return 0;
		}
	}

	static async clearUserActivity(userId: string) {
		try {
			const result = await prisma.userActivity.deleteMany({
				where: { userId },
			});

			return {
				deletedCount: result.count,
			};
		} catch (error) {
			console.error("Failed to clear user activity:", error);
			throw error;
		}
	}

	static async cleanupOldActivities(daysToKeep: number = 365) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			const result = await prisma.userActivity.deleteMany({
				where: {
					createdAt: {
						lt: cutoffDate,
					},
				},
			});

			return {
				deletedCount: result.count,
				cutoffDate: cutoffDate.toISOString(),
			};
		} catch (error) {
			console.error("Failed to cleanup old activities:", error);
			return { deletedCount: 0, error: error };
		}
	}
}
