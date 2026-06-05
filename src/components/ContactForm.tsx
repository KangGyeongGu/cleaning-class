"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Check, Loader2, X } from "lucide-react";
import { submitContactForm } from "@/shared/actions/contact";
import { trackGenerateLead, trackPhoneClick } from "@/shared/lib/analytics";
import { track } from "@/shared/lib/track";
import { formatPhoneNumber } from "@/shared/lib/format";
import {
  CLEANING_INQUIRY_OPTIONS,
  CLEANING_REGIONS,
  MOVING_INQUIRY_OPTIONS,
} from "@/shared/lib/constants";
import { CustomDropdown } from "@/components/CustomDropdown.client";
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
      trackGenerateLead({
        currency: "KRW",
        value: 0,
        lead_source: "quote_form",
        service_type: serviceType,
        inquiry_type: inquiryType,
      });
      track({
        event_type: "quote_form_success",
        event_payload: {
          inquiry_type: inquiryType,
          service_type: serviceType,
          has_images: images.length > 0,
        },
        path:
          typeof window !== "undefined" ? window.location.pathname : "/contact",
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
        path:
          typeof window !== "undefined" ? window.location.pathname : "/contact",
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
                  trackPhoneClick({
                    currency: "KRW",
                    value: 0,
                    lead_source: "phone_click",
                    phone_type: "cleaning",
                    click_location: "contact_form",
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

              <div className="mt-4">
                <div className="flex items-center gap-4">
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {images.map((file, index) => (
                        <div
                          key={`${file.name}-${file.lastModified}-${index}`}
                          className="group/image relative h-20 w-20"
                        >
                          <Image
                            src={previewUrls[index]}
                            alt={`첨부 이미지 ${index + 1}`}
                            fill
                            unoptimized
                            sizes="80px"
                            className="border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageRemove(index)}
                            aria-label="이미지 삭제"
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 transition-opacity md:opacity-0 md:group-hover/image:opacity-100"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="group/add flex shrink-0 cursor-pointer items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border border-slate-200 text-slate-400 transition-colors group-hover/add:border-slate-900 group-hover/add:text-slate-900">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs text-slate-400 transition-colors group-hover/add:text-slate-600">
                      이미지 첨부 (선택, {images.length}/15)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="images"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
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
                  path:
                    typeof window !== "undefined"
                      ? window.location.pathname
                      : "/contact",
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
