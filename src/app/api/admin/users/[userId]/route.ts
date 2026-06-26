import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, unauthorized, forbidden } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  password: z.string().min(6).max(100).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, role, password } = parsed.data;
  const data: { name?: string; role?: Role; password?: string } = {};
  if (name) data.name = name;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: params.userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (!isAdmin(session)) return forbidden();

  if (params.userId === session.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: params.userId } });
  return NextResponse.json({ ok: true });
}
