import { notFound } from "next/navigation";
import { getReviewById } from "@/shared/lib/queries/review";
import { ReviewForm } from "@/app/admin/(protected)/reviews/ReviewForm.client";

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
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <ReviewForm review={review} imageUrl={review.imageUrl} />
    </div>
  );
}
