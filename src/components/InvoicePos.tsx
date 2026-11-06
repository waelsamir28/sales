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
import { useEffect, useMemo, useRef, useState } from "react";

type Kind = "sale" | "purchase" | "sale_return" | "purchase_return";

const META: Record<Kind, { title: string; party: "customer" | "supplier"; badge: string }> = {
  sale: { title: "فاتورة بيع سريع", party: "customer", badge: "فاتورة بيع سريع" },
  purchase: { title: "فاتورة مشتريات", party: "supplier", badge: "فاتورة مشتريات" },
  sale_return: { title: "مرتجع مبيعات", party: "customer", badge: "مرتجع مبيعات" },
  purchase_return: { title: "مرتجع مشتريات", party: "supplier", badge: "مرتجع مشتريات" },
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
  const [lines, setLines] = useState<CartLine[]>([]);
  const [catId, setCatId] = useState<number | 0>(0);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [partyId, setPartyId] = useState<number>(
    meta.party === "customer" ? data.customers[0]?.id ?? 0 : data.suppliers[0]?.id ?? 0,
  );
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id ?? 1);
  const [treasuryId, setTreasuryId] = useState(data.treasuries[0]?.id ?? 1);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastItem, setLastItem] = useState("");
  const [partyDiscount, setPartyDiscount] = useState(0);
  const number = nextPreviewNumber(data.invoices, kind);

  const parties: Array<Customer | Supplier> =
    meta.party === "customer" ? data.customers : data.suppliers;
  const party = parties.find((p) => p.id === partyId);
  const prevBalance = n(party && "balance" in party ? party.balance : 0);

  const cats: Category[] = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);

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
      if (booksLocked && (kind === "sale_return" || kind === "purchase_return") && isSaleOnly(it)) return false;
      if (!q) return true;
      return it.name.includes(q) || it.code.includes(q) || it.barcode.includes(q);
    });
  }, [data.items, catId, query, kind, booksLocked, bookCatId, data.categories]);

  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const tax = round2(lines.reduce((s, l) => s + l.price * l.qty * (l.taxPercent / 100), 0));
  const extraDisc = round2(subtotal * (partyDiscount / 100));
  const totalDiscount = round2(discount + extraDisc);
  const gross = round2(subtotal + tax);
  const net = round2(Math.max(gross + delivery - totalDiscount, 0));
  const qtyTotal = round2(lines.reduce((s, l) => s + l.qty, 0));
  const effectivePaid = paymentType === "cash" ? net : paid;
  const remaining = round2(Math.max(net - effectivePaid, 0));
  const afterBalance =
    kind === "sale" || kind === "sale_return"
      ? round2(prevBalance + (kind === "sale" ? remaining : -remaining))
      : round2(prevBalance + (kind === "purchase" ? remaining : -remaining));

  function addItem(item: Item, qty = 1) {
    if (booksLocked && (kind === "sale_return" || kind === "purchase_return") && isSaleOnly(item)) {
      onToast("err", "الكتب للبيع فقط — لا استبدال ولا مرتجع");
      return;
    }
    setLastItem(`${item.name} | الكمية : ${qty} | السعر : ${n(item.price).toFixed(2)}`);
    setLines((prev) => {
      const found = prev.find((l) => l.itemId === item.id);
      if (found) {
        return prev.map((l) => (l.itemId === item.id ? { ...l, qty: round2(l.qty + qty) } : l));
      }
      return [
        ...prev,
        {
          key: `${item.id}-${Date.now()}`,
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
    if (booksLocked && (kind === "sale_return" || kind === "purchase_return") && isSaleOnly(item)) {
      onToast("err", "الكتب للبيع فقط — لا استبدال ولا مرتجع");
      setCode("");
      return;
    }
    addItem(item);
    setCode("");
    codeRef.current?.focus();
  }

  function reset() {
    setLines([]);
    setDiscount(0);
    setDelivery(0);
    setPaid(0);
    setNotes("");
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
          discount: totalDiscount,
          delivery,
          paid: effectivePaid,
          notes,
          status: "saved",
          lines: lines.map((l) => ({
            itemId: l.itemId,
            code: l.code,
            name: l.name,
            unit: l.unit,
            price: l.price,
            qty: l.qty,
            taxPercent: l.taxPercent,
          })),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        onToast("err", json.error || "تعذر الحفظ");
        return;
      }
      onToast("ok", `تم حفظ ${meta.title} رقم ${number}`);
      if (andPrint) window.print();
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
      if (e.key === "F11") {
        e.preventDefault();
        const v = window.prompt("قيمة خصم الفاتورة", String(discount));
        if (v != null) setDiscount(n(v));
      }
      if (e.key === "F9") {
        e.preventDefault();
        onToast("info", "تم تعليق الفاتورة مؤقتاً على الجهاز");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const p = parties.find((x) => x.id === partyId);
    if (p && "discountPercent" in p) setPartyDiscount(n(p.discountPercent));
    else setPartyDiscount(0);
  }, [partyId, parties]);

  const now = new Date();
  const dateStr = now.toLocaleString("en-GB", { hour12: false }).replace(",", "");
  const lastInv = data.invoices.filter((i) => i.type === kind).at(-1);

  return (
    <div className="pos">
      <div className="pos-title">
        <span>بيانات الفاتورة</span>
        <span className="badge-sale">🛒 {meta.badge}</span>
        <div className="field">
          <span>رقم الفاتورة</span>
          <input className="win-input num inp-code" value={number} readOnly />
        </div>
      </div>

      <div className="pos-top">
        <div className="pos-row">
          <div className="field">
            <span>رقم الطباعة</span>
            <input className="win-input num inp-code" value={number} readOnly />
          </div>
          <div className="field">
            <span>المخزن</span>
            <select
              className="win-input inp-select"
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
            >
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span>النوع</span>
            <select className="win-input inp-code" defaultValue="عادي">
              <option>عادي</option>
              <option>جملة</option>
            </select>
          </div>
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
        <div className="pos-row">
          <div className="field">
            <span>{meta.party === "customer" ? "العميل" : "المورد"}</span>
            <select
              className="win-input inp-name"
              value={partyId}
              onChange={(e) => setPartyId(Number(e.target.value))}
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span>خصم %</span>
            <input className="win-input num inp-num" value={partyDiscount} readOnly />
          </div>
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
        <div className="live-line">
          {(kind === "sale_return" || kind === "purchase_return") && booksLocked
            ? "الكتب للبيع فقط ولا تظهر في المرتجع أو الاستبدال"
            : lastItem || "اضغط صنفاً من اليمين أو اكتب الكود ثم Enter"}
        </div>
      </div>

      <div className="cats">
        <button type="button" className={`cat-btn ${catId === 0 ? "on" : ""}`} onClick={() => setCatId(0)}>
          الكل
        </button>
        {cats.filter((c) => !(booksLocked && (kind === "sale_return" || kind === "purchase_return") && c.name === "كتب خارجية")).map((c) => {
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
            className={`cat-btn ${catId === c.id ? "on" : ""}`}
            onClick={() => setCatId(c.id)}
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
                  <th>نش ض</th>
                  <th>ض%</th>
                  <th>السعر</th>
                  <th>الوحده</th>
                  <th>الصنف</th>
                  <th>كود</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const lineSub = round2(l.price * l.qty);
                  const taxV = round2(lineSub * (l.taxPercent / 100));
                  return (
                    <tr key={l.key}>
                      <td>
                        <button
                          type="button"
                          className="delx"
                          onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))}
                        >
                          ✕
                        </button>
                      </td>
                      <td>{(lineSub + taxV).toFixed(2)}</td>
                      <td>
                        <input
                          className="qty-input"
                          value={l.qty}
                          onChange={(e) =>
                            setLines((p) =>
                              p.map((x) =>
                                x.key === l.key ? { ...x, qty: n(e.target.value, 1) } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>{taxV.toFixed(2)}</td>
                      <td>{l.taxPercent}</td>
                      <td>
                        <input
                          className="qty-input"
                          value={l.price}
                          onChange={(e) =>
                            setLines((p) =>
                              p.map((x) =>
                                x.key === l.key ? { ...x, price: n(e.target.value) } : x,
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
            <button key={it.id} type="button" className="pad-btn" onClick={() => addItem(it)}>
              {it.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pos-bottom">
        <div className="box">
          <div className="field" style={{ justifyContent: "space-between" }}>
            <span>عدد الاصناف</span>
            <b>{lines.length}</b>
          </div>
          <div className="field" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <span>إجمالي الكميات</span>
            <b>{qtyTotal}</b>
          </div>
        </div>
        <div className="box">
          <div className="field">
            <span>الخزينة</span>
            <select
              className="win-input inp-select"
              value={treasuryId}
              onChange={(e) => setTreasuryId(Number(e.target.value))}
            >
              {data.treasuries.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            الرصيد: {n(data.treasuries.find((t) => t.id === treasuryId)?.balance).toFixed(2)}
          </div>
        </div>
        <div className="box">
          <div className="field">
            <span>ملاحظات</span>
            <input className="win-input" style={{ flex: 1, minWidth: 140 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 4, justifyContent: "space-between" }}>
            <span>المتبقي</span>
            <b>{remaining.toFixed(2)}</b>
          </div>
          <div className="field" style={{ justifyContent: "space-between" }}>
            <span>ديون سابقة</span>
            <b>{prevBalance.toFixed(2)}</b>
          </div>
          <div className="field" style={{ justifyContent: "space-between" }}>
            <span>بعد الحفظ</span>
            <b>{afterBalance.toFixed(2)}</b>
          </div>
        </div>
        <div className="box" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <div className="field">
            <span>الإجمالي</span>
            <input className="win-input num inp-num" value={gross.toFixed(2)} readOnly />
          </div>
          <div className="field">
            <span>نوع الدفع</span>
            <select
              className="win-input inp-code"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as "cash" | "credit")}
            >
              <option value="cash">نقدي</option>
              <option value="credit">آجل</option>
            </select>
          </div>
          <div className="field">
            <span>الضريبة %</span>
            <input className="win-input num inp-num" value="0" readOnly />
          </div>
          <div className="field">
            <span>التوصيل</span>
            <input
              className="win-input num inp-num"
              value={delivery}
              onChange={(e) => setDelivery(n(e.target.value))}
            />
          </div>
          <div className="field">
            <span>قيمة الضريبة</span>
            <input className="win-input num inp-num" value={tax.toFixed(2)} readOnly />
          </div>
          <div className="field">
            <span>خصم F11</span>
            <input
              className="win-input num inp-num"
              value={totalDiscount}
              onChange={(e) => setDiscount(n(e.target.value))}
            />
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
            <input className="win-input num inp-num" value={remaining.toFixed(2)} readOnly />
          </div>
          <div className="net-box" style={{ gridColumn: "1 / -1" }}>
            المبلغ الصافي
            <div className="v">{net.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="fk-bar">
        <button type="button" className="fk" style={{ background: "#2563eb" }} onClick={reset}>
          F4 فاتورة جديدة
        </button>
        <button type="button" className="fk" style={{ background: "#0f766e" }} onClick={() => codeRef.current?.focus()}>
          F3 بحث بالكود
        </button>
        <button
          type="button"
          className="fk"
          style={{ background: "#dc2626" }}
          onClick={() => {
            const v = window.prompt("قيمة خصم الفاتورة", String(discount));
            if (v != null) setDiscount(n(v));
          }}
        >
          F11 خصم الفاتورة
        </button>
        <button
          type="button"
          className="fk"
          style={{ background: "#64748b" }}
          onClick={() => onToast("info", "تم تعليق الفاتورة")}
        >
          F9 تعليق
        </button>
        <button type="button" className="fk" style={{ background: "#1d4ed8" }} onClick={() => void save(true)}>
          F10 حفظ وطباعة
        </button>
        <button type="button" className="fk" style={{ background: "#15803d" }} onClick={() => void save(false)}>
          {saving ? "جارى الحفظ..." : "F5 حفظ الفاتورة"}
        </button>
      </div>

      <div className="print-sheet">
        <h2>مكتبة النور — {meta.title}</h2>
        <p>
          رقم: {number} | التاريخ: {dateStr} | {meta.party === "customer" ? "العميل" : "المورد"}:{" "}
          {party?.name}
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
    </div>
  );
}
