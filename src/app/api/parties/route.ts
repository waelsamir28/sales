import { db } from "@/db";
import { customers, employees, suppliers } from "@/db/schema";
import { money, n } from "@/lib/money";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Kind = "customers" | "suppliers" | "employees";

function kindOf(value: unknown): Kind {
  if (value === "suppliers" || value === "employees" || value === "customers") return value;
  return "customers";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = kindOf(body.kind);
    if (kind === "customers") {
      const [row] = await db
        .insert(customers)
        .values({
          code: String(body.code ?? ""),
          name: String(body.name ?? ""),
          phone: String(body.phone ?? ""),
          address: String(body.address ?? ""),
          balance: money(body.balance),
        })
        .returning();
      return Response.json({ ok: true, row });
    }
    if (kind === "suppliers") {
      const [row] = await db
        .insert(suppliers)
        .values({
          code: String(body.code ?? ""),
          name: String(body.name ?? ""),
          phone: String(body.phone ?? ""),
          address: String(body.address ?? ""),
          balance: money(body.balance),
        })
        .returning();
      return Response.json({ ok: true, row });
    }
    const [row] = await db
      .insert(employees)
      .values({
        name: String(body.name ?? ""),
        phone: String(body.phone ?? ""),
        jobTitle: String(body.jobTitle ?? "موظف"),
        salary: money(body.salary),
        hireDate: String(body.hireDate ?? ""),
        active: body.active !== false,
      })
      .returning();
    return Response.json({ ok: true, row });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر الحفظ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = kindOf(body.kind);
    const id = n(body.id);
    if (!id) return Response.json({ ok: false, error: "المعرف مطلوب" }, { status: 400 });
    if (kind === "customers") {
      const [row] = await db
        .update(customers)
        .set({
          code: String(body.code ?? ""),
          name: String(body.name ?? ""),
          phone: String(body.phone ?? ""),
          address: String(body.address ?? ""),
          balance: money(body.balance),
        })
        .where(eq(customers.id, id))
        .returning();
      return Response.json({ ok: true, row });
    }
    if (kind === "suppliers") {
      const [row] = await db
        .update(suppliers)
        .set({
          code: String(body.code ?? ""),
          name: String(body.name ?? ""),
          phone: String(body.phone ?? ""),
          address: String(body.address ?? ""),
          balance: money(body.balance),
        })
        .where(eq(suppliers.id, id))
        .returning();
      return Response.json({ ok: true, row });
    }
    const [row] = await db
      .update(employees)
      .set({
        name: String(body.name ?? ""),
        phone: String(body.phone ?? ""),
        jobTitle: String(body.jobTitle ?? "موظف"),
        salary: money(body.salary),
        hireDate: String(body.hireDate ?? ""),
        active: body.active !== false,
      })
      .where(eq(employees.id, id))
      .returning();
    return Response.json({ ok: true, row });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر التعديل" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = kindOf(searchParams.get("kind"));
    const id = n(searchParams.get("id"));
    if (!id) return Response.json({ ok: false, error: "المعرف مطلوب" }, { status: 400 });
    if (kind === "customers") await db.delete(customers).where(eq(customers.id, id));
    else if (kind === "suppliers") await db.delete(suppliers).where(eq(suppliers.id, id));
    else await db.delete(employees).where(eq(employees.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر الحذف" }, { status: 500 });
  }
}
