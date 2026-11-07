import { db } from "@/db";
import {
  customers,
  invoiceItems,
  invoices,
  items,
  suppliers,
  treasuries,
} from "@/db/schema";
import { money, n, round2 } from "@/lib/money";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type LineInput = {
  itemId: number;
  code?: string;
  name?: string;
  unit?: string;
  price?: number;
  qty?: number;
  taxPercent?: number;
};

const STOCK_DIR: Record<string, number> = {
  sale: -1,
  sale_return: 1,
  purchase: 1,
  purchase_return: -1,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const rows = type
    ? await db.select().from(invoices).where(eq(invoices.type, type)).orderBy(desc(invoices.id))
    : await db.select().from(invoices).orderBy(desc(invoices.id));
  return Response.json({ ok: true, invoices: rows });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      partyId?: number | null;
      partyName?: string;
      warehouseId?: number;
      treasuryId?: number;
      paymentType?: string;
      discount?: number;
      delivery?: number;
      net?: number;
      paid?: number;
      notes?: string;
      status?: string;
      lines?: LineInput[];
    };

    const type = body.type ?? "sale";
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (lines.length === 0) {
      return Response.json({ ok: false, error: "أضف صنفاً واحداً على الأقل" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const last = await tx
        .select({ number: invoices.number })
        .from(invoices)
        .where(eq(invoices.type, type))
        .orderBy(desc(invoices.number))
        .limit(1);
      const number = (last[0]?.number ?? 4000) + 1;

      let subtotal = 0;
      let tax = 0;
      let qtyTotal = 0;
      const prepared = lines.map((line) => {
        const qty = n(line.qty, 1);
        const price = n(line.price);
        const taxPercent = n(line.taxPercent);
        const lineSub = round2(qty * price);
        const taxValue = round2(lineSub * (taxPercent / 100));
        subtotal = round2(subtotal + lineSub);
        tax = round2(tax + taxValue);
        qtyTotal = round2(qtyTotal + qty);
        return {
          itemId: n(line.itemId),
          code: String(line.code ?? ""),
          name: String(line.name ?? ""),
          unit: String(line.unit ?? "عدد"),
          price: money(price),
          qty: money(qty),
          taxPercent: money(taxPercent),
          taxValue: money(taxValue),
          total: money(lineSub + taxValue),
        };
      });

      // الخصم والتوصيل اتشالوا من البرنامج — الصافي = الإجمالي + الضريبة
      // ويُقبل الصافي القادم من الواجهة (لو أرسلته) لأن الخصم/التوصيل صفر
      const net =
        body.net != null ? round2(body.net) : round2(subtotal + tax);
      const paid = body.paymentType === "credit" ? round2(body.paid) : net;
      const remaining = round2(Math.max(net - paid, 0));

      const [invoice] = await tx
        .insert(invoices)
        .values({
          number,
          type,
          partyId: body.partyId ?? null,
          partyName: body.partyName ?? "نقدي",
          warehouseId: n(body.warehouseId, 1),
          treasuryId: n(body.treasuryId, 1),
          paymentType: body.paymentType ?? "cash",
          subtotal: money(subtotal),
          tax: money(tax),
          discount: money(0),
          delivery: money(0),
          paid: money(paid),
          remaining: money(remaining),
          net: money(net),
          notes: body.notes ?? "",
          status: body.status ?? "saved",
          itemCount: lines.length,
          qtyTotal: money(qtyTotal),
        })
        .returning();

      await tx.insert(invoiceItems).values(
        prepared.map((line) => ({
          invoiceId: invoice.id,
          ...line,
        })),
      );

      const dir = STOCK_DIR[type] ?? -1;
      for (const line of prepared) {
        await tx
          .update(items)
          .set({
            stock: sql`${items.stock} + ${dir * n(line.qty)}`,
          })
          .where(eq(items.id, line.itemId));
      }

      if ((type === "sale" || type === "sale_return") && body.partyId) {
        const sign = type === "sale" ? 1 : -1;
        await tx
          .update(customers)
          .set({
            balance: sql`${customers.balance} + ${sign * remaining}`,
          })
          .where(eq(customers.id, body.partyId));
      }

      if ((type === "purchase" || type === "purchase_return") && body.partyId) {
        const sign = type === "purchase" ? 1 : -1;
        await tx
          .update(suppliers)
          .set({
            balance: sql`${suppliers.balance} + ${sign * remaining}`,
          })
          .where(eq(suppliers.id, body.partyId));
      }

      const cashSign = type === "sale" || type === "purchase_return" ? 1 : -1;
      if (paid > 0 && (type === "sale" || type === "purchase" || type === "sale_return" || type === "purchase_return")) {
        await tx
          .update(treasuries)
          .set({
            balance: sql`${treasuries.balance} + ${cashSign * paid}`,
          })
          .where(eq(treasuries.id, n(body.treasuryId, 1)));
      }

      return invoice;
    });

    return Response.json({ ok: true, invoice: result });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر حفظ الفاتورة" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: number; status?: string };
    const id = n(body.id);
    if (!id) return Response.json({ ok: false, error: "المعرف مطلوب" }, { status: 400 });
    const [row] = await db
      .update(invoices)
      .set({ status: body.status ?? "suspended" })
      .where(and(eq(invoices.id, id)))
      .returning();
    return Response.json({ ok: true, invoice: row });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر تحديث الفاتورة" }, { status: 500 });
  }
}
