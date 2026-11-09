import { hash } from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" && body.role.trim() ? body.role.trim() : "grower";

    if (name.length < 2 || name.length > 80) return jsonError("Enter a name between 2 and 80 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return jsonError("Enter a valid email address.");
    if (password.length < 6 || password.length > 72) return jsonError("Password must be 6–72 characters.");

    const db = await getDatabase();
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });
    if (await users.findOne({ email })) return jsonError("An account with this email already exists.", 409);

    const result = await users.insertOne({
      name,
      email,
      role,
      passwordHash: await hash(password, 12),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = result.insertedId.toString();
    const token = await createSession(userId, email, name, role);

    return Response.json(
      {
        token,
        user: { id: userId, name, email, role },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return jsonError("An account with this email already exists.", 409);
    }
    console.error("Registration failed", error);
    return jsonError("Could not create your account. Check the database connection and try again.", 503);
  }
}
