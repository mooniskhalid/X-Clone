import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {

    const { userId } = await params;
    
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
        where: { id: userId },
        include: { following: true, followed: true}
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const requester = await prisma.user.findUnique({
        where: { email: session.user?.email ?? ""},
    });

    if (!requester) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const follow = await prisma.follow.findFirst({
        where: {
            followedId: userId,
            followingId: requester?.id
        }
    });

    const { following, followed, ...userWithoutRelations } = user;

    return NextResponse.json({
        ...userWithoutRelations,
        isFollowing: !!follow,
        followerCount: followed.length,
        followingCount: following.length,
    }, { status: 200 });
    
}