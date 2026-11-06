import type { ReactNode } from "react";

export function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="icon" viewBox="0 0 64 64" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function IconCashOut() {
  return (
    <Svg>
      <circle cx="18" cy="40" r="10" fill="#f59e0b" />
      <circle cx="18" cy="40" r="6" fill="#fde68a" />
      <text x="18" y="44" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="700">
        $
      </text>
      <path d="M28 38c8-10 16-8 22 0" stroke="#fb7185" strokeWidth="4" fill="none" />
      <path d="M46 28c6 4 8 10 6 16" stroke="#f97316" strokeWidth="4" fill="none" />
      <path d="M14 22c8-2 16 2 20 10" stroke="#fdba74" strokeWidth="5" strokeLinecap="round" />
      <circle cx="48" cy="22" r="6" fill="#facc15" />
    </Svg>
  );
}

export function IconCashIn() {
  return (
    <Svg>
      <path d="M20 36c0-8 24-8 24 0v10c0 8-24 8-24 0V36z" fill="#ef4444" />
      <path d="M20 36c0 6 24 6 24 0" stroke="#b91c1c" />
      <circle cx="32" cy="28" r="10" fill="#f59e0b" />
      <circle cx="32" cy="28" r="6" fill="#fde68a" />
      <circle cx="44" cy="44" r="7" fill="#fbbf24" />
      <circle cx="18" cy="46" r="5" fill="#f59e0b" />
    </Svg>
  );
}

export function IconSale() {
  return (
    <Svg>
      <rect x="18" y="10" width="28" height="40" rx="4" fill="#38bdf8" />
      <rect x="22" y="16" width="20" height="3" fill="#fff" />
      <rect x="22" y="22" width="16" height="3" fill="#e0f2fe" />
      <rect x="22" y="28" width="18" height="3" fill="#e0f2fe" />
      <circle cx="40" cy="44" r="10" fill="#0ea5e9" />
      <text x="40" y="48" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
        $
      </text>
    </Svg>
  );
}

export function IconCustomers() {
  return (
    <Svg>
      <circle cx="22" cy="24" r="8" fill="#fb7185" />
      <circle cx="42" cy="22" r="8" fill="#38bdf8" />
      <circle cx="32" cy="30" r="8" fill="#fbbf24" />
      <path d="M12 50c2-10 12-12 20-8" fill="#fda4af" />
      <path d="M32 42c8-6 20-4 22 10H32v-4z" fill="#7dd3fc" />
      <path d="M24 40c4-4 12-4 16 2v8H24v-6z" fill="#fde68a" />
    </Svg>
  );
}

export function IconItems() {
  return (
    <Svg>
      <rect x="14" y="28" width="36" height="22" rx="4" fill="#f59e0b" />
      <path d="M14 34h36" stroke="#b45309" />
      <rect x="24" y="16" width="16" height="14" rx="2" fill="#22c55e" />
      <circle cx="44" cy="22" r="8" fill="#38bdf8" />
      <rect x="18" y="18" width="10" height="10" rx="2" fill="#a78bfa" />
    </Svg>
  );
}

export function IconAttendance() {
  return (
    <Svg>
      <circle cx="24" cy="22" r="9" fill="#38bdf8" />
      <path d="M10 50c2-12 12-16 22-10v12H10z" fill="#7dd3fc" />
      <rect x="34" y="14" width="20" height="28" rx="3" fill="#e2e8f0" />
      <path d="M38 22h12M38 28h12M38 34h8" stroke="#64748b" strokeWidth="2" />
      <circle cx="48" cy="42" r="8" fill="#22c55e" />
      <path d="M44 42l3 3 6-7" stroke="#fff" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function IconTransfer() {
  return (
    <Svg>
      <rect x="10" y="22" width="28" height="22" rx="3" fill="#f59e0b" />
      <path d="M10 28h28" stroke="#b45309" />
      <path d="M40 32h12l-6-8M52 32l-6 8" stroke="#38bdf8" strokeWidth="4" fill="none" />
      <circle cx="48" cy="18" r="8" fill="#0ea5e9" />
      <text x="48" y="22" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">
        1
      </text>
    </Svg>
  );
}

export function IconSaleReturn() {
  return (
    <Svg>
      <circle cx="32" cy="32" r="22" fill="#38bdf8" />
      <path d="M20 28h18l-4-8M38 28l6 10H22" fill="#e0f2fe" />
      <path d="M24 44c8 8 20 4 24-6" stroke="#fff" strokeWidth="3" fill="none" />
      <path d="M46 30v10h-8" stroke="#fff" strokeWidth="3" fill="none" />
    </Svg>
  );
}

export function IconPurchase() {
  return (
    <Svg>
      <circle cx="32" cy="32" r="22" fill="#0ea5e9" />
      <path d="M20 24h22l4 12H22z" fill="#e0f2fe" />
      <path d="M32 20v22" stroke="#fff" strokeWidth="3" />
      <path d="M24 34l8 8 8-8" stroke="#fff" strokeWidth="3" fill="none" />
    </Svg>
  );
}

export function IconEmployees() {
  return (
    <Svg>
      <circle cx="20" cy="22" r="8" fill="#38bdf8" />
      <circle cx="44" cy="22" r="8" fill="#22c55e" />
      <circle cx="32" cy="26" r="8" fill="#818cf8" />
      <path d="M8 50c2-12 12-14 20-8" fill="#7dd3fc" />
      <path d="M24 44c6-8 16-6 20 8H24z" fill="#a5b4fc" />
      <path d="M36 44c8-8 20-4 22 8H36z" fill="#86efac" />
    </Svg>
  );
}

export function IconSuppliers() {
  return (
    <Svg>
      <circle cx="32" cy="18" r="8" fill="#38bdf8" />
      <path d="M20 50V30c0-4 24-4 24 0v20" fill="#60a5fa" />
      <rect x="18" y="34" width="12" height="10" rx="2" fill="#fbbf24" />
      <circle cx="44" cy="46" r="8" fill="#f59e0b" />
      <path d="M40 46h8M44 42v8" stroke="#fff" strokeWidth="2" />
    </Svg>
  );
}

export function IconStats() {
  return (
    <Svg>
      <circle cx="32" cy="32" r="20" fill="#38bdf8" />
      <circle cx="32" cy="32" r="8" fill="#e0f2fe" />
      <path d="M44 20l8-6M48 20h-8v8" stroke="#7dd3fc" strokeWidth="3" fill="none" />
      <rect x="22" y="36" width="5" height="10" fill="#f97316" />
      <rect x="30" y="30" width="5" height="16" fill="#22c55e" />
      <rect x="38" y="33" width="5" height="13" fill="#fbbf24" />
    </Svg>
  );
}

export function IconPrices() {
  return (
    <Svg>
      <circle cx="32" cy="32" r="22" fill="#38bdf8" />
      <path d="M24 24h10c6 0 6 8 0 8H24z" fill="#e0f2fe" />
      <path d="M24 32h12c5 0 5 8-1 8H24z" fill="#fff" />
      <path d="M22 44l10 8 10-8" stroke="#fff" strokeWidth="3" fill="none" />
    </Svg>
  );
}

export function IconPurchaseReturn() {
  return (
    <Svg>
      <circle cx="32" cy="32" r="22" fill="#0ea5e9" />
      <path d="M20 26h22l4 12H22z" fill="#e0f2fe" />
      <path d="M24 20l16 16M40 20L24 36" stroke="#ef4444" strokeWidth="3" />
    </Svg>
  );
}

export function IconExpenses() {
  return (
    <Svg>
      <rect x="16" y="12" width="32" height="40" rx="4" fill="#e2e8f0" />
      <rect x="20" y="18" width="24" height="6" fill="#94a3b8" />
      <rect x="22" y="28" width="8" height="6" fill="#64748b" />
      <rect x="32" y="28" width="8" height="6" fill="#64748b" />
      <rect x="22" y="38" width="8" height="6" fill="#64748b" />
      <circle cx="44" cy="44" r="10" fill="#f59e0b" />
      <text x="44" y="48" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">
        $
      </text>
    </Svg>
  );
}

export function IconTreasury() {
  return (
    <Svg>
      <rect x="12" y="18" width="40" height="32" rx="4" fill="#64748b" />
      <rect x="16" y="22" width="32" height="24" rx="3" fill="#334155" />
      <circle cx="32" cy="34" r="7" fill="#fbbf24" />
      <rect x="30" y="34" width="4" height="8" fill="#f59e0b" />
      <path d="M12 18h40l-4-8H16z" fill="#94a3b8" />
    </Svg>
  );
}

export function LogoMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#0ea5e9" />
      <circle cx="32" cy="32" r="24" fill="#1d4ed8" />
      <path d="M20 40c8-18 24-18 28 0" stroke="#7dd3fc" strokeWidth="4" fill="none" />
      <rect x="28" y="14" width="8" height="28" rx="2" fill="#fbbf24" />
      <path d="M18 44h28v6H18z" fill="#22c55e" />
    </svg>
  );
}
