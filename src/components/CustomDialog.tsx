import { useEffect, useRef } from "react";

type DialogVariant = "confirm" | "prompt";

interface CustomDialogProps {
  open: boolean;
  variant: DialogVariant;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  value?: string;
  valueMaxLength?: number;
  valuePlaceholder?: string;
  onValueChange?: (value: string) => void;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CustomDialog({
  open,
  variant,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  value = "",
  valueMaxLength = 60,
  valuePlaceholder = "",
  onValueChange,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: CustomDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (variant !== "prompt") return;
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);

    return () => window.clearTimeout(timeoutId);
  }, [open, variant]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const composingEvent = event as KeyboardEvent & { isComposing?: boolean };
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
      if (event.key === "Enter" && !event.shiftKey && !composingEvent.isComposing) {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-[#757575] break-words">
            {description}
          </p>
        )}

        {variant === "prompt" && (
          <div className="mt-3 space-y-1">
            <input
              ref={inputRef}
              value={value}
              maxLength={valueMaxLength}
              onChange={(event) => onValueChange?.(event.target.value)}
              placeholder={valuePlaceholder}
              className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-[#BDBDBD] focus:border-gray-900 focus:outline-none"
            />
            <p className="text-right text-[11px] text-[#BDBDBD]">
              {value.length}/{valueMaxLength}
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-[#F5F5F5]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#9E9E9E]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
