import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hent alle denne brukeren følger (followingId === userId → followed er brukeren de følger)
    const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
            followed: {
                select: { id: true, name: true, email: true, image: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const users = follows.map((f) => f.followed);
    return NextResponse.json(users, { status: 200 });
}
