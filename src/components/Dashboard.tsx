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
};

const OPS: TileDef[] = [
  { module: "cash_out", label: "دفع نقدية", icon: <IconCashOut /> },
  { module: "cash_in", label: "إستلام نقدية", icon: <IconCashIn /> },
  { module: "attendance", label: "حضور وانصراف", icon: <IconAttendance /> },
  { module: "transfers", label: "تحويلات مخازن", icon: <IconTransfer /> },
  { module: "stats", label: "إحصائيات", icon: <IconStats /> },
];

const INV: TileDef[] = [
  { module: "sales", label: "فاتورة بيع", icon: <IconSale /> },
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

function Tile({
  tile,
  onOpen,
  color,
}: {
  tile: TileDef;
  onOpen: (m: ModuleId) => void;
  color: string;
}) {
  return (
    <button
      type="button"
      className="tile"
      style={{ ["--tile-c1" as string]: color }}
      onClick={() => onOpen(tile.module)}
    >
      {tile.icon}
      <span className="label">{tile.label}</span>
    </button>
  );
}

/* لون لكل كارت — تدرّج لوني متساوي في التوزيع */
const COLORS: Record<string, string> = {
  cash_out: "#e8590c",
  cash_in: "#2f9e44",
  attendance: "#1098ad",
  transfers: "#7048e8",
  stats: "#1c7ed6",
  sales: "#1971c2",
  sale_return: "#c2255c",
  purchase: "#0b7285",
  prices: "#6741d9",
  purchase_return: "#d9480f",
  customers: "#e64980",
  items: "#2b8a3e",
  employees: "#f08c00",
  suppliers: "#0c8599",
  expenses: "#a61e4d",
  treasury: "#5f3dc4",
};

export default function Dashboard({
  onOpen,
  settings,
  userName,
}: {
  onOpen: (m: ModuleId) => void;
  settings: Record<string, string>;
  userName?: string;
}) {
  const store = settings.store_name || "مكتبة الجمال";
  return (
    <div className="dash">
      <div className="dash-head">
        <div className="brand">
          <LogoMark />
          <h1>
            {store.split(" ")[0]} <span>{store.split(" ").slice(1).join(" ")}</span>
          </h1>
        </div>
        <div className="dash-user">
          <span className="dash-hi">أهلاً {userName || "بيك"} 👋</span>
          <button type="button" className="help-q" onClick={() => onOpen("contact")} title="مساعدة">
            ?
          </button>
        </div>
      </div>
      <div className="tile-wrap">
        <div className="tile-col ops">
          {OPS.map((t) => (
            <Tile key={t.module} tile={t} onOpen={onOpen} color={COLORS[t.module] ?? "#1c7ed6"} />
          ))}
        </div>
        <div className="tile-col inv">
          {INV.map((t) => (
            <Tile key={t.module} tile={t} onOpen={onOpen} color={COLORS[t.module] ?? "#1c7ed6"} />
          ))}
        </div>
        <div className="tile-col ent">
          {ENT.map((t) => (
            <Tile key={t.module} tile={t} onOpen={onOpen} color={COLORS[t.module] ?? "#1c7ed6"} />
          ))}
        </div>
      </div>
    </div>
  );
}
