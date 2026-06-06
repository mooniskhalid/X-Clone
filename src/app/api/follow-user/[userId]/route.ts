 import { getServerSession } from "next-auth";
 import { NextRequest, NextResponse } from "next/server";
 import { authOptions } from "../../auth/[...nextauth]/route";
 import { prisma } from "@/lib/prisma";
 
 export async function POST (request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
 
     const { userId } = await params;
     
     const session = await getServerSession(authOptions);
 
     if (!session) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }
 
     const user = await prisma.user.findUnique({
         where: { id: userId },
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

     if (user.email === requester?.email) {
        return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
     }

     const follow = await prisma.follow.findFirst({
        where: {
            followedId: userId,
            followingId: requester?.id
        }
     });

     if (follow) {
        await prisma.follow.delete({
            where: {
                id: follow.id
            }
        });
        return NextResponse.json({ message: "Unfollowed successfully" }, { status: 200 });
     } else {
        await prisma.follow.create({
            data: {
                followed: { connect: { id: user.id } },
                following: { connect: { id: requester?.id } },
            }
        });
        return NextResponse.json({ message: "Followed successfully" }, { status: 200 });
     }
     
 }