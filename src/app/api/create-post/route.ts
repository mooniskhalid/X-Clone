import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE = 2_000_000;

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content, image } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (content.length > 280) return NextResponse.json({ error: "Post too long" }, { status: 400 });

    // [NY] Valider bildestørrelse
    if (image && image.length > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "Image is too large (max ~1.5 MB)" }, { status: 400 });
    }

    const author = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!author) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const post = await prisma.post.create({
        data: { content: content.trim(), authorId: author.id, image: image ?? null },
        include: { author: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({
        id: post.id,
        content: post.content,
        image: post.image ?? null,
        createdAt: post.createdAt,
        author: post.author,
        likeCount: 0,
        repostCount: 0,
        commentCount: 0,
        isLiked: false,
        isReposted: false,
    }, { status: 201 });
}
