import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// [NY] POST /api/mark-notifications-read — markerer alle varsler som lest
export async function POST(_request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true }, { status: 200 });
}
