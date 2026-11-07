import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import {
  attendance,
  cashTransactions,
  categories,
  customers,
  employees,
  expenses,
  installmentPayments,
  installments,
  invoiceItems,
  invoices,
  items,
  settings,
  suppliers,
  users,
  treasuries,
  warehouseTransfers,
  warehouses,
} from "@/db/schema";

const SEED_LOCK_KEY = 0x53414c45;
type SeedExecutor = Pick<typeof db, "select" | "insert" | "update">;

export const DEFAULT_SETTINGS: Record<string, string> = {
  store_name: "مكتبة الجمال",
  store_activity: "أدوات مدرسية ومكتبية وكتب خارجية",
  phone: "+20 10 1234 5678",
  whatsapp: "+20 10 1234 5678",
  website: "maktabet-elgamal.com",
  email: "info@maktabet-elgamal.com",
  tax_percent: "0",
  user_name: "admin",
  currency: "جنيه",
  allow_credit: "1",
  default_installment_months: "4",
  low_stock_alert: "1",
  print_after_save: "0",
  allow_negative_stock: "0",
  min_profit_percent: "15",
  cashier_shift: "صباحي",
  fiscal_year: "2026",
  invoice_prefix: "INV",
  round_cash: "0",
  price_include_tax: "0",
  theme: "navy",
  books_no_return: "1",
  invoice_footer: "الكتب والكراسات والأقلام للبيع فقط — لا تُستبدل ولا تُرد إلا في حال عيب صناعة",
  // invoice design (used by the preview + printed document)
  invoice_doc_title: "فاتورة بيع",
  invoice_paper: "A4",
  invoice_accent: "#2f54d0",
  invoice_show_items: "1",
  invoice_show_qty: "1",
  invoice_show_type: "1",
  invoice_show_footer: "1",
  invoice_logo: "",
  invoice_notes: "",
  // cashier behaviour
  pos_sound: "1",
};

const CATEGORIES = [
  { name: "أقلام جاف ورصاص", color: "#1d4ed8", sortOrder: 1 },
  { name: "كراسات وكشاكيل", color: "#2563eb", sortOrder: 2 },
  { name: "كتب خارجية", color: "#3b82f6", sortOrder: 3 },
  { name: "أدوات هندسية", color: "#1e40af", sortOrder: 4 },
  { name: "ملفات وحوافظ", color: "#4f7df3", sortOrder: 5 },
  { name: "ألوان ورسوم", color: "#0f766e", sortOrder: 6 },
  { name: "ورق تصوير", color: "#0ea5e9", sortOrder: 7 },
  { name: "أدوات مكتبية", color: "#334155", sortOrder: 8 },
  { name: "حقائب ومقلمات", color: "#6366f1", sortOrder: 9 },
  { name: "مستلزمات مدرسية", color: "#1f4fc0", sortOrder: 10 },
];

type SeedItem = {
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  price: string;
  cost: string;
  stock: string;
};

const ITEMS: SeedItem[] = [
  { code: "P001", barcode: "6223001000001", name: "قلم جاف أزرق BIC", category: "أقلام جاف ورصاص", unit: "قلم", price: "5.00", cost: "2.50", stock: "240" },
  { code: "P002", barcode: "6223001000002", name: "قلم جاف أحمر BIC", category: "أقلام جاف ورصاص", unit: "قلم", price: "5.00", cost: "2.50", stock: "180" },
  { code: "P003", barcode: "6223001000003", name: "قلم جاف أسود", category: "أقلام جاف ورصاص", unit: "قلم", price: "5.00", cost: "2.50", stock: "160" },
  { code: "P004", barcode: "6223001000004", name: "قلم رصاص HB", category: "أقلام جاف ورصاص", unit: "قلم", price: "3.00", cost: "1.25", stock: "300" },
  { code: "P005", barcode: "6223001000005", name: "قلم حبر سائل أزرق", category: "أقلام جاف ورصاص", unit: "قلم", price: "12.00", cost: "6.00", stock: "90" },
  { code: "P006", barcode: "6223001000006", name: "قلم ماركر سبورة", category: "أقلام جاف ورصاص", unit: "قلم", price: "8.00", cost: "4.00", stock: "70" },
  { code: "P007", barcode: "6223001000007", name: "قلم هايلايتر", category: "أقلام جاف ورصاص", unit: "قلم", price: "7.00", cost: "3.25", stock: "85" },
  { code: "P008", barcode: "6223001000008", name: "طقم أقلام جل 12 لون", category: "أقلام جاف ورصاص", unit: "علبة", price: "45.00", cost: "28.00", stock: "40" },
  { code: "N001", barcode: "6223002000001", name: "كراسة 40 ورقة مسطرة", category: "كراسات وكشاكيل", unit: "كراسة", price: "8.00", cost: "4.50", stock: "200" },
  { code: "N002", barcode: "6223002000002", name: "كراسة 60 ورقة", category: "كراسات وكشاكيل", unit: "كراسة", price: "12.00", cost: "7.00", stock: "160" },
  { code: "N003", barcode: "6223002000003", name: "كراسة 80 ورقة", category: "كراسات وكشاكيل", unit: "كراسة", price: "15.00", cost: "9.00", stock: "140" },
  { code: "N004", barcode: "6223002000004", name: "كشكول 100 ورقة", category: "كراسات وكشاكيل", unit: "كشكول", price: "25.00", cost: "15.00", stock: "80" },
  { code: "N005", barcode: "6223002000005", name: "كراسة رسم 20 ورقة", category: "كراسات وكشاكيل", unit: "كراسة", price: "18.00", cost: "10.00", stock: "60" },
  { code: "N006", barcode: "6223002000006", name: "دفتر تحضير معلم", category: "كراسات وكشاكيل", unit: "دفتر", price: "30.00", cost: "18.00", stock: "35" },
  { code: "B001", barcode: "6223003000001", name: "كتاب المعاصر رياضيات 3 إعدادي", category: "كتب خارجية", unit: "كتاب", price: "85.00", cost: "62.00", stock: "48" },
  { code: "B002", barcode: "6223003000002", name: "كتاب الأضواء عربي 6 ابتدائي", category: "كتب خارجية", unit: "كتاب", price: "70.00", cost: "50.00", stock: "55" },
  { code: "B003", barcode: "6223003000003", name: "كتاب قطر الندى إنجليزي 1 ثانوي", category: "كتب خارجية", unit: "كتاب", price: "95.00", cost: "70.00", stock: "40" },
  { code: "B004", barcode: "6223003000004", name: "كتاب الشاطر علوم 4 ابتدائي", category: "كتب خارجية", unit: "كتاب", price: "60.00", cost: "42.00", stock: "50" },
  { code: "B005", barcode: "6223003000005", name: "أطلس العالم المدرسي", category: "كتب خارجية", unit: "كتاب", price: "45.00", cost: "28.00", stock: "30" },
  { code: "B006", barcode: "6223003000006", name: "كتاب الامتحان فيزياء 2 ثانوي", category: "كتب خارجية", unit: "كتاب", price: "110.00", cost: "80.00", stock: "28" },
  { code: "G001", barcode: "6223004000001", name: "مسطرة 30 سم شفافة", category: "أدوات هندسية", unit: "عدد", price: "6.00", cost: "2.50", stock: "120" },
  { code: "G002", barcode: "6223004000002", name: "منقلة بلاستيك", category: "أدوات هندسية", unit: "عدد", price: "5.00", cost: "2.00", stock: "100" },
  { code: "G003", barcode: "6223004000003", name: "برجل معدني", category: "أدوات هندسية", unit: "عدد", price: "22.00", cost: "12.00", stock: "45" },
  { code: "G004", barcode: "6223004000004", name: "طقم هندسي كامل", category: "أدوات هندسية", unit: "طقم", price: "35.00", cost: "20.00", stock: "40" },
  { code: "G005", barcode: "6223004000005", name: "مثلث 45 درجة", category: "أدوات هندسية", unit: "عدد", price: "5.00", cost: "2.00", stock: "80" },
  { code: "F001", barcode: "6223005000001", name: "ملف بلاستيك A4", category: "ملفات وحوافظ", unit: "ملف", price: "10.00", cost: "5.50", stock: "90" },
  { code: "F002", barcode: "6223005000002", name: "حافظة أوراق سحاب", category: "ملفات وحوافظ", unit: "حافظة", price: "15.00", cost: "8.00", stock: "70" },
  { code: "F003", barcode: "6223005000003", name: "ملف كباس 2 حلقة", category: "ملفات وحوافظ", unit: "ملف", price: "28.00", cost: "16.00", stock: "40" },
  { code: "F004", barcode: "6223005000004", name: "ظرف مستندات كرافت", category: "ملفات وحوافظ", unit: "ظرف", price: "4.00", cost: "1.50", stock: "200" },
  { code: "C001", barcode: "6223006000001", name: "علبة ألوان خشبية 12", category: "ألوان ورسوم", unit: "علبة", price: "25.00", cost: "14.00", stock: "55" },
  { code: "C002", barcode: "6223006000002", name: "علبة ألوان فلومستر 12", category: "ألوان ورسوم", unit: "علبة", price: "20.00", cost: "11.00", stock: "60" },
  { code: "C003", barcode: "6223006000003", name: "ألوان مائية 12 لون", category: "ألوان ورسوم", unit: "علبة", price: "35.00", cost: "20.00", stock: "35" },
  { code: "C004", barcode: "6223006000004", name: "باستيل زيتي 12", category: "ألوان ورسوم", unit: "علبة", price: "40.00", cost: "24.00", stock: "25" },
  { code: "W001", barcode: "6223007000001", name: "ورق A4 500 ورقة", category: "ورق تصوير", unit: "رزمة", price: "145.00", cost: "110.00", stock: "40" },
  { code: "W002", barcode: "6223007000002", name: "ورق تصوير A4 100 ورقة", category: "ورق تصوير", unit: "رزمة", price: "35.00", cost: "24.00", stock: "70" },
  { code: "W003", barcode: "6223007000003", name: "ورق مقوى ملون 10 ورقات", category: "ورق تصوير", unit: "طقم", price: "18.00", cost: "10.00", stock: "50" },
  { code: "O001", barcode: "6223008000001", name: "دباسة مكتبية", category: "أدوات مكتبية", unit: "عدد", price: "22.00", cost: "12.00", stock: "40" },
  { code: "O002", barcode: "6223008000002", name: "علبة مشابك ورق", category: "أدوات مكتبية", unit: "علبة", price: "8.00", cost: "3.50", stock: "90" },
  { code: "O003", barcode: "6223008000003", name: "ممحاة بيضاء", category: "أدوات مكتبية", unit: "عدد", price: "3.00", cost: "1.00", stock: "200" },
  { code: "O004", barcode: "6223008000004", name: "براية معدنية", category: "أدوات مكتبية", unit: "عدد", price: "4.00", cost: "1.50", stock: "150" },
  { code: "O005", barcode: "6223008000005", name: "لصق عريض شفاف", category: "أدوات مكتبية", unit: "عدد", price: "12.00", cost: "6.00", stock: "80" },
  { code: "O006", barcode: "6223008000006", name: "مقص مدرسي", category: "أدوات مكتبية", unit: "عدد", price: "15.00", cost: "7.00", stock: "65" },
  { code: "O007", barcode: "6223008000007", name: "آلة حاسبة صغيرة", category: "أدوات مكتبية", unit: "عدد", price: "55.00", cost: "32.00", stock: "25" },
  { code: "H001", barcode: "6223009000001", name: "شنطة مدرسية", category: "حقائب ومقلمات", unit: "عدد", price: "180.00", cost: "110.00", stock: "18" },
  { code: "H002", barcode: "6223009000002", name: "مقلمة سحاب", category: "حقائب ومقلمات", unit: "عدد", price: "35.00", cost: "18.00", stock: "40" },
  { code: "H003", barcode: "6223009000003", name: "لانش بوكس مدرسي", category: "حقائب ومقلمات", unit: "عدد", price: "65.00", cost: "38.00", stock: "22" },
  { code: "S001", barcode: "6223010000001", name: "زي مدرسي مريلة", category: "مستلزمات مدرسية", unit: "عدد", price: "95.00", cost: "55.00", stock: "20" },
  { code: "S002", barcode: "6223010000002", name: "غطاء كراسة بلاستيك", category: "مستلزمات مدرسية", unit: "عدد", price: "4.00", cost: "1.50", stock: "250" },
  { code: "S003", barcode: "6223010000003", name: "ستيكر اسم تلميذ", category: "مستلزمات مدرسية", unit: "طقم", price: "10.00", cost: "4.00", stock: "80" },
  { code: "S004", barcode: "6223010000004", name: "مسطرة جدول الضرب", category: "مستلزمات مدرسية", unit: "عدد", price: "7.00", cost: "3.00", stock: "90" },
];

export async function ensureSeeded() {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SEED_LOCK_KEY}, 1)`);
    await tx.execute(
      sql`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "color" varchar(20) NOT NULL DEFAULT '#3b82f6'`,
    );
    // الخصم اتشال من البرنامج بالكامل (مش بنسقط العمود لتجنّب فقدان بيانات)
    await tx.execute(sql`ALTER TABLE "invoices" ALTER COLUMN "discount" SET DEFAULT '0'`);

    const existing = await tx.select({ id: categories.id }).from(categories).limit(1);
    if (existing.length > 0) {
      await ensureSettings(tx);
      await ensureInstallments(tx);
      await ensureUsers(tx);
      await markBooksSaleOnly(tx);
      return false;
    }

    const insertedCats = await tx.insert(categories).values(CATEGORIES).returning();
    const catByName = new Map(insertedCats.map((c) => [c.name, c.id]));

    await tx.insert(warehouses).values([
      { name: "المخزن الرئيسي", isDefault: true },
      { name: "فرع المعرض", isDefault: false },
    ]);

    await tx.insert(treasuries).values([
      { name: "كاشير 1", balance: "2681.85", isDefault: true },
      { name: "خزينة الإدارة", balance: "15400.00", isDefault: false },
    ]);

    await tx.insert(items).values(
      ITEMS.map((item) => ({
        code: item.code,
        barcode: item.barcode,
        name: item.name,
        categoryId: catByName.get(item.category) ?? insertedCats[0].id,
        unit: item.unit,
        price: item.price,
        cost: item.cost,
        taxPercent: "0",
        stock: item.stock,
        minStock: "5",
        active: true,
        saleOnly: item.category === "كتب خارجية",
      })),
    );

    await tx.insert(customers).values([
      { code: "C001", name: "نقدي / عميل يومي", phone: "", address: "", balance: "0" },
      { code: "C002", name: "مدرسة النور الخاصة", phone: "01011112222", address: "مدينة نصر", balance: "450.00" },
      { code: "C003", name: "أحمد محمد علي", phone: "01098765432", address: "مصر الجديدة", balance: "120.00" },
      { code: "C004", name: "مكتبة الصفوة", phone: "01234567890", address: "العباسية", balance: "0" },
      { code: "C005", name: "حضانة البراعم", phone: "01122334455", address: "مدينة نصر", balance: "80.00" },
      { code: "C006", name: "فاطمة حسن", phone: "01055667788", address: "الزيتون", balance: "0" },
      { code: "C007", name: "شركة الأمل للتوريدات", phone: "0223456789", address: "القاهرة", balance: "900.00" },
      { code: "C008", name: "مدرس محمد عبد الرحمن", phone: "01033445566", address: "حدائق القبة", balance: "35.00" },
    ]);

    await tx.insert(suppliers).values([
      { code: "S001", name: "جملة القرطاسية المصرية", phone: "0225551111", address: "العباسية", balance: "3200.00" },
      { code: "S002", name: "مكتب النيل للتوريدات", phone: "0226662222", address: "شبرا", balance: "1500.00" },
      { code: "S003", name: "دار نشر المعاصر", phone: "0227773333", address: "الدقي", balance: "800.00" },
      { code: "S004", name: "شركة الورق الحديث", phone: "0228884444", address: "6 أكتوبر", balance: "0" },
      { code: "S005", name: "توكيلات الأدوات الهندسية", phone: "01020003000", address: "وسط البلد", balance: "420.00" },
    ]);

    await tx.insert(employees).values([
      { name: "admin", phone: "01000000000", jobTitle: "مدير النظام", salary: "12000", hireDate: "2022-01-01", active: true },
      { name: "سارة محمود", phone: "01011110001", jobTitle: "كاشير", salary: "4500", hireDate: "2023-09-01", active: true },
      { name: "محمود حسن", phone: "01011110002", jobTitle: "محاسب", salary: "7000", hireDate: "2022-06-15", active: true },
      { name: "حسام علي", phone: "01011110003", jobTitle: "أمين مخزن", salary: "5000", hireDate: "2023-02-10", active: true },
      { name: "نورا إبراهيم", phone: "01011110004", jobTitle: "بائع", salary: "4200", hireDate: "2024-01-20", active: true },
      { name: "خالد يوسف", phone: "01011110005", jobTitle: "مندوب مشتريات", salary: "5500", hireDate: "2023-11-01", active: true },
    ]);

    await tx.insert(settings).values(
      Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })),
    );

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    await tx.insert(attendance).values([
      { employeeId: 2, date: dateStr, checkIn: "09:02", checkOut: "", notes: "" },
      { employeeId: 4, date: dateStr, checkIn: "08:50", checkOut: "", notes: "" },
      { employeeId: 5, date: dateStr, checkIn: "09:10", checkOut: "", notes: "" },
    ]);

    await tx.insert(cashTransactions).values([
      {
        type: "receipt",
        partyType: "customer",
        partyId: 3,
        partyName: "أحمد محمد علي",
        amount: "120.00",
        treasuryId: 1,
        notes: "تحصيل مديونية سابقة",
        date: today,
      },
    ]);

    await tx.insert(expenses).values([
      { category: "كهرباء", amount: "850.00", treasuryId: 2, notes: "فاتورة الشهر", date: today },
      { category: "نقل", amount: "200.00", treasuryId: 1, notes: "توصيل بضاعة", date: today },
    ]);

    await tx.insert(warehouseTransfers).values([
      {
        fromWarehouseId: 1,
        toWarehouseId: 2,
        itemId: 1,
        qty: "20",
        notes: "تغطية المعرض",
        date: today,
      },
    ]);

    await tx.insert(installments).values([
      {
        customerId: 2,
        invoiceId: null,
        title: "توريد مستلزمات الترم الأول",
        total: "2400.00",
        downPayment: "600.00",
        remaining: "1800.00",
        months: 4,
        monthlyAmount: "450.00",
        startDate: dateStr,
        status: "active",
        notes: "مدرسة النور — تقسيط كتب وكراسات",
      },
      {
        customerId: 5,
        invoiceId: null,
        title: "باقة حضانة البراعم",
        total: "800.00",
        downPayment: "200.00",
        remaining: "600.00",
        months: 3,
        monthlyAmount: "200.00",
        startDate: dateStr,
        status: "active",
        notes: "ألوان وكراسات وشنط",
      },
    ]);

    await ensureUsers(tx);
    return true;
  });
}

async function ensureSettings(executor: SeedExecutor) {
  const rows = await executor.select().from(settings);
  const have = new Set(rows.map((r) => r.key));

  // rename legacy store name once (existing databases keep their own settings)
  const legacyName = rows.find((r) => r.key === "store_name" && r.value === "مكتبة النور");
  if (legacyName) {
    await executor
      .update(settings)
      .set({ value: DEFAULT_SETTINGS.store_name })
      .where(eq(settings.key, "store_name"));
  }

  const missing = Object.entries(DEFAULT_SETTINGS)
    .filter(([key]) => !have.has(key))
    .map(([key, value]) => ({ key, value }));
  if (missing.length) await executor.insert(settings).values(missing);
}

async function ensureUsers(executor: SeedExecutor) {
  const existing = await executor.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;
  await executor.insert(users).values([
    { username: "admin", password: "1234", displayName: "مدير النظام", role: "admin" },
    { username: "sara", password: "1234", displayName: "سارة محمود", role: "cashier" },
    { username: "mahmoud", password: "1234", displayName: "محمود حسن", role: "accountant" },
  ]);
}

async function markBooksSaleOnly(executor: SeedExecutor) {
  const bookCat = await executor.select().from(categories);
  const id = bookCat.find((c) => c.name === "كتب خارجية")?.id;
  if (!id) return;
  await executor.update(items).set({ saleOnly: true }).where(eq(items.categoryId, id));
}

async function ensureInstallments(executor: SeedExecutor) {
  const existing = await executor.select({ id: installments.id }).from(installments).limit(1);
  if (existing.length) return;
  const dateStr = new Date().toISOString().slice(0, 10);
  await executor.insert(installments).values([
    {
      customerId: 2,
      title: "توريد مستلزمات الترم الأول",
      total: "2400.00",
      downPayment: "600.00",
      remaining: "1800.00",
      months: 4,
      monthlyAmount: "450.00",
      startDate: dateStr,
      status: "active",
      notes: "مدرسة النور",
    },
  ]);
}

export async function loadBootstrap() {
  const [
    cats,
    its,
    cus,
    sup,
    emp,
    wh,
    tr,
    inv,
    cash,
    exp,
    trn,
    att,
    setts,
    inst,
    pays,
  ] = await Promise.all([
    db.select().from(categories),
    db.select().from(items),
    db.select().from(customers),
    db.select().from(suppliers),
    db.select().from(employees),
    db.select().from(warehouses),
    db.select().from(treasuries),
    db.select().from(invoices),
    db.select().from(cashTransactions),
    db.select().from(expenses),
    db.select().from(warehouseTransfers),
    db.select().from(attendance),
    db.select().from(settings),
    db.select().from(installments),
    db.select().from(installmentPayments),
  ]);

  const lines = await db.select().from(invoiceItems);

  return {
    categories: cats,
    items: its,
    customers: cus,
    suppliers: sup,
    employees: emp,
    warehouses: wh,
    treasuries: tr,
    invoices: inv,
    invoiceItems: lines,
    cashTransactions: cash,
    expenses: exp,
    transfers: trn,
    attendance: att,
    settings: Object.fromEntries(setts.map((s) => [s.key, s.value])),
    installments: inst,
    installmentPayments: pays,
  };
}
