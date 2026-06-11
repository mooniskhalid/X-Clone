import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
    const { commentId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requester = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
    });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    if (comment.authorId !== requester.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.comment.delete({ where: { id: commentId } });
    // Returnerer postId slik at klienten kan oppdatere commentCount
    return NextResponse.json({ message: "Comment deleted", postId: comment.postId }, { status: 200 });
}
