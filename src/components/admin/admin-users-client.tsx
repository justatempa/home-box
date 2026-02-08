"use client";

import { useState } from "react";

import { trpc } from "@/utils/trpc";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function AdminUsersClient() {
  const utils = trpc.useUtils();
  const list = trpc.users.list.useQuery();

  const create = trpc.users.create.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
      setUsername("");
      setPassword("");
      setRole("USER");
    },
  });
  const disable = trpc.users.disable.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
    },
  });
  const resetPassword = trpc.users.resetPassword.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
      setResetUserId(null);
      setNewPassword("");
    },
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const roleLabel = (r: "ADMIN" | "USER") => (r === "ADMIN" ? "admin" : "user");

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs text-white/60">管理后台</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">用户管理</h1>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium">创建用户</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password (>=8)"
            type="password"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          >
            <option value="USER">user</option>
            <option value="ADMIN">admin</option>
          </select>
        </div>
        <button
          onClick={() => create.mutate({ username: username.trim(), password, role })}
          disabled={create.isPending || username.trim().length < 3 || password.length < 8}
          className={clsx(
            "mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
            (create.isPending || username.trim().length < 3 || password.length < 8) && "opacity-60",
          )}
        >
          创建
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium">用户列表</div>
        <div className="mt-3 overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-2">用户名</th>
                <th className="py-2">角色</th>
                <th className="py-2">状态</th>
                <th className="py-2">创建时间</th>
                <th className="py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-3 font-medium">{u.username}</td>
                  <td className="py-3">{roleLabel(u.role)}</td>
                  <td className="py-3">
                    {u.isActive ? (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">
                        active
                      </span>
                    ) : (
                      <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2 py-0.5 text-xs text-rose-100">
                        disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-white/70">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => disable.mutate({ userId: u.id, isActive: !u.isActive })}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                      >
                        {u.isActive ? "禁用" : "启用"}
                      </button>
                      <button
                        onClick={() => setResetUserId(u.id)}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                      >
                        重置密码
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetUserId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-5">
            <div className="text-sm font-semibold">重置密码</div>
            <div className="mt-2 text-xs text-white/60">新密码必须至少 8 位。</div>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="new password"
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setResetUserId(null)}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80"
              >
                取消
              </button>
              <button
                onClick={() => resetPassword.mutate({ userId: resetUserId, newPassword })}
                disabled={resetPassword.isPending || newPassword.length < 8}
                className={clsx(
                  "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
                  (resetPassword.isPending || newPassword.length < 8) && "opacity-60",
                )}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

