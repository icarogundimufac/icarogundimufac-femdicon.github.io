import { createHmac, timingSafeEqual } from 'node:crypto'
import { DEFAULT_ADMIN_PASSWORD } from '@/lib/auth/admin-config'

const ADMIN_SESSION_COOKIE = 'portal-admin-session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword()
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signValue(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

function parseCookies(cookieHeader?: string) {
  const source = cookieHeader ?? ''
  if (!source.trim()) return {}

  return Object.fromEntries(
    source
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=')
        if (separatorIndex === -1) return [part, '']
        return [
          part.slice(0, separatorIndex),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ]
      }),
  )
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number
    httpOnly?: boolean
    sameSite?: 'Lax' | 'Strict' | 'None'
    secure?: boolean
    path?: string
  } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.trunc(options.maxAge))}`)
  }

  parts.push(`Path=${options.path ?? '/'}`)
  parts.push(`SameSite=${options.sameSite ?? 'Lax'}`)

  if (options.httpOnly !== false) {
    parts.push('HttpOnly')
  }

  if (options.secure ?? process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }

  return parts.join('; ')
}

export function isValidAdminPassword(password: string) {
  return password === getAdminPassword()
}

export function createAdminSessionCookie() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = encodeBase64Url(JSON.stringify({ expiresAt }))
  const signature = signValue(payload)

  return serializeCookie(
    ADMIN_SESSION_COOKIE,
    `${payload}.${signature}`,
    { maxAge: SESSION_MAX_AGE_SECONDS },
  )
}

export function clearAdminSessionCookie() {
  return serializeCookie(ADMIN_SESSION_COOKIE, '', { maxAge: 0 })
}

export function hasValidAdminSession(cookieHeader?: string) {
  const cookies = parseCookies(cookieHeader)
  const sessionToken = cookies[ADMIN_SESSION_COOKIE]

  if (!sessionToken) return false

  const [payload, signature] = sessionToken.split('.')
  if (!payload || !signature) return false

  const expectedSignature = signValue(payload)
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
  const receivedBuffer = Buffer.from(signature, 'utf8')

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return false
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { expiresAt?: unknown }
    return typeof parsed.expiresAt === 'number' && parsed.expiresAt > Date.now()
  } catch {
    return false
  }
}
