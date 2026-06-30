import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { SessionUser } from "@/types";

export const AUTH_COOKIE = "taskflow_token";
export type { SessionUser };

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "admin" && payload.role !== "member")
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      avatar: typeof payload.avatar === "string" ? payload.avatar : "",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
