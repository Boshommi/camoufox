import { NextRequest, NextResponse } from "next/server";
import { getDb } from "~/server/db";

interface CanvasUpload {
  hash: string;
  width: number;
  height: number;
  method: string;
  sourceUrl: string;
  pixelData: string; // base64 encoded image
}

// GET - List all canvas fingerprints with their renders
export async function GET() {
  const db = getDb();
  const fingerprints = await db.canvasFingerprint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      renders: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return NextResponse.json(fingerprints);
}

// POST - Upload canvas fingerprints (single or batch)
export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Handle both single and batch uploads
  const items: CanvasUpload[] = Array.isArray(body) ? body : [body];

  const results = await Promise.all(
    items.map((item) =>
      db.canvasFingerprint.upsert({
        where: { hash: item.hash },
        update: {
          width: item.width,
          height: item.height,
          method: item.method,
          sourceUrl: item.sourceUrl,
          pixelData: item.pixelData,
        },
        create: {
          hash: item.hash,
          width: item.width,
          height: item.height,
          method: item.method,
          sourceUrl: item.sourceUrl,
          pixelData: item.pixelData,
        },
      }),
    ),
  );

  return NextResponse.json({ count: results.length, items: results });
}

// DELETE - Clear all canvas fingerprints
export async function DELETE() {
  const db = getDb();
  await db.canvasFingerprint.deleteMany();
  return NextResponse.json({ success: true });
}
