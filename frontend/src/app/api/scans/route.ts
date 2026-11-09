import { ObjectId } from "mongodb";
import { getSessionUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { jsonError } from "@/lib/http";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Sign in to view your scans.", 401);
  const scans = await (await getDatabase()).collection("scans").find({ userId: new ObjectId(userId) }, { projection: { userId: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
  return Response.json({ scans: scans.map(({ _id, ...scan }) => ({ ...scan, id: _id.toString() })) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Sign in to save a scan.", 401);
  try {
    const body = await request.json();
    const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() : "";
    if (diagnosis !== "Uncertain") return jsonError("Aloe Vera identification and disease analysis are not connected. New photos can only be saved without a diagnosis.", 409);
    const confidence = Number(body.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) return jsonError("Confidence must be from 0 to 100.");
    const imageUrl = typeof body.imageUrl === "string" && body.imageUrl.length <= 150000 ? body.imageUrl : "";
    const recommendations: string[] = [];
    const plantName = typeof body.plantName === "string" ? body.plantName.trim().slice(0, 60) : "";
    const requestedPlantId = typeof body.plantId === "string" ? body.plantId.trim() : "";
    let plantId: string | undefined;
    if (requestedPlantId) {
      const userObjectId = new ObjectId(userId);
      const existingPlant = await (await getDatabase()).collection("scans").findOne({
        userId: userObjectId,
        $or: [
          ...(ObjectId.isValid(requestedPlantId) ? [{ _id: new ObjectId(requestedPlantId) }] : []),
          { plantId: requestedPlantId },
        ],
      }, { projection: { _id: 1 } });
      if (!existingPlant) return jsonError("That plant entry could not be found in your account.", 404);
      plantId = requestedPlantId;
    }
    const record = { userId: new ObjectId(userId), diagnosis, confidence: 0, imageUrl, recommendations, source: "sample", speciesStatus: "unverified", createdAt: new Date(), ...(plantId ? { plantId } : {}), ...(plantName ? { plantName } : {}) };
    const result = await (await getDatabase()).collection("scans").insertOne(record);
    return Response.json({ scan: { id: result.insertedId.toString(), ...record } }, { status: 201 });
  } catch (error) {
    console.error("Saving scan failed", error);
    return jsonError("Could not save this scan.", 503);
  }
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Sign in to delete scans.", 401);
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get("id");
  if (!scanId || !ObjectId.isValid(scanId)) return jsonError("Valid scan id required.", 400);

  const db = await getDatabase();
  const res = await db.collection("scans").deleteOne({
    _id: new ObjectId(scanId),
    $or: [{ userId: new ObjectId(userId) }, { owner_id: userId }],
  });
  if (res.deletedCount === 0) {
    return jsonError("Scan not found or unauthorized.", 404);
  }
  return Response.json({ success: true, message: "Scan deleted." });
}
