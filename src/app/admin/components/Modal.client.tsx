"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps): React.ReactElement {
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
    if (e.target === dialogRef.current) onClose();
  }

  const widthClass =
    size === "lg" ? "w-[min(100vw,48rem)]" : "w-[min(100vw,36rem)]";

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleDialogClick}
      className={`${widthClass} m-auto max-h-[90vh] overflow-hidden border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/50 open:flex open:flex-col`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-heading-3">{title}</h2>
          {description && (
            <p className="mt-1 text-xs font-light text-slate-500">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mt-1 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="overflow-y-auto px-6 py-6">{children}</div>
    </dialog>
  );
}
