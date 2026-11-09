import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "vera_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createSession(userId: string, email?: string, name?: string, role = "grower") {
  const token = await new SignJWT({
    sub: userId,
    email: email || "",
    role: role || "grower",
    aud: "authenticated",
    user_metadata: { name: name || "" },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  (await cookies()).set(cookieName, token, {
    httpOnly: false, // allows client JavaScript to read token for Bearer Authorization headers
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export async function getSessionUserId() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret())).payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getSessionToken() {
  return (await cookies()).get(cookieName)?.value ?? null;
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}
