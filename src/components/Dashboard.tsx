"use client";

import {
  IconAttendance,
  IconCashIn,
  IconCashOut,
  IconCustomers,
  IconEmployees,
  IconExpenses,
  IconItems,
  IconPrices,
  IconPurchase,
  IconPurchaseReturn,
  IconSale,
  IconSaleReturn,
  IconStats,
  IconSuppliers,
  IconTransfer,
  IconTreasury,
  LogoMark,
} from "@/components/icons";
import type { ModuleId } from "@/lib/types";
import type { ReactNode } from "react";

type TileDef = {
  module: ModuleId;
  label: string;
  icon: ReactNode;
  wide?: boolean;
};

const OPS: TileDef[] = [
  { module: "cash_out", label: "دفع نقدية", icon: <IconCashOut /> },
  { module: "cash_in", label: "إستلام نقدية", icon: <IconCashIn /> },
  { module: "attendance", label: "حضور وانصراف", icon: <IconAttendance /> },
  { module: "transfers", label: "تحويلات مخازن", icon: <IconTransfer /> },
  { module: "stats", label: "إحصائيات", icon: <IconStats />, wide: true },
];

const INV: TileDef[] = [
  { module: "sales", label: "فاتورة بيع", icon: <IconSale />, wide: true },
  { module: "sale_return", label: "مرتجع مبيعات", icon: <IconSaleReturn /> },
  { module: "purchase", label: "فاتورة مشتريات", icon: <IconPurchase /> },
  { module: "prices", label: "بيان أسعار", icon: <IconPrices /> },
  { module: "purchase_return", label: "مرتجع مشتريات", icon: <IconPurchaseReturn /> },
];

const ENT: TileDef[] = [
  { module: "customers", label: "العملاء", icon: <IconCustomers /> },
  { module: "items", label: "الاصناف", icon: <IconItems /> },
  { module: "employees", label: "الموظفين", icon: <IconEmployees /> },
  { module: "suppliers", label: "الموردين", icon: <IconSuppliers /> },
  { module: "expenses", label: "المصروفات", icon: <IconExpenses /> },
  { module: "treasury", label: "الخزينة", icon: <IconTreasury /> },
];

function Tile({ tile, onOpen }: { tile: TileDef; onOpen: (m: ModuleId) => void }) {
  return (
    <button
      type="button"
      className={`tile ${tile.wide ? "wide" : ""}`}
      onClick={() => onOpen(tile.module)}
    >
      {tile.icon}
      <span className="label">{tile.label}</span>
    </button>
  );
}

export default function Dashboard({
  onOpen,
  settings,
}: {
  onOpen: (m: ModuleId) => void;
  settings: Record<string, string>;
}) {
  return (
    <div className="dash">
      <div className="dash-head">
        <div className="brand">
          <LogoMark />
          <h1>
            Sales <span>Manager</span>
          </h1>
        </div>
        <button type="button" className="help-q" onClick={() => onOpen("contact")} title="مساعدة">
          ?
        </button>
      </div>
      <div className="tile-wrap">
        <div className="tile-col ops">
          {OPS.map((t) => (
            <Tile key={t.module} tile={t} onOpen={onOpen} />
          ))}
        </div>
        <div className="tile-col inv">
          {INV.map((t) => (
            <Tile key={t.module} tile={t} onOpen={onOpen} />
          ))}
        </div>
        <div className="tile-col ent">
          {ENT.map((t) => (
            <Tile key={t.module} tile={t} onOpen={onOpen} />
          ))}
        </div>
      </div>
      <div className="watermark">
        MAKTAB
        <small>SOFT</small>
      </div>
      <div className="contact-bar">
        <span>☎ {settings.whatsapp || "+20 10 1234 5678"}</span>
        <span>🌐 {settings.website || "maktabet-elnoor.com"}</span>
        <span>✉ {settings.email || "info@maktabet-elnoor.com"}</span>
      </div>
    </div>
  );
}
