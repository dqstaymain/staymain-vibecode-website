import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireAuth } from '@/lib/api-auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media')

// SVG is intentionally excluded: it can carry <script> and is served from the
// site origin, which makes an uploaded SVG same-origin XSS.
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  document: ['application/pdf'],
} as const

const MAX_SIZES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 20 * 1024 * 1024,
} as const

// The stored extension is derived from the MIME type, never from the uploaded
// filename. Otherwise `evil.html` sent as image/png would be served as HTML.
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'weba',
  'application/pdf': 'pdf',
}

type Category = keyof typeof ALLOWED_TYPES

function getCategory(mimeType: string): Category | null {
  for (const category of Object.keys(ALLOWED_TYPES) as Category[]) {
    if ((ALLOWED_TYPES[category] as readonly string[]).includes(mimeType)) return category
  }
  return null
}

function getMimeType(ext: string): string {
  const entry = Object.entries(EXTENSION_BY_MIME).find(([, value]) => value === ext)
  return entry ? entry[0] : 'application/octet-stream'
}

/** Rejects anything that is not a plain file name inside UPLOAD_DIR. */
function resolveUploadPath(fileName: string): string | null {
  if (fileName !== path.basename(fileName)) return null
  if (fileName.startsWith('.')) return null
  const filePath = path.resolve(UPLOAD_DIR, fileName)
  if (filePath !== path.join(UPLOAD_DIR, fileName)) return null
  return filePath
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireAuth(request)
    if (unauthorized) return unauthorized

    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ files: [] })
    }

    const entries = await readdir(UPLOAD_DIR, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter(entry => !entry.name.startsWith('.') && entry.isFile())
        .map(async entry => {
          try {
            const stats = await stat(path.join(UPLOAD_DIR, entry.name))
            const mimeType = getMimeType(entry.name.split('.').pop()?.toLowerCase() || '')
            return {
              name: entry.name,
              url: `/uploads/media/${entry.name}`,
              size: stats.size,
              type: mimeType,
              category: getCategory(mimeType),
              createdAt: stats.birthtime.toISOString(),
            }
          } catch {
            // A file that vanished or is unreadable shouldn't fail the listing.
            return null
          }
        })
    )

    return NextResponse.json({ files: files.filter(Boolean) })
  } catch (error) {
    console.error('Error reading files:', error)
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAuth(request)
    if (unauthorized) return unauthorized

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const mimeType = file.type
    const category = getCategory(mimeType)
    const extension = EXTENSION_BY_MIME[mimeType]

    if (!category || !extension) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZES[category]) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Suffix the name so re-uploading logo.png can't clobber the live asset.
    const base = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 60) || 'fil'
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const fileName = `${base}-${unique}.${extension}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    await writeFile(filePath, Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        url: `/uploads/media/${fileName}`,
        size: file.size,
        type: mimeType,
        category,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAuth(request)
    if (unauthorized) return unauthorized

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    const filePath = resolveUploadPath(fileName)
    if (!filePath) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await unlink(filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
