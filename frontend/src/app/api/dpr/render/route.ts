import { NextResponse } from "next/server";

export async function POST() {
  // Stub — real impl would render PDF via WeasyPrint and return storage URL.
  // Keep deterministic; DPRPreview already validates numbers === math.ts.
  return NextResponse.json({ pdfUrl: "/mock/dpr.pdf", status: "ready" });
}

export async function GET() {
  return NextResponse.json({ pdfUrl: "/mock/dpr.pdf", status: "ready" });
}
