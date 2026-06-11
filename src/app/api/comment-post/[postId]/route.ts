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

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json(
        comments.map((c) => ({ id: c.id, content: c.content, createdAt: c.createdAt, author: c.author })),
        { status: 200 }
    );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const { content } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
        return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
        data: { content: content.trim(), postId, authorId: user.id },
        include: { author: { select: { id: true, name: true, email: true, image: true } } },
    });

    // [NY] Opprett svar-varsel hvis du kommenterer på noen andres post
    if (post.authorId !== user.id) {
        await prisma.notification.create({
            data: { userId: post.authorId, actorId: user.id, type: "REPLY", postId },
        });
    }

    return NextResponse.json(
        { id: comment.id, content: comment.content, createdAt: comment.createdAt, author: comment.author },
        { status: 201 }
    );
}
