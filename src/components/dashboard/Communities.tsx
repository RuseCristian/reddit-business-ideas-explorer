import { useState, useEffect } from "react";
import type { CommunityData } from "../../types/database";

interface ApiResponse {
	data: CommunityData[];
	meta: {
		count: number;
		limit: number;
		searchTerm?: string;
		timestamp: string;
	};
}

interface CommunitiesProps {
	searchTerm?: string;
	limit?: number;
}

export default function Communities({
	searchTerm,
	limit = 10,
}: CommunitiesProps) {
	const [communitiesData, setCommunitiesData] = useState<ApiResponse | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadCommunities();
	}, [searchTerm, limit]);

	const loadCommunities = async () => {
		try {
			setLoading(true);
			setError(null);

			// Build query parameters
			const params = new URLSearchParams();
			if (searchTerm) params.append("search", searchTerm);
			if (limit) params.append("limit", limit.toString());

			const response = await fetch(
				`/api/database/user-communities${
					params.toString() ? "?" + params.toString() : ""
				}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`API Error (${response.status}): ${
						errorData.error || "Unknown error"
					}`
				);
			}

			const data: ApiResponse = await response.json();
			setCommunitiesData(data);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			setError(`Failed to load user community data: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="communities-loading">
				<div className="loading-spinner"></div>
				<h3>Loading User Communities...</h3>
				<p>Fetching your personalized data...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="communities-error">
				<h3>❌ Error Loading User Communities</h3>
				<p>{error}</p>
				<div className="error-actions">
					<button onClick={loadCommunities} className="retry-btn">
						🔄 Retry Loading
					</button>
				</div>
			</div>
		);
	}

	if (
		!communitiesData ||
		!communitiesData.data ||
		communitiesData.data.length === 0
	) {
		return (
			<div className="communities-empty">
				<h3>📭 No User Communities Found</h3>
				<p>No community data available for your account.</p>
			</div>
		);
	}

	return (
		<div className="communities-container">
			<div className="communities-header">
				<h3>✅ User Communities Loaded</h3>
				<div className="header-stats">
					<p>{communitiesData.data.length} communities loaded</p>
				</div>
				<div className="api-meta">
					<small>
						Timestamp:{" "}
						{new Date(communitiesData.meta.timestamp).toLocaleTimeString()}
					</small>
				</div>
			</div>

			<div className="communities-grid">
				{communitiesData.data.map((community: CommunityData) => (
					<div key={community.id} className="community-card">
						<div className="community-header">
							<h4>r/{community.name}</h4>
							{community.displayName && (
								<p className="display-name">{community.displayName}</p>
							)}
							<span className="member-count">
								{community.subscriberCount?.toLocaleString() || "N/A"}{" "}
								subscribers
							</span>
						</div>

						<div className="community-stats">
							<div className="stat">
								<span className="stat-value">{community.counts.posts}</span>
								<span className="stat-label">Posts</span>
							</div>
							<div className="stat">
								<span className="stat-value">{community.counts.comments}</span>
								<span className="stat-label">Comments</span>
							</div>
							<div className="stat">
								<span className="stat-value">
									{community.counts.opportunities}
								</span>
								<span className="stat-label">Opportunities</span>
							</div>
							{community.analytics && (
								<div className="stat">
									<span className="stat-value">
										{community.analytics.engagementRate}
									</span>
									<span className="stat-label">Engagement</span>
								</div>
							)}
						</div>

						{community.analytics && (
							<div className="community-analytics">
								<div className="analytics-row">
									<span className="analytics-label">Avg Post Score:</span>
									<span className="analytics-value">
										{community.analytics.avgPostScore}
									</span>
								</div>
								<div className="analytics-row">
									<span className="analytics-label">Avg Upvotes:</span>
									<span className="analytics-value">
										{community.analytics.avgPostUpvotes}
									</span>
								</div>
							</div>
						)}

						{community.analytics?.topOpportunities &&
							community.analytics.topOpportunities.length > 0 && (
								<div className="top-opportunities">
									<h5>🚀 Top Opportunities:</h5>
									<ul>
										{community.analytics.topOpportunities
											.slice(0, 2)
											.map((opp: any) => (
												<li key={opp.id}>
													<span className="opp-title">{opp.title}</span>
													<span className="opp-score">
														Score: {opp.impactScore}
													</span>
												</li>
											))}
									</ul>
								</div>
							)}

						<div className="community-footer">
							<span className="updated-date">
								{community.lastUpdated
									? `Updated: ${new Date(
											community.lastUpdated
									  ).toLocaleDateString()}`
									: "Recently updated"}
							</span>
						</div>
					</div>
				))}
			</div>

			<div className="communities-actions">
				<button
					onClick={loadCommunities}
					className="refresh-btn"
					disabled={loading}
				>
					🔄 Refresh Data
				</button>
			</div>
		</div>
	);
}
