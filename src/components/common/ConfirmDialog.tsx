import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** When provided, caller manages dialog lifecycle (no auto-close on confirm) */
  loading?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const isAsync = loading !== undefined;
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => !loading && onOpenChange(false)} />

      <div className="relative bg-background rounded-lg border shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={!!loading}
            className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              if (!isAsync) onOpenChange(false);
            }}
            disabled={!!loading}
            className={`px-4 py-2 text-sm rounded-md text-white transition-colors disabled:opacity-50 ${
              destructive
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {loading ? t('common.loading') : (confirmLabel || t('common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  );
}
