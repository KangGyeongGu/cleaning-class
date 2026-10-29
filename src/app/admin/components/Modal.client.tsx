"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
  bodyClassName?: string;
  closeDisabled?: boolean;
  headerDivider?: boolean;
  fixedHeight?: boolean;
  onEscape?: () => void;
  headerActions?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  bodyClassName = "overflow-y-auto px-6 py-6",
  closeDisabled = false,
  headerDivider = true,
  fixedHeight = false,
  onEscape,
  headerActions,
}: ModalProps): React.ReactElement {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!isOpen && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (!closeDisabled && e.target === dialogRef.current) onClose();
  }

  const widthClass =
    size === "xl"
      ? "w-[min(calc(100vw-2rem),72rem)]"
      : size === "lg"
        ? "w-[min(100vw,48rem)]"
        : "w-[min(100vw,36rem)]";

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (closeDisabled || onEscape) event.preventDefault();
        if (!closeDisabled) onEscape?.();
      }}
      onClose={onClose}
      onClick={handleDialogClick}
      className={`${widthClass} ${fixedHeight ? "h-[min(50rem,90dvh)]" : "max-h-[90vh]"} m-auto overflow-hidden border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/50 open:flex open:flex-col`}
    >
      <header
        className={`flex shrink-0 justify-between gap-4 px-6 py-5 ${headerActions ? "items-center" : "items-start"} ${headerDivider ? "border-b border-slate-100" : ""}`}
      >
        <div>
          <h2 id={titleId} className="text-heading-3">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs font-light text-slate-500">
              {description}
            </p>
          )}
        </div>
        {headerActions ?? (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            disabled={closeDisabled}
            className="-mt-1 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>
      <div className={bodyClassName}>{children}</div>
    </dialog>
  );
}
