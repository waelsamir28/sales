export type PrintLine = {
  code: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
};

export type InvoicePrintData = {
  storeName: string;
  storeActivity?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  email?: string;
  taxNumber?: string;
  title: string;
  number: number | string;
  date: string;
  partyLabel: string;
  partyName: string;
  partyPhone?: string;
  warehouseName?: string;
  treasuryName?: string;
  paymentType: string;
  lines: PrintLine[];
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
  /** invoice design settings (from the settings screen) */
  accent?: string;
  paper?: string;
  showItems?: boolean;
  showQty?: boolean;
  showType?: boolean;
  showFooter?: boolean;
  logoText?: string;
};

function money(v: number | undefined, currency = "جنيه") {
  const value = Number.isFinite(Number(v)) ? Number(v) : 0;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** builds a printable A4/thermal friendly invoice document (Arabic, RTL) */
export function buildInvoiceHtml(data: InvoicePrintData) {
  const currency = data.currency || "جنيه";
  const accent = data.accent || "#2f54d0";
  const paper = data.paper || "A4";
  const showItems = data.showItems !== false;
  const showQty = data.showQty !== false;
  const showType = data.showType !== false;
  const showFooter = data.showFooter !== false;
  const pageSize =
    paper === "A5" ? "A5" : paper === "thermal" ? "80mm auto" : "A4";
  const rows = data.lines
    .map(
      (l, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td class="num">${esc(l.code)}</td>
        <td class="name">${esc(l.name)}</td>
        <td>${esc(l.unit)}</td>
        ${showQty ? `<td class="num">${l.qty}</td>` : ""}
        <td class="num">${Number(l.price).toFixed(2)}</td>
        <td class="num strong">${Number(l.total).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const summary = [
    ["الإجمالي", money(data.subtotal, currency)],
    ["المدفوع", money(data.paid, currency)],
    ["الباقي", money(data.remaining, currency)],
  ]
    .map(
      ([label, value]) =>
        `<div class="sm-item"><span>${esc(label)}</span><b>${esc(value)}</b></div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${esc(data.title)} — ${esc(data.number)}</title>
<style>
  @page { size: ${pageSize}; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px;
    font-family: "Cairo", "Segoe UI", Tahoma, sans-serif;
    color: #1f2937; background: #fff; direction: rtl;
  }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; border-bottom: 3px solid ${accent}; padding-bottom: 12px; }
  .store h1 { margin: 0; font-size: 24px; color: ${accent}; }
  .store p { margin: 3px 0; font-size: 12px; color: #475569; }
  .stamp { text-align: left; }
  .stamp .badge { display: inline-block; background: ${accent}; color: #fff; padding: 6px 16px; border-radius: 0; font-weight: 800; font-size: 13px; border: 1px solid #0f172a; }
  .stamp .num { margin-top: 8px; font-size: 12px; color: #334155; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px 22px; padding: 12px 0; font-size: 12.5px; }
  .meta span b { color: ${accent}; }
  .party { display: flex; flex-wrap: wrap; gap: 10px 22px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 0; padding: 10px 12px; font-size: 12.5px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
  thead th { background: #eef2f9; color: ${accent}; padding: 8px 6px; border-bottom: 2px solid #c5d4ea; font-weight: 800; }
  tbody td { padding: 6px; border-bottom: 1px solid #eef2f7; text-align: center; }
  tbody td.name { text-align: right; }
  td.num { font-variant-numeric: tabular-nums; }
  td.strong { font-weight: 800; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .summary { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start; }
  .sm-item { flex: 1 1 140px; border: 1px solid #e2e8f0; border-radius: 0; padding: 8px 10px; font-size: 12.5px; background: #f8fafc; display: flex; justify-content: space-between; gap: 8px; }
  .sm-item b { color: ${accent}; }
  .net { margin-top: 12px; background: #1f2937; color: #fff; border-radius: 0; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: 800; }
  .net b { color: #fde68a; font-size: 22px; }
  .notes { margin-top: 12px; font-size: 12px; color: #475569; }
  .foot { margin-top: 18px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  @media print { body { padding: 8px; } }
</style>
</head>
<body>
  <div class="head">
    <div class="store">
      <h1>${esc(data.logoText || data.storeName)}</h1>
      ${data.storeActivity ? `<p>${esc(data.storeActivity)}</p>` : ""}
      <p>${[data.phone, data.whatsapp]
        .filter(Boolean)
        .map((v) => `☎ ${esc(v)}`)
        .join(" · ")}</p>
      <p>${[data.website, data.email]
        .filter(Boolean)
        .map((v) => esc(v))
        .join(" · ")}</p>
      ${data.taxNumber ? `<p>الرقم الضريبي: ${esc(data.taxNumber)}</p>` : ""}
    </div>
    <div class="stamp">
      <div class="badge">${esc(data.title)}</div>
      <div class="num">رقم: <b>${esc(data.number)}</b></div>
      <div class="num">التاريخ: ${esc(data.date)}</div>
    </div>
  </div>

  <div class="meta">
    ${showType ? `<span>نوع الدفع: <b>${esc(data.paymentType)}</b></span>` : ""}
    <span>عدد الأصناف: <b>${data.itemCount}</b></span>
    <span>إجمالي الكميات: <b>${data.qtyTotal}</b></span>
  </div>

  <div class="party">
    <span>${esc(data.partyLabel)}: <b>${esc(data.partyName)}</b></span>
    ${data.partyPhone ? `<span>الهاتف: ${esc(data.partyPhone)}</span>` : ""}
  </div>

  ${
    showItems
      ? `<table>
    <thead>
      <tr>
        <th>#</th><th>الكود</th><th>الصنف</th><th>الوحدة</th>${showQty ? "<th>الكمية</th>" : ""}<th>السعر</th><th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="7" style="padding:18px;color:#94a3b8">لا توجد أصناف</td></tr>`}</tbody>
  </table>`
      : ""
  }

  <div class="summary">${summary}${
    data.previousBalance != null
      ? `<div class="sm-item"><span>ديون سابقة</span><b>${money(data.previousBalance, currency)}</b></div>`
      : ""
  }${
    data.balanceAfter != null
      ? `<div class="sm-item"><span>بعد الحفظ</span><b>${money(data.balanceAfter, currency)}</b></div>`
      : ""
  }</div>
  <div class="net"><span>المبلغ الصافي</span><b>${money(data.total, currency)}</b></div>
  ${data.notes ? `<div class="notes">ملاحظات: ${esc(data.notes)}</div>` : ""}
  <div class="foot">
    <span>${showFooter ? esc(data.footer || "") : ""}</span>
    <span>${esc(data.storeName)} — شكراً لتعاملكم معنا</span>
  </div>
</body>
</html>`;
}

/** opens a print window with the invoice document */
export function printInvoice(data: InvoicePrintData) {
  const html = buildInvoiceHtml(data);
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    window.print();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    try {
      win.print();
    } catch {
      /* user can print manually */
    }
  }, 250);
}
