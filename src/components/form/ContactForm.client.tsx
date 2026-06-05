"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { submitContactForm } from "@/shared/actions/contact";
import { track, currentPath } from "@/shared/lib/infra/track";
import { formatPhoneNumber } from "@/shared/lib/pure/format";
import {
  CLEANING_INQUIRY_OPTIONS,
  CLEANING_REGIONS,
  MOVING_INQUIRY_OPTIONS,
} from "@/shared/lib/pure/constants";
import { CustomDropdown } from "@/components/form/CustomDropdown.client";
import { ContactImageGallery } from "@/components/form/ContactImageGallery.client";
import { useInViewport } from "@/shared/lib/hooks/useInViewport";
import { useImageUpload } from "@/shared/lib/hooks/useImageUpload";

type InquiryType = "cleaning" | "moving";

interface ContactFormProps {
  phone?: string;
}

export function ContactForm({ phone }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null,
  );

  const [inquiryType, setInquiryType] = useState<InquiryType>("cleaning");

  const {
    images,
    previewUrls,
    addFiles,
    removeAt,
    clear: clearImages,
  } = useImageUpload(15);
  const [messageLength, setMessageLength] = useState<number>(0);
  const [formValid, setFormValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const departureRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const [serviceType, setServiceType] = useState("");
  const [region, setRegion] = useState("");
  const [isReset, setIsReset] = useState(false);
  const { ref: sectionRef, isVisible } = useInViewport();

  const isSuccess = state?.success === true;
  const showSuccess = isSuccess && !isReset;

  const hasTrackedLead = useRef(false);
  const hasTrackedError = useRef(false);

  useEffect(() => {
    if (isSuccess && !hasTrackedLead.current) {
      hasTrackedLead.current = true;
      track({
        event_type: "quote_form_success",
        event_payload: {
          inquiry_type: inquiryType,
          service_type: serviceType,
          has_images: images.length > 0,
        },
        path: currentPath(),
      });
    }
    if (!isSuccess) {
      hasTrackedLead.current = false;
    }
  }, [isSuccess, serviceType, inquiryType, images.length]);

  const isFailure = state?.success === false;
  useEffect(() => {
    if (isFailure && !hasTrackedError.current) {
      hasTrackedError.current = true;
      const errorKind = state?.errors
        ? "validation"
        : state?.error?.includes("이미지")
          ? "upload_fail"
          : state?.error?.includes("이메일") ||
              state?.error?.includes("발송") ||
              state?.error?.includes("SMTP")
            ? "mail_fail"
            : "unknown";
      track({
        event_type: "quote_form_error",
        event_payload: { inquiry_type: inquiryType, error_kind: errorKind },
        path: currentPath(),
      });
    }
    if (!isFailure) {
      hasTrackedError.current = false;
    }
  }, [isFailure, inquiryType, state]);

  useEffect(() => {
    if (!isSuccess || isReset) return;

    const timer = setTimeout(() => {
      clearImages();
      setMessageLength(0);
      setFormValid(false);
      setServiceType("");
      setRegion("");
      setIsReset(true);

      if (nameRef.current) nameRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      if (messageRef.current) messageRef.current.value = "";
      if (departureRef.current) departureRef.current.value = "";
      if (destinationRef.current) destinationRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSuccess, isReset, clearImages]);

  const checkFormValidity = () => {
    const name = nameRef.current?.value.trim() ?? "";
    const phoneValue = phoneRef.current?.value.trim() ?? "";
    const message = messageRef.current?.value.trim() ?? "";

    if (isReset) setIsReset(false);

    const baseValid =
      name !== "" && phoneValue !== "" && serviceType !== "" && message !== "";

    if (inquiryType === "cleaning") {
      setFormValid(baseValid && region !== "");
    } else {
      setFormValid(baseValid);
    }
  };

  const handleInquiryTypeChange = (type: InquiryType) => {
    setInquiryType(type);
    setServiceType("");
    setRegion("");
    if (departureRef.current) departureRef.current.value = "";
    if (destinationRef.current) destinationRef.current.value = "";

    setTimeout(() => {
      const name = nameRef.current?.value.trim() ?? "";
      const phoneValue = phoneRef.current?.value.trim() ?? "";
      const message = messageRef.current?.value.trim() ?? "";
      const baseValid = name !== "" && phoneValue !== "" && message !== "";
      setFormValid(baseValid && false);
    }, 0);
  };

  function syncFileInputDataTransfer(files: File[]): void {
    if (!fileInputRef.current) return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    fileInputRef.current.files = dt.files;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (images.length + incoming.length > 15) {
      alert("이미지는 최대 15장까지 첨부 가능합니다.");
      return;
    }
    addFiles(incoming);
    syncFileInputDataTransfer([...images, ...incoming]);
  };

  const handleImageRemove = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    removeAt(index);
    syncFileInputDataTransfer(next);
  };

  const serviceOptions =
    inquiryType === "cleaning"
      ? CLEANING_INQUIRY_OPTIONS
      : MOVING_INQUIRY_OPTIONS;

  return (
    <section ref={sectionRef} id="contact" className="bg-white">
      <div className="container mx-auto max-w-lg px-4 md:px-8 lg:px-12">
        <div
          className={`mb-8 text-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2 className="text-heading-1 mb-3">CONTACT</h2>
          {phone && (
            <p className="mt-3 text-sm text-slate-600">
              유선상담{" "}
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center px-1 font-bold text-slate-900 hover:underline"
                onClick={() =>
                  track({
                    event_type: "phone_click",
                    event_payload: {
                      phone_type: "cleaning",
                      click_location: "contact_form",
                    },
                    path: currentPath(),
                  })
                }
              >
                {phone}
              </a>
            </p>
          )}
        </div>

        <form
          action={formAction}
          className={`space-y-6 transition-all delay-200 duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleInquiryTypeChange("cleaning")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                inquiryType === "cleaning"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              청소의뢰
            </button>
            <button
              type="button"
              onClick={() => handleInquiryTypeChange("moving")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                inquiryType === "moving"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              이사의뢰
            </button>
          </div>

          <input type="hidden" name="inquiryType" value={inquiryType} />

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="group">
                <label htmlFor="name" className="form-label-sm">
                  성함
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="이름을 입력하세요"
                  onInput={checkFormValidity}
                />
                {state?.errors?.name && (
                  <p className="form-error">{state.errors.name[0]}</p>
                )}
              </div>
              <div className="group">
                <label htmlFor="phone" className="form-label-sm">
                  연락처
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  ref={phoneRef}
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  onInput={(e) => {
                    const input = e.currentTarget;
                    input.value = formatPhoneNumber(input.value);
                    checkFormValidity();
                  }}
                  className="form-input"
                  placeholder="010-0000-0000"
                />
                {state?.errors?.phone && (
                  <p className="form-error">{state.errors.phone[0]}</p>
                )}
              </div>
            </div>

            <CustomDropdown
              label="서비스 종류"
              name="serviceType"
              options={serviceOptions}
              placeholder="서비스를 선택해주세요"
              required
              error={state?.errors?.serviceType?.[0]}
              value={serviceType}
              onChange={(value) => {
                setServiceType(value);
                setTimeout(checkFormValidity, 0);
              }}
            />

            {inquiryType === "cleaning" && (
              <CustomDropdown
                label="지역"
                name="region"
                options={CLEANING_REGIONS}
                placeholder="지역을 선택해주세요"
                required
                error={state?.errors?.region?.[0]}
                value={region}
                onChange={(value) => {
                  setRegion(value);
                  setTimeout(checkFormValidity, 0);
                }}
              />
            )}

            {inquiryType === "moving" && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="group">
                  <label htmlFor="departure" className="form-label-sm">
                    출발지
                  </label>
                  <input
                    ref={departureRef}
                    id="departure"
                    name="departure"
                    type="text"
                    className="form-input"
                    placeholder="출발지"
                    onInput={checkFormValidity}
                  />
                  {state?.errors?.departure && (
                    <p className="form-error">{state.errors.departure[0]}</p>
                  )}
                </div>
                <div className="group">
                  <label htmlFor="destination" className="form-label-sm">
                    도착지
                  </label>
                  <input
                    ref={destinationRef}
                    id="destination"
                    name="destination"
                    type="text"
                    className="form-input"
                    placeholder="도착지"
                    onInput={checkFormValidity}
                  />
                  {state?.errors?.destination && (
                    <p className="form-error">{state.errors.destination[0]}</p>
                  )}
                </div>
              </div>
            )}

            <div className="group">
              <label htmlFor="message" className="form-label-sm">
                문의사항
                <span className="ml-1 text-red-500">*</span>
              </label>
              <textarea
                ref={messageRef}
                id="message"
                name="message"
                rows={3}
                maxLength={1000}
                required
                className="scrollbar-thin form-input resize-none overflow-y-auto"
                placeholder="문의 내용을 자유롭게 작성해주세요"
                onInput={(e) => {
                  setMessageLength(e.currentTarget.value.length);
                  checkFormValidity();
                }}
              ></textarea>
              <div className="mt-1 flex justify-between">
                <div>
                  {state?.errors?.message && (
                    <p className="form-error">{state.errors.message[0]}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {messageLength}/1000
                </span>
              </div>

              <ContactImageGallery
                fileInputRef={fileInputRef}
                images={images}
                previewUrls={previewUrls}
                onAdd={handleImageChange}
                onRemoveAt={handleImageRemove}
              />
            </div>
          </div>

          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={isPending || !formValid}
              className="btn-primary px-10 py-3"
              onClick={() => {
                track({
                  event_type: "quote_form_click",
                  event_payload: {
                    inquiry_type: inquiryType,
                    service_type: serviceType,
                  },
                  path: currentPath(),
                });
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 문의 중...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> 전송 완료
                </span>
              ) : (
                "문의하기"
              )}
            </button>
            {showSuccess && state?.message && (
              <p className="form-success mt-4">{state.message}</p>
            )}
            {state?.error && <p className="form-error mt-4">{state.error}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
