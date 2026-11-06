import { ensureSeeded, loadBootstrap } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const data = await loadBootstrap();
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "فشل تحميل البيانات" }, { status: 500 });
  }
}
