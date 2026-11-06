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
  color: string;
  icon: ReactNode;
  wide?: boolean;
};

const OPS: TileDef[] = [
  { module: "cash_out", label: "دفع نقدية", color: "#be185d", icon: <IconCashOut /> },
  { module: "cash_in", label: "إستلام نقدية", color: "#0f766e", icon: <IconCashIn /> },
  { module: "attendance", label: "حضور وانصراف", color: "#2563eb", icon: <IconAttendance /> },
  { module: "transfers", label: "تحويلات مخازن", color: "#334155", icon: <IconTransfer /> },
  { module: "stats", label: "إحصائيات", color: "#6d28d9", icon: <IconStats />, wide: true },
];

const INV: TileDef[] = [
  { module: "sales", label: "فاتورة بيع", color: "#0284c7", icon: <IconSale />, wide: true },
  { module: "sale_return", label: "مرتجع مبيعات", color: "#0369a1", icon: <IconSaleReturn /> },
  { module: "purchase", label: "فاتورة مشتريات", color: "#b45309", icon: <IconPurchase /> },
  { module: "prices", label: "بيان أسعار", color: "#1d4ed8", icon: <IconPrices /> },
  { module: "purchase_return", label: "مرتجع مشتريات", color: "#0e7490", icon: <IconPurchaseReturn /> },
];

const ENT: TileDef[] = [
  { module: "customers", label: "العملاء", color: "#16a34a", icon: <IconCustomers /> },
  { module: "items", label: "الاصناف", color: "#d97706", icon: <IconItems /> },
  { module: "employees", label: "الموظفين", color: "#4b5563", icon: <IconEmployees /> },
  { module: "suppliers", label: "الموردين", color: "#ca8a04", icon: <IconSuppliers /> },
  { module: "expenses", label: "المصروفات", color: "#854d0e", icon: <IconExpenses /> },
  { module: "treasury", label: "الخزينة", color: "#7c2d12", icon: <IconTreasury /> },
];

function Tile({ tile, onOpen }: { tile: TileDef; onOpen: (m: ModuleId) => void }) {
  return (
    <button
      type="button"
      className={`tile ${tile.wide ? "wide" : ""}`}
      style={{ borderColor: tile.color }}
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
        <div className="watermark">
          MAKTAB
          <small>SOFT</small>
        </div>
      </div>
      <div className="contact-bar">
        <span>☎ {settings.whatsapp || "+20 10 1234 5678"}</span>
        <span>🌐 {settings.website || "maktabet-elnoor.com"}</span>
        <span>✉ {settings.email || "info@maktabet-elnoor.com"}</span>
      </div>
    </div>
  );
}
