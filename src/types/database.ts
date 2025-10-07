// Enhanced types for the secure API layer

// Base entity interfaces
export interface Community {
	id: number;
	name: string;
	description: string | null;
	memberCount: number | null;
	totalPosts: number;
	totalComments: number;
	totalOpportunities: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Post {
	id: number;
	title: string;
	content: string | null;
	score: number | null;
	commentCount: number | null;
	createdAt: Date;
	communityId: number;
}

export interface BusinessOpportunity {
	id: number;
	title: string;
	description: string;
	category: string | null;
	estimatedValue: number | null;
	createdAt: Date;
	postId: number;
}

// Enhanced API response interfaces
export interface CommunityData {
	id: number;
	name: string;
	displayName: string | null;
	subscriberCount: number | null;
	createdUtc: Date | null;
	lastUpdated: Date | null;
	counts: {
		posts: number;
		comments: number;
		opportunities: number;
		clusters: number;
	};
	analytics?: {
		totalPostUpvotes: number;
		avgPostUpvotes: number;
		totalPostScore: number;
		avgPostScore: number;
		totalCommentUpvotes: number;
		avgCommentUpvotes: number;
		engagementRate: number;
		recentPosts: Array<{
			id: number;
			title: string;
			upvotes: number;
			author: string;
			daysAgo: number;
		}>;
		topOpportunities: Array<{
			id: number;
			title: string;
			impactScore: number;
			painSeverity: string;
		}>;
	} | null;
}

export interface CommunitiesResponse {
	communities: CommunityData[];
	totalCommunities: number;
	timestamp: string;
	searchTerm?: string;
	limit: number;
}

// Business opportunity interfaces
export interface OpportunityData {
	id: number;
	title: string;
	description: string | null;
	impactScore: number | null;
	painSeverity: string | null;
	marketGap: string | null;
	validatedNeed: string | null;
	timeSensitivity: string | null;
	subreddit: {
		id: number;
		name: string;
		displayName: string | null;
	} | null;
	solutions: Array<{
		id: number;
		title: string;
		businessModel: string | null;
		marketSize: string | null;
		description: string | null;
	}>;
	processedAt: Date | null;
}

export interface OpportunitiesResponse {
	data: OpportunityData[];
	meta: {
		totalCount: number;
		limit: number;
		offset: number;
		hasMore: boolean;
		filters: {
			subredditId?: number;
			minImpactScore?: number;
		};
		userId?: string;
		timestamp: string;
	};
}

// Dashboard analytics interfaces
export interface DashboardAnalytics {
	totals: {
		posts: number;
		comments: number;
		opportunities: number;
		subreddits: number;
	};
	activity: {
		recentPosts24h: number;
	};
	topCommunities: Array<{
		id: number;
		name: string;
		displayName: string | null;
		subscriberCount: number | null;
		opportunityCount: number;
	}>;
	timestamp: string;
}

export interface DashboardResponse {
	data: DashboardAnalytics & {
		recentOpportunities?: Array<{
			id: number;
			title: string;
			impactScore: number | null;
			subreddit: string | null;
			createdAt: Date | null;
		}>;
		topCommunities?: Array<{
			id: number;
			name: string;
			subscriberCount: number | null;
			opportunityCount: number;
		}>;
	};
	meta: {
		userId?: string;
		timeframe: string;
		includeDetails: boolean;
		timestamp: string;
		requestId: string;
	};
}

// Admin system metrics interfaces
export interface SystemMetrics {
	database: {
		connectionStatus: boolean;
		latency: number;
		healthStatus: "healthy" | "unhealthy";
		statistics: {
			posts: number;
			comments: number;
			opportunities: number;
			subreddits: number;
		};
	};
	system: {
		uptime: number;
		memoryUsage: NodeJS.MemoryUsage;
		nodeVersion: string;
		platform: string;
		timestamp: string;
	};
	security: {
		totalEvents: number;
		failedAuthentications: number;
		rateLimitHits: number;
		uniqueIPs: number;
		recentFailures: Array<{
			timestamp: string;
			endpoint: string;
			errorType: string | undefined;
			ip: string;
			userAgent: string | undefined;
		}>;
	};
}

export interface SystemMetricsResponse {
	data: SystemMetrics;
	meta: {
		adminId?: string;
		timestamp: string;
		requestId: string;
	};
}

// API error interfaces
export interface APIError {
	error: string;
	details?: string;
	code?: string;
	timestamp: string;
	requestId?: string;
}

// Security and audit interfaces
export interface SecurityEvent {
	timestamp: string;
	endpoint: string;
	method: string;
	userId?: string;
	ip: string;
	userAgent?: string | null;
	success: boolean;
	errorType?: string;
	rateLimitHit?: boolean;
	processingTime?: number;
}

// Pagination interfaces
export interface PaginationMeta {
	limit: number;
	offset: number;
	totalCount: number;
	hasMore: boolean;
	page?: number;
	totalPages?: number;
}

// Generic API response wrapper
export interface APIResponse<T> {
	data: T;
	meta: {
		timestamp: string;
		requestId?: string;
		userId?: string;
		pagination?: PaginationMeta;
		[key: string]: any;
	};
}

// Database error types
export interface DatabaseErrorInfo {
	code?: string;
	message: string;
	originalError?: unknown;
	timestamp: string;
}
