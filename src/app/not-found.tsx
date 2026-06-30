import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  description: "요청하신 페이지를 찾을 수 없습니다.",
  openGraph: {
    title: "페이지를 찾을 수 없습니다 | 청소클라쓰",
    description: "요청하신 페이지를 찾을 수 없습니다.",
    images: ["/opengraph-image"],
  },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-9xl font-black text-slate-900">404</h1>
        <p className="mb-8 text-lg font-light text-slate-600">
          페이지를 찾을 수 없습니다.
        </p>
        <ButtonLink href="/" size="none" className="px-8 py-3">
          홈으로 돌아가기
        </ButtonLink>
      </div>
    </main>
  );
}
