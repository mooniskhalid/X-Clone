import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: { select: { id: true, name: true, email: true, image: true } },
            likes: { select: { userId: true } },
            reposts: { select: { userId: true } },
            _count: { select: { comments: true } },
        },
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({
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
    }, { status: 200 });
}
