import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/get-who-to-follow — brukere du ikke følger, sortert etter follower-antall
// ?limit=3 (sidebar) eller ingen limit (Follow-side)
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
        include: { following: { select: { followedId: true } } },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const followingIds = new Set(user.following.map((f) => f.followedId));
    followingIds.add(user.id);

    const candidates = await prisma.user.findMany({
        where: { id: { notIn: Array.from(followingIds) } },
        include: { _count: { select: { followed: true } } },
    });

    const sorted = candidates
        .sort((a, b) => b._count.followed - a._count.followed)
        .slice(0, limit)
        .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            followerCount: u._count.followed,
        }));

    return NextResponse.json(sorted, { status: 200 });
}
