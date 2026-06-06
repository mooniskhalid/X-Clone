import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
    });

    if (!requester) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            author: {
                select: { id: true, name: true, email: true, image: true },
            },
            likes: { select: { userId: true } },
            reposts: { select: { userId: true } },
        },
    });

    const postsWithMeta = posts.map((post) => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        author: post.author,
        likeCount: post.likes.length,
        repostCount: post.reposts.length,
        isLiked: post.likes.some((l) => l.userId === requester.id),
        isReposted: post.reposts.some((r) => r.userId === requester.id),
    }));

    return NextResponse.json(postsWithMeta, { status: 200 });
}
