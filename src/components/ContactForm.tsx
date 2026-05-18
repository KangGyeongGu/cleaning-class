"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Check, Loader2, X } from "lucide-react";
import { submitContactForm } from "@/shared/actions/contact";
import { trackGenerateLead, trackPhoneClick } from "@/shared/lib/analytics";
import { formatPhoneNumber } from "@/shared/lib/format";
import {
  CLEANING_INQUIRY_OPTIONS,
  MOVING_INQUIRY_OPTIONS,
} from "@/shared/lib/constants";

type InquiryType = "cleaning" | "moving";

interface CustomDropdownProps {
  label: string;
  name: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange?: (value: string) => void;
}

function CustomDropdown({
  label,
  name,
  options,
  placeholder,
  required,
  error,
  value,
  onChange,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option: string) => {
    setIsOpen(false);
    onChange?.(option);
  };

  return (
    <div className="group" ref={dropdownRef}>
      <label className="form-label-sm">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex min-h-9 w-full items-center justify-between border-b border-slate-200 bg-transparent py-2 text-left text-sm font-light transition-colors outline-none focus:border-slate-900"
        >
          <span className={value ? "text-slate-900" : "text-slate-400"}>
            {value || placeholder || "선택해주세요"}
          </span>
          <ArrowDown size={16} className="text-slate-400" />
        </button>
        {isOpen && (
          <div className="scrollbar-thin absolute z-10 mt-1 max-h-60 w-full overflow-y-auto border border-slate-200 bg-white shadow-lg">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-sm font-light transition-colors hover:bg-slate-50"
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <input type="hidden" name={name} value={value} />
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

interface ContactFormProps {
  phone?: string;
}

export function ContactForm({ phone }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null,
  );

  const [inquiryType, setInquiryType] = useState<InquiryType>("cleaning");

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const isSuccess = state?.success === true;
  const showSuccess = isSuccess && !isReset;

  const previewUrlsRef = useRef(previewUrls);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasTrackedLead = useRef(false);
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
    }
    if (!isSuccess) {
      hasTrackedLead.current = false;
    }
  }, [isSuccess, serviceType, inquiryType]);

  useEffect(() => {
    if (!isSuccess || isReset) return;

    const timer = setTimeout(() => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      setImages([]);
      setPreviewUrls([]);
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
  }, [isSuccess, isReset]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = [...images, ...files];

    if (newImages.length > 15) {
      alert("이미지는 최대 15장까지 첨부 가능합니다.");
      return;
    }

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages(newImages);
    setPreviewUrls((prev) => [...prev, ...newUrls]);

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      newImages.forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleImageRemove = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);

    const newImages = images.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newUrls);

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      newImages.forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
    }
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
                options={[
                  "전주시 완산구",
                  "전주시 덕진구",
                  "군산시",
                  "익산시",
                  "정읍시",
                  "남원시",
                  "김제시",
                  "완주군",
                  "진안군",
                  "무주군",
                  "장수군",
                  "임실군",
                  "순창군",
                  "고창군",
                  "부안군",
                ]}
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

function ArrowDown({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
