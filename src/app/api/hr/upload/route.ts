import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import * as hrService from "@/services/hr-unified";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function isPdf(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    if (!isPdf(file)) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const audienceRole = String(formData.get("audienceRole") || "all");
    const requiresAck = String(formData.get("requiresAck") || "false") === "true";
    const expiresAt = String(formData.get("expiresAt") || "").trim();
    const createdBy = String(formData.get("createdBy") || "").trim();

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const fileId = randomUUID();
    const safeName = `${fileId}.pdf`;
    const filePath = `/uploads/${safeName}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, safeName), buffer);

    const document = await hrService.createDocument({
      title,
      description: description || null,
      filePath,
      audienceRole: audienceRole as "all" | "employee" | "manager" | "hr",
      requiresAck,
      createdBy: createdBy || null,
      expiresAt: expiresAt || null,
    });

    if (!document) {
      return NextResponse.json({ error: "Unable to create document" }, { status: 500 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
