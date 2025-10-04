import React, { useState, useEffect } from "react";

interface Community {
	id: number;
	name: string;
	displayName: string;
	subscriberCount: number;
	subscriberCountFormatted: string;
	opportunityCount: number;
	totalPosts: number;
	totalComments: number;
	avgBusinessImpactScore: number;
	iconPath: string;
}

interface CommunitiesResponse {
	success: boolean;
	data: Community[];
	totalCount: number;
	meta: {
		timestamp: string;
		requestedBy: string;
		securityLevel: string;
		endpoint: string;
	};
}

interface CommunitiesListProps {
	communities?: {
		subreddits: Community[];
		totalCount: number;
	};
}

export default function CommunitiesList({
	communities: initialCommunities,
}: CommunitiesListProps) {
	const [allCommunities, setAllCommunities] = useState<Community[]>(
		initialCommunities?.subreddits || []
	);
	const [filteredCommunities, setFilteredCommunities] = useState<Community[]>(
		initialCommunities?.subreddits || []
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [loading, setLoading] = useState(!initialCommunities);
	const [error, setError] = useState<string | null>(null);

	// Filter communities based on search term
	useEffect(() => {
		if (!searchTerm.trim()) {
			setFilteredCommunities(allCommunities);
		} else {
			const filtered = allCommunities.filter(
				(community) =>
					community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					community.displayName.toLowerCase().includes(searchTerm.toLowerCase())
			);
			setFilteredCommunities(filtered);
		}
	}, [searchTerm, allCommunities]);

	useEffect(() => {
		// Only fetch if no initial communities provided
		if (initialCommunities) {
			setAllCommunities(initialCommunities.subreddits);
			setFilteredCommunities(initialCommunities.subreddits);
			setLoading(false);
			return;
		}

		const fetchCommunities = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch("/api/database/communities?limit=100");

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data: CommunitiesResponse = await response.json();

				if (data.success) {
					setAllCommunities(data.data);
					setFilteredCommunities(data.data);
				} else {
					throw new Error("API returned success: false");
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch communities"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchCommunities();
	}, [initialCommunities]);

	const formatScore = (score: number) => {
		return score.toFixed(1);
	};

	const handleCommunityClick = (communityId: number) => {
		// Navigate to opportunities page with this subreddit selected
		window.location.href = `/dashboard/opportunities?subreddit=${communityId}`;
	};

	const handleImageError = (
		e: React.SyntheticEvent<HTMLImageElement>,
		communityName: string
	) => {
		const img = e.currentTarget;
		const currentSrc = img.src;

		console.log(
			`Image failed to load: ${currentSrc} for community: ${communityName}`
		);

		// Extract subreddit name (remove "r/" prefix if present)
		const subredditName = communityName.replace(/^r\//, "");

		// Try different extensions in order: png -> jpg -> fallback
		if (currentSrc.endsWith(".png")) {
			console.log(`Trying JPG version for ${subredditName}`);
			img.src = `/assets/subreddit_icons/${subredditName}.jpg`;
		} else if (currentSrc.endsWith(".jpg")) {
			console.log(`Using fallback icon for ${subredditName}`);
			// Last fallback - use favicon
			img.src = "/favicon.png";
		}
	};

	const renderCommunityIcon = (community: Community) => {
		// Check if we have a valid icon path and the subreddit exists
		const subredditName = community.name.replace("r/", "").toLowerCase();
		const hasIcon =
			subredditName && subredditName !== "null" && subredditName !== "";

		if (hasIcon) {
			return (
				<img
					src={`/assets/subreddit_icons/${subredditName}.png`}
					alt={`${community.name} icon`}
					onError={(e) => handleImageError(e, community.name)}
					onLoad={() =>
						console.log(
							`Image loaded successfully: /assets/subreddit_icons/${subredditName}.png`
						)
					}
				/>
			);
		} else {
			// Fallback SVG for communities without icons
			return (
				<svg
					width="48"
					height="48"
					viewBox="0 0 20 20"
					fill="currentColor"
					style={{ color: "#666" }}
				>
					<path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0ZM8.016 8.633a1.616 1.616 0 0 0-.2.806V13.5H5.931V6.172h1.8v.9h.039a3.009 3.009 0 0 1 1.018-.732 3.45 3.45 0 0 1 1.449-.284c.246-.003.491.02.732.068.158.024.309.08.444.164l-.759 1.832a2.09 2.09 0 0 0-1.093-.26c-.33-.01-.658.062-.954.208a1.422 1.422 0 0 0-.591.565Zm2.9 6.918H9.355L14.7 2.633c.426.272.828.58 1.2.922l-4.984 11.996Z" />
				</svg>
			);
		}
	};

	if (loading) {
		return (
			<div className="communities-container">
				<div className="loading-state">
					<div className="loading-spinner"></div>
					<h3>Loading Communities</h3>
					<p>Fetching community data...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="communities-container">
				<div className="error-state">
					<h3>Error Loading Communities</h3>
					<p>{error}</p>
					<button
						className="retry-button"
						onClick={() => window.location.reload()}
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (filteredCommunities.length === 0 && !loading) {
		if (searchTerm.trim()) {
			return (
				<div className="communities-container">
					{/* Search Bar - Always Visible */}
					<div className="search-container">
						<div className="search-input-wrapper">
							<svg
								className="search-icon"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
							</svg>
							<input
								type="text"
								placeholder="Search communities (e.g., 'entre' for entrepreneur...)"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="search-input"
							/>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm("")}
									className="clear-search"
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>
						{searchTerm && (
							<div className="search-results-info">
								Showing {filteredCommunities.length} of {allCommunities.length}{" "}
								communities
							</div>
						)}
					</div>

					<div className="empty-state">
						<div className="empty-icon">🔍</div>
						<h3>No communities found</h3>
						<p>
							No communities match "{searchTerm}". Try a different search term.
						</p>
						<button onClick={() => setSearchTerm("")} className="retry-button">
							Clear Search
						</button>
					</div>
				</div>
			);
		} else {
			return (
				<div className="communities-container">
					{/* Search Bar - Always Visible */}
					<div className="search-container">
						<div className="search-input-wrapper">
							<svg
								className="search-icon"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
							</svg>
							<input
								type="text"
								placeholder="Search communities (e.g., 'entre' for entrepreneur...)"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="search-input"
							/>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm("")}
									className="clear-search"
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>
					</div>

					<div className="empty-state">
						<div className="empty-icon">🏘️</div>
						<h3>No Communities Found</h3>
						<p>
							No communities with business opportunities are available at the
							moment.
						</p>
					</div>
				</div>
			);
		}
	}

	return (
		<div className="communities-container">
			{/* Search Bar - Always Visible */}
			<div className="search-container">
				<div className="search-input-wrapper">
					<svg
						className="search-icon"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
					</svg>
					<input
						type="text"
						placeholder="Search communities (e.g., 'entre' for entrepreneur...)"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="search-input"
					/>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm("")}
							className="clear-search"
							aria-label="Clear search"
						>
							×
						</button>
					)}
				</div>
				{searchTerm && (
					<div className="search-results-info">
						Showing {filteredCommunities.length} of {allCommunities.length}{" "}
						communities
					</div>
				)}
			</div>

			<div className="communities-grid">
				{filteredCommunities.map((community: Community) => (
					<div
						key={community.id}
						className="community-card"
						onClick={() => handleCommunityClick(community.id)}
					>
						<div className="community-header">
							<div className="community-icon">
								{renderCommunityIcon(community)}
							</div>
							<div className="community-info">
								<h3 className="community-name">{community.name}</h3>
								<p className="community-description">{community.displayName}</p>
							</div>
							<div className="community-score">
								<span className="score-number">
									{formatScore(community.avgBusinessImpactScore)}
								</span>
								<span className="score-label">Avg Score</span>
							</div>
						</div>

						<div className="community-stats">
							<div className="stat-item">
								<span className="stat-icon">👥</span>
								<div className="stat-content">
									<span className="stat-number">
										{community.subscriberCountFormatted}
									</span>
									<span className="stat-label">Members</span>
								</div>
							</div>

							<div className="stat-item">
								<span className="stat-icon">💡</span>
								<div className="stat-content">
									<span className="stat-number">
										{community.opportunityCount}
									</span>
									<span className="stat-label">Opportunities</span>
								</div>
							</div>

							<div className="stat-item">
								<span className="stat-icon">📝</span>
								<div className="stat-content">
									<span className="stat-number">{community.totalPosts}</span>
									<span className="stat-label">Posts</span>
								</div>
							</div>

							<div className="stat-item">
								<span className="stat-icon">💬</span>
								<div className="stat-content">
									<span className="stat-number">{community.totalComments}</span>
									<span className="stat-label">Comments</span>
								</div>
							</div>
						</div>

						<div className="community-footer">
							<div className="engagement-info">
								<span className="engagement-label">Total Sources:</span>
								<span className="engagement-value">
									{community.totalPosts + community.totalComments}
								</span>
							</div>
							<button className="explore-button">
								Explore Opportunities →
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
