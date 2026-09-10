interface ConfirmDeleteButtonProps {
    idleLabel: string;
    confirmLabel?: string;
    deletingLabel?: string;
    confirming: boolean;
    deleting: boolean;
    disabled?: boolean;
    onClick: () => void;
    /** Size/padding classes (e.g. "px-5 py-[9px]"). State colors live here. */
    className?: string;
}

/** How long the armed "Confirm delete" state lasts. Must match the
 *  `confirm-countdown` ring animation duration in globals.css. */
export const CONFIRM_DELETE_TIMEOUT_MS = 3000;

const IDLE_CLASS =
    "cursor-pointer rounded-lg border border-red-300 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30";

const CONFIRM_CLASS =
    "cursor-pointer rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600";

export default function ConfirmDeleteButton({
    idleLabel,
    confirmLabel = "Confirm delete",
    deletingLabel = "Deleting...",
    confirming,
    deleting,
    disabled = false,
    onClick,
    className = "",
}: ConfirmDeleteButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={deleting ? deletingLabel : confirming ? confirmLabel : idleLabel}
            className={`relative ${confirming ? CONFIRM_CLASS : IDLE_CLASS} ${className}`}
        >
            {confirming && !deleting && (
                <span aria-hidden="true" data-testid="confirm-countdown" className="countdown-border" />
            )}
            {deleting ? deletingLabel : confirming ? confirmLabel : idleLabel}
        </button>
    );
}
