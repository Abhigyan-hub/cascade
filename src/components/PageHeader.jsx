export default function PageHeader({ title, subtitle, actions, compact = false }) {
  return (
    <div className="sticky-page-header">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`font-bold text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>{title}</h1>
          {subtitle ? <p className="text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  )
}
