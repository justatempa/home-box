"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type UserMenuUser = {
  name?: string | null;
  role?: "ADMIN" | "USER";
  image?: string | null;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconPeople({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2 3 7l9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function IconExit({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
    >
      {icon}
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const isAdmin = user.role === "ADMIN";
  const displayName = user.name?.trim() || "用户";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-2 text-white/85 shadow-sm transition hover:bg-white/10 hover:text-white",
          open && "bg-white/10",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-white/10 bg-black/30">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <IconUser className="h-4 w-4 text-white/70 group-hover:text-white" />
          )}
        </span>
        <span className="hidden max-w-[10rem] truncate text-xs text-white/75 sm:block">
          {displayName}
        </span>
        <IconChevron className={clsx("h-4 w-4 text-white/55 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,rgba(12,14,18,0.92),rgba(6,7,10,0.88))] p-2 shadow-2xl backdrop-blur"
        >
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">{displayName}</div>
              <div
                className={clsx(
                  "rounded-full border px-2 py-0.5 text-[11px]",
                  isAdmin
                    ? "border-amber-200/20 bg-amber-200/10 text-amber-100"
                    : "border-white/10 bg-white/5 text-white/60",
                )}
              >
                {isAdmin ? "管理员" : "普通用户"}
              </div>
            </div>
          </div>

          <div className="my-1 h-px bg-white/10" />

          <div className="space-y-1">
            <MenuLink
              href="/templates"
              icon={<IconLayers className="h-4 w-4 text-white/65" />}
              label="模板"
              onNavigate={() => setOpen(false)}
            />
          </div>

          {isAdmin ? (
            <div className="space-y-1">
              <MenuLink
                href="/admin/users"
                icon={<IconPeople className="h-4 w-4 text-white/65" />}
                label="用户"
                onNavigate={() => setOpen(false)}
              />
              <MenuLink
                href="/dictionaries"
                icon={<IconBook className="h-4 w-4 text-white/65" />}
                label="字典"
                onNavigate={() => setOpen(false)}
              />
            </div>
          ) : null}

          <div className="mt-1 space-y-1">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-100/90 transition hover:bg-rose-300/10"
            >
              <IconExit className="h-4 w-4 text-rose-200/90" />
              <span className="flex-1 text-left">退出登录</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
