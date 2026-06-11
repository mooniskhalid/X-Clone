import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [NY] GET /api/get-who-to-follow — 3 brukere du ikke følger, sortert etter follower-antall
export async function GET(_request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
        include: { following: { select: { followedId: true } } },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const followingIds = new Set(user.following.map((f) => f.followedId));
    followingIds.add(user.id); // ikke vis deg selv

    const candidates = await prisma.user.findMany({
        where: { id: { notIn: Array.from(followingIds) } },
        include: { _count: { select: { followed: true } } },
        take: 20,
    });

    const sorted = candidates
        .sort((a, b) => b._count.followed - a._count.followed)
        .slice(0, 3)
        .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            followerCount: u._count.followed,
        }));

    return NextResponse.json(sorted, { status: 200 });
}
