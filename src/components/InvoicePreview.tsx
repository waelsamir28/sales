"use client";

export type InvoicePreviewData = {
  storeName: string;
  storeActivity?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  email?: string;
  title: string;
  number: number | string;
  date: string;
  partyLabel: string;
  partyName: string;
  partyPhone?: string;
  warehouseName?: string;
  treasuryName?: string;
  paymentType: string;
  lines: Array<{
    code: string;
    name: string;
    unit: string;
    qty: number;
    price: number;
    total: number;
  }>;
  itemCount: number;
  qtyTotal: number;
  subtotal: number;
  delivery: number;
  total: number;
  paid: number;
  remaining: number;
  previousBalance?: number;
  balanceAfter?: number;
  notes?: string;
  footer?: string;
  currency?: string;
  accent?: string;
};

function money(v: number | undefined, currency = "جنيه") {
  const value = Number.isFinite(Number(v)) ? Number(v) : 0;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

import { useEffect } from "react";

export default function InvoicePreview({
  data,
  onClose,
  onPrint,
}: {
  data: InvoicePreviewData;
  onClose: () => void;
  onPrint?: () => void;
}) {
  const currency = data.currency || "جنيه";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal-card preview-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <b>معاينة {data.title}</b>
          <button
            type="button"
            className="modal-x"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div
            className="preview-sheet"
            style={{ ["--accent" as string]: data.accent || "#2f54d0" }}
          >
            <div className="pv-head">
              <div>
                <h2>{data.storeName}</h2>
                {data.storeActivity ? <p>{data.storeActivity}</p> : null}
                <p>
                  {[data.phone, data.website, data.email]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="pv-stamp">
                <span className="pv-badge">{data.title}</span>
                <div>
                  رقم: <b>{data.number}</b>
                </div>
                <div>التاريخ: {data.date}</div>
              </div>
            </div>

            <div className="pv-meta">
              <span>
                المخزن: <b>{data.warehouseName || "—"}</b>
              </span>
              <span>
                الخزينة: <b>{data.treasuryName || "—"}</b>
              </span>
              <span>
                الدفع: <b>{data.paymentType}</b>
              </span>
              <span>
                الأصناف: <b>{data.itemCount}</b>
              </span>
              <span>
                الكميات: <b>{data.qtyTotal}</b>
              </span>
            </div>

            <div className="pv-party">
              <span>
                {data.partyLabel}: <b>{data.partyName}</b>
              </span>
              {data.partyPhone ? <span>الهاتف: {data.partyPhone}</span> : null}
              {data.previousBalance != null ? (
                <span>
                  ديون سابقة: <b>{money(data.previousBalance, currency)}</b>
                </span>
              ) : null}
            </div>

            <div className="pv-table-wrap">
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الكود</th>
                    <th>الصنف</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="pv-empty">
                        لا توجد أصناف في الفاتورة
                      </td>
                    </tr>
                  ) : (
                    data.lines.map((l, i) => (
                      <tr key={`${l.code}-${i}`}>
                        <td>{i + 1}</td>
                        <td>{l.code}</td>
                        <td className="pv-name">{l.name}</td>
                        <td>{l.qty}</td>
                        <td>{l.price.toFixed(2)}</td>
                        <td className="pv-strong">{l.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pv-summary">
              <div>
                <span>الإجمالي</span>
                <b>{money(data.subtotal, currency)}</b>
              </div>
              {Number(data.delivery) ? (
                <div>
                  <span>التوصيل</span>
                  <b>{money(data.delivery, currency)}</b>
                </div>
              ) : null}
              <div>
                <span>المدفوع</span>
                <b>{money(data.paid, currency)}</b>
              </div>
              <div>
                <span>الباقي</span>
                <b>{money(data.remaining, currency)}</b>
              </div>
            </div>

            <div className="pv-net">
              <span>المبلغ الصافي</span>
              <b>{money(data.total, currency)}</b>
            </div>

            {data.notes ? (
              <p className="pv-notes">ملاحظات: {data.notes}</p>
            ) : null}
            <div className="pv-foot">
              <span>{data.footer || ""}</span>
              <span>{data.storeName}</span>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            إغلاق
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => (onPrint ? onPrint() : window.print())}
          >
            🖨 طباعة
          </button>
        </div>
      </div>
    </div>
  );
}
