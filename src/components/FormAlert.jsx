import { AlertCircle, CheckCircle } from 'lucide-react'

export default function FormAlert({ type = 'error', title, children }) {
  const isError = type === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border px-4 py-3 ${
        isError
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        {title && <p className="font-medium text-sm">{title}</p>}
        {children && <div className="text-sm mt-0.5 opacity-90">{children}</div>}
      </div>
    </div>
  )
}
