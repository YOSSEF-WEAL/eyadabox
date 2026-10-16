import { Modal } from "@/components/ui/modal";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const CONFIRM_PHRASE = "DELETE";

interface DangerConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  sentence: string;
  confirmAction: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DangerConfirmDialog({ isOpen, title, description, sentence, confirmAction, busy = false, error, onCancel, onConfirm }: DangerConfirmDialogProps) {
  const { t } = useTranslation();
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    if (!isOpen) setPhrase("");
  }, [isOpen]);

  if (!isOpen) return null;

  const ready = phrase === CONFIRM_PHRASE && !busy;

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => undefined : onCancel} showCloseButton={!busy} className="max-w-lg" closeLabel={t("clinic.danger.close")}>
      <div className="p-6 sm:p-7">
        <p className="text-theme-xs font-semibold uppercase tracking-wide text-error-600 dark:text-error-400">{t("clinic.danger.confirmTitle")}</p>
        <h3 className="mt-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">{description}</p>

        <div className="mt-5 rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
          <p className="text-theme-sm text-error-700 dark:text-error-300">{sentence}</p>
          <label className="mt-3 block">
            <span className="sr-only">{t("clinic.danger.confirmPlaceholder")}</span>
            <input
              autoFocus
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              placeholder={t("clinic.danger.confirmPlaceholder")}
              dir="ltr"
              disabled={busy}
              className="h-11 w-full rounded-lg border border-error-200 bg-white px-4 text-theme-sm text-gray-800 shadow-theme-xs outline-none transition focus:border-error-400 focus:ring-2 focus:ring-error-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500/40 dark:bg-gray-900 dark:text-white/90"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2.5 text-theme-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.danger.cancel")}</button>
          <button type="button" onClick={onConfirm} disabled={!ready} className="rounded-lg bg-error-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50">{busy ? t("clinic.danger.working") : confirmAction}</button>
        </div>
      </div>
    </Modal>
  );
}
