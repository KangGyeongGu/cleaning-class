"use client";

import { useState } from "react";
import { useActionState } from "react";
import { login } from "@/shared/actions/auth";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-4xl font-black text-slate-900">
          청소클라쓰
        </h1>
        <p className="mb-12 text-center font-light text-slate-500">
          관리자 로그인
        </p>

        <form action={formAction} className="space-y-8">
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-input-lg"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="form-input-lg pr-10"
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isPending}
          >
            {isPending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
