export const INDICATOR_SECTION_IDS = [
  'educacao',
  'saude',
  'seguranca',
  'orcamento',
] as const

export type IndicatorSectionId = (typeof INDICATOR_SECTION_IDS)[number]

export interface IndicatorSectionPageMeta {
  id: IndicatorSectionId
  title: string
  subtitle: string
  badge: string
  missingDataPath: string
}

export const INDICATOR_SECTION_META: Record<
  IndicatorSectionId,
  IndicatorSectionPageMeta
> = {
  educacao: {
    id: 'educacao',
    title: 'Educação',
    subtitle: 'Indicadores educacionais do Estado do Acre',
    badge: 'Educação',
    missingDataPath: 'data/educacao.json',
  },
  saude: {
    id: 'saude',
    title: 'Saúde',
    subtitle: 'Indicadores de saúde pública do Estado do Acre',
    badge: 'Saúde',
    missingDataPath: 'data/saude.json',
  },
  seguranca: {
    id: 'seguranca',
    title: 'Segurança',
    subtitle: 'Indicadores de segurança pública do Estado do Acre',
    badge: 'Segurança',
    missingDataPath: 'data/seguranca.json',
  },
  orcamento: {
    id: 'orcamento',
    title: 'Orçamento',
    subtitle: 'Execução orçamentária e financeira do Estado do Acre',
    badge: 'Orçamento',
    missingDataPath: 'data/orcamento.json',
  },
}

export function isIndicatorSectionId(
  value: string,
): value is IndicatorSectionId {
  return value in INDICATOR_SECTION_META
}
