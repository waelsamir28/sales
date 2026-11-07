"use client";

import Dashboard from "@/components/Dashboard";
import InvoicePos from "@/components/InvoicePos";
import Login, { type SessionUser } from "@/components/Login";
import { MODULE_TITLES, renderModule } from "@/components/Screens";
import type { BootstrapData, ModuleId, Tab, Toast } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const HOME: Tab = { id: "home", module: "home", title: "الرئيسية" };
const USER_KEY = "sales.user";

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booted, setBooted] = useState(false);
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
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionUser;
        // استرجاع جلسة الاسم المحفوظة (مرة واحدة عند الفتح)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed?.name) setUser(parsed);
      }
    } catch {
      /* ignore */
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    void reload();
    const t = window.setInterval(() => setNow(new Date().toLocaleString("ar-EG")), 1000);
    return () => window.clearInterval(t);
  }, [reload]);

  function signIn(next: SessionUser) {
    setUser(next);
    showToast("ok", `أهلاً ${next.name} 👋 — نورت مكتبة الجمال`);
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setActive("home");
  }

  function openTab(tab: Tab) {
    setTabs((prev) => (prev.some((t) => t.id === tab.id) ? prev : [...prev, tab]));
    setActive(tab.id);
  }

  function openModule(module: ModuleId) {
    setMenu(null);
    if (module === "home") {
      setActive("home");
      return;
    }
    if (module === "items") {
      openItemsTab("list");
      return;
    }
    const existing = tabs.find((t) => t.module === module);
    if (existing) {
      setActive(existing.id);
      return;
    }
    const tab: Tab = { id: `${module}-${Date.now()}`, module, title: MODULE_TITLES[module] };
    openTab(tab);
  }

  function openBackupTab(view: "backup" | "maintenance" = "backup") {
    setMenu(null);
    const tab: Tab = { id: "backup-main", module: "backup", title: "النسخ الاحتياطى والصيانة", sub: view };
    setTabs((prev) =>
      prev.some((t) => t.id === tab.id)
        ? prev.map((t) => (t.id === tab.id ? { ...t, sub: view } : t))
        : [...prev, tab],
    );
    setActive(tab.id);
  }

  function openItemsTab(sub: string) {
    setMenu(null);
    const tab: Tab = {
      id: "items-main",
      module: "items",
      title: MODULE_TITLES.items,
      sub,
    };
    setTabs((prev) =>
      prev.some((t) => t.id === tab.id)
        ? prev.map((t) => (t.id === tab.id ? { ...t, sub } : t))
        : [...prev, tab],
    );
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

  function setCurrentSub(sub: string) {
    setTabs((prev) => prev.map((t) => (t.id === active ? { ...t, sub } : t)));
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

  if (!booted) return <div className="boot-splash">جارى التحميل...</div>;

  if (!user) {
    return <Login theme={theme} onSuccess={signIn} />;
  }

  return (
    <div className="desktop" data-theme={theme} onClick={() => setMenu(null)}>
      <div className="titlebar">
        <div className="titlebar-title">
          <span>📚</span>
          <span>مكتبة الجمال للأدوات المدرسية والمكتبية</span>
        </div>
        <div className="titlebar-brand">Sales Manager</div>
      </div>

      <div className="menubar">
        <div className="menu-items" onClick={(e) => e.stopPropagation()}>
          <Menu
            label="ملف"
            open={menu === "file"}
            onToggle={() => setMenu(menu === "file" ? null : "file")}
            items={[
              { label: "الرئيسية", action: () => openModule("home") },
              { label: "نسخ احتياطى", action: () => openBackupTab() },
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
            label="الأصناف والمجموعات"
            open={menu === "items"}
            onToggle={() => setMenu(menu === "items" ? null : "items")}
            items={[
              { label: "الأصناف", action: () => openItemsTab("list") },
              { label: "المجموعات · البنود", action: () => openItemsTab("groups") },
              { label: "إضافة سريعة", action: () => openItemsTab("quick") },
              { label: "أرباح الأصناف", action: () => openItemsTab("profit") },
              { label: "تحت الحد الأدنى", action: () => openItemsTab("low") },
            ]}
          />
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
          <button type="button" onClick={() => openBackupTab("maintenance")}>
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
            جارى تحميل بيانات مكتبة الجمال...
          </div>
        )}
        {error && (
          <div className="screen" style={{ alignItems: "center", justifyContent: "center" }}>
            {error}
          </div>
        )}
        {data && current.module === "home" && (
          <Dashboard onOpen={openModule} settings={data.settings} userName={user?.name} />
        )}
        {data && invoiceKind && (
          <InvoicePos kind={invoiceKind} data={data} onSaved={reload} onToast={showToast} />
        )}
        {data && current.module !== "home" && !invoiceKind &&
          renderModule(current.module, data, reload, showToast, {
            sub: current.sub,
            onSub: setCurrentSub,
          })}
      </div>

      <div className="statusbar">
        <span>
          المستخدم: <b>{user?.name || "—"}</b>
        </span>
        <span>التاريخ: {now}</span>
        <span>{data?.settings.store_name || "مكتبة الجمال"}</span>
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
