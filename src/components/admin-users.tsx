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
import { UserPlus, Users } from "lucide-react";
import type { User } from "@/lib/types";

export function AdminUsers() {
  const [me, setMe] = useState<User | null | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (me?.is_admin) load();
  }, [me]);

  if (me === undefined) return null;
  if (!me?.is_admin) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, is_admin: isAdmin }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create user");
      return;
    }
    setUsername("");
    setPassword("");
    setIsAdmin(false);
    load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          User Management
        </CardTitle>
        <CardDescription>
          Create accounts for people you want to allow to use this app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alice"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            Make admin (can create other users)
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            <UserPlus className="mr-2 h-4 w-4" />
            {submitting ? "Creating..." : "Create user"}
          </Button>
        </form>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Existing users</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="font-medium">{u.username}</span>
                  {u.is_admin && (
                    <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-xs text-orange-600 dark:text-orange-400">
                      admin
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
