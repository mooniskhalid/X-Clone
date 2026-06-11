import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const POST_INCLUDE = (requesterId: string) => ({
    author: { select: { id: true, name: true, email: true, image: true } },
    likes: { select: { userId: true } },
    reposts: { select: { userId: true } },
    _count: { select: { comments: true } },
    quotedPost: {
        include: { author: { select: { id: true, name: true, email: true, image: true } } },
    },
});

function formatPost(post: any, requesterId: string, repostedBy?: { id: string; name: string | null; email: string | null } | null, repostDate?: Date) {
    return {
        id: post.id,
        content: post.content,
        image: post.image ?? null,
        createdAt: repostDate ? repostDate.toISOString() : post.createdAt,
        originalCreatedAt: post.createdAt,
        author: post.author,
        likeCount: post.likes.length,
        repostCount: post.reposts.length,
        commentCount: post._count.comments,
        isLiked: post.likes.some((l: any) => l.userId === requesterId),
        isReposted: post.reposts.some((r: any) => r.userId === requesterId),
        quotedPost: post.quotedPost ?? null,
        repostedBy: repostedBy ?? null,
    };
}

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
    const cursor = searchParams.get("cursor"); // ISO timestamp
    const limit = 20;

    const cursorDate = cursor ? new Date(cursor) : undefined;
    const followingIds = new Set(requester.following.map((f) => f.followedId));

    // Hent originale poster
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        where: {
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            ...(feed === "following"
                ? { authorId: { in: [...followingIds, requester.id] } }
                : {}),
        },
        include: POST_INCLUDE(requester.id),
    });

    // Hent reposts
    const reposts = await prisma.repost.findMany({
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        where: {
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            NOT: { userId: requester.id }, // ikke vis egne reposts som separate items
            ...(feed === "following"
                ? { userId: { in: [...followingIds] } }
                : {}),
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
            post: { include: POST_INCLUDE(requester.id) },
        },
    });

    // Konverter poster til feed-items
    const postItems = posts.map((p) => ({
        sortDate: new Date(p.createdAt),
        item: formatPost(p, requester.id),
    }));

    // Konverter reposts til feed-items (unngå duplikater — ikke vis repost hvis originalpost allerede er i feeden)
    const postIds = new Set(posts.map((p) => p.id));
    const repostItems = reposts
        .filter((r) => !postIds.has(r.postId))
        .map((r) => ({
            sortDate: new Date(r.createdAt),
            item: formatPost(r.post, requester.id, r.user, r.createdAt),
        }));

    // Flett og sorter
    const combined = [...postItems, ...repostItems]
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
        .slice(0, limit + 1);

    const hasMore = combined.length > limit;
    const page = hasMore ? combined.slice(0, limit) : combined;
    const nextCursor = hasMore ? page[page.length - 1].sortDate.toISOString() : null;

    return NextResponse.json({ posts: page.map((x) => x.item), nextCursor }, { status: 200 });
}
