"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserCircle } from "lucide-react";
import type { User } from "@/lib/types";

type Status = { type: "success" | "error"; message: string } | null;

export function ProfileSection() {
  const [me, setMe] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, []);

  if (me === undefined) return null;
  if (!me) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCircle className="h-4 w-4" />
          Account
        </CardTitle>
        <CardDescription>
          Signed in as{" "}
          <span className="font-medium text-foreground">{me.username}</span>
          {me.is_admin && (
            <span className="ml-2 rounded bg-orange-500/15 px-1.5 py-0.5 text-xs text-orange-600 dark:text-orange-400">
              admin
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsernameForm currentUsername={me.username} onUpdated={setMe} />
        <Separator />
        <PasswordForm />
      </CardContent>
    </Card>
  );
}

function UsernameForm({
  currentUsername,
  onUpdated,
}: {
  currentUsername: string;
  onUpdated: (user: User) => void;
}) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [currentPassword, setCurrentPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const dirty = newUsername.trim() !== currentUsername;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newUsername: newUsername.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error || "Update failed" });
      return;
    }
    setCurrentPassword("");
    onUpdated(data.user);
    setStatus({ type: "success", message: "Username updated" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Change username</h3>
        <p className="text-xs text-muted-foreground">
          3-32 chars, lowercase letters, numbers, _ or -, starting with a letter.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-username">New username</Label>
          <Input
            id="new-username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username-current-password">Current password</Label>
          <Input
            id="username-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>
      <FormStatus status={status} />
      <Button type="submit" disabled={!dirty || submitting || !currentPassword}>
        {submitting ? "Saving..." : "Update username"}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords don't match" });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setStatus({ type: "error", message: data.error || "Update failed" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus({ type: "success", message: "Password updated" });
  }

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Change password</h3>
        <p className="text-xs text-muted-foreground">
          At least 8 characters.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="password-current">Current password</Label>
          <Input
            id="password-current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-new">New password</Label>
          <Input
            id="password-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-confirm">Confirm new password</Label>
          <Input
            id="password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      <FormStatus status={status} />
      <Button type="submit" disabled={!canSubmit || submitting}>
        {submitting ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}

function FormStatus({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={
        status.type === "success"
          ? "text-sm text-emerald-600 dark:text-emerald-400"
          : "text-sm text-destructive"
      }
    >
      {status.message}
    </p>
  );
}
