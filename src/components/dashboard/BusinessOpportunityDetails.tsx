import React, { useState, useEffect } from "react";
import { useActivityTracker } from "../../hooks/useUserActivity";

interface BusinessOpportunity {
	id: string;
	title: string;
	description: string;
	score: number;
	market_demand: number;
	viability_score: number;
	competition_level: number;
	created_at: string;
	subreddit_name: string;
	subreddit_display_name?: string;
	subreddit_subscriber_count?: number;
	subreddit_id?: number;
	keywords: string[];
	// Business Analysis Fields
	affected_audience?: string;
	pain_severity?: string;
	market_gap?: string;
	validated_need?: string;
	addressable_market?: string;
	time_sensitivity?: string;
	solutions: Array<{
		id: string;
		title: string;
		description: string;
		market_viability: string;
		business_model: string;
	}>;
	posts: Array<{
		id: string;
		title: string;
		content: string;
		reddit_url: string;
		upvotes: number;
		num_comments: number;
		created_at: string;
		author: string;
		subreddit: string;
	}>;
	comments: Array<{
		id: string;
		content: string;
		author: string;
		created_at: string;
		subreddit: string;
		permalink?: string;
		upvotes?: number;
	}>;
}

interface BusinessOpportunityDetailsProps {
	opportunityId: string;
}

export default function BusinessOpportunityDetails({
	opportunityId,
}: BusinessOpportunityDetailsProps) {
	const [opportunity, setOpportunity] = useState<BusinessOpportunity | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
	const [expandedComments, setExpandedComments] = useState<Set<string>>(
		new Set()
	);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [bookmarkLoading, setBookmarkLoading] = useState(false);

	// Activity tracking hook
	const { trackOpportunityView } = useActivityTracker();

	const getScoreColor = (score: number) => {
		if (score >= 8) return "score-high";
		if (score >= 6) return "score-medium";
		return "score-low";
	};

	const formatScore = (score: number) => {
		return score.toFixed(1);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatSubscriberCount = (count?: number) => {
		if (!count) return "";
		if (count >= 1000000) {
			return `${(count / 1000000).toFixed(1)}M`;
		}
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}K`;
		}
		return count.toString();
	};

	const toggleExpanded = (type: "posts" | "comments", id: string) => {
		if (type === "posts") {
			const newExpanded = new Set(expandedPosts);
			if (newExpanded.has(id)) {
				newExpanded.delete(id);
			} else {
				newExpanded.add(id);
			}
			setExpandedPosts(newExpanded);
		} else {
			const newExpanded = new Set(expandedComments);
			if (newExpanded.has(id)) {
				newExpanded.delete(id);
			} else {
				newExpanded.add(id);
			}
			setExpandedComments(newExpanded);
		}
	};

	// Check bookmark status
	useEffect(() => {
		const checkBookmarkStatus = async () => {
			try {
				const response = await fetch("/api/user/bookmarks");
				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						const bookmarked = data.data.opportunities.some(
							(opp: any) => opp.id === parseInt(opportunityId)
						);
						setIsBookmarked(bookmarked);
					}
				}
			} catch (error) {
				console.log("Failed to check bookmark status:", error);
			}
		};

		checkBookmarkStatus();
	}, [opportunityId]);

	useEffect(() => {
		const fetchOpportunity = async () => {
			try {
				const response = await fetch(
					`/api/database/opportunity-details?id=${opportunityId}`
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const apiData = await response.json();

				// Extract data from the API response structure
				const rawOpportunity = apiData.data;
				if (!rawOpportunity) {
					throw new Error("No opportunity data in response");
				}

				// Map the API data structure to our component's expected format
				const mappedOpportunity: BusinessOpportunity = {
					id: opportunityId.toString(),
					title: rawOpportunity.mainTitle || "Untitled Opportunity",
					description:
						rawOpportunity.problemDescription || "No description available",
					score: rawOpportunity.businessImpactScore || 0,
					market_demand: rawOpportunity.businessImpactScore || 0, // Using same score for now
					viability_score: rawOpportunity.businessImpactScore || 0, // Using same score for now
					competition_level: 5, // Default middle value
					created_at: new Date().toISOString(), // Default to current date
					subreddit_name:
						rawOpportunity.subreddit?.name ||
						rawOpportunity.subreddit?.displayName ||
						"unknown",
					subreddit_display_name: rawOpportunity.subreddit?.displayName,
					subreddit_subscriber_count: rawOpportunity.subreddit?.subscriberCount,
					subreddit_id: rawOpportunity.subreddit?.id,
					keywords: Array.isArray(rawOpportunity.keywords)
						? rawOpportunity.keywords
						: [],
					// Business Analysis Fields
					affected_audience: rawOpportunity.affectedAudience,
					pain_severity: rawOpportunity.painSeverity,
					market_gap: rawOpportunity.marketGap,
					validated_need: rawOpportunity.validatedNeed,
					addressable_market: rawOpportunity.addressableMarket,
					time_sensitivity: rawOpportunity.timeSensitivity,
					solutions: (rawOpportunity.solutions || []).map(
						(sol: any, index: number) => ({
							id: index.toString(),
							title: sol.title || "Untitled Solution",
							description: sol.description || "No description",
							market_viability: sol.marketSize || "Unknown",
							business_model: sol.businessModel || "Unknown",
						})
					),
					posts: (rawOpportunity.posts || []).map(
						(post: any, index: number) => ({
							id: index.toString(),
							title: post.title || "Untitled Post",
							content: post.selftext || "",
							reddit_url: post.redditUrl || post.url || "#",
							upvotes: post.upvotes || 0,
							num_comments: 0, // Not available in current API
							created_at: post.createdUtc || new Date().toISOString(),
							author: post.author || "Unknown",
							subreddit:
								post.subreddit?.name ||
								post.subreddit?.displayName ||
								"unknown",
						})
					),
					comments: (rawOpportunity.comments || []).map(
						(comment: any, index: number) => ({
							id: index.toString(),
							content: comment.content || "No content",
							author: comment.author || "Unknown",
							created_at: comment.createdUtc || new Date().toISOString(),
							subreddit:
								comment.subreddit?.name ||
								comment.subreddit?.displayName ||
								"unknown",
							permalink: comment.permalink || undefined,
							upvotes: comment.upvotes || 0,
						})
					),
				};

				setOpportunity(mappedOpportunity);

				// Track the opportunity view
				trackOpportunityView(parseInt(opportunityId), "opportunity-details");
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load business opportunity"
				);
			} finally {
				setLoading(false);
			}
		};

		if (opportunityId) {
			fetchOpportunity();
		}
	}, [opportunityId]);

	if (loading) {
		return (
			<div className="analysis-dashboard">
				<div className="loading-state">
					<div className="loading-spinner"></div>
					<h3>Loading Opportunity</h3>
					<p>Fetching business opportunity details...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="analysis-dashboard">
				<div className="error-state">
					<h3>Error Loading Opportunity</h3>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	if (!opportunity) {
		return (
			<div className="analysis-dashboard">
				<div className="error-state">
					<h3>Business Opportunity Not Found</h3>
					<p>The requested business opportunity could not be found.</p>
				</div>
			</div>
		);
	}

	const handleGoBack = () => {
		// Try to go back in browser history first
		if (window.history.length > 1) {
			window.history.back();
		} else {
			// Fallback to dashboard if no history
			window.location.href = "/dashboard";
		}
	};

	const handleBookmarkToggle = async () => {
		setBookmarkLoading(true);
		try {
			const method = isBookmarked ? "DELETE" : "POST";
			const url = isBookmarked
				? `/api/user/bookmarks?opportunityId=${opportunityId}`
				: "/api/user/bookmarks";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: method === "POST" ? JSON.stringify({ opportunityId: parseInt(opportunityId) }) : undefined,
			});

			if (response.ok) {
				setIsBookmarked(!isBookmarked);
				// Track the activity
				if (typeof window !== "undefined" && (window as any).trackActivity) {
					await (window as any).trackActivity(
						isBookmarked ? "unsaved_opportunity" : "saved_opportunity",
						parseInt(opportunityId),
						"opportunity",
						{ source: "opportunity-details" }
					);
				}
			} else {
				alert(`Failed to ${isBookmarked ? "remove" : "save"} bookmark`);
			}
		} catch (error) {
			console.error("Bookmark toggle failed:", error);
			alert(`Failed to ${isBookmarked ? "remove" : "save"} bookmark`);
		} finally {
			setBookmarkLoading(false);
		}
	};

	return (
		<div className="analysis-dashboard">
			{/* Back Navigation */}
			<div className="back-navigation">
				<button
					onClick={handleGoBack}
					className="back-button"
					aria-label="Go back to previous page"
				>
					<span className="back-icon">←</span>
					<span className="back-text">Back</span>
				</button>
				<button
					onClick={handleBookmarkToggle}
					className={`bookmark-button ${isBookmarked ? "bookmarked" : ""}`}
					disabled={bookmarkLoading}
					aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
				>
					{bookmarkLoading ? (
						<span className="bookmark-loading">⏳</span>
					) : isBookmarked ? (
						<span className="bookmark-filled">💾</span>
					) : (
						<span className="bookmark-empty">🔖</span>
					)}
					<span className="bookmark-text">
						{isBookmarked ? "Saved" : "Save"}
					</span>
				</button>
			</div>

			<div className="title-with-badge">
				<h1 className="main-title">{opportunity.title}</h1>
				{/* Enhanced Subreddit Badge */}
				<div className="subreddit-info">
					<a
						href={`https://www.reddit.com/r/${opportunity.subreddit_name}`}
						target="_blank"
						rel="noopener noreferrer"
						className="meta-badge subreddit-main clickable-badge"
					>
						<span className="subreddit-details">
							<span className="subreddit-name">
								r/{opportunity.subreddit_name}
							</span>
							{opportunity.subreddit_display_name &&
								opportunity.subreddit_display_name !==
									opportunity.subreddit_name && (
									<span className="subreddit-display">
										{opportunity.subreddit_display_name}
									</span>
								)}
						</span>
					</a>
					{opportunity.subreddit_subscriber_count && (
						<span className="meta-badge community-stats">
							<span className="meta-icon">👥</span>
							{formatSubscriberCount(
								opportunity.subreddit_subscriber_count
							)}{" "}
							members
						</span>
					)}
				</div>
			</div>

			{/* Top Metrics Row */}
			<div className="metrics-row">
				<div className="metric-card">
					<div className="metric-header">
						<span className="metric-icon">🎯</span>
						<span className="metric-label">Solutions Found</span>
					</div>
					<div className="metric-number">
						{opportunity.solutions?.length || 0}
					</div>
				</div>
				<div className="metric-card">
					<div className="metric-header">
						<span className="metric-icon">✅</span>
						<span className="metric-label">Impact Score</span>
					</div>
					<div className="metric-number">{formatScore(opportunity.score)}</div>
				</div>
				<div className="metric-card">
					<div className="metric-header">
						<span className="metric-icon">📊</span>
						<span className="metric-label">Data Sources</span>
					</div>
					<div className="metric-number">
						{(opportunity.posts?.length || 0) +
							(opportunity.comments?.length || 0)}
					</div>
				</div>
				<div className="metric-card">
					<div className="metric-header">
						<span className="metric-icon">🏷️</span>
						<span className="metric-label">Keywords</span>
					</div>
					<div className="metric-number">
						{opportunity.keywords?.length || 0}
					</div>
				</div>
			</div>

			{/* Main Opportunity Container */}
			<div className="opportunity-container">
				{/* Main Title */}
				<div className="opportunity-header">
					<h2 className="main-title">{opportunity.title}</h2>
					<p className="main-description">{opportunity.description}</p>

					<div className="impact-section">
						<span className="impact-label">Impact Score:</span>
						<div className="impact-bar">
							<div
								className="impact-fill"
								style={{ width: `${(opportunity.score / 10) * 100}%` }}
							></div>
						</div>
						<span className="impact-score">
							{formatScore(opportunity.score)}/10
						</span>
					</div>
				</div>

				{/* Business Analysis Section */}
				{(opportunity.affected_audience ||
					opportunity.pain_severity ||
					opportunity.market_gap ||
					opportunity.validated_need ||
					opportunity.addressable_market ||
					opportunity.time_sensitivity) && (
					<div className="business-analysis-section">
						<h3 className="section-title">
							<span className="section-icon">📊</span>
							Business Analysis
						</h3>
						<div className="analysis-grid">
							{opportunity.affected_audience && (
								<div className="analysis-card">
									<div className="analysis-header">
										<span className="analysis-icon">👥</span>
										<h4 className="analysis-title">Affected Audience</h4>
									</div>
									<p className="analysis-content">
										{opportunity.affected_audience}
									</p>
								</div>
							)}
							{opportunity.pain_severity && (
								<div className="analysis-card">
									<div className="analysis-header">
										<span className="analysis-icon">⚡</span>
										<h4 className="analysis-title">Pain Severity</h4>
									</div>
									<p className="analysis-content">
										{opportunity.pain_severity}
									</p>
								</div>
							)}
							{opportunity.market_gap && (
								<div className="analysis-card">
									<div className="analysis-header">
										<span className="analysis-icon">🕳️</span>
										<h4 className="analysis-title">Market Gap</h4>
									</div>
									<p className="analysis-content">{opportunity.market_gap}</p>
								</div>
							)}
							{opportunity.validated_need && (
								<div className="analysis-card">
									<div className="analysis-header">
										<span className="analysis-icon">✅</span>
										<h4 className="analysis-title">Validated Need</h4>
									</div>
									<p className="analysis-content">
										{opportunity.validated_need}
									</p>
								</div>
							)}
							{opportunity.addressable_market && (
								<div className="analysis-card">
									<div className="analysis-header">
										<span className="analysis-icon">🎯</span>
										<h4 className="analysis-title">Addressable Market</h4>
									</div>
									<p className="analysis-content">
										{opportunity.addressable_market}
									</p>
								</div>
							)}
							{opportunity.time_sensitivity && (
								<div className="analysis-card">
									<div className="analysis-header">
										<span className="analysis-icon">⏰</span>
										<h4 className="analysis-title">Time Sensitivity</h4>
									</div>
									<p className="analysis-content">
										{opportunity.time_sensitivity}
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Keywords Section */}
				{opportunity.keywords && opportunity.keywords.length > 0 && (
					<div className="keywords-section">
						<h3 className="section-title">
							<span className="section-icon">🏷️</span>
							Key Topics & Themes
						</h3>
						<div className="keywords-grid">
							{opportunity.keywords.map((keyword, index) => (
								<span key={index} className="keyword-badge">
									{keyword}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Solutions Section */}
				{opportunity.solutions && opportunity.solutions.length > 0 && (
					<div className="solutions-section">
						<h3 className="section-title">
							<span className="section-icon">💡</span>
							Potential Solutions ({opportunity.solutions.length})
						</h3>
						<div className="solutions-grid">
							{opportunity.solutions.map((solution, index) => (
								<div key={solution.id} className="solution-card">
									<div className="solution-header">
										<div className="solution-number">{index + 1}</div>
										<h4 className="solution-title">{solution.title}</h4>
									</div>
									<p className="solution-description">{solution.description}</p>
									<div className="solution-meta">
										<span className="meta-badge market">
											<span className="meta-icon">📈</span>
											Market: {solution.market_viability}
										</span>
										<span className="meta-badge model">
											<span className="meta-icon">💼</span>
											Model: {solution.business_model}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Sources Section */}
				{((opportunity.posts && opportunity.posts.length > 0) ||
					(opportunity.comments && opportunity.comments.length > 0)) && (
					<div className="sources-section">
						<h3 className="section-title">
							<span className="section-icon">📚</span>
							Evidence & Sources
						</h3>

						{/* Posts */}
						{opportunity.posts && opportunity.posts.length > 0 && (
							<div className="source-category">
								<button
									className="expand-header"
									onClick={() => toggleExpanded("posts", "main")}
								>
									<span className="expand-icon">📝</span>
									<span>Reddit Posts ({opportunity.posts.length})</span>
									<span className="expand-arrow">
										{expandedPosts.has("main") ? "▼" : "▶"}
									</span>
								</button>
								{expandedPosts.has("main") && (
									<div className="expand-content">
										{opportunity.posts.map((post) => (
											<div key={post.id} className="source-item">
												<h4 className="source-title">{post.title}</h4>
												{post.content && (
													<p className="post-text">{post.content}</p>
												)}
												<div className="source-meta">
													<span className="meta-badge upvotes">
														⬆️ {post.upvotes}
													</span>
													<span className="meta-badge">👤 u/{post.author}</span>
													<span className="meta-badge">r/{post.subreddit}</span>
													<span className="meta-badge">
														📅 {formatDate(post.created_at)}
													</span>
													<button
														className="meta-badge source-link"
														onClick={() =>
															window.open(post.reddit_url, "_blank")
														}
													>
														🔗 View Source
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Comments */}
						{opportunity.comments && opportunity.comments.length > 0 && (
							<div className="source-category">
								<button
									className="expand-header"
									onClick={() => toggleExpanded("comments", "main")}
								>
									<span className="expand-icon">💬</span>
									<span>Key Comments ({opportunity.comments.length})</span>
									<span className="expand-arrow">
										{expandedComments.has("main") ? "▼" : "▶"}
									</span>
								</button>
								{expandedComments.has("main") && (
									<div className="expand-content">
										{opportunity.comments.slice(0, 10).map((comment) => {
											const commentUrl = comment.permalink
												? `https://www.reddit.com${comment.permalink}`
												: `https://www.reddit.com/r/${comment.subreddit}/comments/`;

											return (
												<div key={comment.id} className="source-item">
													<p className="comment-text">{comment.content}</p>
													<div className="source-meta">
														<span className="meta-badge upvotes">
															⬆️ {comment.upvotes}
														</span>
														<span className="meta-badge">
															👤 u/{comment.author}
														</span>
														<span className="meta-badge">
															r/{comment.subreddit}
														</span>
														<span className="meta-badge">
															📅 {formatDate(comment.created_at)}
														</span>
														<button
															className="meta-badge source-link"
															onClick={() => window.open(commentUrl, "_blank")}
														>
															🔗 View Source
														</button>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
