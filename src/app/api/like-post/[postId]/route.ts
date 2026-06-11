import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await prisma.like.findFirst({ where: { postId, userId: user.id } });

    if (existing) {
        await prisma.like.delete({ where: { id: existing.id } });
        // Fjern eventuelt eksisterende like-varsel
        await prisma.notification.deleteMany({
            where: { userId: post.authorId, actorId: user.id, type: "LIKE", postId },
        });
        return NextResponse.json({ liked: false }, { status: 200 });
    }

    await prisma.like.create({
        data: { post: { connect: { id: postId } }, user: { connect: { id: user.id } } },
    });

    // [NY] Opprett varsel hvis du liker noen andres post
    if (post.authorId !== user.id) {
        await prisma.notification.create({
            data: { userId: post.authorId, actorId: user.id, type: "LIKE", postId },
        });
    }

    return NextResponse.json({ liked: true }, { status: 200 });
}
