import { CloseIcon } from "@/icons";
import { useEffect, useState, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  closeLabel?: string;
}

const EXIT_DURATION_MS = 200;

export const Modal = ({ isOpen, onClose, children, className = "", showCloseButton = true, isFullscreen = false, closeLabel = "Close" }: ModalProps) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    let frameId: number | undefined;
    let timeoutId: number | undefined;

    if (isOpen) {
      setIsRendered(true);
      frameId = requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeoutId = window.setTimeout(() => setIsRendered(false), EXIT_DURATION_MS);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isRendered) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isRendered]);

  if (!isRendered) return null;

  const contentClasses = isFullscreen ? "h-full w-full" : "relative w-full rounded-3xl bg-white dark:bg-gray-900";

  return <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4 sm:p-6" role="dialog" aria-modal="true">
    {!isFullscreen && <button type="button" tabIndex={-1} aria-label={closeLabel} onClick={onClose} className={`fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`} />}
    <div className={`${contentClasses} ${className} relative z-1 transition-[opacity,transform] duration-200 ease-out ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"}`} onClick={(event) => event.stopPropagation()}>
      {showCloseButton && <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute end-3 top-3 z-999 flex size-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:end-6 sm:top-6 sm:size-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"><CloseIcon className="size-5" /></button>}
      {children}
    </div>
  </div>;
};
