import { ObjectId } from "mongodb";
import { getSessionUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { jsonError } from "@/lib/http";

export async function GET() {
  const id = await getSessionUserId();
  if (!id || !ObjectId.isValid(id)) return jsonError("Sign in to view your profile.", 401);
  const user = await (await getDatabase()).collection("users").findOne({ _id: new ObjectId(id) }, { projection: { name: 1, email: 1, image: 1 } });
  return user ? Response.json({ user: { name: user.name, email: user.email, image: user.image ?? "" } }) : jsonError("Account not found.", 404);
}

export async function PATCH(request: Request) {
  const id = await getSessionUserId();
  if (!id || !ObjectId.isValid(id)) return jsonError("Sign in to update your profile.", 401);
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 80) return jsonError("Name must be between 2 and 80 characters.");
    const result = await (await getDatabase()).collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { name, updatedAt: new Date() } });
    if (!result.matchedCount) return jsonError("Account not found.", 404);
    return Response.json({ user: { name } });
  } catch (error) {
    console.error("Profile update failed", error);
    return jsonError("Could not update your profile.", 503);
  }
}
