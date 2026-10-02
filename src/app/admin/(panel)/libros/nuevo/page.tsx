import Link from "next/link";
import { BookForm } from "@/components/admin/BookForm";
import { listCollectionOptions, listNameOptions } from "@/services/catalog/admin-books";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const [collections, names] = await Promise.all([listCollectionOptions(), listNameOptions()]);
  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">
          <Link href="/admin/libros">Libros</Link>
        </p>
        <h2>Nuevo libro</h2>
        <p className="admin-sub">Se crea como borrador. Publícalo cuando tenga portada, precio y descripción.</p>
      </header>
      <BookForm
        id={null}
        collections={collections}
        authorOptions={names.authors}
        categoryOptions={names.categories}
        defaultValues={{
          title: "",
          slug: "",
          isbn: "",
          status: "DRAFT",
          price: "",
          collectionId: "",
          series: "",
          people: [{ name: "", role: "author" }],
          categories: [],
          bajada: "",
          description: "",
          authorBio: "",
          year: String(new Date().getFullYear()),
          pages: "",
          size: "",
          subject: "",
          featured: false,
          salesRank: "",
          stock: "0",
          stockNote: "Stock inicial",
          coverUrl: "",
          coverWidth: "",
          coverHeight: "",
        }}
      />
    </>
  );
}
