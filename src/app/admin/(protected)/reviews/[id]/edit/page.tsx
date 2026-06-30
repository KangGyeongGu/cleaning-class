import { notFound } from "next/navigation";
import { getReviewById } from "@/shared/lib/queries/review";
import { EditReviewForm } from "@/app/admin/(protected)/reviews/[id]/edit/EditReviewForm.client";

interface EditReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const { id } = await params;
  const review = await getReviewById(id);

  if (!review) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:p-8">
      <h1 className="mb-8 text-3xl font-black text-slate-900">리뷰 수정</h1>
      <EditReviewForm review={review} imageUrl={review.imageUrl} />
    </div>
  );
}
