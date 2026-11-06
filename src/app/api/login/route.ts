import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    if (!username || !password) {
      return Response.json({ ok: false, error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });
    }
    const found = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.password, password)))
      .limit(1);
    if (!found[0]) {
      return Response.json({ ok: false, error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }
    return Response.json({
      ok: true,
      user: {
        username: found[0].username,
        displayName: found[0].displayName,
        role: found[0].role,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "تعذر تسجيل الدخول" }, { status: 500 });
  }
}
