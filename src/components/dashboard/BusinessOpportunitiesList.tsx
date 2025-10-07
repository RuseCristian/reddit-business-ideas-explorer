import React, { useState, useEffect } from "react";

interface BusinessOpportunity {
	id: number;
	title: string;
	description: string;
	score: number;
	date: string;
	keywords: string[];
	source: {
		subreddit: string;
		displayName: string;
		sourceCount: number;
	};
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalCount: number;
	limit: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

interface FilterOptions {
	subredditId: number;
	days: number;
	sortBy: string;
	sortOrder: string;
	search: string | null;
	searchFields: string[];
}

interface ApiResponse {
	success: boolean;
	data: BusinessOpportunity[];
	pagination: PaginationInfo;
	filters: FilterOptions;
	meta: {
		timestamp: string;
		requestedBy: string;
		securityLevel: string;
		endpoint: string;
	};
}

interface Subreddit {
	id: number;
	name: string;
	displayName: string;
	subscriberCount: number;
	subscriberCountFormatted: string;
	opportunityCount: number;
	totalPosts: number;
	totalComments: number;
}

interface SubredditsResponse {
	success: boolean;
	data: Subreddit[];
	totalCount: number;
	meta: {
		timestamp: string;
		requestedBy: string;
		securityLevel: string;
		endpoint: string;
	};
}

export default function BusinessOpportunitiesList() {
	const [opportunities, setOpportunities] = useState<BusinessOpportunity[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [filters, setFilters] = useState<FilterOptions | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
	const [loadingSubreddits, setLoadingSubreddits] = useState(true);
	const [bookmarkStates, setBookmarkStates] = useState<Record<number, boolean>>(
		{}
	);
	const [bookmarkLoading, setBookmarkLoading] = useState<
		Record<number, boolean>
	>({});

	// Filter state
	const [selectedSubredditId, setSelectedSubredditId] = useState<number>(0);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("impact_score");
	const [sortOrder, setSortOrder] = useState("desc");
	const [days, setDays] = useState(30);
	const [currentPage, setCurrentPage] = useState(1);

	// Fetch subreddits for the dropdown
	useEffect(() => {
		const fetchSubreddits = async () => {
			try {
				setLoadingSubreddits(true);
				const response = await fetch("/api/database/subreddits?limit=100");
				const data: SubredditsResponse = await response.json();

				if (data.success && data.data.length > 0) {
					setSubreddits(data.data);
					// Set first subreddit as default if none selected
					if (!selectedSubredditId) {
						setSelectedSubredditId(data.data[0].id);
					}
				}
			} catch (err) {
				setError("Failed to load subreddits");
			} finally {
				setLoadingSubreddits(false);
			}
		};

		fetchSubreddits();
	}, []);

	// Fetch opportunities when filters change
	useEffect(() => {
		if (selectedSubredditId) {
			fetchOpportunities();
		}
	}, [selectedSubredditId, searchTerm, sortBy, sortOrder, days, currentPage]);

	// Load bookmark states when opportunities change
	useEffect(() => {
		if (opportunities.length > 0) {
			loadBookmarkStates();
		}
	}, [opportunities]);

	const loadBookmarkStates = async () => {
		try {
			const bookmarkPromises = opportunities.map(async (opp) => {
				const response = await fetch(
					`/api/user/bookmarks?opportunityId=${opp.id}`
				);
				if (response.ok) {
					const data = await response.json();
					return { id: opp.id, isBookmarked: data.data?.isBookmarked || false };
				}
				return { id: opp.id, isBookmarked: false };
			});

			const bookmarkResults = await Promise.all(bookmarkPromises);
			const newBookmarkStates: Record<number, boolean> = {};
			bookmarkResults.forEach((result) => {
				newBookmarkStates[result.id] = result.isBookmarked;
			});
			setBookmarkStates(newBookmarkStates);
		} catch (error) {
			console.error("Failed to load bookmark states:", error);
		}
	};

	const fetchOpportunities = async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				subredditId: selectedSubredditId.toString(),
				page: currentPage.toString(),
				limit: "9",
				days: days.toString(),
				sortBy,
				sortOrder,
			});

			if (searchTerm.trim()) {
				params.append("search", searchTerm.trim());
			}

			const response = await fetch(
				`/api/database/opportunities-list?${params}`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: ApiResponse = await response.json();

			if (data.success) {
				setOpportunities(data.data);
				setPagination(data.pagination);
				setFilters(data.filters);
			} else {
				throw new Error("API returned success: false");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch opportunities"
			);
			setOpportunities([]);
			setPagination(null);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		setCurrentPage(1); // Reset to first page when searching
		fetchOpportunities();
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const toggleBookmark = async (
		opportunityId: number,
		event: React.MouseEvent
	) => {
		event.stopPropagation(); // Prevent card click when clicking bookmark

		// Set loading state
		setBookmarkLoading((prev) => ({ ...prev, [opportunityId]: true }));

		try {
			const isCurrentlyBookmarked = bookmarkStates[opportunityId] || false;

			if (isCurrentlyBookmarked) {
				// Remove bookmark
				const response = await fetch(
					`/api/user/bookmarks?opportunityId=${opportunityId}`,
					{
						method: "DELETE",
					}
				);

				if (response.ok) {
					setBookmarkStates((prev) => ({ ...prev, [opportunityId]: false }));

					// Track activity
					await fetch("/api/user/track-activity", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							activityType: "unsaved_opportunity",
							resourceId: opportunityId,
							resourceType: "opportunity",
							metadata: { source: "search_page" },
						}),
					});
				}
			} else {
				// Add bookmark
				const response = await fetch("/api/user/bookmarks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ opportunityId }),
				});

				if (response.ok) {
					setBookmarkStates((prev) => ({ ...prev, [opportunityId]: true }));

					// Track activity
					await fetch("/api/user/track-activity", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							activityType: "saved_opportunity",
							resourceId: opportunityId,
							resourceType: "opportunity",
							metadata: { source: "search_page" },
						}),
					});
				}
			}
		} catch (error) {
			console.error("Failed to toggle bookmark:", error);
		} finally {
			setBookmarkLoading((prev) => ({ ...prev, [opportunityId]: false }));
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatSubscriberCount = (count: number) => {
		if (count >= 1000000) {
			return `${(count / 1000000).toFixed(1)}M`;
		}
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}K`;
		}
		return count.toString();
	};

	// Render subreddit icon with fallback logic (similar to CommunitiesList)
	const renderSubredditIcon = (subredditName: string) => {
		return (
			<img
				src={`/assets/subreddit_icons/${subredditName.toLowerCase()}.png`}
				alt={`r/${subredditName} icon`}
				className="subreddit-icon"
				onError={(e) => {
					const target = e.target as HTMLImageElement;
					// Try JPG if PNG fails
					if (target.src.endsWith(".png")) {
						target.src = `/assets/subreddit_icons/${subredditName.toLowerCase()}.jpg`;
					} else {
						// Fallback to SVG default
						target.src = "/assets/placeholder.svg";
					}
				}}
			/>
		);
	};

	const formatScore = (score: number): string => {
		return score.toFixed(1);
	};

	const getSelectedSubreddit = () => {
		return subreddits.find((s) => s.id === selectedSubredditId);
	};

	const generatePageNumbers = () => {
		if (!pagination) return [];

		const { currentPage, totalPages } = pagination;
		const pages = [];
		const showPages = 5; // Show 5 page numbers max

		let start = Math.max(1, currentPage - Math.floor(showPages / 2));
		let end = Math.min(totalPages, start + showPages - 1);

		// Adjust start if we're at the end
		if (end - start < showPages - 1) {
			start = Math.max(1, end - showPages + 1);
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		return pages;
	};

	const selectedSubreddit = getSelectedSubreddit();

	if (loadingSubreddits) {
		return (
			<div className="opportunities-page">
				<div className="loading-state">
					<div className="loading-spinner"></div>
					<h3>Loading Subreddits</h3>
					<p>Fetching available subreddits...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="opportunities-page">
			{/* Filters Section */}
			<div className="filters-section">
				<div className="filters-grid">
					<div className="filter-group">
						<label className="filter-label">Search Opportunities</label>
						<input
							type="text"
							className="filter-input"
							placeholder="Search by title, description, or keywords..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && handleSearch()}
						/>
					</div>

					<div className="filter-group">
						<label className="filter-label">Subreddit</label>
						<select
							className="filter-select"
							value={selectedSubredditId}
							onChange={(e) => setSelectedSubredditId(parseInt(e.target.value))}
							disabled={subreddits.length === 0}
						>
							{subreddits.map((subreddit) => (
								<option key={subreddit.id} value={subreddit.id}>
									r/{subreddit.name} ({subreddit.subscriberCountFormatted} •{" "}
									{subreddit.opportunityCount} opportunities)
								</option>
							))}
						</select>
					</div>

					<div className="filter-group">
						<label className="filter-label">Time Period</label>
						<select
							className="filter-select"
							value={days}
							onChange={(e) => setDays(parseInt(e.target.value))}
						>
							<option value={7}>Last 7 days</option>
							<option value={30}>Last 30 days</option>
							<option value={90}>Last 90 days</option>
							<option value={365}>Last year</option>
						</select>
					</div>

					<div className="filter-group">
						<label className="filter-label">Sort By</label>
						<select
							className="filter-select"
							value={`${sortBy}_${sortOrder}`}
							onChange={(e) => {
								const [newSortBy, newSortOrder] = e.target.value.split("_");
								setSortBy(newSortBy);
								setSortOrder(newSortOrder);
							}}
						>
							<option value="impact_score_desc">Highest Impact</option>
							<option value="impact_score_asc">Lowest Impact</option>
							<option value="date_desc">Most Recent</option>
							<option value="date_asc">Oldest First</option>
						</select>
					</div>

					<button
						className="filter-button"
						onClick={handleSearch}
						disabled={loading}
					>
						🔍 Search
					</button>
				</div>
			</div>

			{/* Results Section */}
			<div className="results-section">
				<div className="results-header">
					<h2 className="results-title">
						{selectedSubreddit ? (
							<div className="subreddit-header">
								{renderSubredditIcon(selectedSubreddit.name)}
								<span>r/{selectedSubreddit.name}</span>
							</div>
						) : (
							"Business Opportunities"
						)}
					</h2>
					<div className="results-meta">
						{pagination && (
							<span className="results-count">
								Showing {(pagination.currentPage - 1) * pagination.limit + 1}-
								{Math.min(
									pagination.currentPage * pagination.limit,
									pagination.totalCount
								)}{" "}
								of {pagination.totalCount} opportunities
							</span>
						)}
						<div className="current-filters">
							{searchTerm && (
								<span className="filter-tag">Search: "{searchTerm}"</span>
							)}
							<span className="filter-tag">Last {days} days</span>
							<span className="filter-tag">
								{sortBy === "impact_score" ? "Impact" : "Date"} (
								{sortOrder === "desc" ? "High to Low" : "Low to High"})
							</span>
						</div>
					</div>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="loading-state">
						<div className="loading-spinner"></div>
						<h3>Loading Opportunities</h3>
						<p>Fetching business opportunities...</p>
					</div>
				)}

				{/* Error State */}
				{error && !loading && (
					<div className="error-state">
						<h3>Error Loading Opportunities</h3>
						<p>{error}</p>
						<button className="filter-button" onClick={fetchOpportunities}>
							Try Again
						</button>
					</div>
				)}

				{/* Empty State */}
				{!loading && !error && opportunities.length === 0 && (
					<div className="empty-state">
						<div className="empty-icon">📭</div>
						<h3>No Opportunities Found</h3>
						<p>
							{searchTerm
								? `No opportunities match your search "${searchTerm}". Try different keywords or filters.`
								: "No opportunities found for the selected filters. Try adjusting your search criteria."}
						</p>
					</div>
				)}

				{/* Opportunities Grid */}
				{!loading && !error && opportunities.length > 0 && (
					<div className="opportunities-grid">
						{opportunities.map((opportunity) => (
							<div
								key={opportunity.id}
								className="opportunity-card"
								onClick={() => {
									// Track activity before navigating
									fetch("/api/user/track-activity", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											activityType: "viewed_opportunity",
											resourceId: opportunity.id,
											resourceType: "opportunity",
											metadata: { source: "search_page" },
										}),
									}).catch(console.error);

									window.open(
										`/dashboard/business-opportunity/${opportunity.id}`,
										"_blank"
									);
								}}
							>
								<div className="opportunity-header">
									<h3 className="opportunity-title">{opportunity.title}</h3>
									<div className="opportunity-header-actions">
										<button
											className={`bookmark-button ${
												bookmarkStates[opportunity.id] ? "bookmarked" : ""
											}`}
											onClick={(e) => toggleBookmark(opportunity.id, e)}
											disabled={bookmarkLoading[opportunity.id]}
											title={
												bookmarkStates[opportunity.id]
													? "Remove from saved"
													: "Save opportunity"
											}
										>
											{bookmarkLoading[opportunity.id] ? (
												<span className="bookmark-loading">⏳</span>
											) : bookmarkStates[opportunity.id] ? (
												<span className="bookmark-filled">💾</span>
											) : (
												<span className="bookmark-empty">🔖</span>
											)}
										</button>
										<div className="opportunity-score">
											{formatScore(opportunity.score)}
										</div>
									</div>
								</div>

								<p className="opportunity-description">
									{opportunity.description}
								</p>

								<div className="opportunity-meta">
									<span className="meta-badge">
										<span className="meta-icon">📅</span>
										{formatDate(opportunity.date)}
									</span>
									<span className="meta-badge">
										<span className="meta-icon">📊</span>
										Sources: {opportunity.source.sourceCount}
									</span>
								</div>

								{opportunity.keywords.length > 0 && (
									<div className="opportunity-keywords">
										{opportunity.keywords.slice(0, 4).map((keyword, index) => (
											<span key={index} className="keyword-tag">
												{keyword}
											</span>
										))}
										{opportunity.keywords.length > 4 && (
											<span className="keyword-tag">
												+{opportunity.keywords.length - 4} more
											</span>
										)}
									</div>
								)}

								<div className="opportunity-footer">
									<div className="source-info">
										{renderSubredditIcon(opportunity.source.subreddit)}
										<span className="subreddit-name">
											r/{opportunity.source.subreddit}
										</span>
									</div>
									<a
										href={`/dashboard/business-opportunity/${opportunity.id}`}
										className="view-button"
										target="_blank"
										rel="noopener noreferrer"
										onClick={(e) => {
											e.stopPropagation();
											// Track activity
											fetch("/api/user/track-activity", {
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({
													activityType: "viewed_opportunity",
													resourceId: opportunity.id,
													resourceType: "opportunity",
													metadata: { source: "search_page_button" },
												}),
											}).catch(console.error);
										}}
									>
										View Details →
									</a>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && !loading && (
				<div className="pagination-section">
					<div className="pagination-info">
						Page {pagination.currentPage} of {pagination.totalPages} •{" "}
						{pagination.totalCount} total opportunities
					</div>

					<div className="pagination-controls">
						<button
							className="pagination-button"
							onClick={() => handlePageChange(1)}
							disabled={!pagination.hasPrevPage}
						>
							««
						</button>

						<button
							className="pagination-button"
							onClick={() => handlePageChange(pagination.currentPage - 1)}
							disabled={!pagination.hasPrevPage}
						>
							‹ Prev
						</button>

						{generatePageNumbers().map((pageNum) => (
							<button
								key={pageNum}
								className={`pagination-button ${
									pageNum === pagination.currentPage ? "active" : ""
								}`}
								onClick={() => handlePageChange(pageNum)}
							>
								{pageNum}
							</button>
						))}

						<button
							className="pagination-button"
							onClick={() => handlePageChange(pagination.currentPage + 1)}
							disabled={!pagination.hasNextPage}
						>
							Next ›
						</button>

						<button
							className="pagination-button"
							onClick={() => handlePageChange(pagination.totalPages)}
							disabled={!pagination.hasNextPage}
						>
							»»
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
