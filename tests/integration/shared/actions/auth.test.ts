import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedirect = vi.hoisted(() =>
  vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
const mockSignIn = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() =>
  vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
    },
  })),
);

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

function buildLoginForm(
  email = "admin@example.com",
  password = "abcdef",
): FormData {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("login", () => {
  it("redirects to /admin on successful login", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { login } = await import("@/shared/actions/auth");
    await expect(login(null, buildLoginForm())).rejects.toThrow(
      "NEXT_REDIRECT:/admin",
    );
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "abcdef",
    });
  });

  it("returns error when email format invalid (Zod fail)", async () => {
    const { login } = await import("@/shared/actions/auth");
    const result = await login(null, buildLoginForm("invalid", "abcdef"));
    expect(result.error).toBeDefined();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("returns error when password too short", async () => {
    const { login } = await import("@/shared/actions/auth");
    const result = await login(null, buildLoginForm("a@b.com", "x"));
    expect(result.error).toBeDefined();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("returns error message when supabase signIn fails", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "denied" } });
    const { login } = await import("@/shared/actions/auth");
    const result = await login(null, buildLoginForm());
    expect(result.error).toContain("이메일");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns validation message (not credentials message) and skips signIn when form empty", async () => {
    const { login } = await import("@/shared/actions/auth");
    const fd = new FormData();
    const result = await login(null, fd);
    expect(result.error).toBe("이메일 또는 비밀번호 형식을 확인해주세요");
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("redirects to /admin/login on success", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const { logout } = await import("@/shared/actions/auth");
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("logs error when signOut returns error but still redirects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignOut.mockResolvedValue({ error: { message: "x" } });
    const { logout } = await import("@/shared/actions/auth");
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs exception when signOut throws but still redirects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error("network"));
    const { logout } = await import("@/shared/actions/auth");
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
