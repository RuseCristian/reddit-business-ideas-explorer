import { PrismaClient } from "../generated/prisma/client.js";
import { withAccelerate } from "@prisma/extension-accelerate";

const datasourceUrl = import.meta.env.DATABASE_URL;

if (!datasourceUrl) {
  console.warn(
    "[prisma] DATABASE_URL is not defined. Prisma Client will throw at runtime when accessed."
  );
}

const createClient = (): PrismaClient => {
  const client = new PrismaClient({
    datasourceUrl,
  });

  if (import.meta.env.PRISMA_ACCELERATE_URL) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return client;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? createClient();

if (import.meta.env.DEV) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
