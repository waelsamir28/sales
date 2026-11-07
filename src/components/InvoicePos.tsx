"use client";

import { n, round2 } from "@/lib/money";
import type {
  BootstrapData,
  CartLine,
  Category,
  Customer,
  Invoice,
  Item,
  Supplier,
} from "@/lib/types";
import InvoicePreview from "@/components/InvoicePreview";
import { usePickSound } from "@/components/usePickSound";
import { printInvoice } from "@/lib/invoice-print";
import { useEffect, useMemo, useRef, useState } from "react";

type Kind = "sale" | "purchase" | "sale_return" | "purchase_return";

const storeNameFallback = "مكتبة الجمال";

const META: Record<
  Kind,
  { title: string; party: "customer" | "supplier"; badge: string }
> = {
  sale: {
    title: "فاتورة بيع سريع",
    party: "customer",
    badge: "فاتورة بيع سريع",
  },
  purchase: {
    title: "فاتورة مشتريات",
    party: "supplier",
    badge: "فاتورة مشتريات",
  },
  sale_return: {
    title: "مرتجع مبيعات",
    party: "customer",
    badge: "مرتجع مبيعات",
  },
  purchase_return: {
    title: "مرتجع مشتريات",
    party: "supplier",
    badge: "مرتجع مشتريات",
  },
};

function nextPreviewNumber(invoices: Invoice[], type: Kind) {
  const nums = invoices.filter((i) => i.type === type).map((i) => i.number);
  return (nums.length ? Math.max(...nums) : 4000) + 1;
}

export default function InvoicePos({
  kind,
  data,
  onSaved,
  onToast,
}: {
  kind: Kind;
  data: BootstrapData;
  onSaved: () => Promise<void> | void;
  onToast: (kind: "ok" | "err" | "info", text: string) => void;
}) {
  const meta = META[kind];
  const codeRef = useRef<HTMLInputElement>(null);
  const qtyRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const qtyFocusKey = useRef<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [catId, setCatId] = useState<number | 0>(0);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [partyId, setPartyId] = useState<number>(
    meta.party === "customer"
      ? (data.customers[0]?.id ?? 0)
      : (data.suppliers[0]?.id ?? 0),
  );
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id ?? 1);
  const [treasuryId, setTreasuryId] = useState(data.treasuries[0]?.id ?? 1);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [paid, setPaid] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const playPick = usePickSound(data.settings.pos_sound !== "0");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "", code: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastItem, setLastItem] = useState("");
  const number = nextPreviewNumber(data.invoices, kind);

  const parties: Array<Customer | Supplier> =
    meta.party === "customer" ? data.customers : data.suppliers;
  const party = parties.find((p) => p.id === partyId);
  const prevBalance = n(party && "balance" in party ? party.balance : 0);

  const cats: Category[] = [...data.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const bookCatId = data.categories.find((c) => c.name === "كتب خارجية")?.id;
  const booksLocked = data.settings.books_no_return !== "0";
  function isSaleOnly(item: Item) {
    return item.saleOnly || item.categoryId === bookCatId;
  }

  const filteredItems = useMemo(() => {
    const q = query.trim();
    return data.items.filter((it) => {
      if (!it.active) return false;
      if (catId && it.categoryId !== catId) return false;
      if (
        booksLocked &&
        (kind === "sale_return" || kind === "purchase_return") &&
        isSaleOnly(it)
      )
        return false;
      if (!q) return true;
      return (
        it.name.includes(q) || it.code.includes(q) || it.barcode.includes(q)
      );
    });
  }, [data.items, catId, query, kind, booksLocked, bookCatId, data.categories]);

  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const gross = subtotal;
  const net = round2(Math.max(gross, 0));
  const qtyTotal = round2(lines.reduce((s, l) => s + l.qty, 0));
  const effectivePaid = paymentType === "cash" ? net : paid;
  const remaining = round2(Math.max(net - effectivePaid, 0));
  const afterBalance =
    kind === "sale" || kind === "sale_return"
      ? round2(prevBalance + (kind === "sale" ? remaining : -remaining))
      : round2(prevBalance + (kind === "purchase" ? remaining : -remaining));

  function focusQty(key: string) {
    qtyFocusKey.current = key;
  }

  useEffect(() => {
    const key = qtyFocusKey.current;
    if (!key) return;
    qtyFocusKey.current = null;
    const el = qtyRefs.current.get(key);
    if (!el) return;
    el.focus();
    el.select();
  }, [lines]);

  function addItem(item: Item, qty = 1) {
    if (
      booksLocked &&
      (kind === "sale_return" || kind === "purchase_return") &&
      isSaleOnly(item)
    ) {
      onToast("err", "الكتب للبيع فقط — لا استبدال ولا مرتجع");
      return;
    }
    playPick("add");
    setLastItem(
      `${item.name} | الكمية : ${qty} | السعر : ${n(item.price).toFixed(2)}`,
    );
    const newKey = `${item.id}-${Date.now()}`;
    focusQty(newKey);
    setLines((prev) => {
      const found = prev.find((l) => l.itemId === item.id);
      if (found) {
        focusQty(found.key);
        return prev.map((l) =>
          l.itemId === item.id ? { ...l, qty: round2(l.qty + qty) } : l,
        );
      }
      return [
        ...prev,
        {
          key: newKey,
          itemId: item.id,
          code: item.code,
          name: item.name,
          unit: item.unit,
          price: n(item.price),
          qty,
          taxPercent: n(item.taxPercent),
        },
      ];
    });
  }

  function addByCode() {
    const value = code.trim();
    if (!value) return;
    const item = data.items.find(
      (it) => it.code === value || it.barcode === value || it.name === value,
    );
    if (!item) {
      onToast("err", "الصنف غير موجود");
      setCode("");
      return;
    }
    if (
      booksLocked &&
      (kind === "sale_return" || kind === "purchase_return") &&
      isSaleOnly(item)
    ) {
      onToast("err", "الكتب للبيع فقط — لا استبدال ولا مرتجع");
      setCode("");
      return;
    }
    addItem(item);
    setCode("");
  }

  function reset() {
    setLines([]);
    setPaid(0);
    setLastItem("");
    setQuery("");
    setCode("");
    setPaymentType("cash");
    codeRef.current?.focus();
  }

  async function save(andPrint = false) {
    if (lines.length === 0) {
      onToast("err", "أضف صنفاً واحداً على الأقل");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: kind,
          partyId: partyId || null,
          partyName: party?.name ?? "نقدي",
          warehouseId,
          treasuryId,
          paymentType,
          net,
          paid: effectivePaid,
          notes: "",
          status: "saved",
          lines: lines.map((l) => ({
            itemId: l.itemId,
            code: l.code,
            name: l.name,
            unit: l.unit,
            price: l.price,
            qty: l.qty,
            taxPercent: 0,
          })),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        onToast("err", json.error || "تعذر الحفظ");
        return;
      }
      onToast("ok", `تم حفظ ${meta.title} رقم ${number}`);
      if (andPrint) printInvoice(printData);
      reset();
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F4") {
        e.preventDefault();
        reset();
      }
      if (e.key === "F5") {
        e.preventDefault();
        void save(false);
      }
      if (e.key === "F8") {
        e.preventDefault();
        void save(true);
      }
      if (e.key === "F10") {
        e.preventDefault();
        void save(true);
      }
      if (e.key === "F9") {
        e.preventDefault();
        onToast("info", "تم تعليق الفاتورة مؤقتاً على الجهاز");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const now = new Date();
  const dateStr = now
    .toLocaleString("en-GB", { hour12: false })
    .replace(",", "");
  const lastInv = data.invoices.filter((i) => i.type === kind).at(-1);

  function openCustomerForm() {
    const maxCode = data.customers.reduce((maxCode, c) => {
      const value = Number(c.code);
      return Number.isFinite(value) && value > maxCode ? value : maxCode;
    }, 500);
    setNewCustomer({ name: "", phone: "", address: "", code: String(maxCode + 1) });
    setCustomerOpen(true);
  }

  async function saveCustomer() {
    const name = newCustomer.name.trim();
    if (!name) {
      onToast("err", "اكتب اسم العميل أولاً");
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "customers", ...newCustomer, balance: 0 }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; row?: Customer };
      if (!json.ok || !json.row) {
        onToast("err", json.error || "تعذر إضافة العميل");
        return;
      }
      onToast("ok", `تمت إضافة ${json.row.name}`);
      await onSaved();
      setPartyId(json.row.id);
      setCustomerOpen(false);
      setNewCustomer({ name: "", phone: "", address: "", code: "" });
    } finally {
      setSavingCustomer(false);
    }
  }

  const printData = {
    storeName: data.settings.store_name || storeNameFallback,
    storeActivity: data.settings.store_activity,
    phone: data.settings.phone,
    whatsapp: data.settings.whatsapp,
    website: data.settings.website,
    email: data.settings.email,
    title: meta.title,
    number,
    date: dateStr,
    partyLabel: meta.party === "customer" ? "العميل" : "المورد",
    partyName: party?.name ?? "نقدي",
    partyPhone: party?.phone,
    // المخزن والخزينة مش ظاهرين في الفاتورة ولا في الطباعة
    paymentType: paymentType === "cash" ? "نقدي" : "آجل",
    lines: lines.map((l) => ({
      code: l.code,
      name: l.name,
      unit: l.unit,
      qty: l.qty,
      price: l.price,
      total: round2(l.price * l.qty),
    })),
    itemCount: lines.length,
    qtyTotal,
    subtotal,
    delivery: 0,
    total: net,
    paid: effectivePaid,
    remaining,
    previousBalance: prevBalance,
    balanceAfter: afterBalance,
    notes: data.settings.invoice_notes || "",
    footer: data.settings.invoice_footer,
    currency: data.settings.currency,
    accent: data.settings.invoice_accent,
    paper: data.settings.invoice_paper,
    showItems: data.settings.invoice_show_items !== "0",
    showQty: data.settings.invoice_show_qty !== "0",
    showType: data.settings.invoice_show_type !== "0",
    showFooter: data.settings.invoice_show_footer !== "0",
    logoText: data.settings.invoice_logo,
  };

  return (
    <>
      <div className="pos">
        <div className="pos-title">
          <span>بيانات الفاتورة</span>
          <span className="badge-sale">🛒 {meta.badge}</span>
          <div className="field">
            <span>رقم الفاتورة</span>
            <input className="win-input num inp-code" value={number} readOnly />
          </div>
          <button
            type="button"
            className="btn preview-btn"
            onClick={() => setPreviewOpen(true)}
          >
            👁 معاينة
          </button>
        </div>

        <div className="pos-top">
          <div className="pos-row dates-row">
            <div className="dates-left">
              <div className="field">
                <span>التاريخ</span>
                <input className="win-input inp-date" value={dateStr} readOnly />
              </div>
              <label className="check">
                <input type="checkbox" defaultChecked /> تاريخ آخر فاتورة
              </label>
              <span className="muted">
                {lastInv ? new Date(lastInv.date).toLocaleString("en-GB") : "لا يوجد"}
              </span>
            </div>

            <div className="field">
              <span>نوع الفاتورة</span>
              <select className="win-input inp-select" defaultValue="عادي">
                <option>عادي</option>
                <option>جملة</option>
              </select>
            </div>
            <div className="field">
              <span>نوع الدفع</span>
              <select
                className="win-input inp-select"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as "cash" | "credit")}
              >
                <option value="cash">نقدي</option>
                <option value="credit">آجل</option>
              </select>
            </div>
          </div>

          <div className="pos-row">
            <div className="field party-field">
              <span>{meta.party === "customer" ? "العميل" : "المورد"}</span>
              <select
                className="win-input inp-name party-input"
                value={partyId}
                onChange={(e) => setPartyId(Number(e.target.value))}
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="add-party"
                title="إضافة عميل جديد"
                onClick={openCustomerForm}
              >
                ＋
              </button>
            </div>

            <div className="code-search-box">
              <div className="field">
                <span>الكود</span>
                <input
                  ref={codeRef}
                  className="win-input num inp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addByCode();
                  }}
                />
              </div>
              <div className="field">
                <span>بحث الصنف</span>
                <input
                  className="win-input inp-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <label className="check">
                <input type="checkbox" defaultChecked /> تجميع الكميات
              </label>
            </div>
          </div>

          <div className="live-line">
            {(kind === "sale_return" || kind === "purchase_return") &&
            booksLocked
              ? "الكتب للبيع فقط ولا تظهر في المرتجع أو الاستبدال"
              : lastItem || "اضغط صنفاً من اليمين أو اكتب الكود ثم Enter"}
          </div>
        </div>

        <div className="cats">
          <button
            type="button"
            className={`cat-btn ${catId === 0 ? "on" : ""}`}
            onClick={() => setCatId(0)}
          >
            الكل
          </button>
          {cats
            .filter(
              (c) =>
                !(
                  booksLocked &&
                  (kind === "sale_return" || kind === "purchase_return") &&
                  c.name === "كتب خارجية"
                ),
            )
            .map((c) => {
              const short: Record<string, string> = {
                "أقلام جاف ورصاص": "أقلام",
                "كراسات وكشاكيل": "كراسات",
                "كتب خارجية": "كتب",
                "أدوات هندسية": "هندسة",
                "ملفات وحوافظ": "ملفات",
                "ألوان ورسوم": "ألوان",
                "ورق تصوير": "ورق",
                "أدوات مكتبية": "مكتبية",
                "حقائب ومقلمات": "حقائب",
                "مستلزمات مدرسية": "مدرسية",
              };
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cat-btn cat-color-${(((c.sortOrder - 1) % 6) + 6) % 6} ${catId === c.id ? "on" : ""}`}
                  onClick={() => {
                    setCatId(c.id);
                    playPick("add");
                  }}
                >
                  {short[c.name] || c.name}
                </button>
              );
            })}
        </div>

        <div className="pos-mid">
          <div className="pos-table">
            <div className="scroll-y">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>حذف</th>
                    <th>الاجمالى</th>
                    <th>كميه</th>
                    <th>السعر</th>
                    <th>الوحده</th>
                    <th>الصنف</th>
                    <th>كود</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const lineSub = round2(l.price * l.qty);
                    return (
                      <tr key={l.key}>
                        <td>
                          <button
                            type="button"
                            className="delx"
                            onClick={() => {
                              playPick("remove");
                              setLines((p) => p.filter((x) => x.key !== l.key));
                            }}
                          >
                            ✕
                          </button>
                        </td>
                        <td>{lineSub.toFixed(2)}</td>
                        <td>
                          <input
                            ref={(el) => {
                              if (el) qtyRefs.current.set(l.key, el);
                              else qtyRefs.current.delete(l.key);
                            }}
                            className="qty-input"
                            value={l.qty}
                            onChange={(e) =>
                              setLines((p) =>
                                p.map((x) =>
                                  x.key === l.key
                                    ? { ...x, qty: n(e.target.value, 1) }
                                    : x,
                                ),
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                codeRef.current?.focus();
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className="qty-input"
                            value={l.price}
                            onChange={(e) =>
                              setLines((p) =>
                                p.map((x) =>
                                  x.key === l.key
                                    ? { ...x, price: n(e.target.value) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>{l.unit}</td>
                        <td className="cell-name">{l.name}</td>
                        <td>{l.code}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pad">
            {filteredItems.map((it) => (
              <button
                key={it.id}
                type="button"
                className={`pad-btn pad-color-${((cats.find((c) => c.id === it.categoryId)?.sortOrder ?? 1) - 1) % 6}`}
                onClick={() => addItem(it)}
              >
                {it.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pos-bottom">
          <div className="box counts-box">
            <div className="mini-stat">
              <span>عدد الأصناف</span>
              <b>{lines.length}</b>
            </div>
            <div className="mini-stat">
              <span>إجمالي الكميات</span>
              <b>{qtyTotal}</b>
            </div>
          </div>

          <div className="box pay-line">
            <div className="field debt-field">
              <span>ديون سابقة</span>
              <b className="money debt">{prevBalance.toFixed(2)}</b>
            </div>
            <div className="total-badge">
              <span>الإجمالي</span>
              <b>{gross.toFixed(2)}</b>
            </div>
            <div className="field">
              <span>المدفوع</span>
              <input
                className="win-input num inp-num"
                value={paymentType === "cash" ? net : paid}
                onChange={(e) => setPaid(n(e.target.value))}
                disabled={paymentType === "cash"}
              />
            </div>
            <div className="field">
              <span>الباقي</span>
              <b className="money warn">{remaining.toFixed(2)}</b>
            </div>
            <div className="net-box">
              المبلغ الصافي
              <div className="v">{net.toFixed(2)}</div>
            </div>
            <div className="field after-field">
              <span>بعد الحفظ</span>
              <b className="money after">{afterBalance.toFixed(2)}</b>
            </div>
          </div>
        </div>

        <div className="fk-bar">
          <button
            type="button"
            className="fk"
            style={{ background: "#2563eb" }}
            onClick={reset}
          >
            F4 فاتورة جديدة
          </button>
          <button
            type="button"
            className="fk"
            style={{ background: "#0f766e" }}
            onClick={() => codeRef.current?.focus()}
          >
            F3 بحث بالكود
          </button>
          <button
            type="button"
            className="fk"
            style={{ background: "#7c3aed" }}
            onClick={() => setPreviewOpen(true)}
          >
            معاينة الفاتورة
          </button>
          <button
            type="button"
            className="fk"
            style={{ background: "#64748b" }}
            onClick={() => onToast("info", "تم تعليق الفاتورة")}
          >
            F9 تعليق
          </button>
          <button
            type="button"
            className="fk"
            style={{ background: "#1d4ed8" }}
            onClick={() => void save(true)}
          >
            F10 حفظ وطباعة
          </button>
          <button
            type="button"
            className="fk"
            style={{ background: "#15803d" }}
            onClick={() => void save(false)}
          >
            {saving ? "جارى الحفظ..." : "F5 حفظ الفاتورة"}
          </button>
        </div>

        {customerOpen && (
        <div className="modal-back" onClick={() => setCustomerOpen(false)}>
          <div
            className="floating-card"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setCustomerOpen(false);
            }}
          >
            <div className="modal-head">
              <b>إضافة عميل جديد</b>
              <button
                type="button"
                className="modal-x"
                onClick={() => setCustomerOpen(false)}
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="floating-body">
              <label className="fl fl-full">
                <span>الاسم</span>
                <input
                  className="win-input name-input"
                  autoFocus
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveCustomer();
                  }}
                />
              </label>
              <label className="fl fl-full">
                <span>الهاتف</span>
                <input
                  className="win-input num"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                />
              </label>
              <label className="fl fl-full">
                <span>العنوان</span>
                <input
                  className="win-input"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                />
              </label>
              <label className="fl fl-full">
                <span>كود العميل (تلقائي)</span>
                <input
                  className="win-input num code-auto"
                  value={newCustomer.code}
                  readOnly
                />
              </label>
            </div>
            <div className="floating-foot">
              <button
                type="button"
                className="btn"
                onClick={() => setCustomerOpen(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={savingCustomer}
                onClick={() => void saveCustomer()}
              >
                {savingCustomer ? "جارى الإضافة..." : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
          <InvoicePreview
            data={printData}
            onPrint={() => printInvoice(printData)}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>

      <div className="print-sheet">
        <h2>
          {data.settings.store_name || storeNameFallback} — {meta.title}
        </h2>
        <p>
          رقم: {number} | التاريخ: {dateStr} |{" "}
          {meta.party === "customer" ? "العميل" : "المورد"}: {party?.name}
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>كود</th>
              <th>الصنف</th>
              <th>كمية</th>
              <th>سعر</th>
              <th>إجمالي</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key}>
                <td>{l.code}</td>
                <td>{l.name}</td>
                <td>{l.qty}</td>
                <td>{l.price.toFixed(2)}</td>
                <td>{(l.qty * l.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>الصافي: {net.toFixed(2)} جنيه</p>
        <p>{data.settings.invoice_footer}</p>
      </div>
    </>
  );
}
