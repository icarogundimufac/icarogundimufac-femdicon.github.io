'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Feature, GeoJsonObject } from 'geojson'
import L, { type Layer, type LeafletMouseEvent, type PathOptions } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import { queryKeys, portalDataClient } from '@/lib/data/client'
import { generateColorScale } from '@/lib/utils/color-scale'
import { MapLegend } from './MapLegend'

export interface AcreMapProps {
  dataByMunicipio?: Record<string, number>
  unit?: string
  label?: string
  colorScale?: 'verde' | 'estrela' | 'heat'
  height?: number
}

const COLOR_PALETTES: Record<string, string[]> = {
  verde: ['#d6f3e1', '#7bd09e', '#229157', '#0f5b36', '#072d1c'],
  estrela: ['#fde8e8', '#f5a0a0', '#e74c3c', '#c0392b', '#7b1f1a'],
  heat: ['#fffde7', '#fff176', '#ffd600', '#f57f17', '#e65100'],
}

const SATELLITE_TILE_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const SATELLITE_ATTRIBUTION =
  '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'

const ACRE_CENTER: [number, number] = [-9.0238, -70.812]

interface HoverState {
  x: number
  y: number
  name: string
  value: string
}

function getGeoJsonBounds(geoJson: GeoJsonObject | undefined) {
  if (!geoJson) return null

  const bounds = L.geoJSON(geoJson).getBounds()
  return bounds.isValid() ? bounds : null
}

function fitMapToAcreBounds(map: L.Map, bounds: L.LatLngBounds, animate: boolean) {
  window.requestAnimationFrame(() => {
    map.invalidateSize(false)
    map.fitBounds(bounds, {
      animate,
      paddingTopLeft: [24, 24],
      paddingBottomRight: [24, 24],
    })
  })
}

function getMunicipioName(feature: Feature | undefined) {
  return (
    (feature?.properties?.NM_MUN as string | undefined) ??
    (feature?.properties?.name as string | undefined) ??
    (feature?.properties?.NOME as string | undefined) ??
    'Município'
  )
}

function getMunicipioSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

function FitToGeoJson({ geoJson }: { geoJson: GeoJsonObject | undefined }) {
  const map = useMap()

  useEffect(() => {
    const bounds = getGeoJsonBounds(geoJson)

    if (!bounds) return

    fitMapToAcreBounds(map, bounds.pad(0.03), false)
  }, [geoJson, map])

  return null
}

function BindMapInstance({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()

  useEffect(() => {
    onReady(map)
  }, [map, onReady])

  return null
}

function SyncMapLayout({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap()

  useEffect(() => {
    if (!bounds) return

    const paddedBounds = bounds.pad(0.03)
    const realignMap = () => fitMapToAcreBounds(map, paddedBounds, false)

    realignMap()

    const delayedRealignId = window.setTimeout(realignMap, 180)
    const settleRealignId = window.setTimeout(realignMap, 420)

    const handleWindowResize = () => {
      map.invalidateSize(false)
      realignMap()
    }

    window.addEventListener('resize', handleWindowResize)

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return

        const { width, height } = entry.contentRect
        if (width <= 0 || height <= 0) return

        map.invalidateSize(false)
        realignMap()
      })

      resizeObserver.observe(map.getContainer())
    }

    return () => {
      window.clearTimeout(delayedRealignId)
      window.clearTimeout(settleRealignId)
      window.removeEventListener('resize', handleWindowResize)
      resizeObserver?.disconnect()
    }
  }, [bounds, map])

  return null
}

export function AcreMap({
  dataByMunicipio = {},
  unit = '',
  label = 'Indicador',
  colorScale = 'verde',
  height = 480,
}: AcreMapProps) {
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const { data: geoJson, isLoading, isError } = useQuery({
    queryKey: queryKeys.acreGeoJson,
    queryFn: portalDataClient.getAcreGeoJson,
  })

  const values = useMemo(
    () => Object.values(dataByMunicipio).filter((value) => value !== undefined && value !== null),
    [dataByMunicipio],
  )
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const colors = COLOR_PALETTES[colorScale]
  const colorFn = useMemo(
    () => generateColorScale(values, colors),
    [colors, values],
  )
  const geoJsonBounds = useMemo(
    () => getGeoJsonBounds(geoJson as GeoJsonObject | undefined),
    [geoJson],
  )

  const styleFeature = (feature?: Feature): PathOptions => {
    const name = getMunicipioName(feature)
    const slug = getMunicipioSlug(name)
    const value = dataByMunicipio[slug]

    return {
      fillColor: value !== undefined ? colorFn(value) : '#dbd5c9',
      fillOpacity: 1,
      color: '#f8f3e8',
      weight: 1,
      opacity: 0.95,
    }
  }

  const updateHover = (event: LeafletMouseEvent, feature?: Feature) => {
    const name = getMunicipioName(feature)
    const slug = getMunicipioSlug(name)
    const value = dataByMunicipio[slug]

    setHovered({
      x: event.containerPoint.x,
      y: event.containerPoint.y,
      name,
      value:
        value !== undefined
          ? `${value.toLocaleString('pt-BR')} ${unit}`.trim()
          : 'Sem dado',
    })
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-areia-200 shadow-sm bg-white"
      style={{ height }}
    >
      {!isError && (
        <MapContainer
          center={ACRE_CENTER}
          zoom={7}
          minZoom={6}
          maxZoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
          zoomControl={false}
        >
          <BindMapInstance onReady={setMapInstance} />
          <TileLayer
            url={SATELLITE_TILE_URL}
            attribution={SATELLITE_ATTRIBUTION}
            maxZoom={18}
          />
          <SyncMapLayout bounds={geoJsonBounds} />
          {geoJson && (
            <>
              <FitToGeoJson geoJson={geoJson as GeoJsonObject} />
              <GeoJSON
                ref={geoJsonLayerRef}
                data={geoJson as GeoJsonObject}
                style={(feature) => styleFeature(feature as Feature | undefined)}
                onEachFeature={(feature, layer) => {
                  layer.on({
                    mouseover: (event) => {
                      const target = event.target as L.Path
                      target.setStyle({
                        ...styleFeature(feature as Feature),
                        color: '#F2C230',
                        weight: 2,
                        fillOpacity: 1,
                      })

                      if ('bringToFront' in target) {
                        target.bringToFront()
                      }

                      updateHover(event, feature as Feature)
                    },
                    mousemove: (event) => updateHover(event, feature as Feature),
                    mouseout: (event) => {
                      geoJsonLayerRef.current?.resetStyle(event.target as Layer)
                      setHovered(null)
                    },
                  })
                }}
              />
            </>
          )}
        </MapContainer>
      )}

      {!isLoading && !isError && (
        <div className="absolute top-4 right-4 z-[500]">
          <span className="rounded-full border border-black/10 bg-white/92 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-areia-600 shadow-sm backdrop-blur-sm font-jakarta">
            Satelite: Esri
          </span>
        </div>
      )}

      {!isLoading && !isError && geoJsonBounds && mapInstance && (
        <div className="absolute top-4 left-4 z-[500]">
          <button
            type="button"
            onClick={() =>
              fitMapToAcreBounds(mapInstance, geoJsonBounds.pad(0.03), true)
            }
            aria-label="Recentrar mapa"
            title="Recentrar mapa"
            className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white h-10 w-10 text-verde-900 shadow-md transition hover:bg-areia-50 font-jakarta"
          >
            <span className="text-lg leading-none">⌂</span>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-areia-100/80 z-10">
          <div className="text-center">
            <div className="text-3xl mb-2 opacity-40">🗺️</div>
            <p className="text-sm text-areia-500 font-jakarta">Carregando mapa...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-areia-100/80 z-10">
          <div className="text-center max-w-xs">
            <div className="text-3xl mb-2 opacity-40">🗺️</div>
            <p className="text-sm font-semibold text-areia-600 font-fraunces mb-1">
              GeoJSON não carregado
            </p>
            <p className="text-xs text-areia-400 font-jakarta">
              Verifique o arquivo{' '}
              <code className="bg-areia-200 rounded px-1">
                public/shapefiles/acre-municipios.geojson
              </code>
              .
            </p>
          </div>
        </div>
      )}

      {hovered && (
        <div
          className="absolute pointer-events-none bg-verde-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs font-jakarta z-[550]"
          style={{
            left: hovered.x + 12,
            top: hovered.y + 12,
          }}
        >
          <p className="font-semibold text-areia-200 mb-0.5">{hovered.name}</p>
          <p className="text-white">
            {label}: {hovered.value}
          </p>
        </div>
      )}

      {values.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[500]">
          <MapLegend
            min={min}
            max={max}
            unit={unit}
            label={label}
            colors={colors}
          />
        </div>
      )}
    </div>
  )
}
