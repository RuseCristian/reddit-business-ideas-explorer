// Environment variable loader - ensures .env is loaded before anything else
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Re-export for convenience
export { config } from "dotenv";

// Validate that critical environment variables are loaded
if (!process.env.DATABASE_URL) {
	console.error("❌ Failed to load DATABASE_URL from .env file");
	console.error(
		"Please ensure your .env file exists and contains DATABASE_URL"
	);
	process.exit(1);
}

console.log("✅ Environment variables loaded successfully");
