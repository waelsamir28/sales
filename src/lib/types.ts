export type Category = {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
};

export type Item = {
  id: number;
  code: string;
  barcode: string;
  name: string;
  categoryId: number;
  unit: string;
  price: string;
  cost: string;
  taxPercent: string;
  stock: string;
  minStock: string;
  active: boolean;
  saleOnly: boolean;
};

export type Customer = {
  id: number;
  code: string;
  name: string;
  phone: string;
  address: string;
  balance: string;
};

export type Supplier = {
  id: number;
  code: string;
  name: string;
  phone: string;
  address: string;
  balance: string;
};

export type Employee = {
  id: number;
  name: string;
  phone: string;
  jobTitle: string;
  salary: string;
  hireDate: string;
  active: boolean;
};

export type Warehouse = {
  id: number;
  name: string;
  isDefault: boolean;
};

export type Treasury = {
  id: number;
  name: string;
  balance: string;
  isDefault: boolean;
};

export type Invoice = {
  id: number;
  number: number;
  type: string;
  partyId: number | null;
  partyName: string;
  warehouseId: number;
  treasuryId: number;
  date: string;
  paymentType: string;
  subtotal: string;
  tax: string;
  discount: string;
  delivery: string;
  paid: string;
  remaining: string;
  net: string;
  notes: string;
  status: string;
  itemCount: number;
  qtyTotal: string;
};

export type InvoiceItem = {
  id: number;
  invoiceId: number;
  itemId: number;
  code: string;
  name: string;
  unit: string;
  price: string;
  qty: string;
  taxPercent: string;
  taxValue: string;
  total: string;
};

export type CashTx = {
  id: number;
  type: string;
  partyType: string;
  partyId: number | null;
  partyName: string;
  amount: string;
  treasuryId: number;
  notes: string;
  date: string;
};

export type Expense = {
  id: number;
  category: string;
  amount: string;
  treasuryId: number;
  notes: string;
  date: string;
};

export type Transfer = {
  id: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  itemId: number;
  qty: string;
  notes: string;
  date: string;
};

export type AttendanceRow = {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string;
  checkOut: string;
  notes: string;
};

export type Installment = {
  id: number;
  customerId: number;
  invoiceId: number | null;
  title: string;
  total: string;
  downPayment: string;
  remaining: string;
  months: number;
  monthlyAmount: string;
  startDate: string;
  status: string;
  notes: string;
};

export type InstallmentPayment = {
  id: number;
  installmentId: number;
  amount: string;
  treasuryId: number;
  date: string;
  notes: string;
};

export type BootstrapData = {
  categories: Category[];
  items: Item[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  warehouses: Warehouse[];
  treasuries: Treasury[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  cashTransactions: CashTx[];
  expenses: Expense[];
  transfers: Transfer[];
  attendance: AttendanceRow[];
  settings: Record<string, string>;
  installments: Installment[];
  installmentPayments: InstallmentPayment[];
};

export type ModuleId =
  | "home"
  | "sales"
  | "purchase"
  | "sale_return"
  | "purchase_return"
  | "customers"
  | "items"
  | "employees"
  | "suppliers"
  | "expenses"
  | "treasury"
  | "cash_out"
  | "cash_in"
  | "attendance"
  | "transfers"
  | "stats"
  | "prices"
  | "reports"
  | "settings"
  | "contact"
  | "warehouses"
  | "setup"
  | "installments"
  | "statement"
  | "profits"
  | "backup";

export type Tab = {
  id: string;
  module: ModuleId;
  title: string;
  /** الشاشة الفرعية المفتوحة (تُستخدم لفتح الأصناف / المجموعات من الشريط العلوى) */
  sub?: string;
};

export type CartLine = {
  key: string;
  itemId: number;
  code: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  taxPercent: number;
};

export type Toast = { kind: "ok" | "err" | "info"; text: string };
