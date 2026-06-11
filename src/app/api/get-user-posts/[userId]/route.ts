import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const currentUserId = currentUser.id;

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor"); // ISO timestamp
    const limit = 20;
    const cursorDate = cursor ? new Date(cursor) : undefined;

    const postInclude = {
        author: { select: { id: true, name: true, email: true, image: true } },
        likes: { select: { userId: true } },
        reposts: { select: { userId: true } },
        _count: { select: { comments: true } },
        quotedPost: {
            include: { author: { select: { id: true, name: true, email: true, image: true } } },
        },
    };

    // Hent brukerens egne poster
    const posts = await prisma.post.findMany({
        where: {
            authorId: userId,
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        include: postInclude,
    });

    // Hent brukerens reposts
    const reposts = await prisma.repost.findMany({
        where: {
            userId,
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        include: {
            user: { select: { id: true, name: true, email: true } },
            post: { include: postInclude },
        },
    });

    function fmt(post: any, repostedBy?: any, repostDate?: Date) {
        return {
            id: post.id,
            content: post.content,
            image: post.image ?? null,
            createdAt: repostDate ? repostDate.toISOString() : post.createdAt,
            author: post.author,
            likeCount: post.likes.length,
            repostCount: post.reposts.length,
            commentCount: post._count.comments,
            isLiked: post.likes.some((l: any) => l.userId === currentUserId),
            isReposted: post.reposts.some((r: any) => r.userId === currentUserId),
            quotedPost: post.quotedPost ?? null,
            repostedBy: repostedBy ?? null,
        };
    }

    const postIds = new Set(posts.map((p) => p.id));

    const combined = [
        ...posts.map((p) => ({ sortDate: new Date(p.createdAt), item: fmt(p) })),
        ...reposts
            .filter((r) => !postIds.has(r.postId))
            .map((r) => ({ sortDate: new Date(r.createdAt), item: fmt(r.post, r.user, r.createdAt) })),
    ]
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
        .slice(0, limit + 1);

    const hasMore = combined.length > limit;
    const page = hasMore ? combined.slice(0, limit) : combined;
    const nextCursor = hasMore ? page[page.length - 1].sortDate.toISOString() : null;

    return NextResponse.json({ posts: page.map((x) => x.item), nextCursor }, { status: 200 });
}
