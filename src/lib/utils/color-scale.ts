import chroma from 'chroma-js'

const DEFAULT_COLORS = ['#d6f3e1', '#229157', '#072d1c']

export function generateColorScale(
  values: number[],
  colors: string[] = DEFAULT_COLORS,
): (value: number) => string {
  if (values.length === 0) return () => colors[0]

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) return () => colors[Math.floor(colors.length / 2)]

  const scale = chroma.scale(colors).domain([min, max])

  return (value: number) => scale(value).hex()
}

export function generateClassBreaks(
  values: number[],
  numClasses = 5,
  colors: string[] = DEFAULT_COLORS,
): Array<{ min: number; max: number; color: string; label: string }> {
  if (values.length === 0) return []

  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const step = (max - min) / numClasses

  const scale = chroma.scale(colors).colors(numClasses)

  return Array.from({ length: numClasses }, (_, i) => {
    const breakMin = min + i * step
    const breakMax = i === numClasses - 1 ? max : min + (i + 1) * step
    return {
      min: breakMin,
      max: breakMax,
      color: scale[i],
      label: `${breakMin.toFixed(1)} – ${breakMax.toFixed(1)}`,
    }
  })
}
