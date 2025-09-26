import { PrismaClient } from "@prisma/client";

// Dynamically construct DATABASE_URL from individual environment variables
function getDatabaseUrl(): string {
	const dbUser = process.env.DB_USER;
	const dbPassword = process.env.DB_PASSWORD;
	const dbHost = process.env.DB_HOST;
	const dbPort = process.env.DB_PORT || "5432";
	const dbName = process.env.DB_NAME;
	const sslMode = process.env.DB_SSL_MODE || "require";

	// Validate required environment variables
	if (!dbUser || !dbPassword || !dbHost || !dbName) {
		throw new Error(
			"Missing required database environment variables: DB_USER, DB_PASSWORD, DB_HOST, DB_NAME"
		);
	}

	// Construct the connection string
	const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=${sslMode}`;

	console.log(
		`🔗 Database URL constructed: postgresql://${dbUser}:***@${dbHost}:${dbPort}/${dbName}?sslmode=${sslMode}`
	);

	return databaseUrl;
}

// Set the DATABASE_URL environment variable dynamically
process.env.DATABASE_URL = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV !== "production"
				? ["query", "info", "warn", "error"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
