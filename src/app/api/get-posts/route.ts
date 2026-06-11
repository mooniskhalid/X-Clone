import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [ENDRET] Støtter paginering via ?cursor=<createdAt> og ?limit=<n> (default 20)
// Støtter ?feed=following for filtrert feed
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requester = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
        include: { following: true },
    });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const feed = searchParams.get("feed");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: limit + 1, // hent én ekstra for å avgjøre om det finnes flere
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
            author: { select: { id: true, name: true, email: true, image: true } },
            likes: { select: { userId: true } },
            reposts: { select: { userId: true } },
            _count: { select: { comments: true } },
        },
    });

    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    const postsWithMeta = page.map((post) => ({
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

    if (feed === "following") {
        const followingIds = new Set(requester.following.map((f) => f.followedId));
        const filtered = postsWithMeta.filter(
            (post) => post.author.id === requester.id || followingIds.has(post.author.id)
        );
        return NextResponse.json({ posts: filtered, nextCursor }, { status: 200 });
    }

    return NextResponse.json({ posts: postsWithMeta, nextCursor }, { status: 200 });
}
