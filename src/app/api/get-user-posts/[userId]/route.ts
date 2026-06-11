import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [ENDRET] Støtter paginering via ?cursor=<id>
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
    });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = 20;

    const posts = await prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
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

    const response = page.map((post) => ({
        id: post.id,
        content: post.content,
        image: post.image ?? null,
        createdAt: post.createdAt,
        author: post.author,
        likeCount: post.likes.length,
        repostCount: post.reposts.length,
        commentCount: post._count.comments,
        isLiked: post.likes.some((l) => l.userId === currentUser.id),
        isReposted: post.reposts.some((r) => r.userId === currentUser.id),
    }));

    return NextResponse.json({ posts: response, nextCursor }, { status: 200 });
}
