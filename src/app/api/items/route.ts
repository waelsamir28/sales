import { db } from "@/db";
import { categories, invoiceItems, items } from "@/db/schema";
import { money, n } from "@/lib/money";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * /api/items
 *  POST   { mode?: "item" | "quick" | "category", ... }   إضافة صنف / إضافة سريعة / بند
 *  PUT    { id, ... }    تعديل صنف
 *  PATCH  { mode: "category" | "item", id, ... }  تعديل بند أو صنف (نفس منطق POST)
 *  DELETE ?mode=item&id= | ?mode=category&id=
 */

function itemValues(body: Record<string, unknown>) {
  return {
    code: String(body.code ?? "").trim(),
    barcode: String(body.barcode ?? "").trim(),
    name: String(body.name ?? "").trim(),
    categoryId: n(body.categoryId, 1),
    unit: String(body.unit ?? "عدد").trim() || "عدد",
    price: money(body.price),
    cost: money(body.cost),
    taxPercent: money(body.taxPercent),
    stock: money(body.stock),
    minStock: money(body.minStock ?? 5),
    active: body.active !== false,
    saleOnly: body.saleOnly === true,
  };
}

async function nextItemCode() {
  const rows = await db.select({ code: items.code }).from(items);
  let max = 1000;
  for (const row of rows) {
    const value = Number(row.code);
    if (Number.isFinite(value) && value > max) max = value;
  }
  return String(max + 1);
}

async function nextBarcode() {
  const rows = await db.select({ barcode: items.barcode }).from(items);
  let max = 200000;
  for (const row of rows) {
    const value = Number(row.barcode);
    if (Number.isFinite(value) && value > max) max = value;
  }
  return String(max + 1);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mode = String(body.mode ?? "item");

    // ---------- بند / مجموعة جديدة ----------
    if (mode === "category") {
      const name = String(body.name ?? "").trim();
      if (!name) {
        return Response.json({ ok: false, error: "اكتب اسم البند أولاً" }, { status: 400 });
      }
      const existing = await db.select({ id: categories.id }).from(categories);
      const [row] = await db
        .insert(categories)
        .values({
          name,
          color: String(body.color ?? "#2563eb"),
          sortOrder: n(body.sortOrder, existing.length + 1),
        })
        .returning();
      return Response.json({ ok: true, category: row });
    }

    // ---------- إضافة سريعة (اسم + كمية + سعر) ----------
    if (mode === "quick") {
      const name = String(body.name ?? "").trim();
      if (!name) {
        return Response.json({ ok: false, error: "اكتب اسم الصنف أولاً" }, { status: 400 });
      }
      const catId = n(body.categoryId, 0);
      if (!catId) {
        return Response.json({ ok: false, error: "اختر البند (المجموعة) أولاً" }, { status: 400 });
      }
      const [row] = await db
        .insert(items)
        .values({
          code: String(body.code ?? "").trim() || (await nextItemCode()),
          barcode: String(body.barcode ?? "").trim() || (await nextBarcode()),
          name,
          categoryId: catId,
          unit: String(body.unit ?? "عدد").trim() || "عدد",
          price: money(body.price),
          cost: money(body.cost),
          taxPercent: money(body.taxPercent),
          stock: money(body.stock),
          minStock: money(body.minStock ?? 5),
          active: true,
          saleOnly: body.saleOnly === true,
        })
        .returning();
      return Response.json({ ok: true, item: row });
    }

    // ---------- إضافة صنف كاملة ----------
    const values = itemValues(body);
    if (!values.name) {
      return Response.json({ ok: false, error: "اكتب اسم الصنف أولاً" }, { status: 400 });
    }
    if (!values.code) values.code = await nextItemCode();
    if (!values.barcode) values.barcode = await nextBarcode();
    const [row] = await db.insert(items).values(values).returning();
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
      .set(itemValues(body))
      .where(eq(items.id, id))
      .returning();
    return Response.json({ ok: true, item: row });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر تعديل الصنف" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "category" || body.mode === "category") {
      const [row] = await db
        .insert(categories)
        .values({
          name: String(body.name ?? "بند جديد"),
          color: String(body.color ?? "#2563eb"),
          sortOrder: n(body.sortOrder, 99),
        })
        .returning();
      return Response.json({ ok: true, category: row });
    }
    return Response.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر حفظ البند" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = n(searchParams.get("id"));
    if (!id) return Response.json({ ok: false, error: "المعرف مطلوب" }, { status: 400 });

    if (searchParams.get("mode") === "category") {
      const used = await db
        .select({ id: items.id })
        .from(items)
        .where(eq(items.categoryId, id))
        .limit(1);
      if (used.length) {
        return Response.json(
          { ok: false, error: "البند فيه أصناف — انقل الأصناف أو احذفها أولاً" },
          { status: 400 },
        );
      }
      await db.delete(categories).where(eq(categories.id, id));
      return Response.json({ ok: true });
    }

    // امنع حذف صنف مستخدم في فواتير محفوظة (تفادي أخطاء البيانات)
    const usedInInvoices = await db
      .select({ id: invoiceItems.id })
      .from(invoiceItems)
      .where(eq(invoiceItems.itemId, id))
      .limit(1);
    if (usedInInvoices.length) {
      const [row] = await db
        .update(items)
        .set({ active: false })
        .where(eq(items.id, id))
        .returning();
      return Response.json({
        ok: true,
        item: row,
        message: "الصنف مستخدم في فواتير — تم إيقافه بدل حذفه",
      });
    }

    await db.delete(items).where(eq(items.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر الحذف" }, { status: 500 });
  }
}
