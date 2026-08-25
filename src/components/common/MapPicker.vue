<template>
  <div class="space-y-2">
    <div ref="mapEl" class="h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100" />
    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <span>{{ statusText }}</span>
      <div v-if="!disabled" class="flex items-center gap-2">
        <button
          v-if="canSearchAddress"
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          :disabled="resolving"
          @click="geocodeAddress"
        >
          Manzil bo'yicha topish
        </button>
        <button
          v-if="modelValue"
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="clear"
        >
          Tozalash
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPoint {
  lat: number
  lng: number
}

export interface MapAddress {
  addressLine: string
  city: string
}

const props = withDefaults(defineProps<{
  modelValue: MapPoint | null
  addressLine?: string | null
  city?: string | null
  disabled?: boolean
  autoResolveAddress?: boolean
}>(), {
  disabled: false,
  autoResolveAddress: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: MapPoint | null]
  'address-selected': [value: MapAddress]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const resolving = ref(false)
const geocodeMessage = ref('')
let map: L.Map | null = null
let marker: L.Marker | null = null
let geocodeTimer: ReturnType<typeof setTimeout> | null = null
let skipNextAddressSearch = false

const DEFAULT_CENTER: L.LatLngExpression = [41.311081, 69.240562]
const DEFAULT_ZOOM = 12
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

const canSearchAddress = computed(() => Boolean(addressQuery.value) && !resolving.value)
const addressQuery = computed(() =>
  [props.addressLine, props.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
)
const statusText = computed(() => {
  if (geocodeMessage.value) return geocodeMessage.value
  return props.modelValue
    ? `${props.modelValue.lat.toFixed(6)}, ${props.modelValue.lng.toFixed(6)}`
    : 'Lokatsiya belgilanmagan'
})

function setMarker(point: MapPoint | null) {
  if (!map) return
  if (!point) {
    marker?.remove()
    marker = null
    return
  }
  if (!marker) {
    marker = L.marker([point.lat, point.lng], { draggable: !props.disabled }).addTo(map)
    marker.on('dragend', async () => {
      const position = marker!.getLatLng()
      await selectPoint({ lat: position.lat, lng: position.lng }, true)
    })
  } else {
    marker.setLatLng([point.lat, point.lng])
    marker.dragging?.[props.disabled ? 'disable' : 'enable']()
  }
}

function clear() {
  geocodeMessage.value = ''
  emit('update:modelValue', null)
}

async function selectPoint(point: MapPoint, resolveAddress: boolean) {
  emit('update:modelValue', point)
  if (resolveAddress) {
    await reverseGeocode(point)
  }
}

function pickCity(address: Record<string, string | undefined>) {
  return address.city || address.town || address.village || address.district || address.county || address.state || ''
}

function pickAddressLine(address: Record<string, string | undefined>, displayName: string) {
  const street = [address.road, address.house_number].filter(Boolean).join(', ')
  return street || address.neighbourhood || address.suburb || address.quarter || displayName.split(',').slice(0, 2).join(', ')
}

async function reverseGeocode(point: MapPoint) {
  resolving.value = true
  geocodeMessage.value = 'Manzil aniqlanmoqda...'
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(point.lat),
      lon: String(point.lng),
      addressdetails: '1',
      'accept-language': 'uz,ru,en',
    })
    const response = await fetch(`${NOMINATIM_URL}/reverse?${params}`)
    if (!response.ok) throw new Error('Reverse geocoding failed')
    const data = await response.json()
    const address = (data.address ?? {}) as Record<string, string | undefined>
    const addressLine = pickAddressLine(address, data.display_name ?? '')
    const city = pickCity(address)
    skipNextAddressSearch = true
    emit('address-selected', { addressLine, city })
    geocodeMessage.value = 'Manzil xaritadan olindi'
  } catch {
    geocodeMessage.value = 'Manzilni aniqlab bo\'lmadi'
  } finally {
    resolving.value = false
  }
}

async function geocodeAddress() {
  if (!addressQuery.value || props.disabled) return
  resolving.value = true
  geocodeMessage.value = 'Manzil xaritada qidirilmoqda...'
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: addressQuery.value,
      limit: '1',
      addressdetails: '1',
      'accept-language': 'uz,ru,en',
    })
    const response = await fetch(`${NOMINATIM_URL}/search?${params}`)
    if (!response.ok) throw new Error('Geocoding failed')
    const [result] = await response.json()
    if (!result) {
      geocodeMessage.value = 'Manzil topilmadi'
      return
    }
    const point = { lat: Number(result.lat), lng: Number(result.lon) }
    emit('update:modelValue', point)
    geocodeMessage.value = 'Manzil xaritada belgilandi'
  } catch {
    geocodeMessage.value = 'Manzilni xaritada topib bo\'lmadi'
  } finally {
    resolving.value = false
  }
}

onMounted(() => {
  if (!mapEl.value) return
  const center = props.modelValue ? [props.modelValue.lat, props.modelValue.lng] as L.LatLngExpression : DEFAULT_CENTER
  map = L.map(mapEl.value, {
    center,
    zoom: props.modelValue ? 15 : DEFAULT_ZOOM,
    zoomControl: !props.disabled,
    dragging: !props.disabled,
    scrollWheelZoom: !props.disabled,
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  setMarker(props.modelValue)
  if (!props.disabled) {
    map.on('click', async (event: L.LeafletMouseEvent) => {
      await selectPoint({ lat: event.latlng.lat, lng: event.latlng.lng }, true)
    })
  }
  setTimeout(() => map?.invalidateSize(), 0)
})

watch(() => props.modelValue, (point) => {
  geocodeMessage.value = ''
  setMarker(point)
  if (point) map?.setView([point.lat, point.lng], Math.max(map.getZoom(), 15))
})

watch(addressQuery, () => {
  if (!props.autoResolveAddress || props.disabled) return
  if (skipNextAddressSearch) {
    skipNextAddressSearch = false
    return
  }
  if (geocodeTimer) clearTimeout(geocodeTimer)
  if (!addressQuery.value) return
  geocodeTimer = setTimeout(() => {
    void geocodeAddress()
  }, 900)
})

watch(() => props.disabled, (disabled) => {
  if (!map) return
  map.dragging[disabled ? 'disable' : 'enable']()
  map.scrollWheelZoom[disabled ? 'disable' : 'enable']()
  marker?.dragging?.[disabled ? 'disable' : 'enable']()
})

onBeforeUnmount(() => {
  if (geocodeTimer) clearTimeout(geocodeTimer)
  map?.remove()
  map = null
})
</script>
