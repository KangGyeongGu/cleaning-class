"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { loginFormSchema } from "@/shared/lib/schema";

type LoginState = {
  error?: string;
};

export async function login(
  prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = loginFormSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      error: result.error.errors[0]?.message ?? "입력값을 확인해주세요",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      error: "이메일 또는 비밀번호가 올바르지 않습니다.",
    };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[logout] signOut 오류:", error);
    }
  } catch (e) {
    console.error("[logout] signOut 예외:", e);
  }
  redirect("/admin/login");
}
