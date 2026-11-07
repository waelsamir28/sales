"use client";

import {
  DebtsView,
  InstallmentsView,
  ProfitsView,
  StatementView,
  SubTabs,
  TopItemsView,
  profitSummary,
} from "@/components/Finance";
import { n } from "@/lib/money";
import type { BootstrapData, Item, ModuleId } from "@/lib/types";
import { useState, type ReactNode } from "react";

function Panel({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="screen">
      <div className="panel panel-fill">
        <div className="panel-h">
          <span>{title}</span>
          {extra ? <span className="panel-h-extra">{extra}</span> : null}
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

export function ItemsScreen({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const empty = {
    id: 0,
    code: "",
    barcode: "",
    name: "",
    categoryId: data.categories[0]?.id ?? 1,
    unit: "عدد",
    price: "0",
    cost: "0",
    taxPercent: "0",
    stock: "0",
    minStock: "5",
    active: true,
    saleOnly: false,
  };
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("list");
  const rows = data.items.filter(
    (i) => !q || i.name.includes(q) || i.code.includes(q) || i.barcode.includes(q),
  );
  const catName = (id: number) => data.categories.find((c) => c.id === id)?.name ?? "";

  async function save() {
    const method = form.id ? "PUT" : "POST";
    const res = await fetch("/api/items", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return toast("err", json.error || "خطأ");
    toast("ok", "تم حفظ الصنف");
    setForm(empty);
    await reload();
  }

  async function remove(id: number) {
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    toast("ok", "تم الحذف");
    await reload();
  }

  return (
    <Panel title="إدارة الأصناف" extra={`${data.items.length} صنف`}>
      <SubTabs
        items={[
          { id: "list", label: "الأصناف" },
          { id: "profit", label: "أرباح الأصناف" },
          { id: "low", label: "تحت الحد الأدنى" },
        ]}
        value={sub}
        onChange={setSub}
      />
      {sub === "profit" ? (
        <ProfitsView data={data} />
      ) : sub === "low" ? (
        <div className="grid-wrap scroll-y">
          <table className="data">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الصنف</th>
                <th>الرصيد</th>
                <th>الحد</th>
              </tr>
            </thead>
            <tbody>
              {data.items
                .filter((i) => n(i.stock) <= n(i.minStock))
                .map((i) => (
                  <tr key={i.id}>
                    <td>{i.code}</td>
                    <td className="cell-name">{i.name}</td>
                    <td>{n(i.stock)}</td>
                    <td>{n(i.minStock)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
      <>
      <div className="toolbar">
        <div className="field">
          <span>بحث</span>
          <input className="win-input inp-search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="button" className="btn primary" onClick={() => void save()}>
          حفظ الصنف
        </button>
        <button type="button" className="btn" onClick={() => setForm(empty)}>
          جديد
        </button>
      </div>
      <div className="form-row">
        <label className="fl fl-code">
          <span>الكود</span>
          <input className="win-input num" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </label>
        <label className="fl fl-code">
          <span>الباركود</span>
          <input className="win-input num" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        </label>
        <label className="fl fl-item">
          <span>اسم الصنف</span>
          <input className="win-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="fl fl-select">
          <span>القسم</span>
          <select
            className="win-input"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
          >
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-unit">
          <span>الوحدة</span>
          <input className="win-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </label>
        <label className="fl fl-num">
          <span>سعر البيع</span>
          <input className="win-input num" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        <label className="fl fl-num">
          <span>سعر التكلفة</span>
          <input className="win-input num" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </label>
        <label className="fl fl-num">
          <span>الرصيد</span>
          <input className="win-input num" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </label>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>كود</th>
              <th>الصنف</th>
              <th>القسم</th>
              <th>وحدة</th>
              <th>سعر</th>
              <th>تكلفة</th>
              <th>رصيد</th>
              <th>حد أدنى</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className={form.id === i.id ? "sel" : ""}>
                <td>{i.code}</td>
                <td className="cell-name">{i.name}</td>
                <td className="cell-name">{catName(i.categoryId)}</td>
                <td>{i.unit}</td>
                <td>{n(i.price).toFixed(2)}</td>
                <td>{n(i.cost).toFixed(2)}</td>
                <td style={{ color: n(i.stock) <= n(i.minStock) ? "#b91c1c" : undefined }}>{n(i.stock)}</td>
                <td>{n(i.minStock)}</td>
                <td>
                  <button type="button" className="btn" onClick={() => setForm(i)}>
                    تعديل
                  </button>{" "}
                  <button type="button" className="btn danger" onClick={() => void remove(i.id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </Panel>
  );
}

export function PartyScreen({
  kind,
  data,
  reload,
  toast,
}: {
  kind: "customers" | "suppliers" | "employees";
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const titles = { customers: "العملاء", suppliers: "الموردين", employees: "الموظفين" };
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("list");
  const [form, setForm] = useState<Record<string, string | number | boolean>>({
    id: 0,
    code: "",
    name: "",
    phone: "",
    address: "",
    discountPercent: "0",
    balance: "0",
    jobTitle: "موظف",
    salary: "0",
    hireDate: "",
    active: true,
  });

  const rows =
    kind === "customers" ? data.customers : kind === "suppliers" ? data.suppliers : data.employees;
  const filtered = rows.filter((r) => {
    const name = "name" in r ? r.name : "";
    const extra = "code" in r ? String(r.code) : "";
    return !q || name.includes(q) || extra.includes(q);
  });

  async function save() {
    const method = Number(form.id) ? "PUT" : "POST";
    const res = await fetch("/api/parties", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, kind }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return toast("err", json.error || "خطأ");
    toast("ok", "تم الحفظ");
    await reload();
  }

  async function remove(id: number) {
    await fetch(`/api/parties?kind=${kind}&id=${id}`, { method: "DELETE" });
    toast("ok", "تم الحذف");
    await reload();
  }

  return (
    <Panel title={titles[kind]} extra={`${rows.length}`}>
      {kind === "customers" && (
        <SubTabs
          items={[
            { id: "list", label: "البيانات" },
            { id: "statement", label: "كشف حساب" },
            { id: "install", label: "التقسيط" },
            { id: "debts", label: "المديونيات" },
          ]}
          value={sub}
          onChange={setSub}
        />
      )}
      {kind === "suppliers" && (
        <SubTabs
          items={[
            { id: "list", label: "البيانات" },
            { id: "statement", label: "كشف حساب" },
          ]}
          value={sub}
          onChange={setSub}
        />
      )}
      {kind === "customers" && sub === "statement" ? (
        <StatementView data={data} kind="customer" />
      ) : kind === "customers" && sub === "install" ? (
        <InstallmentsView data={data} reload={reload} toast={toast} />
      ) : kind === "customers" && sub === "debts" ? (
        <DebtsView data={data} />
      ) : kind === "suppliers" && sub === "statement" ? (
        <StatementView data={data} kind="supplier" />
      ) : (
      <>
      <div className="toolbar">
        <div className="field">
          <span>بحث</span>
          <input className="win-input inp-search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="button" className="btn primary" onClick={() => void save()}>
          حفظ
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            setForm({
              id: 0,
              code: "",
              name: "",
              phone: "",
              address: "",
              discountPercent: "0",
              balance: "0",
              jobTitle: "موظف",
              salary: "0",
              hireDate: "",
              active: true,
            })
          }
        >
          جديد
        </button>
      </div>
      <div className="form-row">
        {kind !== "employees" && (
          <label className="fl fl-code">
            <span>الكود</span>
            <input className="win-input num" value={String(form.code)} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </label>
        )}
        <label className="fl fl-name">
          <span>الاسم</span>
          <input className="win-input" value={String(form.name)} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="fl fl-phone">
          <span>الهاتف</span>
          <input className="win-input num" value={String(form.phone)} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        {kind !== "employees" && (
          <label className="fl fl-address">
            <span>العنوان</span>
            <input className="win-input" value={String(form.address)} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
        )}
        {kind === "customers" && (
          <label className="fl fl-num">
            <span>خصم %</span>
            <input
              className="win-input num"
              value={String(form.discountPercent)}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            />
          </label>
        )}
        {kind !== "employees" && (
          <label className="fl fl-num">
            <span>الرصيد</span>
            <input className="win-input num" value={String(form.balance)} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
          </label>
        )}
        {kind === "employees" && (
          <>
            <label className="fl fl-job">
              <span>الوظيفة</span>
              <input className="win-input" value={String(form.jobTitle)} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </label>
            <label className="fl fl-num">
              <span>الراتب</span>
              <input className="win-input num" value={String(form.salary)} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </label>
            <label className="fl fl-date">
              <span>تاريخ التعيين</span>
              <input className="win-input num" value={String(form.hireDate)} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            </label>
          </>
        )}
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              {kind !== "employees" && <th>كود</th>}
              <th>الاسم</th>
              <th>هاتف</th>
              {kind !== "employees" && <th>عنوان</th>}
              {kind === "customers" && <th>خصم</th>}
              {kind !== "employees" && <th>رصيد</th>}
              {kind === "employees" && <th>وظيفة</th>}
              {kind === "employees" && <th>راتب</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                {"code" in r && kind !== "employees" && <td>{r.code}</td>}
                <td className="cell-name">{r.name}</td>
                <td>{r.phone}</td>
                {"address" in r && kind !== "employees" && <td>{r.address}</td>}
                {kind === "customers" && "discountPercent" in r ? <td>{String(r.discountPercent)}</td> : null}
                {kind !== "employees" && "balance" in r ? <td>{n(r.balance).toFixed(2)}</td> : null}
                {kind === "employees" && "jobTitle" in r ? <td>{String(r.jobTitle)}</td> : null}
                {kind === "employees" && "salary" in r ? <td>{n(r.salary).toFixed(2)}</td> : null}
                <td>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setForm({ ...(r as unknown as Record<string, string | number | boolean>) })}
                  >
                    تعديل
                  </button>{" "}
                  <button type="button" className="btn danger" onClick={() => void remove(r.id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </Panel>
  );
}

export function CashScreen({
  type,
  data,
  reload,
  toast,
}: {
  type: "receipt" | "payment";
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const [partyType, setPartyType] = useState<"customer" | "supplier" | "other">(
    type === "receipt" ? "customer" : "supplier",
  );
  const [partyId, setPartyId] = useState(0);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [treasuryId, setTreasuryId] = useState(data.treasuries[0]?.id ?? 1);
  const parties = partyType === "customer" ? data.customers : partyType === "supplier" ? data.suppliers : [];

  async function save() {
    const party = parties.find((p) => p.id === partyId);
    const res = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cash",
        type,
        partyType,
        partyId: partyId || null,
        partyName: party?.name ?? notes,
        amount: n(amount),
        treasuryId,
        notes,
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return toast("err", json.error || "خطأ");
    toast("ok", type === "receipt" ? "تم استلام النقدية" : "تم صرف النقدية");
    setAmount("");
    setNotes("");
    await reload();
  }

  const rows = data.cashTransactions.filter((c) => c.type === type);

  return (
    <Panel title={type === "receipt" ? "إستلام نقدية" : "دفع نقدية"}>
      <div className="form-row">
        <label className="fl fl-select">
          <span>النوع</span>
          <select className="win-input" value={partyType} onChange={(e) => setPartyType(e.target.value as typeof partyType)}>
            <option value="customer">عميل</option>
            <option value="supplier">مورد</option>
            <option value="other">أخرى</option>
          </select>
        </label>
        <label className="fl fl-name">
          <span>الاسم</span>
          <select className="win-input" value={partyId} onChange={(e) => setPartyId(Number(e.target.value))}>
            <option value={0}>—</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-num">
          <span>المبلغ</span>
          <input className="win-input num" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="fl fl-select">
          <span>الخزينة</span>
          <select className="win-input" value={treasuryId} onChange={(e) => setTreasuryId(Number(e.target.value))}>
            {data.treasuries.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-notes">
          <span>ملاحظات</span>
          <input className="win-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={() => void save()}>
          حفظ الحركة
        </button>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الطرف</th>
              <th>المبلغ</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleString("ar-EG")}</td>
                <td>{r.partyName}</td>
                <td>{n(r.amount).toFixed(2)}</td>
                <td>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ExpensesScreen({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const [category, setCategory] = useState("كهرباء");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [treasuryId, setTreasuryId] = useState(data.treasuries[0]?.id ?? 1);

  async function save() {
    const res = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "expense", category, amount: n(amount), notes, treasuryId }),
    });
    const json = (await res.json()) as { ok: boolean };
    if (!json.ok) return toast("err", "تعذر الحفظ");
    toast("ok", "تم قيد المصروف");
    setAmount("");
    await reload();
  }

  return (
    <Panel title="المصروفات" extra={`الإجمالي ${data.expenses.reduce((s, e) => s + n(e.amount), 0).toFixed(2)}`}>
      <div className="form-row">
        <label className="fl fl-select">
          <span>البند</span>
          <select className="win-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {["إيجار", "كهرباء", "مرتبات", "نقل", "صيانة", "متنوعة"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="fl fl-num">
          <span>المبلغ</span>
          <input className="win-input num" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="fl fl-select">
          <span>الخزينة</span>
          <select className="win-input" value={treasuryId} onChange={(e) => setTreasuryId(Number(e.target.value))}>
            {data.treasuries.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-notes">
          <span>ملاحظات</span>
          <input className="win-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={() => void save()}>
          حفظ المصروف
        </button>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البند</th>
              <th>المبلغ</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {data.expenses.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.date).toLocaleString("ar-EG")}</td>
                <td>{e.category}</td>
                <td>{n(e.amount).toFixed(2)}</td>
                <td>{e.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function TreasuryScreen({ data }: { data: BootstrapData }) {
  return (
    <Panel title="الخزينة">
      <div className="kpi-row">
        {data.treasuries.map((t) => (
          <div className="kpi" key={t.id}>
            <span className="l">{t.name}</span>
            <span className="n">{n(t.balance).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="grid-wrap scroll-y" style={{ marginTop: 8 }}>
        <table className="data">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>الطرف</th>
              <th>المبلغ</th>
              <th>بيان</th>
            </tr>
          </thead>
          <tbody>
            {data.cashTransactions.map((c) => (
              <tr key={c.id}>
                <td>{new Date(c.date).toLocaleString("ar-EG")}</td>
                <td>{c.type === "receipt" ? "قبض" : "صرف"}</td>
                <td>{c.partyName}</td>
                <td>{n(c.amount).toFixed(2)}</td>
                <td>{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function AttendanceScreen({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const [employeeId, setEmployeeId] = useState(data.employees[1]?.id ?? 1);

  async function punch() {
    const res = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "punch", employeeId }),
    });
    const json = (await res.json()) as { ok: boolean };
    if (!json.ok) return toast("err", "تعذر التسجيل");
    toast("ok", "تم تسجيل الحركة");
    await reload();
  }

  return (
    <Panel title="حضور وانصراف">
      <div className="toolbar">
        <div className="field">
          <span>الموظف</span>
          <select className="win-input inp-name" value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))}>
            {data.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.jobTitle}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn ok" onClick={() => void punch()}>
          تسجيل حضور / انصراف
        </button>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>التاريخ</th>
              <th>حضور</th>
              <th>انصراف</th>
            </tr>
          </thead>
          <tbody>
            {data.attendance.map((a) => (
              <tr key={a.id}>
                <td>{data.employees.find((e) => e.id === a.employeeId)?.name}</td>
                <td>{a.date}</td>
                <td>{a.checkIn}</td>
                <td>{a.checkOut || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function TransfersScreen({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const [fromWarehouseId, setFrom] = useState(data.warehouses[0]?.id ?? 1);
  const [toWarehouseId, setTo] = useState(data.warehouses[1]?.id ?? 2);
  const [itemId, setItem] = useState(data.items[0]?.id ?? 1);
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");

  async function save() {
    const res = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transfer", fromWarehouseId, toWarehouseId, itemId, qty, notes }),
    });
    const json = (await res.json()) as { ok: boolean };
    if (!json.ok) return toast("err", "تعذر التحويل");
    toast("ok", "تم تسجيل التحويل");
    await reload();
  }

  return (
    <Panel title="تحويلات المخازن">
      <div className="form-row">
        <label className="fl fl-select">
          <span>من مخزن</span>
          <select className="win-input" value={fromWarehouseId} onChange={(e) => setFrom(Number(e.target.value))}>
            {data.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-select">
          <span>إلى مخزن</span>
          <select className="win-input" value={toWarehouseId} onChange={(e) => setTo(Number(e.target.value))}>
            {data.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-item">
          <span>اسم الصنف</span>
          <select className="win-input" value={itemId} onChange={(e) => setItem(Number(e.target.value))}>
            {data.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-num">
          <span>الكمية</span>
          <input className="win-input num" value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
        <label className="fl fl-notes">
          <span>ملاحظات</span>
          <input className="win-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={() => void save()}>
          تنفيذ التحويل
        </button>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>من</th>
              <th>إلى</th>
              <th>الصنف</th>
              <th>كمية</th>
            </tr>
          </thead>
          <tbody>
            {data.transfers.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleString("ar-EG")}</td>
                <td>{data.warehouses.find((w) => w.id === t.fromWarehouseId)?.name}</td>
                <td>{data.warehouses.find((w) => w.id === t.toWarehouseId)?.name}</td>
                <td>{data.items.find((i) => i.id === t.itemId)?.name}</td>
                <td>{t.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function StatsScreen({ data }: { data: BootstrapData }) {
  const sales = data.invoices.filter((i) => i.type === "sale" && i.status === "saved");
  const salesTotal = sales.reduce((s, i) => s + n(i.net), 0);
  const purchases = data.invoices.filter((i) => i.type === "purchase").reduce((s, i) => s + n(i.net), 0);
  const stockValue = data.items.reduce((s, i) => s + n(i.stock) * n(i.cost), 0);
  const low = data.items.filter((i) => n(i.stock) <= n(i.minStock));
  const cash = data.treasuries.reduce((s, t) => s + n(t.balance), 0);
  const debt = data.customers.reduce((s, c) => s + n(c.balance), 0);
  const profit = profitSummary(data);

  const byCat = data.categories.map((c) => ({
    name: c.name,
    count: data.items.filter((i) => i.categoryId === c.id).length,
  }));
  const max = Math.max(...byCat.map((c) => c.count), 1);

  return (
    <Panel title="إحصائيات مكتبة النور">
      <div className="kpi-row">
        <div className="kpi">
          <span className="l">مبيعات محفوظة</span>
          <span className="n">{salesTotal.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">مشتريات</span>
          <span className="n">{purchases.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">قيمة المخزون</span>
          <span className="n">{stockValue.toFixed(0)}</span>
        </div>
        <div className="kpi">
          <span className="l">نقدية الخزائن</span>
          <span className="n">{cash.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">مديونية العملاء</span>
          <span className="n">{debt.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">أصناف تحت الحد</span>
          <span className="n">{low.length}</span>
        </div>
      </div>
      <div className="kpi-row">
        <div className="kpi">
          <span className="l">مجمل الربح</span>
          <span className="n">{profit.gross.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">صافي الربح</span>
          <span className="n">{profit.net.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">عقود تقسيط</span>
          <span className="n">{data.installments.filter((i) => i.status === "active").length}</span>
        </div>
        <div className="kpi">
          <span className="l">متبقي أقساط</span>
          <span className="n">{data.installments.reduce((s, i) => s + n(i.remaining), 0).toFixed(0)}</span>
        </div>
      </div>
      <div className="chart-panel">
        <b>توزيع الأصناف على الأقسام</b>
        <div className="bars">
          {byCat.map((c) => (
            <div key={c.name} className="bar" style={{ height: `${(c.count / max) * 100}%` }}>
              <span>{c.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function PriceListScreen({ data }: { data: BootstrapData }) {
  const [q, setQ] = useState("");
  const rows = data.items.filter((i) => !q || i.name.includes(q) || i.code.includes(q));
  return (
    <Panel
      title="بيان الأسعار"
      extra={
        <button type="button" className="btn" onClick={() => window.print()}>
          طباعة
        </button>
      }
    >
      <div className="toolbar">
        <div className="field">
          <span>بحث</span>
          <input className="win-input inp-search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>كود</th>
              <th>الصنف</th>
              <th>وحدة</th>
              <th>سعر البيع</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td>{i.code}</td>
                <td>{i.name}</td>
                <td>{i.unit}</td>
                <td>{n(i.price).toFixed(2)}</td>
                <td>{n(i.stock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ReportsScreen({ data }: { data: BootstrapData }) {
  const [sub, setSub] = useState("sale");
  const rows = data.invoices.filter((i) => i.type === sub);
  return (
    <Panel title="التقارير">
      <SubTabs
        items={[
          { id: "sale", label: "فواتير البيع" },
          { id: "purchase", label: "المشتريات" },
          { id: "profit", label: "الأرباح" },
          { id: "top", label: "الأكثر مبيعاً" },
          { id: "debts", label: "المديونية" },
          { id: "statement", label: "كشف حساب" },
        ]}
        value={sub}
        onChange={setSub}
      />
      {sub === "profit" ? (
        <ProfitsView data={data} />
      ) : sub === "top" ? (
        <TopItemsView data={data} />
      ) : sub === "debts" ? (
        <DebtsView data={data} />
      ) : sub === "statement" ? (
        <StatementView data={data} kind="customer" />
      ) : (
        <div className="grid-wrap scroll-y">
          <table className="data">
            <thead>
              <tr>
                <th>رقم</th>
                <th>التاريخ</th>
                <th>الطرف</th>
                <th>صافي</th>
                <th>مدفوع</th>
                <th>متبقي</th>
                <th>حالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.number}</td>
                  <td>{new Date(r.date).toLocaleString("ar-EG")}</td>
                  <td className="cell-name">{r.partyName}</td>
                  <td>{n(r.net).toFixed(2)}</td>
                  <td>{n(r.paid).toFixed(2)}</td>
                  <td>{n(r.remaining).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${r.status === "saved" ? "ok" : "info"}`}>
                      {r.status === "saved" ? "محفوظة" : r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function SettingsScreen({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const [form, setForm] = useState(data.settings);
  async function save() {
    await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "settings", entries: form }),
    });
    toast("ok", "تم حفظ الإعدادات");
    await reload();
  }
  const set = (key: string, value: string) => setForm({ ...form, [key]: value });
  return (
    <Panel title="إعدادات المكتبة">
      <div className="form-row">
        <label className="fl fl-name">
          <span>اسم المحل</span>
          <input className="win-input" value={form.store_name || ""} onChange={(e) => set("store_name", e.target.value)} />
        </label>
        <label className="fl fl-activity">
          <span>النشاط</span>
          <input className="win-input" value={form.store_activity || ""} onChange={(e) => set("store_activity", e.target.value)} />
        </label>
        <label className="fl fl-name">
          <span>اسم المستخدم</span>
          <input className="win-input" value={form.user_name || ""} onChange={(e) => set("user_name", e.target.value)} />
        </label>
      </div>
      <div className="form-row">
        <label className="fl fl-phone">
          <span>الهاتف</span>
          <input className="win-input num" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label className="fl fl-phone">
          <span>واتساب</span>
          <input className="win-input num" value={form.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} />
        </label>
        <label className="fl fl-name">
          <span>الموقع</span>
          <input className="win-input" value={form.website || ""} onChange={(e) => set("website", e.target.value)} />
        </label>
        <label className="fl fl-name">
          <span>البريد</span>
          <input className="win-input" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="fl fl-num">
          <span>نسبة الضريبة</span>
          <input className="win-input num" value={form.tax_percent || "0"} onChange={(e) => set("tax_percent", e.target.value)} />
        </label>
      </div>
      <div className="form-row">
        <label className="fl fl-full">
          <span>تذييل الفاتورة</span>
          <input className="win-input" value={form.invoice_footer || ""} onChange={(e) => set("invoice_footer", e.target.value)} />
        </label>
      </div>
      <div className="form-row">
        <label className="fl fl-unit">
          <span>العملة</span>
          <input className="win-input" value={form.currency || "جنيه"} onChange={(e) => set("currency", e.target.value)} />
        </label>
        <label className="fl fl-date">
          <span>السنة المالية</span>
          <input className="win-input num" value={form.fiscal_year || "2026"} onChange={(e) => set("fiscal_year", e.target.value)} />
        </label>
        <label className="fl fl-code">
          <span>بادئة الفاتورة</span>
          <input className="win-input num" value={form.invoice_prefix || "INV"} onChange={(e) => set("invoice_prefix", e.target.value)} />
        </label>
        <label className="fl fl-select">
          <span>الوردية</span>
          <select className="win-input" value={form.cashier_shift || "صباحي"} onChange={(e) => set("cashier_shift", e.target.value)}>
            <option>صباحي</option>
            <option>مسائي</option>
          </select>
        </label>
        <label className="fl fl-select">
          <span>البيع الآجل</span>
          <select className="win-input" value={form.allow_credit || "1"} onChange={(e) => set("allow_credit", e.target.value)}>
            <option value="1">مسموح</option>
            <option value="0">نقدي فقط</option>
          </select>
        </label>
        <label className="fl fl-num">
          <span>شهور التقسيط</span>
          <input className="win-input num" value={form.default_installment_months || "4"} onChange={(e) => set("default_installment_months", e.target.value)} />
        </label>
        <label className="fl fl-num">
          <span>حد هامش الربح</span>
          <input className="win-input num" value={form.min_profit_percent || "15"} onChange={(e) => set("min_profit_percent", e.target.value)} />
        </label>
        <label className="fl fl-select">
          <span>تنبيه الحد الأدنى</span>
          <select className="win-input" value={form.low_stock_alert || "1"} onChange={(e) => set("low_stock_alert", e.target.value)}>
            <option value="1">تشغيل</option>
            <option value="0">إيقاف</option>
          </select>
        </label>
        <label className="fl fl-select">
          <span>طباعة بعد الحفظ</span>
          <select className="win-input" value={form.print_after_save || "0"} onChange={(e) => set("print_after_save", e.target.value)}>
            <option value="1">نعم</option>
            <option value="0">لا</option>
          </select>
        </label>
        <label className="fl fl-select">
          <span>بيع بدون رصيد</span>
          <select className="win-input" value={form.allow_negative_stock || "0"} onChange={(e) => set("allow_negative_stock", e.target.value)}>
            <option value="0">ممنوع</option>
            <option value="1">مسموح</option>
          </select>
        </label>
        <label className="fl fl-select">
          <span>الكتب للبيع فقط</span>
          <select className="win-input" value={form.books_no_return || "1"} onChange={(e) => set("books_no_return", e.target.value)}>
            <option value="1">لا استبدال</option>
            <option value="0">مسموح مرتجع</option>
          </select>
        </label>
      </div>
      <div className="theme-row">
        {[
          { id: "navy", label: "أزرق", bg: "#2f54d0" },
          { id: "emerald", label: "أخضر", bg: "#059669" },
          { id: "burgundy", label: "نبيتي", bg: "#9f1239" },
          { id: "gold", label: "ذهبي", bg: "#b45309" },
          { id: "dark", label: "ليلي", bg: "#1e293b" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`theme-swatch ${form.theme === t.id ? "on" : ""}`}
            style={{ background: t.bg }}
            onClick={() => set("theme", t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={() => void save()}>
          حفظ الإعدادات
        </button>
      </div>
    </Panel>
  );
}

export function SetupScreen({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    store_name: data.settings.store_name || "مكتبة النور",
    store_activity: data.settings.store_activity || "أدوات مدرسية ومكتبية وكتب خارجية",
    phone: data.settings.phone || "",
    whatsapp: data.settings.whatsapp || "",
    user_name: data.settings.user_name || "admin",
    invoice_footer: data.settings.invoice_footer || "",
  });

  const steps = ["بيانات المحل", "طريقة البيع", "المستخدم", "سطح المكتب"];

  async function finish() {
    await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "settings", entries: { ...form, setup_done: "1" } }),
    });
    toast("ok", "تم تجهيز البرنامج للعمل");
    await reload();
  }

  return (
    <div className="wizard">
      <div className="wizard-card">
        <div className="panel-h">معالج التثبيت والإعداد — خطوة بخطوة</div>
        <div className="wizard-steps">
          {steps.map((s, i) => (
            <button key={s} type="button" className={`step-pill ${step === i ? "on" : ""}`} onClick={() => setStep(i)}>
              {i + 1}. {s}
            </button>
          ))}
        </div>
        <div className="wizard-body">
          {step === 0 && (
            <>
              <h2>بيانات المكتبة</h2>
              <p>الاسم الظاهر على الفواتير وشريط البرنامج</p>
              <div className="form-row">
                <label className="fl fl-name">
                  <span>اسم المحل</span>
                  <input className="win-input" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
                </label>
                <label className="fl fl-activity">
                  <span>النشاط</span>
                  <input className="win-input" value={form.store_activity} onChange={(e) => setForm({ ...form, store_activity: e.target.value })} />
                </label>
                <label className="fl fl-phone">
                  <span>الهاتف</span>
                  <input className="win-input num" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label className="fl fl-phone">
                  <span>واتساب</span>
                  <input className="win-input num" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </label>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2>طريقة البيع المناسبة لمحلك</h2>
              <p>تم ضبط الفاتورة للبيع السريع من أزرار الأصناف بدون سكرول</p>
              <div className="hint-grid">
                <div className="hint"><b>بيع نقدي</b>الكاشير يضغط الصنف ويحفظ بـ F5</div>
                <div className="hint"><b>بيع آجل</b>للمدارس والحضانات من نوع الدفع</div>
                <div className="hint"><b>كتب خارجية</b>قسم مستقل بأسعار ثابتة</div>
                <div className="hint"><b>جملة ومكتبات</b>اختَر النوع جملة من رأس الفاتورة</div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2>مستخدم الجهاز</h2>
              <p>يظهر في الشريط السفلي، مناسب لجهاز الكاشير</p>
              <div className="form-row">
                <label className="fl fl-name">
                  <span>اسم المستخدم</span>
                  <input className="win-input" value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} />
                </label>
                <label className="fl fl-full">
                  <span>تذييل الفاتورة</span>
                  <input className="win-input" value={form.invoice_footer} onChange={(e) => setForm({ ...form, invoice_footer: e.target.value })} />
                </label>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2>تحويله لبرنامج سطح مكتب</h2>
              <p>اقتراحي العملي لمحل قرطاسية: نافذة كاملة بدون متصفح، وملف تثبيت ويندوز خطوة بخطوة</p>
              <div className="hint-grid">
                <div className="hint"><b>1. تجريب الآن</b>شغّل البرنامج من المتصفح كشاشة كاملة — نفس شكل الـ exe</div>
                <div className="hint"><b>2. تثبيته هنا</b>من المتصفح: تثبيت التطبيق (PWA) فيصبح أيقونة على سطح المكتب</div>
                <div className="hint"><b>3. ملف تنفيذي</b>الأفضل Electron + NSIS: Next.js للواجهة وملف Setup.exe للمكتبة</div>
                <div className="hint"><b>4. عند العميل</b>Next → اسم المكتبة → مسار التثبيت → اختصار سطح المكتب → إنهاء</div>
              </div>
            </>
          )}
        </div>
        <div className="wizard-actions">
          <button type="button" className="btn" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            السابق
          </button>
          {step < 3 ? (
            <button type="button" className="btn primary" onClick={() => setStep(step + 1)}>
              التالي
            </button>
          ) : (
            <button type="button" className="btn ok" onClick={() => void finish()}>
              إنهاء التثبيت وبدء العمل
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContactScreen({ data }: { data: BootstrapData }) {
  return (
    <Panel title="اتصل بنا">
      <div style={{ padding: 18, lineHeight: 1.9 }}>
        <h2 style={{ margin: 0 }}>{data.settings.store_name || "مكتبة النور"}</h2>
        <p>{data.settings.store_activity}</p>
        <p>هاتف / واتساب: {data.settings.whatsapp}</p>
        <p>الموقع: {data.settings.website}</p>
        <p>البريد: {data.settings.email}</p>
        <p className="muted">نظام مبيعات مكتبي بدون سكرول لإدارة محل أدوات مدرسية ومكتبية وكتب خارجية.</p>
      </div>
    </Panel>
  );
}

export function WarehousesScreen({ data }: { data: BootstrapData }) {
  return (
    <Panel title="المخازن">
      <div className="kpi-row">
        {data.warehouses.map((w) => (
          <div className="kpi" key={w.id}>
            <span className="l">{w.name}</span>
            <span className="n">{w.isDefault ? "رئيسي" : "فرع"}</span>
          </div>
        ))}
      </div>
      <div className="grid-wrap scroll-y" style={{ marginTop: 8 }}>
        <table className="data">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الرصيد الكلي</th>
              <th>حد أدنى</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i: Item) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{n(i.stock)}</td>
                <td>{n(i.minStock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function renderModule(
  module: ModuleId,
  data: BootstrapData,
  reload: () => Promise<void>,
  toast: (k: "ok" | "err" | "info", t: string) => void,
) {
  switch (module) {
    case "items":
      return <ItemsScreen data={data} reload={reload} toast={toast} />;
    case "customers":
      return <PartyScreen kind="customers" data={data} reload={reload} toast={toast} />;
    case "suppliers":
      return <PartyScreen kind="suppliers" data={data} reload={reload} toast={toast} />;
    case "employees":
      return <PartyScreen kind="employees" data={data} reload={reload} toast={toast} />;
    case "cash_in":
      return <CashScreen type="receipt" data={data} reload={reload} toast={toast} />;
    case "cash_out":
      return <CashScreen type="payment" data={data} reload={reload} toast={toast} />;
    case "expenses":
      return <ExpensesScreen data={data} reload={reload} toast={toast} />;
    case "treasury":
      return <TreasuryScreen data={data} />;
    case "attendance":
      return <AttendanceScreen data={data} reload={reload} toast={toast} />;
    case "transfers":
      return <TransfersScreen data={data} reload={reload} toast={toast} />;
    case "stats":
      return <StatsScreen data={data} />;
    case "prices":
      return <PriceListScreen data={data} />;
    case "reports":
      return <ReportsScreen data={data} />;
    case "settings":
      return <SettingsScreen data={data} reload={reload} toast={toast} />;
    case "contact":
      return <ContactScreen data={data} />;
    case "warehouses":
      return <WarehousesScreen data={data} />;
    case "setup":
      return <SetupScreen data={data} reload={reload} toast={toast} />;
    case "installments":
      return (
        <Panel title="نظام التقسيط">
          <InstallmentsView data={data} reload={reload} toast={toast} />
        </Panel>
      );
    case "statement":
      return (
        <Panel title="كشف حساب عميل">
          <StatementView data={data} kind="customer" />
        </Panel>
      );
    case "profits":
      return (
        <Panel title="الأرباح">
          <ProfitsView data={data} />
        </Panel>
      );
    default:
      return null;
  }
}

export const MODULE_TITLES: Record<ModuleId, string> = {
  home: "الرئيسية",
  sales: "فاتورة مبيعات",
  purchase: "فاتورة مشتريات",
  sale_return: "مرتجع مبيعات",
  purchase_return: "مرتجع مشتريات",
  customers: "العملاء",
  items: "الاصناف",
  employees: "إدارة الموظفين",
  suppliers: "الموردين",
  expenses: "المصروفات",
  treasury: "الخزينة",
  cash_out: "دفع نقدية",
  cash_in: "إستلام نقدية",
  attendance: "حضور وانصراف",
  transfers: "تحويلات مخازن",
  stats: "إحصائيات",
  prices: "بيان أسعار",
  reports: "التقارير",
  settings: "الإعدادات",
  contact: "اتصل بنا",
  warehouses: "المخازن",
  setup: "معالج التثبيت",
  installments: "التقسيط",
  statement: "كشف حساب",
  profits: "الأرباح",
};


