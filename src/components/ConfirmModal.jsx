import { motion } from 'framer-motion'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const confirmClass =
    variant === 'danger'
      ? 'px-5 py-2.5 rounded-xl font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50'
      : 'btn-primary py-2.5'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={loading ? undefined : onCancel}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative card max-w-md w-full p-6"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" className="btn-secondary py-2.5" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
