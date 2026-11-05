"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* --------------------------------- Button -------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_20px_-12px_rgba(13,148,136,0.9)]",
  secondary: "bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
};
const SIZES: Record<string, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
        "disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin-slow" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-9 place-items-center rounded-lg text-ink-500 transition-colors",
        "hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------------- Card --------------------------------- */

export function Card({
  className,
  children,
  as: As = "section",
}: {
  className?: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <As
      className={cn(
        "rounded-2xl border border-ink-200/70 bg-white shadow-soft",
        className,
      )}
    >
      {children}
    </As>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="animate-fade-up">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[28px] leading-tight font-semibold text-ink-900 sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* --------------------------------- Fields -------------------------------- */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink-700">
          {label}
          {required ? <span className="text-red-500">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-[12px] font-medium text-red-600">
          <AlertTriangle className="size-3" /> {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}

const fieldBase =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50 disabled:text-ink-400";

export function Input({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      className={cn(fieldBase, "h-10", invalid ? "border-red-400" : "border-ink-200", className)}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      className={cn(
        fieldBase,
        "min-h-[92px] py-2.5 leading-relaxed",
        invalid ? "border-red-400" : "border-ink-200",
        className,
      )}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...rest}
      className={cn(
        fieldBase,
        "h-10 appearance-none bg-[length:16px] bg-[right_0.65rem_center] bg-no-repeat pr-9",
        invalid ? "border-red-400" : "border-ink-200",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7ba1' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-ink-800">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-[12.5px] text-ink-500">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-brand-600" : "bg-ink-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

/* --------------------------------- Badge --------------------------------- */

const TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-800 border-brand-200",
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  amber: "bg-flare-50 text-flare-600 border-flare-100",
  red: "bg-red-50 text-red-700 border-red-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof TONES | string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap",
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Progress ------------------------------- */

export function ProgressBar({
  value,
  className,
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "amber" | "dark";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const bar =
    tone === "amber"
      ? "bg-flare-500"
      : tone === "dark"
        ? "bg-ink-800"
        : "bg-gradient-to-r from-brand-600 to-brand-400";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-100", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-ink-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-brand-600 transition-[stroke-dashoffset] duration-700"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-semibold text-ink-900">{pct}%</div>
        {label ? <div className="text-[10.5px] uppercase tracking-wide text-ink-400">{label}</div> : null}
      </div>
    </div>
  );
}

/* ---------------------------------- Modal -------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    ref.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-lift sm:rounded-2xl",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description ? <p className="mt-0.5 text-[13px] text-ink-500">{description}</p> : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-600">{message}</p>
    </Modal>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  message,
  action,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50/50 text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
      )}
    >
      {icon ? (
        <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-soft">
          {icon}
        </span>
      ) : null}
      <h3 className="text-[15px] font-semibold text-ink-800">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-500">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin-slow", className)} />;
}

/* ---------------------------------- Tabs --------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            value === t.id ? "bg-ink-900 text-white shadow-soft" : "text-ink-600 hover:bg-ink-100",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className={cn("ml-1.5 text-[11px]", value === t.id ? "text-white/70" : "text-ink-400")}>
              {t.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- Tag input ------------------------------- */

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  suggestions = [],
  max = 30,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const matches = useMemo(() => {
    const d = draft.trim().toLowerCase();
    if (!d) return [];
    return suggestions
      .filter((s) => s.toLowerCase().includes(d) && !value.includes(s))
      .slice(0, 6);
  }, [draft, suggestions, value]);

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.includes(v) || value.length >= max) return;
    onChange([...value, v]);
    setDraft("");
  };

  return (
    <div className="relative">
      <div
        className={cn(
          fieldBase,
          "flex min-h-10 flex-wrap items-center gap-1.5 border-ink-200 py-1.5",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[12px] font-medium text-brand-800"
          >
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((v) => v !== tag))}>
              <X className="size-3 text-brand-600 hover:text-brand-900" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim()) add(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-ink-300"
        />
      </div>
      {matches.length ? (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-ink-200 bg-white py-1 shadow-lift">
          {matches.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => add(m)}
                className="w-full px-3 py-1.5 text-left text-[13px] text-ink-700 hover:bg-brand-50"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* --------------------------------- Toasts -------------------------------- */

type Toast = { id: number; tone: "success" | "error" | "info"; title: string; body?: string };
type ToastCtx = {
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
};

const ToastContext = createContext<ToastCtx>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICON = {
  success: <CheckCircle2 className="size-4 text-emerald-600" />,
  error: <XCircle className="size-4 text-red-600" />,
  info: <Info className="size-4 text-blue-600" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((tone: Toast["tone"], title: string, body?: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, tone, title, body }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 4200);
  }, []);

  const value = useMemo<ToastCtx>(
    () => ({
      success: (t, b) => push("success", t, b),
      error: (t, b) => push("error", t, b),
      info: (t, b) => push("info", t, b),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5 shadow-lift"
          >
            <span className="mt-0.5">{TOAST_ICON[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-ink-900">{t.title}</p>
              {t.body ? <p className="mt-0.5 text-[12.5px] leading-snug break-words text-ink-500">{t.body}</p> : null}
            </div>
            <button
              aria-label="Dismiss"
              onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
              className="text-ink-400 hover:text-ink-700"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ------------------------------ Misc widgets ----------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "brand" | "dark" | "amber" | "blue";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    dark: "bg-ink-100 text-ink-700",
    amber: "bg-flare-50 text-flare-600",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium tracking-wide text-ink-500 uppercase">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
          {hint ? <p className="mt-1 truncate text-[12px] text-ink-400">{hint}</p> : null}
        </div>
        {icon ? <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tones[tone])}>{icon}</span> : null}
      </div>
    </Card>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "error" | "success";
  title?: string;
  children: ReactNode;
}) {
  const map = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    warning: "border-flare-100 bg-flare-50 text-flare-600",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-[13px] leading-relaxed", map[tone])}>
      {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
      <div className="opacity-90">{children}</div>
    </div>
  );
}
