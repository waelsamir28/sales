import { db } from "@/db";
import {
  attendance,
  cashTransactions,
  customers,
  employees,
  expenses,
  installmentPayments,
  installments,
  settings,
  suppliers,
  treasuries,
  warehouseTransfers,
} from "@/db/schema";
import { money, n } from "@/lib/money";
import { and, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "cash") {
      const type = String(body.type ?? "receipt");
      const amount = n(body.amount);
      const treasuryId = n(body.treasuryId, 1);
      const sign = type === "receipt" ? 1 : -1;
      const [row] = await db
        .insert(cashTransactions)
        .values({
          type,
          partyType: String(body.partyType ?? "other"),
          partyId: body.partyId ? n(body.partyId) : null,
          partyName: String(body.partyName ?? ""),
          amount: money(amount),
          treasuryId,
          notes: String(body.notes ?? ""),
        })
        .returning();
      await db
        .update(treasuries)
        .set({ balance: sql`${treasuries.balance} + ${sign * amount}` })
        .where(eq(treasuries.id, treasuryId));

      if (body.partyType === "customer" && body.partyId) {
        await db
          .update(customers)
          .set({ balance: sql`${customers.balance} - ${sign * amount}` })
          .where(eq(customers.id, n(body.partyId)));
      }
      if (body.partyType === "supplier" && body.partyId) {
        await db
          .update(suppliers)
          .set({ balance: sql`${suppliers.balance} - ${sign * amount}` })
          .where(eq(suppliers.id, n(body.partyId)));
      }
      return Response.json({ ok: true, row });
    }

    if (action === "expense") {
      const amount = n(body.amount);
      const treasuryId = n(body.treasuryId, 1);
      const [row] = await db
        .insert(expenses)
        .values({
          category: String(body.category ?? "متنوعة"),
          amount: money(amount),
          treasuryId,
          notes: String(body.notes ?? ""),
        })
        .returning();
      await db
        .update(treasuries)
        .set({ balance: sql`${treasuries.balance} - ${amount}` })
        .where(eq(treasuries.id, treasuryId));
      return Response.json({ ok: true, row });
    }

    if (action === "transfer") {
      const [row] = await db
        .insert(warehouseTransfers)
        .values({
          fromWarehouseId: n(body.fromWarehouseId, 1),
          toWarehouseId: n(body.toWarehouseId, 2),
          itemId: n(body.itemId),
          qty: money(body.qty ?? 1),
          notes: String(body.notes ?? ""),
        })
        .returning();
      return Response.json({ ok: true, row });
    }

    if (action === "attendance") {
      const employeeId = n(body.employeeId);
      const date = String(body.date ?? new Date().toISOString().slice(0, 10));
      const existing = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, date)))
        .limit(1);
      if (existing[0]) {
        const [row] = await db
          .update(attendance)
          .set({
            checkIn: String(body.checkIn ?? existing[0].checkIn),
            checkOut: String(body.checkOut ?? existing[0].checkOut),
            notes: String(body.notes ?? existing[0].notes),
          })
          .where(eq(attendance.id, existing[0].id))
          .returning();
        return Response.json({ ok: true, row });
      }
      const [row] = await db
        .insert(attendance)
        .values({
          employeeId,
          date,
          checkIn: String(body.checkIn ?? ""),
          checkOut: String(body.checkOut ?? ""),
          notes: String(body.notes ?? ""),
        })
        .returning();
      return Response.json({ ok: true, row });
    }

    if (action === "settings") {
      const entries = (body.entries ?? {}) as Record<string, string>;
      for (const [key, value] of Object.entries(entries)) {
        const found = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
        if (found[0]) {
          await db.update(settings).set({ value: String(value) }).where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({ key, value: String(value) });
        }
      }
      return Response.json({ ok: true });
    }

    if (action === "punch") {
      const employeeId = n(body.employeeId, 1);
      const date = new Date().toISOString().slice(0, 10);
      const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const existing = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, date)))
        .limit(1);
      if (!existing[0]) {
        const [row] = await db
          .insert(attendance)
          .values({ employeeId, date, checkIn: now, checkOut: "", notes: "" })
          .returning();
        return Response.json({ ok: true, row });
      }
      const [row] = await db
        .update(attendance)
        .set({ checkOut: now })
        .where(eq(attendance.id, existing[0].id))
        .returning();
      return Response.json({ ok: true, row });
    }

    if (action === "employee-toggle") {
      const id = n(body.id);
      await db.update(employees).set({ active: Boolean(body.active) }).where(eq(employees.id, id));
      return Response.json({ ok: true });
    }

    if (action === "installment") {
      const total = n(body.total);
      const downPayment = n(body.downPayment);
      const months = Math.max(1, n(body.months, 3));
      const remaining = Math.max(total - downPayment, 0);
      const [row] = await db
        .insert(installments)
        .values({
          customerId: n(body.customerId),
          invoiceId: body.invoiceId ? n(body.invoiceId) : null,
          title: String(body.title ?? "عقد تقسيط"),
          total: money(total),
          downPayment: money(downPayment),
          remaining: money(remaining),
          months,
          monthlyAmount: money(remaining / months),
          startDate: String(body.startDate ?? new Date().toISOString().slice(0, 10)),
          status: remaining <= 0 ? "done" : "active",
          notes: String(body.notes ?? ""),
        })
        .returning();
      if (downPayment > 0) {
        await db
          .update(customers)
          .set({ balance: sql`${customers.balance} + ${remaining}` })
          .where(eq(customers.id, n(body.customerId)));
      }
      return Response.json({ ok: true, row });
    }

    if (action === "installment-pay") {
      const id = n(body.id);
      const amount = n(body.amount);
      const treasuryId = n(body.treasuryId, 1);
      const found = await db.select().from(installments).where(eq(installments.id, id)).limit(1);
      if (!found[0]) return Response.json({ ok: false, error: "العقد غير موجود" }, { status: 404 });
      const left = Math.max(n(found[0].remaining) - amount, 0);
      const [row] = await db
        .update(installments)
        .set({
          remaining: money(left),
          status: left <= 0 ? "done" : "active",
        })
        .where(eq(installments.id, id))
        .returning();
      await db.insert(installmentPayments).values({
        installmentId: id,
        amount: money(amount),
        treasuryId,
        notes: String(body.notes ?? "قسط"),
      });
      await db
        .update(treasuries)
        .set({ balance: sql`${treasuries.balance} + ${amount}` })
        .where(eq(treasuries.id, treasuryId));
      await db
        .update(customers)
        .set({ balance: sql`${customers.balance} - ${amount}` })
        .where(eq(customers.id, found[0].customerId));
      return Response.json({ ok: true, row });
    }

    return Response.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر تنفيذ العملية" }, { status: 500 });
  }
}
