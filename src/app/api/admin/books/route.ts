import { NextRequest, NextResponse } from "next/server";
import { createAdminBook, listAdminBooks } from "@/lib/bookRepository";

export async function GET() {
  try {
    const result = await listAdminBooks();
    return NextResponse.json({ items: result.items, mode: result.mode });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unexpected error",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const result = await createAdminBook({
    title: typeof body.title === "string" ? body.title : undefined,
    subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
    collection: typeof body.collection === "string" ? body.collection : undefined,
    bajada: typeof body.bajada === "string" ? body.bajada : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    image: typeof body.image === "string" ? body.image : undefined,
    isbn: typeof body.isbn === "string" ? body.isbn : undefined,
    subject: typeof body.subject === "string" ? body.subject : undefined,
    publicationType: typeof body.publicationType === "string" ? body.publicationType : undefined,
    publishDate: typeof body.publishDate === "string" ? body.publishDate : undefined,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    price: typeof body.price === "number" ? body.price : undefined,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: result.error } },
      { status: 400 },
    );
  }

  return NextResponse.json({ item: result.item }, { status: 201 });
}
