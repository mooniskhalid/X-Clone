import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [NY] GET /api/get-trending — top 5 poster siste 48t sortert etter engagement (likes + kommentarer)
export async function GET(_request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const posts = await prisma.post.findMany({
        where: { createdAt: { gte: since } },
        include: {
            author: { select: { id: true, name: true, email: true, image: true } },
            _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    // Sorter klient-side på total engagement
    const sorted = posts
        .map((p) => ({ ...p, score: p._count.likes + p._count.comments }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const result = sorted.map((p) => ({
        id: p.id,
        content: p.content,
        author: p.author,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        score: p.score,
    }));

    return NextResponse.json(result, { status: 200 });
}
