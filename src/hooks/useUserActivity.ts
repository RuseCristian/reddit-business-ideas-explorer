import { useCallback } from "react";

interface ActivityData {
	activityType: "viewed_opportunity" | "searched" | "viewed_community";
	resourceId?: number;
	resourceType?: "opportunity" | "community" | "search_query";
	metadata?: Record<string, any>;
}

export const useActivityTracker = () => {
	const trackActivity = useCallback(async (data: ActivityData) => {
		try {
			const response = await fetch("/api/user/track-activity", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				console.warn("Activity tracking failed:", response.status);
			}
		} catch (error) {
			console.warn("Activity tracking error:", error);
			// Don't throw - activity tracking shouldn't break the app
		}
	}, []);

	const trackOpportunityView = useCallback(
		(opportunityId: number, source = "unknown") => {
			trackActivity({
				activityType: "viewed_opportunity",
				resourceId: opportunityId,
				resourceType: "opportunity",
				metadata: {
					source,
					timestamp: Date.now(),
				},
			});
		},
		[trackActivity]
	);

	const trackCommunityView = useCallback(
		(communityId: number, source = "unknown") => {
			trackActivity({
				activityType: "viewed_community",
				resourceId: communityId,
				resourceType: "community",
				metadata: {
					source,
					timestamp: Date.now(),
				},
			});
		},
		[trackActivity]
	);

	const trackSearch = useCallback(
		(searchTerm: string, filters: Record<string, any> = {}) => {
			trackActivity({
				activityType: "searched",
				resourceType: "search_query",
				metadata: {
					searchTerm,
					filters,
					timestamp: Date.now(),
				},
			});
		},
		[trackActivity]
	);

	return {
		trackActivity,
		trackOpportunityView,
		trackCommunityView,
		trackSearch,
	};
};

// Hook for bookmark management
export const useBookmarks = () => {
	const addBookmark = useCallback(
		async (opportunityId: number): Promise<boolean> => {
			try {
				const response = await fetch("/api/user/bookmarks", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ opportunityId }),
				});

				if (response.ok) {
					const data = await response.json();
					return data.success;
				}
				return false;
			} catch (error) {
				console.error("Failed to add bookmark:", error);
				return false;
			}
		},
		[]
	);

	const removeBookmark = useCallback(
		async (opportunityId: number): Promise<boolean> => {
			try {
				const response = await fetch(
					`/api/user/bookmarks?opportunityId=${opportunityId}`,
					{
						method: "DELETE",
					}
				);

				if (response.ok) {
					const data = await response.json();
					return data.success;
				}
				return false;
			} catch (error) {
				console.error("Failed to remove bookmark:", error);
				return false;
			}
		},
		[]
	);

	const isBookmarked = useCallback(
		async (opportunityId: number): Promise<boolean> => {
			try {
				const response = await fetch(
					`/api/user/bookmarks?opportunityId=${opportunityId}`
				);

				if (response.ok) {
					const data = await response.json();
					return data.data?.isBookmarked || false;
				}
				return false;
			} catch (error) {
				console.error("Failed to check bookmark status:", error);
				return false;
			}
		},
		[]
	);

	const toggleBookmark = useCallback(
		async (opportunityId: number): Promise<boolean> => {
			const bookmarked = await isBookmarked(opportunityId);
			if (bookmarked) {
				return await removeBookmark(opportunityId);
			} else {
				return await addBookmark(opportunityId);
			}
		},
		[isBookmarked, addBookmark, removeBookmark]
	);

	return {
		addBookmark,
		removeBookmark,
		isBookmarked,
		toggleBookmark,
	};
};
