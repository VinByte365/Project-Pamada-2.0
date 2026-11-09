import { ObjectId } from "mongodb";
import { getSessionUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  const id = await getSessionUserId();
  if (!id || !ObjectId.isValid(id)) return Response.json({ user: null }, { status: 401 });
  const user = await (await getDatabase())
    .collection("users")
    .findOne({ _id: new ObjectId(id) }, { projection: { name: 1, email: 1, image: 1, role: 1 } });
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({
    user: {
      id,
      name: user.name,
      email: user.email,
      role: user.role || "grower",
      image: user.image ?? "",
    },
  });
}
