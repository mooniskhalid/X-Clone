import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
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

    await prisma.post.delete({ where: { id: postId } });
    return NextResponse.json({ message: "Post deleted" }, { status: 200 });
}
