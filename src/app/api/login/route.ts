import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const COOKIE_NAME =
    process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    if (!email || !password)
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    await prisma.session.create({
        data: { sessionToken, userId: user.id, expires },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires,
        secure: process.env.NODE_ENV === "production",
    });

    return res;
}
