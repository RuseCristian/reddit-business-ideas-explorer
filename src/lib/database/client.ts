import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
	throw new Error(
		"DATABASE_URL environment variable is required. Please set it in your .env file."
	);
}

// Type for global Prisma instance
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// Neon-optimized Prisma client configuration
const createPrismaClient = () => {
	return new PrismaClient({
		// Enable query logging in development only (disabled for cleaner console)
		log:
			process.env.NODE_ENV === "development"
				? ["error", "warn"] // Removed "query" for cleaner output
				: ["error"],

		// Neon serverless optimization
		datasourceUrl: process.env.DATABASE_URL,
	});
};

// Use singleton pattern to prevent multiple instances
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Prevent multiple Prisma instances in development
if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

// Database connection utilities
export class DatabaseConnection {
	/**
	 * Test database connection with retry logic
	 */
	static async testConnection(retries = 3): Promise<boolean> {
		for (let i = 0; i < retries; i++) {
			try {
				await prisma.$queryRaw`SELECT 1`;
				console.log("✅ Database connection successful");
				return true;
			} catch (error) {
				console.error(`❌ Database connection attempt ${i + 1} failed:`, error);
				if (i === retries - 1) {
					return false;
				}
				// Wait before retry (exponential backoff)
				await new Promise((resolve) =>
					setTimeout(resolve, Math.pow(2, i) * 1000)
				);
			}
		}
		return false;
	}

	/**
	 * Gracefully disconnect from database
	 */
	static async disconnect(): Promise<void> {
		try {
			await prisma.$disconnect();
			console.log("📤 Database disconnected gracefully");
		} catch (error) {
			console.error("Error disconnecting from database:", error);
		}
	}

	/**
	 * Get database metrics for monitoring
	 */
	static async getMetrics(): Promise<{
		connectionStatus: boolean;
		latency: number;
		timestamp: string;
	}> {
		const start = Date.now();
		try {
			await prisma.$queryRaw`SELECT 1`;
			const latency = Date.now() - start;
			return {
				connectionStatus: true,
				latency,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				connectionStatus: false,
				latency: Date.now() - start,
				timestamp: new Date().toISOString(),
			};
		}
	}
}

// Graceful shutdown handlers
if (typeof process !== "undefined") {
	process.on("beforeExit", async () => {
		await DatabaseConnection.disconnect();
	});

	process.on("SIGINT", async () => {
		await DatabaseConnection.disconnect();
		process.exit(0);
	});

	process.on("SIGTERM", async () => {
		await DatabaseConnection.disconnect();
		process.exit(0);
	});
}
