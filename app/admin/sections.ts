/**
 * The admin's sections, shared by the routes and the rail.
 *
 * Kept free of `'use client'` and of icons on purpose: the server route has to
 * validate the URL segment, and a function that lives in a client module cannot
 * be called from a server component. Icons stay behind in the rail.
 */

export const ADMIN_SECTIONS = {
  sider: { label: 'Sider' },
  generelt: { label: 'Generelle oplysninger' },
  'header-footer': { label: 'Header / Footer' },
  cases: { label: 'Cases' },
  anmeldelser: { label: 'Kundeudtalelser' },
  logoer: { label: 'Firmalogoer' },
  mediebibliotek: { label: 'Mediebibliotek' },
  menu: { label: 'Rediger menu' },
} as const

export type AdminSection = keyof typeof ADMIN_SECTIONS

export const isAdminSection = (v: string): v is AdminSection =>
  Object.prototype.hasOwnProperty.call(ADMIN_SECTIONS, v)

/**
 * A screen the workspace can show.
 *
 * `home` is the dashboard `/admin` opens on. It is deliberately not a section:
 * every section is addressed by its own URL segment, and the dashboard's address
 * is `/admin` itself, so putting it in the registry would invent a second address
 * showing the same thing.
 */
export type AdminView = 'home' | AdminSection

export const sectionHref = (s: AdminSection) => `/admin/${s}`
