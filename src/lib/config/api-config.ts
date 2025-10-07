// Centralized API configuration
// Change these values once and all your APIs will use them

// Development and production origins
const DEVELOPMENT_ORIGINS = [
	"http://localhost:4321",
	"http://localhost:4322",
	"http://localhost:3000",
	"http://127.0.0.1:4321",
	"http://127.0.0.1:4322",
];

const PRODUCTION_ORIGINS = [
	"https://yourdomain.com",
	"https://www.yourdomain.com",
	"https://app.yourdomain.com",
];

const ADMIN_ORIGINS = [
	...DEVELOPMENT_ORIGINS, // Include dev origins for admin too
	"https://admin.yourdomain.com",
];

// Auto-detect environment and use appropriate origins
const isProduction = process.env.NODE_ENV === "production";

export const CORS_CONFIG = {
	// Public APIs - allow all in dev, specific origins in production
	PUBLIC: isProduction ? PRODUCTION_ORIGINS : ["*"],

	// User APIs - localhost for dev, your domain for production
	USER: isProduction ? PRODUCTION_ORIGINS : DEVELOPMENT_ORIGINS,

	// Admin APIs - localhost + admin domain
	ADMIN: isProduction ? ["https://admin.yourdomain.com"] : DEVELOPMENT_ORIGINS,
};

// Rate limiting configuration (generous for development)
export const RATE_LIMITS = {
	PUBLIC: {
		IP: { requests: 2000, window: "1h" },
		USER: { requests: 2000, window: "1h" },
	},
	USER: {
		IP: { requests: 2000, window: "1h" }, // Very generous for development
		USER: { requests: 2000, window: "1h" }, // Very generous for development
	},
	ADMIN: {
		IP: { requests: 10000, window: "1h" },
		USER: { requests: 10000, window: "1h" },
	},
};

// Security settings
export const SECURITY_CONFIG = {
	HTTPS_ONLY: isProduction, // Only enforce HTTPS in production
	ENVIRONMENT: isProduction ? "production" : "development",
};
