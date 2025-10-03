import React, { useState, useEffect } from "react";

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
	keywords: string[];
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
		reddit_url: string;
		upvotes: number;
		num_comments: number;
		created_at: string;
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
	const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

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

	const toggleExpanded = (type: 'posts' | 'comments', id: string) => {
		if (type === 'posts') {
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

	useEffect(() => {
		console.log("BusinessOpportunityDetails mounted with ID:", opportunityId);

		const fetchOpportunity = async () => {
			try {
				console.log("Fetching opportunity data...");
				const response = await fetch(
					`/api/database/business-opportunity?id=${opportunityId}`
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const apiData = await response.json();
				console.log("Fetched API response:", apiData);

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
					subreddit_name: rawOpportunity.subreddit?.name || rawOpportunity.subreddit?.displayName || "unknown",
					keywords: Array.isArray(rawOpportunity.keywords)
						? rawOpportunity.keywords
						: [],
					solutions: (rawOpportunity.solutions || []).map(
						(sol: any, index: number) => ({
							id: index.toString(),
							title: sol.title || "Untitled Solution",
							description: sol.solutionDescription || "No description",
							market_viability: sol.marketSize || "Unknown",
							business_model: sol.businessModel || "Unknown",
						})
					),
					posts: (rawOpportunity.posts || []).map(
						(post: any, index: number) => ({
							id: index.toString(),
							title: post.title || "Untitled Post",
							reddit_url: post.url || "#",
							upvotes: post.upvotes || 0,
							num_comments: 0, // Not available in current API
							created_at: post.createdUtc || new Date().toISOString(),
							subreddit: post.subreddit?.name || post.subreddit?.displayName || "unknown",
						})
					),
					comments: (rawOpportunity.comments || []).map(
						(comment: any, index: number) => ({
							id: index.toString(),
							content: comment.content || "No content",
							author: comment.author || "Unknown",
							created_at: comment.createdUtc || new Date().toISOString(),
							subreddit: comment.subreddit?.name || comment.subreddit?.displayName || "unknown",
							permalink: comment.permalink || undefined,
							upvotes: comment.upvotes || 0,
						})
					),
				};

				console.log("Mapped opportunity:", mappedOpportunity);
				setOpportunity(mappedOpportunity);
				console.log("State set, opportunity should now render...");
			} catch (err) {
				console.error("Error fetching opportunity:", err);
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

	console.log("Component render - opportunity:", opportunity);
	console.log("Component render - loading:", loading);
	console.log("Component render - error:", error);

	return (
		<div className="analysis-dashboard">

			<div className="title-with-badge">
				<h1 className="main-title">{opportunity.title}</h1>
				{/* Subreddit Badge */}
				<span className="meta-badge subreddit-main">
					<span className="meta-icon">📍</span>
					r/{opportunity.subreddit_name}
				</span>
			</div>

			{/* Top Metrics Row */}
			<div className="metrics-row">
				<div className="metric-card">
					<div className="metric-header">
						<span className="metric-icon">🎯</span>
						<span className="metric-label">Solutions Found</span>
					</div>
					<div className="metric-number">{opportunity.solutions?.length || 0}</div>
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
					<div className="metric-number">{(opportunity.posts?.length || 0) + (opportunity.comments?.length || 0)}</div>
				</div>
				<div className="metric-card">
					<div className="metric-header">
						<span className="metric-icon">🏷️</span>
						<span className="metric-label">Keywords</span>
					</div>
					<div className="metric-number">{opportunity.keywords?.length || 0}</div>
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
							<div className="impact-fill" style={{ width: `${(opportunity.score / 10) * 100}%` }}></div>
						</div>
						<span className="impact-score">{formatScore(opportunity.score)}/10</span>
					</div>
				</div>

				{/* Keywords Section */}
				{opportunity.keywords && opportunity.keywords.length > 0 && (
					<div className="keywords-section">
						<h3 className="section-title">
							<span className="section-icon">🏷️</span>
							Key Topics & Themes
						</h3>
						<div className="keywords-grid">
							{opportunity.keywords.map((keyword, index) => (
								<span key={index} className="keyword-badge">{keyword}</span>
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
				{((opportunity.posts && opportunity.posts.length > 0) || (opportunity.comments && opportunity.comments.length > 0)) && (
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
									onClick={() => toggleExpanded('posts', 'main')}
								>
									<span className="expand-icon">📝</span>
									<span>Reddit Posts ({opportunity.posts.length})</span>
									<span className="expand-arrow">{expandedPosts.has('main') ? '▼' : '▶'}</span>
								</button>
								{expandedPosts.has('main') && (
									<div className="expand-content">
										{opportunity.posts.map((post) => (
											<div key={post.id} className="source-item">
												<a href={post.reddit_url} target="_blank" rel="noopener noreferrer" className="source-title">
													{post.title}
												</a>
												<div className="source-meta">
													<span className="meta-badge upvotes">⬆️ {post.upvotes}</span>
													<span className="meta-badge">💬 {post.num_comments}</span>
													<span className="meta-badge">r/{post.subreddit}</span>
													<span className="meta-badge">{formatDate(post.created_at)}</span>
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
									onClick={() => toggleExpanded('comments', 'main')}
								>
									<span className="expand-icon">💬</span>
									<span>Key Comments ({opportunity.comments.length})</span>
									<span className="expand-arrow">{expandedComments.has('main') ? '▼' : '▶'}</span>
								</button>
								{expandedComments.has('main') && (
									<div className="expand-content">
										{opportunity.comments.slice(0, 10).map((comment) => {
											const commentUrl = comment.permalink 
												? `https://www.reddit.com${comment.permalink}`
												: `https://www.reddit.com/r/${comment.subreddit}/comments/`;
											
											return (
												<a 
													key={comment.id}
													href={commentUrl}
													target="_blank"
													rel="noopener noreferrer"
													style={{ textDecoration: 'none', color: 'inherit' }}
												>
													<div className="source-item comment-item">
														<p className="comment-content">"{comment.content}"</p>
														<div className="source-meta">
															<span className="meta-badge upvotes">⬆️ {comment.upvotes}</span>
															<span className="meta-badge">👤 u/{comment.author}</span>
															<span className="meta-badge">📍 r/{comment.subreddit}</span>
															<span className="meta-badge">📅 {formatDate(comment.created_at)}</span>
														</div>
													</div>
												</a>
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
