"use client";

import { LogoMark } from "@/components/icons";
import { useState, type FormEvent } from "react";

export type SessionUser = { username: string; displayName: string; role: string };

export default function Login({
  onSuccess,
  theme,
}: {
  onSuccess: (user: SessionUser) => void;
  theme: string;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; user?: SessionUser };
      if (!json.ok || !json.user) {
        setError(json.error || "تعذر الدخول");
        return;
      }
      onSuccess(json.user);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login" data-theme={theme}>
      <div className="login-card">
        <aside className="login-brand">
          <LogoMark />
          <h1>Sales Manager</h1>
          <p>مكتبة الجمال</p>
          <small>أدوات مدرسية · مكتبية · كتب خارجية للبيع</small>
          <ul>
            <li>فاتورة بيع سريع</li>
            <li>تقسيط المدارس</li>
            <li>كشف حساب وأرباح</li>
          </ul>
        </aside>
        <form className="login-form" onSubmit={(e) => void submit(e)}>
          <h2>تسجيل الدخول</h2>
          <p>أدخل بيانات المستخدم لفتح وردية الكاشير</p>
          <label>
            <span>اسم المستخدم</span>
            <input
              className="win-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            <span>كلمة المرور</span>
            <input
              className="win-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <div className="login-err">{error}</div> : null}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "جارى التحقق..." : "دخول للنظام"}
          </button>
          <div className="login-hint">المستخدم الافتراضي: admin — كلمة المرور: 1234</div>
        </form>
      </div>
    </div>
  );
}
