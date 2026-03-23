interface EmptyStateProps {
  title?: string
  description?: string
  icon?: string
}

export function EmptyState({
  title = 'Sem dados disponíveis',
  description = 'Os dados para esta seção ainda não foram carregados.',
  icon = '📊',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <span className="text-5xl mb-4 opacity-40">{icon}</span>
      <h3 className="text-base font-semibold text-areia-600 font-fraunces mb-1">{title}</h3>
      <p className="text-sm text-areia-400 font-jakarta max-w-sm">{description}</p>
    </div>
  )
}
