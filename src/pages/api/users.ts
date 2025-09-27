import type { APIRoute } from "astro";
import prisma from "../../lib/prisma";

export const GET: APIRoute = async () => {
  try {
    const users = await prisma.user.findMany({
      include: { posts: true },
      orderBy: { id: "asc" },
    });

    return new Response(JSON.stringify(users), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/users] Failed to fetch users", error);

    return new Response(
      JSON.stringify({ message: "Unable to load users" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
