import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [NY] GET /api/search?q= — søk i poster og brukere
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requester = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ posts: [], users: [] }, { status: 200 });

    const [posts, users] = await Promise.all([
        prisma.post.findMany({
            where: { content: { contains: q } },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
                author: { select: { id: true, name: true, email: true, image: true } },
                likes: { select: { userId: true } },
                reposts: { select: { userId: true } },
                _count: { select: { comments: true } },
            },
        }),
        prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { email: { contains: q } },
                ],
            },
            take: 10,
            select: { id: true, name: true, email: true, image: true },
        }),
    ]);

    const postsWithMeta = posts.map((post) => ({
        id: post.id,
        content: post.content,
        image: post.image ?? null,
        createdAt: post.createdAt,
        author: post.author,
        likeCount: post.likes.length,
        repostCount: post.reposts.length,
        commentCount: post._count.comments,
        isLiked: post.likes.some((l) => l.userId === requester.id),
        isReposted: post.reposts.some((r) => r.userId === requester.id),
    }));

    return NextResponse.json({ posts: postsWithMeta, users }, { status: 200 });
}
