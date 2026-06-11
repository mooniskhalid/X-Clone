import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [NY] GET /api/get-notifications — henter varsler for innlogget bruker (max 30)
export async function GET(_request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
            actor: { select: { id: true, name: true, email: true, image: true } },
            post: { select: { id: true, content: true } },
        },
    });

    const unreadCount = await prisma.notification.count({ where: { userId: user.id, read: false } });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
}
