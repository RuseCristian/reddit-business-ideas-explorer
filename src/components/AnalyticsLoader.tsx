import React, { useState, useEffect } from 'react';

interface DatabaseStats {
	totalSubreddits: number;
	totalPosts: number;
	totalOpportunities: number;
}

interface DatabaseTest {
	status: string;
	message: string;
	data: DatabaseStats | null;
}

interface AnalyticsData {
	dbTest: DatabaseTest;
	// Add more data types as needed
}

const AnalyticsLoader: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			try {
				// Simulate API call to fetch analytics data
				const response = await fetch('/api/analytics');
				if (!response.ok) {
					throw new Error('Failed to fetch analytics data');
				}
				
				const data = await response.json();
				setAnalyticsData(data);
			} catch (err) {
				console.error('Error fetching analytics:', err);
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				
				// Fallback data for development
				setAnalyticsData({
					dbTest: {
						status: "❌",
						message: "Could not connect to database",
						data: null
					}
				});
			} finally {
				setIsLoading(false);
			}
		};

		// Add a small delay to show the loading state
		const timer = setTimeout(fetchAnalyticsData, 500);
		return () => clearTimeout(timer);
	}, []);

	if (isLoading) {
		return null; // Skeleton panels are rendered by the parent
	}

	return (
		<div className="analytics-content">
			{/* Featured Panel */}
			<div className="panel featured">
				<div className="panel-header">
					<div className="panel-icon">🧠</div>
					<div className="panel-content">
						<h3>AI Business Ideas</h3>
						<p>Generated based on Reddit trends</p>
					</div>
				</div>
				<div className="panel-body">
					<div className="metric">127</div>
					<p>New ideas discovered this week from trending Reddit discussions.</p>
					<div className="badge">Trending</div>
					<div className="badge">AI-Powered</div>
				</div>
			</div>

			{/* Analytics Panel */}
			<div className="panel">
				<div className="panel-header">
					<div className="panel-icon">📊</div>
					<div className="panel-content">
						<h3>Analytics Overview</h3>
						<p>Your activity summary</p>
					</div>
				</div>
				<div className="panel-body">
					<h4>This Week</h4>
					<ul>
						<li>15 ideas saved</li>
						<li>8 communities joined</li>
						<li>42 posts analyzed</li>
					</ul>
					<div className="progress-bar">
						<div className="progress-fill" style={{width: '75%'}}></div>
					</div>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="panel compact">
				<div className="panel-header">
					<div className="panel-icon">👍</div>
					<div className="panel-content">
						<h3>Quick Stats</h3>
					</div>
				</div>
				<div className="panel-body">
					<div className="metric">89%</div>
					<p>Ideas with positive sentiment this month.</p>
				</div>
			</div>

			{/* Communities Panel */}
			<div className="panel">
				<div className="panel-header">
					<div className="panel-icon">👥</div>
					<div className="panel-content">
						<h3>Active Communities</h3>
						<p>Top performing subreddits</p>
					</div>
				</div>
				<div className="panel-body">
					<h4>Trending Now</h4>
					<ul>
						<li>r/entrepreneur - 12 new ideas</li>
						<li>r/startups - 8 new ideas</li>
						<li>r/SideProject - 5 new ideas</li>
						<li>r/business - 3 new ideas</li>
					</ul>
				</div>
			</div>

			{/* Search Activity */}
			<div className="panel compact">
				<div className="panel-header">
					<div className="panel-icon">🔍</div>
					<div className="panel-content">
						<h3>Recent Searches</h3>
					</div>
				</div>
				<div className="panel-body">
					<ul>
						<li>SaaS business ideas</li>
						<li>E-commerce trends</li>
						<li>AI startups</li>
						<li>Remote work tools</li>
					</ul>
				</div>
			</div>

			{/* Market Trends */}
			<div className="panel">
				<div className="panel-header">
					<div className="panel-icon">📈</div>
					<div className="panel-content">
						<h3>Market Trends</h3>
						<p>What's hot right now</p>
					</div>
				</div>
				<div className="panel-body">
					<h4>Top Categories</h4>
					<div className="badge">AI & ML</div>
					<div className="badge">Sustainability</div>
					<div className="badge">Remote Work</div>
					<div className="badge">FinTech</div>
					<div className="badge">Health Tech</div>
					<p>Based on 500+ analyzed Reddit posts from the last 7 days.</p>
				</div>
			</div>

			{/* Bookmarks */}
			<div className="panel compact">
				<div className="panel-header">
					<div className="panel-icon">📦</div>
					<div className="panel-content">
						<h3>Saved Ideas</h3>
					</div>
				</div>
				<div className="panel-body">
					<div className="metric">23</div>
					<p>Ideas in your bookmarks ready for research.</p>
				</div>
			</div>

			{/* Activity Feed */}
			<div className="panel">
				<div className="panel-header">
					<div className="panel-icon">📊</div>
					<div className="panel-content">
						<h3>Recent Activity</h3>
						<p>What's happening</p>
					</div>
				</div>
				<div className="panel-body">
					<h4>Latest Updates</h4>
					<ul>
						<li>New AI tool idea from r/MachineLearning</li>
						<li>Sustainable packaging solution trending</li>
						<li>Remote collaboration tool gaining traction</li>
						<li>FinTech innovation in micropayments</li>
					</ul>
				</div>
			</div>

			{/* Database Test Panel */}
			<div className="panel compact">
				<div className="panel-header">
					<div className="panel-icon">📦</div>
					<div className="panel-content">
						<h3>Database Test</h3>
						<p>Prisma connection status</p>
					</div>
				</div>
				<div className="panel-body">
					<div className="db-test-status">
						<div className="status-indicator">{analyticsData?.dbTest.status}</div>
						<p><strong>{analyticsData?.dbTest.message}</strong></p>
						{analyticsData?.dbTest.data && (
							<div className="db-stats">
								<div>Subreddits: {analyticsData.dbTest.data.totalSubreddits}</div>
								<div>Posts: {analyticsData.dbTest.data.totalPosts}</div>
								<div>Opportunities: {analyticsData.dbTest.data.totalOpportunities}</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AnalyticsLoader;