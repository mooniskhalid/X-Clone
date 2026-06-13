import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
        return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    if (password.length < 6)
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        return NextResponse.json({ error: "Email already in use." }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, password: hashed } });

    return NextResponse.json({ ok: true }, { status: 201 });
}
