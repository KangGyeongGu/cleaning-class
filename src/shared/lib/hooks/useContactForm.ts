"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitContactForm } from "@/shared/actions/contact";
import { track, currentPath } from "@/shared/lib/infra/track";

type InquiryType = "cleaning" | "moving";

interface UseContactFormParams {
  inquiryType: InquiryType;
  initialServiceType?: string;
  hasImages: boolean;
  addressValid: boolean;
  onReset: () => void;
}

export function useContactForm({
  inquiryType,
  initialServiceType = "",
  hasImages,
  addressValid,
  onReset,
}: UseContactFormParams) {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null,
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState(initialServiceType);
  const [message, setMessage] = useState("");
  const [addressResetKey, setAddressResetKey] = useState(0);
  const [isReset, setIsReset] = useState(false);

  const isSuccess = state?.success === true;
  const isFailure = state?.success === false;
  const showSuccess = isSuccess && !isReset;

  const hasTrackedLead = useRef(false);
  const hasTrackedError = useRef(false);

  const formValid = useMemo(
    () =>
      name.trim() !== "" &&
      phone.trim() !== "" &&
      serviceType !== "" &&
      addressValid &&
      message.trim().length >= 50,
    [name, phone, serviceType, addressValid, message],
  );

  useEffect(() => {
    if (isSuccess && !hasTrackedLead.current) {
      hasTrackedLead.current = true;
      track({
        event_type: "quote_form_success",
        event_payload: {
          inquiry_type: inquiryType,
          service_type: serviceType,
          has_images: hasImages,
        },
        path: currentPath(),
      });
    }
    if (!isSuccess) hasTrackedLead.current = false;
  }, [isSuccess, serviceType, hasImages, inquiryType]);

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
    if (!isFailure) hasTrackedError.current = false;
  }, [isFailure, state, inquiryType]);

  useEffect(() => {
    if (!isSuccess || isReset) return;
    const timer = setTimeout(() => {
      setName("");
      setPhone("");
      setServiceType("");
      setMessage("");
      setAddressResetKey((k) => k + 1);
      onReset();
      setIsReset(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, isReset, onReset]);

  function clearReset(): void {
    if (isReset) setIsReset(false);
  }

  function trackClick(): void {
    track({
      event_type: "quote_form_click",
      event_payload: { inquiry_type: inquiryType, service_type: serviceType },
      path: currentPath(),
    });
  }

  return {
    state,
    formAction,
    isPending,
    name,
    setName,
    phone,
    setPhone,
    serviceType,
    setServiceType,
    message,
    setMessage,
    addressResetKey,
    formValid,
    showSuccess,
    clearReset,
    trackClick,
  };
}
