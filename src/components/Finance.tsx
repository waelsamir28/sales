"use client";

import { n, round2 } from "@/lib/money";
import type { BootstrapData, Invoice } from "@/lib/types";
import { useMemo, useState } from "react";

export function SubTabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="subtabs-wrap">
      <div className="subtabs">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`subtab ${value === it.id ? "on" : ""}`}
            onClick={() => onChange(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function profitSummary(data: BootstrapData) {
  const sales = data.invoices.filter((i) => i.type === "sale" && i.status === "saved");
  const saleReturns = data.invoices.filter((i) => i.type === "sale_return" && i.status === "saved");
  const salesNet = sales.reduce((s, i) => s + n(i.net), 0) - saleReturns.reduce((s, i) => s + n(i.net), 0);
  const cogs = data.invoiceItems.reduce((sum, line) => {
    const inv = data.invoices.find((i) => i.id === line.invoiceId);
    if (!inv || inv.status !== "saved") return sum;
    const item = data.items.find((x) => x.id === line.itemId);
    const cost = n(item?.cost);
    const qty = n(line.qty);
    if (inv.type === "sale") return sum + cost * qty;
    if (inv.type === "sale_return") return sum - cost * qty;
    return sum;
  }, 0);
  const expenseTotal = data.expenses.reduce((s, e) => s + n(e.amount), 0);
  const gross = round2(salesNet - cogs);
  const net = round2(gross - expenseTotal);
  return { salesNet: round2(salesNet), cogs: round2(cogs), expenseTotal: round2(expenseTotal), gross, net };
}

type LedgerLine = { date: string; desc: string; debit: number; credit: number };

export function buildStatement(data: BootstrapData, partyId: number, kind: "customer" | "supplier"): LedgerLine[] {
  const lines: LedgerLine[] = [];
  const invTypes: Invoice["type"][] =
    kind === "customer" ? ["sale", "sale_return"] : ["purchase", "purchase_return"];
  for (const inv of data.invoices.filter((i) => i.partyId === partyId && invTypes.includes(i.type))) {
    const debit =
      (kind === "customer" && inv.type === "sale") || (kind === "supplier" && inv.type === "purchase")
        ? n(inv.net)
        : 0;
    const credit =
      (kind === "customer" && inv.type === "sale_return") || (kind === "supplier" && inv.type === "purchase_return")
        ? n(inv.net)
        : 0;
    lines.push({
      date: inv.date,
      desc: `${inv.type === "sale" ? "فاتورة بيع" : inv.type === "sale_return" ? "مرتجع بيع" : inv.type === "purchase" ? "فاتورة شراء" : "مرتجع شراء"} ${inv.number}`,
      debit,
      credit,
    });
  }
  for (const c of data.cashTransactions.filter((x) => x.partyId === partyId && x.partyType === kind)) {
    const isIn = c.type === "receipt";
    lines.push({
      date: c.date,
      desc: isIn ? `تحصيل — ${c.notes || "نقدية"}` : `صرف — ${c.notes || "نقدية"}`,
      debit: kind === "supplier" && isIn ? 0 : !isIn && kind === "customer" ? n(c.amount) : 0,
      credit: kind === "customer" && isIn ? n(c.amount) : kind === "supplier" && !isIn ? n(c.amount) : 0,
    });
  }
  if (kind === "customer") {
    for (const p of data.installmentPayments) {
      const plan = data.installments.find((i) => i.id === p.installmentId);
      if (!plan || plan.customerId !== partyId) continue;
      lines.push({ date: p.date, desc: `قسط — ${plan.title}`, debit: 0, credit: n(p.amount) });
    }
  }
  return lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function StatementView({
  data,
  kind = "customer",
}: {
  data: BootstrapData;
  kind?: "customer" | "supplier";
}) {
  const parties = kind === "customer" ? data.customers : data.suppliers;
  const [partyId, setPartyId] = useState(parties[0]?.id ?? 0);
  const party = parties.find((p) => p.id === partyId);
  const rows = useMemo(() => buildStatement(data, partyId, kind), [data, partyId, kind]);
  let run = 0;
  const withBal = rows.map((r) => {
    run = round2(run + r.debit - r.credit);
    return { ...r, bal: run };
  });
  return (
    <>
      <div className="form-row">
        <label className="fl fl-name">
          <span>{kind === "customer" ? "العميل" : "المورد"}</span>
          <select className="win-input name-input" value={partyId} onChange={(e) => setPartyId(Number(e.target.value))}>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-num">
          <span>الرصيد الحالي</span>
          <input className="win-input num" readOnly value={n(party?.balance).toFixed(2)} />
        </label>
        <button type="button" className="btn" onClick={() => window.print()}>
          طباعة الكشف
        </button>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {withBal.map((r, i) => (
              <tr key={`${r.date}-${i}`}>
                <td>{new Date(r.date).toLocaleDateString("ar-EG")}</td>
                <td className="cell-name">{r.desc}</td>
                <td>{r.debit ? r.debit.toFixed(2) : ""}</td>
                <td>{r.credit ? r.credit.toFixed(2) : ""}</td>
                <td>{r.bal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function InstallmentsView({
  data,
  reload,
  toast,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
}) {
  const monthsDefault = n(data.settings.default_installment_months, 4);
  const [customerId, setCustomerId] = useState(data.customers[1]?.id ?? data.customers[0]?.id ?? 0);
  const [title, setTitle] = useState("تقسيط مستلزمات دراسية");
  const [total, setTotal] = useState("0");
  const [down, setDown] = useState("0");
  const [months, setMonths] = useState(String(monthsDefault));
  const [payId, setPayId] = useState(data.installments[0]?.id ?? 0);
  const [payAmt, setPayAmt] = useState("");
  const [treasuryId, setTreasuryId] = useState(data.treasuries[0]?.id ?? 1);
  const remaining = Math.max(n(total) - n(down), 0);
  const monthly = months && n(months) ? remaining / n(months) : 0;

  async function save() {
    const res = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "installment",
        customerId,
        title,
        total: n(total),
        downPayment: n(down),
        months: n(months, 3),
        startDate: new Date().toISOString().slice(0, 10),
        notes: "",
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return toast("err", json.error || "تعذر الحفظ");
    toast("ok", "تم فتح عقد التقسيط");
    await reload();
  }

  async function pay() {
    const res = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "installment-pay",
        id: payId,
        amount: n(payAmt),
        treasuryId,
        notes: "تحصيل قسط",
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return toast("err", json.error || "تعذر التحصيل");
    toast("ok", "تم تحصيل القسط");
    setPayAmt("");
    await reload();
  }

  return (
    <>
      <div className="form-row">
        <label className="fl fl-name">
          <span>العميل</span>
          <select className="win-input name-input" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-item">
          <span>بيان العقد</span>
          <input className="win-input name-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="fl fl-num">
          <span>الإجمالي</span>
          <input className="win-input num" value={total} onChange={(e) => setTotal(e.target.value)} />
        </label>
        <label className="fl fl-num">
          <span>المقدم</span>
          <input className="win-input num" value={down} onChange={(e) => setDown(e.target.value)} />
        </label>
        <label className="fl fl-num">
          <span>عدد الأشهر</span>
          <input className="win-input num" value={months} onChange={(e) => setMonths(e.target.value)} />
        </label>
        <label className="fl fl-num">
          <span>القسط الشهري</span>
          <input className="win-input num" readOnly value={monthly.toFixed(2)} />
        </label>
        <button type="button" className="btn primary" onClick={() => void save()}>
          فتح عقد
        </button>
      </div>
      <div className="form-row">
        <label className="fl fl-item">
          <span>تحصيل قسط</span>
          <select className="win-input" value={payId} onChange={(e) => setPayId(Number(e.target.value))}>
            {data.installments.map((p) => (
              <option key={p.id} value={p.id}>
                {data.customers.find((c) => c.id === p.customerId)?.name} — {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="fl fl-num">
          <span>المبلغ</span>
          <input className="win-input num" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
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
        <button type="button" className="btn ok" onClick={() => void pay()}>
          تحصيل
        </button>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>العميل</th>
              <th>البيان</th>
              <th>الإجمالي</th>
              <th>مقدم</th>
              <th>المتبقي</th>
              <th>الشهور</th>
              <th>القسط</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data.installments.map((p) => (
              <tr key={p.id}>
                <td className="cell-name">{data.customers.find((c) => c.id === p.customerId)?.name}</td>
                <td className="cell-name">{p.title}</td>
                <td>{n(p.total).toFixed(2)}</td>
                <td>{n(p.downPayment).toFixed(2)}</td>
                <td>{n(p.remaining).toFixed(2)}</td>
                <td>{p.months}</td>
                <td>{n(p.monthlyAmount).toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.status === "done" ? "ok" : n(p.remaining) > 0 ? "warn" : "info"}`}>
                    {p.status === "done" ? "مسدد" : "جاري"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ProfitsView({ data }: { data: BootstrapData }) {
  const p = profitSummary(data);
  const byItem = data.items
    .map((it) => {
      const sold = data.invoiceItems.reduce((s, line) => {
        const inv = data.invoices.find((i) => i.id === line.invoiceId);
        if (!inv || inv.status !== "saved" || line.itemId !== it.id) return s;
        if (inv.type === "sale") return s + n(line.qty);
        if (inv.type === "sale_return") return s - n(line.qty);
        return s;
      }, 0);
      const revenue = data.invoiceItems.reduce((s, line) => {
        const inv = data.invoices.find((i) => i.id === line.invoiceId);
        if (!inv || inv.status !== "saved" || line.itemId !== it.id) return s;
        const val = n(line.price) * n(line.qty);
        if (inv.type === "sale") return s + val;
        if (inv.type === "sale_return") return s - val;
        return s;
      }, 0);
      const profit = round2(revenue - sold * n(it.cost));
      const margin = revenue ? round2((profit / revenue) * 100) : 0;
      return { ...it, sold, revenue: round2(revenue), profit, margin };
    })
    .filter((x) => x.sold > 0)
    .sort((a, b) => b.profit - a.profit);

  return (
    <>
      <div className="kpi-row">
        <div className="kpi">
          <span className="l">صافي المبيعات</span>
          <span className="n">{p.salesNet.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">تكلفة البضاعة</span>
          <span className="n">{p.cogs.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">مجمل الربح</span>
          <span className="n">{p.gross.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">المصروفات</span>
          <span className="n">{p.expenseTotal.toFixed(2)}</span>
        </div>
        <div className="kpi">
          <span className="l">صافي الربح</span>
          <span className="n" style={{ color: p.net >= 0 ? "#15803d" : "#b91c1c" }}>
            {p.net.toFixed(2)}
          </span>
        </div>
        <div className="kpi">
          <span className="l">هامش الربح %</span>
          <span className="n">{p.salesNet ? ((p.net / p.salesNet) * 100).toFixed(1) : "0"}</span>
        </div>
      </div>
      <div className="grid-wrap scroll-y">
        <table className="data">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>المباع</th>
              <th>المبيعات</th>
              <th>التكلفة</th>
              <th>الربح</th>
              <th>الهامش %</th>
            </tr>
          </thead>
          <tbody>
            {byItem.map((it) => (
              <tr key={it.id}>
                <td className="cell-name">{it.name}</td>
                <td>{it.sold}</td>
                <td>{it.revenue.toFixed(2)}</td>
                <td>{(it.sold * n(it.cost)).toFixed(2)}</td>
                <td>{it.profit.toFixed(2)}</td>
                <td>{it.margin.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function TopItemsView({ data }: { data: BootstrapData }) {
  const rows = [...data.items]
    .map((it) => {
      const qty = data.invoiceItems.reduce((s, line) => {
        const inv = data.invoices.find((i) => i.id === line.invoiceId);
        if (!inv || inv.type !== "sale" || inv.status !== "saved" || line.itemId !== it.id) return s;
        return s + n(line.qty);
      }, 0);
      return { ...it, qty };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 20);
  return (
    <div className="grid-wrap scroll-y">
      <table className="data">
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية المباعة</th>
            <th>الرصيد</th>
            <th>سعر البيع</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="cell-name">{r.name}</td>
              <td>{r.qty}</td>
              <td>{n(r.stock)}</td>
              <td>{n(r.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DebtsView({ data }: { data: BootstrapData }) {
  const rows = data.customers.filter((c) => n(c.balance) > 0).sort((a, b) => n(b.balance) - n(a.balance));
  return (
    <div className="grid-wrap scroll-y">
      <table className="data">
        <thead>
          <tr>
            <th>العميل</th>
            <th>الهاتف</th>
            <th>المديونية</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td className="cell-name">{c.name}</td>
              <td>{c.phone}</td>
              <td>{n(c.balance).toFixed(2)}</td>
              <td>
                <span className={`badge ${n(c.balance) > 500 ? "err" : "warn"}`}>
                  {n(c.balance) > 500 ? "متأخر" : "مدين"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
