import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
