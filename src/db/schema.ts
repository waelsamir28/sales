import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const treasuries = pgTable("treasuries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull(),
  barcode: varchar("barcode", { length: 40 }).notNull().default(""),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id").notNull(),
  unit: varchar("unit", { length: 40 }).notNull().default("عدد"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  taxPercent: numeric("tax_percent", { precision: 6, scale: 2 }).notNull().default("0"),
  stock: numeric("stock", { precision: 12, scale: 2 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 12, scale: 2 }).notNull().default("5"),
  active: boolean("active").notNull().default(true),
  saleOnly: boolean("sale_only").notNull().default(false),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  address: varchar("address", { length: 300 }).notNull().default(""),
  discountPercent: numeric("discount_percent", { precision: 6, scale: 2 })
    .notNull()
    .default("0"),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  address: varchar("address", { length: 300 }).notNull().default(""),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  jobTitle: varchar("job_title", { length: 120 }).notNull().default("موظف"),
  salary: numeric("salary", { precision: 12, scale: 2 }).notNull().default("0"),
  hireDate: varchar("hire_date", { length: 20 }).notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  partyId: integer("party_id"),
  partyName: varchar("party_name", { length: 200 }).notNull().default("نقدي"),
  warehouseId: integer("warehouse_id").notNull(),
  treasuryId: integer("treasury_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  paymentType: varchar("payment_type", { length: 20 }).notNull().default("cash"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 14, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
  delivery: numeric("delivery", { precision: 14, scale: 2 }).notNull().default("0"),
  paid: numeric("paid", { precision: 14, scale: 2 }).notNull().default("0"),
  remaining: numeric("remaining", { precision: 14, scale: 2 }).notNull().default("0"),
  net: numeric("net", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("saved"),
  itemCount: integer("item_count").notNull().default(0),
  qtyTotal: numeric("qty_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  itemId: integer("item_id").notNull(),
  code: varchar("code", { length: 40 }).notNull().default(""),
  name: varchar("name", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 40 }).notNull().default("عدد"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull().default("1"),
  taxPercent: numeric("tax_percent", { precision: 6, scale: 2 }).notNull().default("0"),
  taxValue: numeric("tax_value", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  partyType: varchar("party_type", { length: 20 }).notNull().default("other"),
  partyId: integer("party_id"),
  partyName: varchar("party_name", { length: 200 }).notNull().default(""),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  treasuryId: integer("treasury_id").notNull(),
  notes: text("notes").notNull().default(""),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 80 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  treasuryId: integer("treasury_id").notNull(),
  notes: text("notes").notNull().default(""),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
});

export const warehouseTransfers = pgTable("warehouse_transfers", {
  id: serial("id").primaryKey(),
  fromWarehouseId: integer("from_warehouse_id").notNull(),
  toWarehouseId: integer("to_warehouse_id").notNull(),
  itemId: integer("item_id").notNull(),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull().default("1"),
  notes: text("notes").notNull().default(""),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  checkIn: varchar("check_in", { length: 20 }).notNull().default(""),
  checkOut: varchar("check_out", { length: 20 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 80 }).notNull(),
  value: text("value").notNull().default(""),
});

export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  invoiceId: integer("invoice_id"),
  title: varchar("title", { length: 200 }).notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  downPayment: numeric("down_payment", { precision: 14, scale: 2 }).notNull().default("0"),
  remaining: numeric("remaining", { precision: 14, scale: 2 }).notNull().default("0"),
  months: integer("months").notNull().default(3),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  startDate: varchar("start_date", { length: 20 }).notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  notes: text("notes").notNull().default(""),
});

export const installmentPayments = pgTable("installment_payments", {
  id: serial("id").primaryKey(),
  installmentId: integer("installment_id").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  treasuryId: integer("treasury_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes").notNull().default(""),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull(),
  password: varchar("password", { length: 80 }).notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  role: varchar("role", { length: 40 }).notNull().default("cashier"),
});
