"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/signup")
      .then((r) => r.json())
      .then((d) => setOpen(Boolean(d.open)))
      .catch(() => setOpen(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (open === null) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Signup is closed</CardTitle>
          <CardDescription>
            This app is invite-only. Ask an admin to create your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Create the first admin
        </CardTitle>
        <CardDescription>
          You're the first user — this will be the admin account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              3-32 chars, lowercase letters, numbers, _ or -, starting with a letter.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create admin & sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
