"use client";

import Dashboard from "@/components/Dashboard";
import InvoicePos from "@/components/InvoicePos";
import { MODULE_TITLES, renderModule } from "@/components/Screens";
import type { BootstrapData, ModuleId, Tab, Toast } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const HOME: Tab = { id: "home", module: "home", title: "الرئيسية" };

export default function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([HOME]);
  const [active, setActive] = useState("home");
  const [menu, setMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [now, setNow] = useState("");
  const [error, setError] = useState<string | null>(null);

  const showToast = useCallback((kind: Toast["kind"], text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: BootstrapData; error?: string };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error || "تعذر الاتصال بقاعدة البيانات");
        return;
      }
      setData(json.data);
      setError(null);
    } catch {
      setError("تعذر الاتصال بقاعدة البيانات أو تحميل البيانات");
    }
  }, []);

  useEffect(() => {
    void reload();
    const t = window.setInterval(() => setNow(new Date().toLocaleString("ar-EG")), 1000);
    return () => window.clearInterval(t);
  }, [reload]);

  function openModule(module: ModuleId) {
    setMenu(null);
    if (module === "home") {
      setActive("home");
      return;
    }
    const existing = tabs.find((t) => t.module === module);
    if (existing) {
      setActive(existing.id);
      return;
    }
    const tab: Tab = { id: `${module}-${Date.now()}`, module, title: MODULE_TITLES[module] };
    setTabs((prev) => [...prev, tab]);
    setActive(tab.id);
  }

  function closeTab(id: string) {
    if (id === "home") return;
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (active === id) setActive(next[next.length - 1]?.id ?? "home");
      return next;
    });
  }

  const current = tabs.find((t) => t.id === active) ?? HOME;
  const theme = data?.settings.theme || "navy";
  const low = data ? data.items.filter((i) => Number(i.stock) <= Number(i.minStock)) : [];
  const invoiceKind =
    current.module === "sales"
      ? "sale"
      : current.module === "purchase"
        ? "purchase"
        : current.module === "sale_return"
          ? "sale_return"
          : current.module === "purchase_return"
            ? "purchase_return"
            : null;

  return (
    <div className="desktop" data-theme={theme} onClick={() => setMenu(null)}>
      <div className="titlebar">
        <div className="titlebar-title">
          <span>📚</span>
          <span>Sales Manager — مكتبة النور للأدوات المدرسية والمكتبية</span>
        </div>
        <div className="win-btns">
          <span>_</span>
          <span>□</span>
          <span className="close">✕</span>
        </div>
      </div>

      <div className="menubar">
        <div className="menu-items" onClick={(e) => e.stopPropagation()}>
          <Menu
            label="ملف"
            open={menu === "file"}
            onToggle={() => setMenu(menu === "file" ? null : "file")}
            items={[
              { label: "الرئيسية", action: () => openModule("home") },
              { label: "معالج التثبيت والإعداد", action: () => openModule("setup") },
              { label: "الإعدادات", action: () => openModule("settings") },
              { label: "بيان الأسعار", action: () => openModule("prices") },
            ]}
          />
          <button type="button" onClick={() => openModule("customers")}>
            العملاء
          </button>
          <button type="button" onClick={() => openModule("suppliers")}>
            الموردين
          </button>
          <button type="button" onClick={() => openModule("warehouses")}>
            المخازن
          </button>
          <Menu
            label="المشتريات"
            open={menu === "buy"}
            onToggle={() => setMenu(menu === "buy" ? null : "buy")}
            items={[
              { label: "فاتورة مشتريات", action: () => openModule("purchase") },
              { label: "مرتجع مشتريات", action: () => openModule("purchase_return") },
            ]}
          />
          <Menu
            label="المبيعات"
            open={menu === "sell"}
            onToggle={() => setMenu(menu === "sell" ? null : "sell")}
            items={[
              { label: "فاتورة بيع", action: () => openModule("sales") },
              { label: "مرتجع مبيعات", action: () => openModule("sale_return") },
              { label: "بيان الأسعار", action: () => openModule("prices") },
            ]}
          />
          <Menu
            label="الحسابات"
            open={menu === "acc"}
            onToggle={() => setMenu(menu === "acc" ? null : "acc")}
            items={[
              { label: "الخزينة", action: () => openModule("treasury") },
              { label: "المصروفات", action: () => openModule("expenses") },
              { label: "إستلام نقدية", action: () => openModule("cash_in") },
              { label: "دفع نقدية", action: () => openModule("cash_out") },
              { label: "التقسيط", action: () => openModule("installments") },
              { label: "كشف حساب", action: () => openModule("statement") },
              { label: "الأرباح", action: () => openModule("profits") },
            ]}
          />
          <button type="button" onClick={() => openModule("employees")}>
            الموظفين
          </button>
          <button type="button" onClick={() => openModule("attendance")}>
            الصيانه
          </button>
          <button type="button" onClick={() => openModule("reports")}>
            التقارير
          </button>
          <button type="button" onClick={() => openModule("contact")}>
            اتصل بنا
          </button>
        </div>
        <button
          type="button"
          className="bell"
          title={low.length ? `${low.length} أصناف تحت الحد الأدنى` : "لا تنبيهات"}
          onClick={(e) => {
            e.stopPropagation();
            openModule("stats");
          }}
        >
          🔔
        </button>
      </div>

      <div className="tabbar">
        {tabs.map((t) => (
          <div key={t.id} className={`tab ${t.id === active ? "active" : ""}`}>
            <button type="button" style={{ background: "transparent", border: 0, fontWeight: 800 }} onClick={() => setActive(t.id)}>
              {t.title}
            </button>
            {t.id !== "home" && (
              <button type="button" className="x" onClick={() => closeTab(t.id)}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="workspace">
        {toast && <div className={`toast ${toast.kind}`}>{toast.text}</div>}
        {!data && !error && (
          <div className="screen" style={{ alignItems: "center", justifyContent: "center" }}>
            جارى تحميل بيانات مكتبة النور...
          </div>
        )}
        {error && (
          <div className="screen" style={{ alignItems: "center", justifyContent: "center" }}>
            {error}
          </div>
        )}
        {data && current.module === "home" && (
          <Dashboard onOpen={openModule} settings={data.settings} />
        )}
        {data && invoiceKind && (
          <InvoicePos kind={invoiceKind} data={data} onSaved={reload} onToast={showToast} />
        )}
        {data && current.module !== "home" && !invoiceKind &&
          renderModule(current.module, data, reload, showToast)}
      </div>

      <div className="statusbar">
        <span>
          المستخدم: <b>زائر</b>
        </span>
        <span>التاريخ: {now}</span>
        <span>
          ترخيص البرنامج: <b>365</b> أيام
        </span>
        <span>Copyright © Maktab Soft 2026 — مكتبة النور</span>
      </div>
    </div>
  );
}

function Menu({
  label,
  open,
  onToggle,
  items,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  items: Array<{ label: string; action: () => void }>;
}) {
  return (
    <div className="menu-drop">
      <button type="button" className={open ? "on" : ""} onClick={onToggle}>
        {label}
      </button>
      {open && (
        <div className="menu-panel">
          {items.map((it) => (
            <button key={it.label} type="button" onClick={it.action}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
