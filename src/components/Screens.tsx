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
import InvoicePreview from "@/components/InvoicePreview";
import { printInvoice } from "@/lib/invoice-print";
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
  subTab,
  onSubTab,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
  subTab?: string;
  onSubTab?: (id: string) => void;
}) {
  const emptyGroup = { name: "", color: "#1d4ed8" };
  const emptyQuick = {
    name: "",
    categoryId: data.categories[0]?.id ?? 1,
    unit: "عدد",
    price: "",
    cost: "",
    stock: "",
  };
  const emptyItem = {
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

  const [form, setForm] = useState(emptyItem);
  const [quick, setQuick] = useState(emptyQuick);
  const [group, setGroup] = useState(emptyGroup);
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState<number | 0>(0);
  const [subLocal, setSubLocal] = useState("list");
  const sub = subTab ?? subLocal;
  const setSub = (id: string) => {
    setSubLocal(id);
    onSubTab?.(id);
  };
  const [busy, setBusy] = useState(false);

  const catName = (id: number) => data.categories.find((c) => c.id === id)?.name ?? "";
  const catCount = (id: number) => data.items.filter((i) => i.categoryId === id).length;
  const rows = data.items.filter(
    (i) =>
      (!groupFilter || i.categoryId === groupFilter) &&
      (!q || i.name.includes(q) || i.code.includes(q) || i.barcode.includes(q)),
  );
  const groups = data.categories.length;
  const stockValue = data.items.reduce((sum, i) => sum + n(i.stock) * n(i.cost), 0);

  async function call(method: "POST" | "PUT" | "DELETE", body?: unknown, query = "") {
    setBusy(true);
    try {
      const res = await fetch(`/api/items${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        item?: Item;
        category?: { id: number; name: string };
      };
    } finally {
      setBusy(false);
    }
  }

  async function quickAdd() {
    if (!quick.name.trim()) {
      toast("err", "اكتب اسم الصنف");
      return;
    }
    const json = await call("POST", { mode: "quick", ...quick });
    if (!json.ok) return toast("err", json.error || "تعذر الإضافة");
    toast("ok", `تمت إضافة «${json.item?.name ?? quick.name}» إلى ${catName(quick.categoryId)}`);
    setQuick({ ...emptyQuick, categoryId: quick.categoryId });
    await reload();
  }

  async function addGroup() {
    if (!group.name.trim()) {
      toast("err", "اكتب اسم البند");
      return;
    }
    const json = await call("POST", { mode: "category", ...group, sortOrder: groups + 1 });
    if (!json.ok) return toast("err", json.error || "تعذر إضافة البند");
    toast("ok", `تمت إضافة بند «${json.category?.name ?? group.name}»`);
    setGroup(emptyGroup);
    await reload();
  }

  async function removeGroup(id: number) {
    const json = await call("DELETE", undefined, `?mode=category&id=${id}`);
    if (!json.ok) return toast("err", json.error || "تعذر حذف البند");
    toast("ok", "تم حذف البند");
    if (groupFilter === id) setGroupFilter(0);
    await reload();
  }

  async function save() {
    if (!form.name.trim()) {
      toast("err", "اكتب اسم الصنف");
      return;
    }
    const json = await call(form.id ? "PUT" : "POST", form);
    if (!json.ok) return toast("err", json.error || "خطأ");
    toast("ok", form.id ? "تم تعديل الصنف" : "تمت إضافة الصنف");
    setForm(emptyItem);
    await reload();
  }

  async function remove(id: number) {
    const json = await call("DELETE", undefined, `?id=${id}`);
    if (!json.ok) return toast("err", json.error || "تعذر الحذف");
    toast("ok", json.message || "تم الحذف");
    await reload();
  }

  function editItem(item: Item) {
    setForm({ ...item });
    setSub("list");
  }

  return (
    <Panel
      title="الأصناف · المجموعات · البنود"
      extra={
        <span className="badge info">
          {data.items.length} صنف · {groups} بند
        </span>
      }
    >
      <SubTabs
        items={[
          { id: "list", label: "الأصناف" },
          { id: "groups", label: "المجموعات · البنود" },
          { id: "quick", label: "إضافة سريعة" },
          { id: "profit", label: "أرباح الأصناف" },
          { id: "low", label: "تحت الحد الأدنى" },
        ]}
        value={sub}
        onChange={setSub}
      />

      {/* ------------------ المجموعات / البنود ------------------ */}
      {sub === "groups" ? (
        <>
          <div className="dark-bar">
            <span className="dark-bar-title">＋ إضافة بند / مجموعة جديدة</span>
            <label className="fl fl-name">
              <span>اسم البند</span>
              <input
                className="win-input name-input"
                placeholder="مثال: أقلام"
                value={group.name}
                onChange={(e) => setGroup({ ...group, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void addGroup();
                }}
              />
            </label>
            <label className="fl fl-num">
              <span>اللون</span>
              <input
                type="color"
                className="color-input"
                value={group.color}
                onChange={(e) => setGroup({ ...group, color: e.target.value })}
              />
            </label>
            <button type="button" className="btn ok" disabled={busy} onClick={() => void addGroup()}>
              ＋ إضافة بند
            </button>
          </div>
          <div className="group-grid">
            {data.categories.map((c) => (
              <div className="group-card" key={c.id} style={{ borderColor: c.color }}>
                <span className="group-dot" style={{ borderColor: c.color }} />
                <div className="group-meta">
                  <b>{c.name}</b>
                  <span className="muted">{catCount(c.id)} صنف</span>
                </div>
                <div className="group-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setSub("quick");
                      setQuick({ ...emptyQuick, categoryId: c.id });
                    }}
                  >
                    ＋ صنف
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setGroupFilter(c.id);
                      setSub("list");
                    }}
                  >
                    عرض
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => void removeGroup(c.id)}
                    title="حذف البند"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
            {data.categories.length === 0 ? (
              <p className="muted">ما فيش بنود لسه — أضف أول بند من فوق.</p>
            ) : null}
          </div>
        </>
      ) : null}

      {/* ------------------ إضافة سريعة ------------------ */}
      {sub === "quick" ? (
        <>
          <div className="dark-bar">
            <span className="dark-bar-title">＋ إضافة صنف جديد</span>
            <span className="dark-bar-note">الكود والباركود بيتولّدوا تلقائيًا · Enter يضيف الصنف</span>
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => void quickAdd()}
            >
              ＋ إضافة الصنف
            </button>
          </div>
          <div className="form-row quick-add dark-fields">
            <label className="fl fl-name">
              <span>اسم الصنف</span>
              <input
                className="win-input name-input"
                autoFocus
                value={quick.name}
                onChange={(e) => setQuick({ ...quick, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void quickAdd();
                }}
              />
            </label>
            <label className="fl fl-select">
              <span>البند / المجموعة</span>
              <select
                className="win-input"
                value={quick.categoryId}
                onChange={(e) => setQuick({ ...quick, categoryId: Number(e.target.value) })}
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
              <input
                className="win-input"
                value={quick.unit}
                onChange={(e) => setQuick({ ...quick, unit: e.target.value })}
              />
            </label>
            <label className="fl fl-num">
              <span>الكمية</span>
              <input
                className="win-input num"
                value={quick.stock}
                onChange={(e) => setQuick({ ...quick, stock: e.target.value })}
              />
            </label>
            <label className="fl fl-num">
              <span>سعر البيع</span>
              <input
                className="win-input num"
                value={quick.price}
                onChange={(e) => setQuick({ ...quick, price: e.target.value })}
              />
            </label>
            <label className="fl fl-num">
              <span>سعر التكلفة</span>
              <input
                className="win-input num"
                value={quick.cost}
                onChange={(e) => setQuick({ ...quick, cost: e.target.value })}
              />
            </label>
          </div>
        </>
      ) : null}

      {/* ------------------ الأصناف ------------------ */}
      {sub === "list" ? (
        <>
          <div className="dark-bar">
            <span className="dark-bar-title">الأصناف</span>
            <div className="field dn">
              <span>بحث</span>
              <input
                className="win-input inp-search"
                placeholder="اسم / كود / باركود"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="field dn">
              <span>البند</span>
              <select
                className="win-input inp-select"
                value={groupFilter}
                onChange={(e) => setGroupFilter(Number(e.target.value))}
              >
                <option value={0}>كل البنود</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="dark-bar-actions">
              <button type="button" className="btn primary" disabled={busy} onClick={() => void save()}>
                {form.id ? "💾 حفظ التعديل" : "＋ إضافة الصنف"}
              </button>
              <button type="button" className="btn" onClick={() => setForm(emptyItem)}>
                ＋ جديد
              </button>
              {form.id ? <span className="badge warn">تعديل: {form.name}</span> : null}
            </div>
          </div>

          <div className="form-row item-form dark-fields">
            <label className="fl fl-code">
              <span>الكود (تلقائي)</span>
              <input
                className="win-input num"
                value={form.code}
                placeholder="auto"
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </label>
            <label className="fl fl-code">
              <span>الباركود</span>
              <input
                className="win-input num"
                value={form.barcode}
                placeholder="auto"
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </label>
            <div className="fl-pair">
              <label className="fl fl-item">
                <span>اسم الصنف</span>
                <input
                  className="win-input name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="fl fl-num fl-min">
                <span>حد أدنى</span>
                <input
                  className="win-input num"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </label>
            </div>
            <label className="fl fl-select">
              <span>البند</span>
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
              <input
                className="win-input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </label>
            <label className="fl fl-num">
              <span>سعر البيع</span>
              <input
                className="win-input num"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label className="fl fl-num">
              <span>سعر التكلفة</span>
              <input
                className="win-input num"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </label>
            <label className="fl fl-num">
              <span>الكمية</span>
              <input
                className="win-input num"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
          </div>

          <div className="grid-wrap scroll-y items-table-wrap">
            <table className="data items-table">
              <thead>
                <tr>
                  <th>كود</th>
                  <th>الصنف</th>
                  <th>البند</th>
                  <th>وحدة</th>
                  <th>سعر</th>
                  <th>تكلفة</th>
                  <th>كمية</th>
                  <th>حد أدنى</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className={form.id === i.id ? "sel" : ""}>
                    <td>{i.code}</td>
                    <td className="cell-name">{i.name}</td>
                    <td className="cell-name">
                      <span
                        className="group-pill"
                        style={{
                          borderColor: data.categories.find((c) => c.id === i.categoryId)?.color,
                          color: data.categories.find((c) => c.id === i.categoryId)?.color,
                        }}
                      >
                        {catName(i.categoryId)}
                      </span>
                    </td>
                    <td>{i.unit}</td>
                    <td>{n(i.price).toFixed(2)}</td>
                    <td>{n(i.cost).toFixed(2)}</td>
                    <td style={{ color: n(i.stock) <= n(i.minStock) ? "#b91c1c" : undefined }}>{n(i.stock)}</td>
                    <td>{n(i.minStock)}</td>
                    <td className="row-actions">
                      <button type="button" className="btn" onClick={() => editItem(i)}>
                        تعديل
                      </button>
                      <button type="button" className="btn danger" onClick={() => void remove(i.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      ما فيش أصناف مطابقة — جرّب بحث تاني أو أضف صنف جديد.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* ------------------ أرباح / حد أدنى ------------------ */}
      {sub === "profit" ? (
        <>
          <div className="stat-strip">
            <div>
              <span>قيمة المخزون (تكلفة)</span>
              <b>{stockValue.toFixed(2)}</b>
            </div>
            <div>
              <span>عدد الأصناف</span>
              <b>{data.items.length}</b>
            </div>
            <div>
              <span>عدد البنود</span>
              <b>{groups}</b>
            </div>
          </div>
          <ProfitsView data={data} />
        </>
      ) : null}

      {sub === "low" ? (
        <>
        <div className="dark-bar">
          <span className="dark-bar-title">تحت الحد الأدنى</span>
          <span className="dark-bar-note">الأصناف اللي الكمية بتاعتها وصلت للحد الأدنى أو أقل</span>
        </div>
        <div className="grid-wrap scroll-y items-table-wrap">
          <table className="data items-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الصنف</th>
                <th>البند</th>
                <th>الكمية</th>
                <th>الحد الأدنى</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items
                .filter((i) => n(i.stock) <= n(i.minStock))
                .map((i) => (
                  <tr key={i.id}>
                    <td>{i.code}</td>
                    <td className="cell-name">{i.name}</td>
                    <td className="cell-name">{catName(i.categoryId)}</td>
                    <td style={{ color: "#b91c1c", fontWeight: 800 }}>{n(i.stock)}</td>
                    <td>{n(i.minStock)}</td>
                    <td className="row-actions">
                      <button type="button" className="btn" onClick={() => editItem(i)}>
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        </>
      ) : null}
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

  const nextPartyCode = String(
    rows.reduce((max, r) => {
      const value = "code" in r ? Number(r.code) : 0;
      return Number.isFinite(value) && value > max ? value : max;
    }, 500) + 1,
  );

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
            <span>الكود (تلقائي)</span>
            <input
              className="win-input num code-auto"
              value={String(form.code) || nextPartyCode}
              readOnly
              title="بيتولّد تلقائيًا عند الحفظ"
            />
          </label>
        )}
        <label className="fl fl-name">
          <span>الاسم</span>
          <input className="win-input name-input" value={String(form.name)} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
          <select className="win-input name-input" value={partyId} onChange={(e) => setPartyId(Number(e.target.value))}>
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
      <div className="dark-bar">
        <span className="dark-bar-title">حركة نقدية جديدة</span>
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
      <div className="dark-bar">
        <span className="dark-bar-title">مصروف جديد</span>
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
      <div className="dark-bar">
        <span className="dark-bar-title">تسجيل الحضور والانصراف</span>
        <div className="field dn">
          <span>الموظف</span>
          <select className="win-input inp-name name-input" value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))}>
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
      <div className="dark-bar">
        <span className="dark-bar-title">تحويل مخزون جديد</span>
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
    <Panel title="إحصائيات مكتبة الجمال">
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
      <div className="dark-bar">
        <span className="dark-bar-title">بيان الأسعار</span>
        <div className="field dn">
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings", entries: form }),
      });
      toast("ok", "تم حفظ الإعدادات");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const set = (key: string, value: string) =>
    setForm({ ...form, [key]: value });
  const storeName = form.store_name || "مكتبة الجمال";
  const currency = form.currency || "جنيه";

  const demoLines = [
    {
      code: "1003",
      name: "كشكول 60 ورقة",
      unit: "عدد",
      qty: 3,
      price: 12.5,
      total: 37.5,
    },
    {
      code: "1006",
      name: "مسطرة 30 سم",
      unit: "عدد",
      qty: 2,
      price: 8,
      total: 16,
    },
    {
      code: "1011",
      name: "ألوان خشبية 12 لون",
      unit: "علبة",
      qty: 1,
      price: 65,
      total: 65,
    },
  ];
  const demoTotal = demoLines.reduce((sum, l) => sum + l.total, 0);

  const previewData = {
    storeName,
    storeActivity: form.store_activity,
    phone: form.phone,
    whatsapp: form.whatsapp,
    website: form.website,
    email: form.email,
    title: form.invoice_doc_title || "فاتورة بيع",
    number: form.invoice_prefix ? `${form.invoice_prefix}-4001` : 4001,
    date: new Date()
      .toLocaleString("en-GB", { hour12: false })
      .replace(",", ""),
    partyLabel: "العميل",
    partyName: "مدرسة النور الابتدائية",
    warehouseName: data.warehouses[0]?.name,
    treasuryName: data.treasuries[0]?.name,
    paymentType: "نقدي",
    lines: demoLines,
    itemCount: demoLines.length,
    qtyTotal: demoLines.reduce((sum, l) => sum + l.qty, 0),
    subtotal: demoTotal,
    delivery: 0,
    total: demoTotal,
    paid: demoTotal,
    remaining: 0,
    notes: form.invoice_notes || "",
    footer: form.invoice_footer,
    currency,
    accent: form.invoice_accent,
  };

  const themes = [
    { id: "navy", label: "أزرق", bg: "#2f54d0" },
    { id: "emerald", label: "أخضر", bg: "#059669" },
    { id: "burgundy", label: "نبيتي", bg: "#9f1239" },
    { id: "gold", label: "ذهبي", bg: "#b45309" },
    { id: "dark", label: "ليلي", bg: "#1e293b" },
  ];

  return (
    <Panel
      title="إعدادات المكتبة"
      extra={<span className="badge info">{storeName}</span>}
    >
      <div className="settings-scroll">
        <div className="settings-grid">
          {/* 1) بيانات المكتبة */}
          <section className="set-card">
            <h3>🏪 بيانات المكتبة</h3>
            <div className="set-fields">
              <label className="fl fl-name">
                <span>اسم المكتبة</span>
                <input
                  className="win-input"
                  value={form.store_name || ""}
                  onChange={(e) => set("store_name", e.target.value)}
                />
              </label>
              <label className="fl fl-activity">
                <span>النشاط</span>
                <input
                  className="win-input"
                  value={form.store_activity || ""}
                  onChange={(e) => set("store_activity", e.target.value)}
                />
              </label>
              <label className="fl fl-phone">
                <span>الهاتف</span>
                <input
                  className="win-input num"
                  value={form.phone || ""}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </label>
              <label className="fl fl-phone">
                <span>واتساب</span>
                <input
                  className="win-input num"
                  value={form.whatsapp || ""}
                  onChange={(e) => set("whatsapp", e.target.value)}
                />
              </label>
              <label className="fl fl-name">
                <span>الموقع</span>
                <input
                  className="win-input"
                  value={form.website || ""}
                  onChange={(e) => set("website", e.target.value)}
                />
              </label>
              <label className="fl fl-name">
                <span>البريد</span>
                <input
                  className="win-input"
                  value={form.email || ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </label>
              <label className="fl fl-name">
                <span>اسم المستخدم</span>
                <input
                  className="win-input"
                  value={form.user_name || ""}
                  onChange={(e) => set("user_name", e.target.value)}
                />
              </label>
              <label className="fl fl-code">
                <span>العملة</span>
                <input
                  className="win-input"
                  value={form.currency || "جنيه"}
                  onChange={(e) => set("currency", e.target.value)}
                />
              </label>
            </div>
          </section>

          {/* 2) تصميم الفاتورة */}
          <section className="set-card">
            <h3>🧾 تصميم الفاتورة</h3>
            <div className="set-fields">
              <label className="fl fl-select">
                <span>عنوان المستند</span>
                <input
                  className="win-input"
                  value={form.invoice_doc_title || "فاتورة بيع"}
                  onChange={(e) => set("invoice_doc_title", e.target.value)}
                />
              </label>
              <label className="fl fl-code">
                <span>بادئة الفاتورة</span>
                <input
                  className="win-input num"
                  value={form.invoice_prefix || "INV"}
                  onChange={(e) => set("invoice_prefix", e.target.value)}
                />
              </label>
              <label className="fl fl-select">
                <span>حجم الورق</span>
                <select
                  className="win-input"
                  value={form.invoice_paper || "A4"}
                  onChange={(e) => set("invoice_paper", e.target.value)}
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="thermal">حراري 80mm</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>لون الفاتورة</span>
                <select
                  className="win-input"
                  value={form.invoice_accent || "#2f54d0"}
                  onChange={(e) => set("invoice_accent", e.target.value)}
                >
                  <option value="#2f54d0">أزرق</option>
                  <option value="#059669">أخضر</option>
                  <option value="#9f1239">نبيتي</option>
                  <option value="#b45309">ذهبي</option>
                  <option value="#334155">رمادي</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>إظهار الأصناف</span>
                <select
                  className="win-input"
                  value={form.invoice_show_items || "1"}
                  onChange={(e) => set("invoice_show_items", e.target.value)}
                >
                  <option value="1">نعم</option>
                  <option value="0">لا</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>إظهار الكمية</span>
                <select
                  className="win-input"
                  value={form.invoice_show_qty || "1"}
                  onChange={(e) => set("invoice_show_qty", e.target.value)}
                >
                  <option value="1">نعم</option>
                  <option value="0">لا</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>إظهار النوع</span>
                <select
                  className="win-input"
                  value={form.invoice_show_type || "1"}
                  onChange={(e) => set("invoice_show_type", e.target.value)}
                >
                  <option value="1">نعم</option>
                  <option value="0">لا</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>تذييل الفاتورة</span>
                <select
                  className="win-input"
                  value={form.invoice_show_footer || "1"}
                  onChange={(e) => set("invoice_show_footer", e.target.value)}
                >
                  <option value="1">نعم</option>
                  <option value="0">لا</option>
                </select>
              </label>
              <label className="fl fl-full">
                <span>نص تذييل الفاتورة</span>
                <input
                  className="win-input"
                  value={form.invoice_footer || ""}
                  onChange={(e) => set("invoice_footer", e.target.value)}
                />
              </label>
              <label className="fl fl-full">
                <span>لوجو المكتبة (نص أو رابط)</span>
                <input
                  className="win-input"
                  value={form.invoice_logo || ""}
                  onChange={(e) => set("invoice_logo", e.target.value)}
                />
              </label>
            </div>
            <div className="set-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setPreviewOpen(true)}
              >
                👁 معاينة تصميم الفاتورة
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  printInvoice({
                    ...previewData,
                    footer: form.invoice_footer,
                    currency,
                    accent: form.invoice_accent,
                    paper: form.invoice_paper,
                    showItems: form.invoice_show_items !== "0",
                    showQty: form.invoice_show_qty !== "0",
                    showType: form.invoice_show_type !== "0",
                    showFooter: form.invoice_show_footer !== "0",
                    logoText: form.invoice_logo,
                  })
                }
              >
                🖨 طباعة معاينة
              </button>
            </div>
          </section>

          {/* 3) المبيعات والفاتورة */}
          <section className="set-card">
            <h3>🛒 المبيعات والكاشير</h3>
            <div className="set-fields">
              <label className="fl fl-select">
                <span>البيع الآجل</span>
                <select
                  className="win-input"
                  value={form.allow_credit || "1"}
                  onChange={(e) => set("allow_credit", e.target.value)}
                >
                  <option value="1">مسموح</option>
                  <option value="0">نقدي فقط</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>بيع بدون رصيد</span>
                <select
                  className="win-input"
                  value={form.allow_negative_stock || "0"}
                  onChange={(e) => set("allow_negative_stock", e.target.value)}
                >
                  <option value="0">ممنوع</option>
                  <option value="1">مسموح</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>الكتب للبيع فقط</span>
                <select
                  className="win-input"
                  value={form.books_no_return || "1"}
                  onChange={(e) => set("books_no_return", e.target.value)}
                >
                  <option value="1">لا استبدال</option>
                  <option value="0">مسموح مرتجع</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>طباعة بعد الحفظ</span>
                <select
                  className="win-input"
                  value={form.print_after_save || "0"}
                  onChange={(e) => set("print_after_save", e.target.value)}
                >
                  <option value="1">نعم</option>
                  <option value="0">لا</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>صوت اختيار الصنف</span>
                <select
                  className="win-input"
                  value={form.pos_sound || "1"}
                  onChange={(e) => set("pos_sound", e.target.value)}
                >
                  <option value="1">تشغيل</option>
                  <option value="0">إيقاف</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>الوردية</span>
                <select
                  className="win-input"
                  value={form.cashier_shift || "صباحي"}
                  onChange={(e) => set("cashier_shift", e.target.value)}
                >
                  <option>صباحي</option>
                  <option>مسائي</option>
                </select>
              </label>
              <label className="fl fl-num">
                <span>شهور التقسيط</span>
                <input
                  className="win-input num"
                  value={form.default_installment_months || "4"}
                  onChange={(e) =>
                    set("default_installment_months", e.target.value)
                  }
                />
              </label>
              <label className="fl fl-num">
                <span>حد هامش الربح</span>
                <input
                  className="win-input num"
                  value={form.min_profit_percent || "15"}
                  onChange={(e) => set("min_profit_percent", e.target.value)}
                />
              </label>
              <label className="fl fl-num">
                <span>نسبة الضريبة</span>
                <input
                  className="win-input num"
                  value={form.tax_percent || "0"}
                  onChange={(e) => set("tax_percent", e.target.value)}
                />
              </label>
              <label className="fl fl-date">
                <span>السنة المالية</span>
                <input
                  className="win-input num"
                  value={form.fiscal_year || "2026"}
                  onChange={(e) => set("fiscal_year", e.target.value)}
                />
              </label>
            </div>
          </section>

          {/* 4) المظهر والألوان */}
          <section className="set-card">
            <h3>🎨 المظهر وألوان البرنامج</h3>
            <div className="theme-row">
              {themes.map((t) => (
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
            <div className="set-fields">
              <label className="fl fl-select">
                <span>تنبيه الحد الأدنى</span>
                <select
                  className="win-input"
                  value={form.low_stock_alert || "1"}
                  onChange={(e) => set("low_stock_alert", e.target.value)}
                >
                  <option value="1">تشغيل</option>
                  <option value="0">إيقاف</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>تقريب النقدية</span>
                <select
                  className="win-input"
                  value={form.round_cash || "0"}
                  onChange={(e) => set("round_cash", e.target.value)}
                >
                  <option value="0">لا</option>
                  <option value="1">نعم</option>
                </select>
              </label>
              <label className="fl fl-select">
                <span>الأسعار شاملة الضريبة</span>
                <select
                  className="win-input"
                  value={form.price_include_tax || "0"}
                  onChange={(e) => set("price_include_tax", e.target.value)}
                >
                  <option value="0">لا</option>
                  <option value="1">نعم</option>
                </select>
              </label>
            </div>
            <p className="set-hint">
              الألوان تُطبَّق على شريط القوائم والأزرار والعناوين في كل الشاشات.
            </p>
          </section>
        </div>
      </div>

      <div className="settings-bar">
        <span className="muted">
          التغييرات تُحفظ مرة واحدة عند الضغط على «حفظ الإعدادات»
        </span>
        <div className="settings-bar-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setForm(data.settings)}
          >
            استرجاع
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "جارى الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {previewOpen ? (
        <InvoicePreview
          data={previewData}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
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
    store_name: data.settings.store_name || "مكتبة الجمال",
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
        <h2 style={{ margin: 0 }}>{data.settings.store_name || "مكتبة الجمال"}</h2>
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
  opts?: { sub?: string; onSub?: (id: string) => void },
) {
  switch (module) {
    case "items":
      return (
        <ItemsScreen
          data={data}
          reload={reload}
          toast={toast}
          subTab={opts?.sub}
          onSubTab={opts?.onSub}
        />
      );
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
    case "backup":
      return (
        <BackupScreen data={data} reload={reload} toast={toast} subTab={opts?.sub} onSubTab={opts?.onSub} />
      );
    default:
      return null;
  }
}

/* ================= النسخ الاحتياطى والصيانة ================= */
export function BackupScreen({
  data,
  reload,
  toast,
  subTab,
  onSubTab,
}: {
  data: BootstrapData;
  reload: () => Promise<void>;
  toast: (k: "ok" | "err" | "info", t: string) => void;
  subTab?: string;
  onSubTab?: (id: string) => void;
}) {
  const [subLocal, setSubLocal] = useState("backup");
  const sub = subTab ?? subLocal;
  const setSub = (id: string) => {
    setSubLocal(id);
    onSubTab?.(id);
  };
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("sales.lastBackup") || "";
  });

  function fileName() {
    const d = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    return `gamal-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
  }

  async function makeBackup() {
    setBusy(true);
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: BootstrapData };
      if (!json.ok || !json.data) {
        toast("err", "تعذر قراءة البيانات");
        return;
      }
      const name = fileName();
      const blob = new Blob([JSON.stringify({ app: "Sales Manager", store: json.data.settings.store_name, at: new Date().toISOString(), data: json.data }, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      const stamp = new Date().toLocaleString("ar-EG");
      window.localStorage.setItem("sales.lastBackup", stamp);
      setLastBackup(stamp);
      toast("ok", `تم إنشاء النسخة الاحتياطية: ${name}`);
    } catch {
      toast("err", "تعذر إنشاء النسخة الاحتياطية");
    } finally {
      setBusy(false);
    }
  }

  function printData() {
    window.print();
  }

  const stats = [
    { label: "الأصناف", value: data.items.length },
    { label: "المجموعات", value: data.categories.length },
    { label: "العملاء", value: data.customers.length },
    { label: "الموردين", value: data.suppliers.length },
    { label: "الفواتير", value: data.invoices.length },
    { label: "الموظفين", value: data.employees.length },
  ];

  return (
    <Panel title="النسخ الاحتياطى والصيانة">
      <SubTabs
        items={[
          { id: "backup", label: "نسخ احتياطى" },
          { id: "maintenance", label: "صيانة وأدوات" },
          { id: "about", label: "عن البرنامج" },
        ]}
        value={sub}
        onChange={setSub}
      />

      {sub === "backup" ? (
        <>
          <div className="dark-bar">
            <span className="dark-bar-title">نسخة احتياطية كاملة للبيانات</span>
            <span className="dark-bar-note">ملف JSON فيه كل الأصناف والعملاء والفواتير والإعدادات</span>
            <button type="button" className="btn primary" disabled={busy} onClick={() => void makeBackup()}>
              {busy ? "جارى التحضير..." : "⬇ تنزيل النسخة الاحتياطية"}
            </button>
          </div>
          <div className="stat-strip">
            <div>
              <span>آخر نسخة احتياطية</span>
              <b>{lastBackup || "لا يوجد"}</b>
            </div>
            <div>
              <span>حجم البيانات</span>
              <b>{data.items.length + data.invoices.length + data.customers.length} سجل</b>
            </div>
            <div>
              <span>اسم الملف</span>
              <b>gamal-backup-*.json</b>
            </div>
          </div>
          <div className="backup-note">
            <b>ملاحظة:</b> النسخة بتتحفظ على جهازك كملف — احتفظ بيها على فلاشة أو على Drive.
            الاستعادة من ملف مش متاحة من الشاشة (بتتعمل من مسؤول النظام) لتجنب الكتابة بالغلط على البيانات.
          </div>
        </>
      ) : null}

      {sub === "maintenance" ? (
        <>
          <div className="dark-bar">
            <span className="dark-bar-title">صيانة وأدوات</span>
            <span className="dark-bar-note">تنظيف البيانات المؤقتة وطباعة ملخص الحالة</span>
            <button type="button" className="btn" onClick={printData}>
              🖨 طباعة ملخص الحالة
            </button>
            <button
              type="button"
              className="btn ok"
              onClick={() => void reload().then(() => toast("ok", "تم تحديث البيانات"))}
            >
              ↻ تحديث البيانات
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (typeof window === "undefined") return;
                window.localStorage.removeItem("sales.lastBackup");
                setLastBackup("");
                toast("ok", "تم تنظيف بيانات الجلسة المؤقتة");
              }}
            >
              🧹 تنظيف المؤقت
            </button>
          </div>
          <div className="stat-strip">
            {stats.map((st) => (
              <div key={st.label}>
                <span>{st.label}</span>
                <b>{st.value}</b>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {sub === "about" ? (
        <>
          <div className="dark-bar">
            <span className="dark-bar-title">Sales Manager</span>
            <span className="dark-bar-note">نظام إدارة مبيعات ومخازن</span>
          </div>
          <div className="stat-strip">
            <div>
              <span>اسم المحل</span>
              <b>{data.settings.store_name || "مكتبة الجمال"}</b>
            </div>
            <div>
              <span>المستخدم الحالى</span>
              <b>{data.employees[0]?.name || "—"}</b>
            </div>
            <div>
              <span>الثيم</span>
              <b>{data.settings.theme || "navy"}</b>
            </div>
          </div>
        </>
      ) : null}
    </Panel>
  );
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
  backup: "النسخ الاحتياطى والصيانة",
};


