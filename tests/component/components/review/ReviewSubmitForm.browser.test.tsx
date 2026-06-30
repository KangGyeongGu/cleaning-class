import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/shared/actions/customer-review", () => ({
  submitPublicReview: vi.fn(async () => ({ success: true })),
}));

import { ReviewSubmitForm } from "@/components/review/ReviewSubmitForm.client";

function ratingInput(): HTMLInputElement {
  return document.querySelector('input[name="rating"]') as HTMLInputElement;
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: /후기 등록하기/,
  }) as HTMLButtonElement;
}

describe("ReviewSubmitForm (browser)", () => {
  it("should sync the hidden rating input when a star button is clicked", () => {
    render(<ReviewSubmitForm />);
    expect(ratingInput().value).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "3점" }));
    expect(ratingInput().value).toBe("3");

    fireEvent.click(screen.getByRole("button", { name: "4.5점" }));
    expect(ratingInput().value).toBe("4.5");
  });

  it("should mark the clicked star as pressed", () => {
    render(<ReviewSubmitForm />);
    const star = screen.getByRole("button", { name: "4점" });
    expect(star.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(star);
    expect(star.getAttribute("aria-pressed")).toBe("true");
  });

  it("should disable submit until a rating is selected", () => {
    render(<ReviewSubmitForm />);
    expect(submitButton().disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "2점" }));
    expect(submitButton().disabled).toBe(false);
  });

  it("should render the success card after a successful submission", async () => {
    render(<ReviewSubmitForm />);

    fireEvent.click(screen.getByRole("button", { name: "5점" }));
    fireEvent.input(screen.getByLabelText(/후기 내용/), {
      target: { value: "정말 깨끗하게 청소해주셨어요" },
    });
    fireEvent.submit(submitButton().closest("form")!);

    expect(await screen.findByText(/후기가 등록되었습니다/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /후기 등록하기/ })).toBeNull();
  });
});
