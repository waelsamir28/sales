"use client";

import { LogoMark } from "@/components/icons";
import { useState, type FormEvent } from "react";

export type SessionUser = { name: string };

export default function Login({
  onSuccess,
  theme,
}: {
  onSuccess: (user: SessionUser) => void;
  theme: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError("اكتب اسمك الأول عشان تدخل");
      setWelcome("");
      return;
    }
    setError("");
    setWelcome(`أهلاً ${clean} 👋 — جارى فتح البرنامج...`);
    window.setTimeout(() => onSuccess({ name: clean }), 900);
  }

  return (
    <div className="login" data-theme={theme}>
      <div className="login-card">
        <aside className="login-brand">
          <LogoMark />
          <h1>مكتبة الجمال</h1>
          <p>للأدوات المدرسية والمكتبية</p>
          <small>أدوات مدرسية · مكتبية · كتب خارجية للبيع</small>
          <ul>
            <li>فاتورة بيع سريع</li>
            <li>تقسيط المدارس</li>
            <li>كشف حساب وأرباح</li>
            <li>نسخ احتياطى للبيانات</li>
          </ul>
        </aside>
        <form className="login-form" onSubmit={submit}>
          <h2>أهلاً بيك</h2>
          <p>اكتب اسمك وادخل على طول — مفيش كلمة مرور</p>
          <label>
            <span>الاسم</span>
            <input
              className="win-input name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="مثال: وليد"
              autoFocus
              autoComplete="name"
            />
          </label>
          {error ? <div className="login-err">{error}</div> : null}
          {welcome ? <div className="login-welcome">{welcome}</div> : null}
          <button type="submit" className="btn primary">
            دخول
          </button>
          <div className="login-hint">الاسم بيظهر فى شريط الحالة ويستخدم فى الترحيب</div>
        </form>
      </div>
    </div>
  );
}
