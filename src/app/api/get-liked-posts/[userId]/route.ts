import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const posts = await prisma.post.findMany({
        where: { authorId: userId },
        include: {
            author: { select: { id: true, name: true, email: true, image: true } },
            likes: { select: { userId: true } },
            reposts: { select: { userId: true } },
            _count: { select: { comments: true } },
            quotedPost: {
                include: { author: { select: { id: true, name: true, email: true, image: true } } },
            },
        },
    });

    const result = posts
        .map((p) => ({
            id: p.id,
            content: p.content,
            image: p.image ?? null,
            createdAt: p.createdAt,
            author: p.author,
            likeCount: p.likes.length,
            repostCount: p.reposts.length,
            commentCount: p._count.comments,
            isLiked: p.likes.some((l) => l.userId === currentUser.id),
            isReposted: p.reposts.some((r) => r.userId === currentUser.id),
            quotedPost: p.quotedPost ?? null,
            repostedBy: null,
        }))
        .sort((a, b) => b.likeCount - a.likeCount);

    return NextResponse.json(result, { status: 200 });
}
