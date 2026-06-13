import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE = 2_000_000;

export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requester = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const body = await request.json();
    const { name, bio, email, image, banner, showEmail } = body; // [ENDRET]

    if (image && image.length > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "Profile image is too large (max ~1.5 MB)" }, { status: 400 });
    }
    if (banner && banner.length > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "Banner image is too large (max ~1.5 MB)" }, { status: 400 });
    }

    // [ENDRET] Bug: forhindre e-post fra å bli satt til tom streng/null — det låser brukeren ute
    const trimmedEmail = typeof email === "string" ? email.trim() : undefined;
    if (trimmedEmail !== undefined && trimmedEmail.length === 0) {
        return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
    }

    if (trimmedEmail && trimmedEmail !== requester.email) {
        const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (existing) return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: requester.id },
        data: {
            ...(name !== undefined && { name: name.trim() || null }),
            ...(bio !== undefined && { bio: bio.trim() || null }),
            ...(trimmedEmail !== undefined && { email: trimmedEmail }),
            ...(image !== undefined && { image }),
            ...(banner !== undefined && { banner }),
            ...(showEmail !== undefined && { showEmail: !!showEmail }), // [NY]
        },
    });

    return NextResponse.json(updated, { status: 200 });
}
