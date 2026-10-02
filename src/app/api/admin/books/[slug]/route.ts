import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { deleteAdminBook, getAdminBook, updateAdminBook } from "@/lib/bookRepository";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;
  const { slug } = await params;
  const result = await getAdminBook(slug);

  if ("error" in result) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Book not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ item: result.item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;
  const { slug } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const result = await updateAdminBook(slug, {
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
      { error: { code: "NOT_FOUND", message: "Book not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ item: result.item });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;
  const { slug } = await params;
  const result = await deleteAdminBook(slug);

  if ("error" in result) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Book not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, item: result.item });
}
