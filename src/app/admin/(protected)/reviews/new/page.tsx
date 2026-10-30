import { ReviewForm } from "@/app/admin/(protected)/reviews/ReviewForm.client";

export default function NewReviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">
      <ReviewForm />
    </div>
  );
}
