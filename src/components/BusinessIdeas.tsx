import React, { useState, useEffect } from "react";
import type { BusinessIdeaWithTags } from "../types/database";

interface BusinessIdeasProps {
	initialIdeas?: BusinessIdeaWithTags[];
}

const BusinessIdeas: React.FC<BusinessIdeasProps> = ({ initialIdeas = [] }) => {
	const [ideas, setIdeas] = useState<BusinessIdeaWithTags[]>(initialIdeas);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const fetchIdeas = async (search?: string) => {
		setLoading(true);
		try {
			const queryParams = new URLSearchParams();
			if (search) queryParams.set("search", search);

			const response = await fetch(`/api/ideas?${queryParams}`);
			const result = await response.json();

			if (result.success) {
				setIdeas(result.data);
			}
		} catch (error) {
			console.error("Error fetching ideas:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		fetchIdeas(searchQuery);
	};

	const saveIdea = async (ideaId: string) => {
		try {
			const response = await fetch("/api/user/saved", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ideaId,
					userId: "temp-user-id", // In production, get this from Clerk
				}),
			});

			const result = await response.json();
			if (result.success) {
				alert("Idea saved successfully!");
			}
		} catch (error) {
			console.error("Error saving idea:", error);
			alert("Failed to save idea");
		}
	};

	return (
		<div className="business-ideas-container">
			<div className="search-bar">
				<form onSubmit={handleSearch}>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search business ideas..."
						className="search-input"
					/>
					<button type="submit" disabled={loading}>
						{loading ? "Searching..." : "Search"}
					</button>
				</form>
			</div>

			<div className="ideas-grid">
				{ideas.map((idea) => (
					<div key={idea.id} className="idea-card">
						<h3>{idea.title}</h3>
						<p className="description">{idea.description}</p>
						<div className="meta">
							<span className="subreddit">r/{idea.subreddit}</span>
							<span className="upvotes">👍 {idea.upvotes}</span>
							{idea._count && (
								<span className="saves">💾 {idea._count.savedBy}</span>
							)}
						</div>
						{idea.tags && idea.tags.length > 0 && (
							<div className="tags">
								{idea.tags.map((tagRelation) => (
									<span key={tagRelation.tag.id} className="tag">
										{tagRelation.tag.name}
									</span>
								))}
							</div>
						)}
						<div className="actions">
							<button onClick={() => saveIdea(idea.id)} className="save-button">
								Save Idea
							</button>
							{idea.redditUrl && (
								<a
									href={idea.redditUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="reddit-link"
								>
									View on Reddit
								</a>
							)}
						</div>
					</div>
				))}
			</div>

			{ideas.length === 0 && !loading && (
				<p className="no-results">No business ideas found.</p>
			)}
		</div>
	);
};

export default BusinessIdeas;
