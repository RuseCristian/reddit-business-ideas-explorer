export interface Subreddit {
	id: number;
	name: string;
	displayName: string;
	subscriberCount: number;
	createdUtc?: Date;
	iconPath?: string | null;
	lastUpdated?: Date;
}

export interface BusinessIdeaWithTags {
	id: string;
	title: string;
	description: string;
	subreddit: string;
	redditUrl?: string | null;
	upvotes: number;
	createdAt: Date;
	updatedAt: Date;
	tags: {
		tag: {
			id: string;
			name: string;
		};
	}[];
	_count?: {
		savedBy: number;
		comments: number;
	};
}

export interface SavedIdeaWithDetails {
	id: string;
	userId: string;
	ideaId: string;
	idea: BusinessIdeaWithTags;
}

export interface CommentWithUser {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	user: {
		id: string;
		email: string;
	};
}
