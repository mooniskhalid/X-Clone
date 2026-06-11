import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user, requester] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.user.findUnique({ where: { email: session.user?.email ?? "" } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });
    if (user.id === requester.id) return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });

    const follow = await prisma.follow.findFirst({
        where: { followedId: userId, followingId: requester.id },
    });

    if (follow) {
        await prisma.follow.delete({ where: { id: follow.id } });
        await prisma.notification.deleteMany({
            where: { userId, actorId: requester.id, type: "FOLLOW" },
        });
        return NextResponse.json({ message: "Unfollowed successfully" }, { status: 200 });
    }

    await prisma.follow.create({
        data: { followed: { connect: { id: userId } }, following: { connect: { id: requester.id } } },
    });

    // [NY] Opprett følge-varsel
    await prisma.notification.create({
        data: { userId, actorId: requester.id, type: "FOLLOW" },
    });

    return NextResponse.json({ message: "Followed successfully" }, { status: 200 });
}
