import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requester = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
    });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.authorId !== requester.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { content } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (content.length > 280) {
        return NextResponse.json({ error: "Post too long" }, { status: 400 });
    }

    const updated = await prisma.post.update({
        where: { id: postId },
        data: { content: content.trim() },
    });

    return NextResponse.json({ id: updated.id, content: updated.content }, { status: 200 });
}
