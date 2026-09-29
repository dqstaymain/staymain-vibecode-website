import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sacipjtmvvyazwxwvatm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY2lwanTtdnZ5YXp3eHd2YXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTY0NDIsImV4cCI6MjA5MTU3MjQ0Mn0._IqB5I4yXHZ-ukcIJ9Vwqg25NMtzDg6l-is9H09t1SY'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Authorization header for calls to our own /api routes.
 * The service-role key deliberately lives only in server-side env, so every
 * privileged endpoint has to authenticate the caller with their session token.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface DBUser {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export interface CMSData {
  id: string
  key: string
  value: any
  updated_at: string
}

export async function uploadImage(file: File, folder: string = 'images'): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from('cms-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('cms-assets')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function deleteImage(publicUrl: string): Promise<boolean> {
  if (!publicUrl || publicUrl.includes('supabase')) {
    const path = publicUrl.split('/cms-assets/')[1]
    if (path) {
      const { error } = await supabase.storage
        .from('cms-assets')
        .remove([path])
      return !error
    }
  }
  return false
}

export async function saveCMSPages(pages: any[]): Promise<boolean> {
  try {
    const formatted = pages.map(p => ({
      slug: p.slug,
      title: p.title,
      parent_slug: p.parentSlug,
      blocks: p.blocks,
      meta: p.meta
    }))
    const { error } = await supabase.from('cms_pages').upsert(formatted)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving pages:', error)
    return false
  }
}

export async function loadCMSPages(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase.from('cms_pages').select('*')
    if (error || !data) return null
    return data.map(item => ({
      slug: item.slug,
      title: item.title,
      parentSlug: item.parent_slug,
      blocks: item.blocks,
      meta: item.meta,
      updatedAt: item.updated_at
    }))
  } catch (error) {
    console.error('Error loading pages:', error)
    return null
  }
}

/**
 * Ordering used to rely on `.order('id')` over ids like `nav-1712...`, so manual
 * reordering was lost on reload. A `position` column fixes that, but the column
 * has to be added to Supabase separately, so its availability is probed once and
 * cached.
 *
 * When the column is missing the fallback is `.order('id')`, which cannot
 * represent a manual order. That is a silent data-loss path: a reorder saves
 * with a 200 and then reverts on the next load. `isOrderingPersisted` lets the
 * admin say so out loud instead of pretending the save worked.
 *
 * See supabase/migrations/001_add_position_columns.sql
 */
const positionSupport: Record<string, boolean> = {}

function supportsPosition(table: string): boolean {
  return positionSupport[table] === true
}

/** False once any table has been found to be missing its `position` column. */
export function isOrderingPersisted(): boolean {
  return Object.values(positionSupport).every(v => v === true)
}

/** Orders by `position` when available, otherwise falls back to `id`. */
async function selectOrdered(table: string, columns = '*'): Promise<{ data: any[] | null; error: any }> {
  if (supportsPosition(table)) {
    const attempt = await supabase.from(table).select(columns).order('position')
    if (!attempt.error) return attempt
    positionSupport[table] = false
  } else {
    // Probe once; the error tells us the column isn't there yet.
    const probe = await supabase.from(table).select(columns).order('position')
    if (!probe.error) {
      positionSupport[table] = true
      return probe
    }
  }
  return supabase.from(table).select(columns).order('id')
}

export async function saveCMSNavigation(navigation: any[]): Promise<boolean> {
  try {
    const withPosition = supportsPosition('cms_navigation')
    const formatted = navigation.map((item, index) => ({
      id: item.id,
      label: item.label,
      href: item.href || null,
      page_slug: item.pageSlug || null,
      parent_nav_id: item.parentNavId || null,
      children: item.children || null,
      new_tab: item.newTab || null,
      ...(withPosition ? { position: index } : {}),
    }))
    const { error } = await supabase.from('cms_navigation').upsert(formatted, { onConflict: 'id' })
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving navigation:', error)
    return false
  }
}

export async function loadCMSNavigation(): Promise<any[] | null> {
  try {
    const { data, error } = await selectOrdered('cms_navigation')
    if (error || !data || data.length === 0) return null
    return data.map(item => ({
      id: item.id,
      label: item.label,
      href: item.href,
      pageSlug: item.page_slug,
      parentNavId: item.parent_nav_id,
      children: item.children || undefined,
      newTab: item.new_tab || undefined,
      updatedAt: item.updated_at
    }))
  } catch (error) {
    console.error('Error loading navigation:', error)
    return null
  }
}

export async function saveCMSContactInfo(contactInfo: any): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_settings').upsert({ key: 'contact_info', value: contactInfo }, { onConflict: 'key' })
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving contact info:', error)
    return false
  }
}

export async function loadCMSContactInfo(): Promise<any | null> {
  try {
    const { data, error } = await supabase.from('cms_settings').select('value').eq('key', 'contact_info').single()
    if (error || !data) return null
    return data.value
  } catch (error) {
    console.error('Error loading contact info:', error)
    return null
  }
}

export async function saveCMSCases(cases: any[]): Promise<boolean> {
  try {
    const withPosition = supportsPosition('cms_cases')
    const formatted = cases.map((c, index) => ({
      id: c.id,
      title: c.title,
      image: c.image,
      link: c.link || null,
      ...(withPosition ? { position: index } : {}),
    }))
    const { error } = await supabase.from('cms_cases').upsert(formatted, { onConflict: 'id' })
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving cases:', error)
    return false
  }
}

export async function loadCMSCases(): Promise<any[] | null> {
  try {
    const { data, error } = await selectOrdered('cms_cases')
    if (error || !data) return null
    return data.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image,
      link: item.link,
      updatedAt: item.updated_at
    }))
  } catch (error) {
    console.error('Error loading cases:', error)
    return null
  }
}

export async function saveCMSTestimonials(testimonials: any[]): Promise<boolean> {
  try {
    const withPosition = supportsPosition('cms_testimonials')
    const formatted = testimonials.map((t, index) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      content: t.content,
      image: t.image,
      ...(withPosition ? { position: index } : {}),
    }))
    const { error } = await supabase.from('cms_testimonials').upsert(formatted)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving testimonials:', error)
    return false
  }
}

export async function loadCMSTestimonials(): Promise<any[] | null> {
  try {
    const { data, error } = await selectOrdered('cms_testimonials')
    if (error || !data) return null
    return data.map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      content: item.content,
      image: item.image,
      updatedAt: item.updated_at
    }))
  } catch (error) {
    console.error('Error loading testimonials:', error)
    return null
  }
}

export async function saveCMSCompanyLogos(logos: any[]): Promise<boolean> {
  try {
    const withPosition = supportsPosition('cms_company_logos')
    // Spreading is what made this one different from the other saves: the row
    // came back from `select('*')` carrying columns the table has and the
    // client model does not, and every one of them went straight back out. A
    // column the table does not have is a 400 from PostgREST, so the client's
    // own `updatedAt` has to come back off before the payload is sent.
    const formatted = logos.map((l, index) => {
      const { updatedAt: _editedAt, ...columns } = l
      return { ...columns, ...(withPosition ? { position: index } : {}) }
    })
    const { error } = await supabase.from('cms_company_logos').upsert(formatted)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving company logos:', error)
    return false
  }
}

export async function loadCMSCompanyLogos(): Promise<any[] | null> {
  try {
    const { data, error } = await selectOrdered('cms_company_logos')
    if (error || !data) return null
    return data.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image,
      website: item.website,
      updatedAt: item.updated_at
    }))
  } catch (error) {
    console.error('Error loading company logos:', error)
    return null
  }
}

export async function deleteCMSPage(slug: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_pages').delete().eq('slug', slug)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting page:', error)
    return false
  }
}

/** Removes a page and every descendant in one round trip. */
export async function deleteCMSPages(slugs: string[]): Promise<boolean> {
  if (slugs.length === 0) return true
  try {
    const { error } = await supabase.from('cms_pages').delete().in('slug', slugs)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting pages:', error)
    return false
  }
}

export async function deleteCMSNavigation(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_navigation').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting navigation item:', error)
    return false
  }
}

export async function deleteCMSCase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_cases').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting case:', error)
    return false
  }
}

export async function deleteCMSTestimonial(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_testimonials').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return false
  }
}

export async function deleteCMSCompanyLogo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_company_logos').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting company logo:', error)
    return false
  }
}
