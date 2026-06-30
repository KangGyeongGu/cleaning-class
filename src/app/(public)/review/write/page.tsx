import type { Metadata } from "next";
import { ReviewSubmitForm } from "@/components/review/ReviewSubmitForm.client";

export const metadata: Metadata = {
  title: "리뷰 작성",
  description: "청소클라쓰 서비스 이용 후기를 남겨주세요.",
  robots: { index: false, follow: false },
};

export const revalidate = false;

export default function PublicReviewPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <ReviewSubmitForm />
        </div>
      </div>
    </main>
  );
}
