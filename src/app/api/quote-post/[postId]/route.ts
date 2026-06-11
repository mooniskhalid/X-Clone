import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requester = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const originalPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!originalPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const quotePost = await prisma.post.create({
        data: {
            content,
            authorId: requester.id,
            quotedPostId: postId,
        },
        include: {
            author: { select: { id: true, name: true, email: true, image: true } },
            likes: true,
            reposts: true,
            comments: { select: { id: true } },
            quotedPost: {
                include: {
                    author: { select: { id: true, name: true, email: true, image: true } },
                },
            },
        },
    });

    const result = {
        ...quotePost,
        likeCount: 0,
        repostCount: 0,
        commentCount: 0,
        isLiked: false,
        isReposted: false,
    };

    return NextResponse.json(result, { status: 201 });
}
