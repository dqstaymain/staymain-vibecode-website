import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sacipjtmvvyazwxwvatm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY2lwanTtdnZ5YXp3eHd2YXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTY0NDIsImV4cCI6MjA5MTU3MjQ0Mn0._IqB5I4yXHZ-ukcIJ9Vwqg25NMtzDg6l-is9H09t1SY'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY2lwanTtdnZ5YXp3eHd2YXRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk5NjQ0MiwiZXhwIjoyMDkxNTcyNDQyfQ.O-zwTiNYhVXJ8tsSFjwSDRiwTSumRrclVTT4fZf5GFQ'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

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
      meta: item.meta
    }))
  } catch (error) {
    console.error('Error loading pages:', error)
    return null
  }
}

export async function saveCMSNavigation(navigation: any[]): Promise<boolean> {
  try {
    const formatted = navigation.map(item => ({
      id: item.id,
      label: item.label,
      href: item.href || null,
      page_slug: item.pageSlug || null,
      parent_nav_id: item.parentNavId || null,
      children: item.children || null,
      new_tab: item.newTab || null
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
    const { data, error } = await supabase.from('cms_navigation').select('*').order('id')
    if (error || !data || data.length === 0) return null
    return data.map(item => ({
      id: item.id,
      label: item.label,
      href: item.href,
      pageSlug: item.page_slug,
      parentNavId: item.parent_nav_id,
      children: item.children || undefined,
      newTab: item.new_tab || undefined
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
    const formatted = cases.map(c => ({
      id: c.id,
      title: c.title,
      image: c.image,
      link: c.link || null
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
    const { data, error } = await supabase.from('cms_cases').select('*')
    if (error || !data) return null
    return data.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image,
      link: item.link
    }))
  } catch (error) {
    console.error('Error loading cases:', error)
    return null
  }
}

export async function saveCMSTestimonials(testimonials: any[]): Promise<boolean> {
  try {
    const formatted = testimonials.map(t => ({
      id: t.id,
      name: t.name,
      role: t.role,
      content: t.content,
      image: t.image
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
    const { data, error } = await supabase.from('cms_testimonials').select('*')
    if (error || !data) return null
    return data.map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      content: item.content,
      image: item.image
    }))
  } catch (error) {
    console.error('Error loading testimonials:', error)
    return null
  }
}

export async function saveCMSCompanyLogos(logos: any[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('cms_company_logos').upsert(logos)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving company logos:', error)
    return false
  }
}

export async function loadCMSCompanyLogos(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase.from('cms_company_logos').select('*')
    if (error || !data) return null
    return data
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
