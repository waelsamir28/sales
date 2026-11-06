import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { money, n } from "@/lib/money";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const [row] = await db
      .insert(items)
      .values({
        code: String(body.code ?? ""),
        barcode: String(body.barcode ?? ""),
        name: String(body.name ?? ""),
        categoryId: n(body.categoryId, 1),
        unit: String(body.unit ?? "عدد"),
        price: money(body.price),
        cost: money(body.cost),
        taxPercent: money(body.taxPercent),
        stock: money(body.stock),
        minStock: money(body.minStock ?? 5),
        active: body.active !== false,
        saleOnly: body.saleOnly === true,
      })
      .returning();
    return Response.json({ ok: true, item: row });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر حفظ الصنف" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = n(body.id);
    if (!id) return Response.json({ ok: false, error: "رقم الصنف مطلوب" }, { status: 400 });
    const [row] = await db
      .update(items)
      .set({
        code: String(body.code ?? ""),
        barcode: String(body.barcode ?? ""),
        name: String(body.name ?? ""),
        categoryId: n(body.categoryId, 1),
        unit: String(body.unit ?? "عدد"),
        price: money(body.price),
        cost: money(body.cost),
        taxPercent: money(body.taxPercent),
        stock: money(body.stock),
        minStock: money(body.minStock ?? 5),
        active: body.active !== false,
        saleOnly: body.saleOnly === true,
      })
      .where(eq(items.id, id))
      .returning();
    return Response.json({ ok: true, item: row });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر تعديل الصنف" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = n(searchParams.get("id"));
    if (!id) return Response.json({ ok: false, error: "رقم الصنف مطلوب" }, { status: 400 });
    await db.delete(items).where(eq(items.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر حذف الصنف" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "category") {
      const [row] = await db
        .insert(categories)
        .values({
          name: String(body.name ?? "قسم جديد"),
          color: String(body.color ?? "#3b82f6"),
          sortOrder: n(body.sortOrder, 99),
        })
        .returning();
      return Response.json({ ok: true, category: row });
    }
    return Response.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر حفظ القسم" }, { status: 500 });
  }
}
