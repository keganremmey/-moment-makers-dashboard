import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = formData.get("adminToken");
  const clientToken = formData.get("clientToken");
  const image = formData.get("image");

  if (
    !adminToken ||
    typeof token !== "string" ||
    !tokensMatch(token, adminToken)
  ) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (typeof clientToken !== "string" || clientToken.length === 0) {
    return NextResponse.json({ error: "Missing clientToken." }, { status: 400 });
  }

  if (!(image instanceof Blob) || image.size === 0) {
    return NextResponse.json({ error: "Missing image." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large." }, { status: 413 });
  }

  const supabase = supabaseServer();

  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("access_token", clientToken)
    .maybeSingle();
  const client = clientData as { id: string } | null;

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const contentType = image.type || "image/png";
  const extension = contentType.includes("png") ? "png" : "jpg";
  const path = `${client.id}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await image.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("vision-boards")
    .upload(path, buffer, { contentType });

  if (uploadError) {
    console.error("vision board upload error", uploadError);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({ vision_board_path: path } as never)
    .eq("id", client.id);

  if (updateError) {
    console.error("vision board client update error", updateError);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  return NextResponse.json({ path });
}
