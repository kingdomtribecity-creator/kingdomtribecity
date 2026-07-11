import { NextResponse } from "next/server";
import { getObjectStream, r2Configured } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  if (!r2Configured) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const object = await getObjectStream(objectKey);
    if (!object.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stream = object.Body.transformToWebStream();

    return new Response(stream, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        ...(object.ContentLength ? { "Content-Length": String(object.ContentLength) } : {}),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
