export default function LoadingSpinner({ size = 'md', center = false }) {
  const sizes = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  }

  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-aura-border border-t-aura-primary`}
    />
  )

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        {spinner}
        <span className="text-xs text-aura-muted animate-pulse">Cargando…</span>
      </div>
    )
  }

  return spinner
}
