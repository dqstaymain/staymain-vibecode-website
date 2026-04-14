import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'media')

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  document: ['application/pdf'],
}

const MAX_SIZES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  document: 20 * 1024 * 1024,
}

export async function GET() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ files: [] })
    }

    const files = await readdir(UPLOAD_DIR)
    const fileList = files
      .filter(fileName => !fileName.startsWith('.'))
      .map(fileName => {
      const filePath = path.join(UPLOAD_DIR, fileName)
      const stats = require('fs').statSync(filePath)
      const ext = fileName.split('.').pop()?.toLowerCase() || ''
      const mimeType = getMimeType(ext)
      
      return {
        name: fileName,
        url: `/uploads/media/${fileName}`,
        size: stats.size,
        type: mimeType,
        category: getCategory(mimeType),
        createdAt: stats.birthtime.toISOString(),
      }
    })

    return NextResponse.json({ files: fileList })
  } catch (error) {
    console.error('Error reading files:', error)
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const mimeType = file.type
    const category = getCategory(mimeType)

    if (!category) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZES[category as keyof typeof MAX_SIZES]) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const originalName = file.name
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(UPLOAD_DIR, sanitizedName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      file: {
        name: sanitizedName,
        url: `/uploads/media/${sanitizedName}`,
        size: file.size,
        type: mimeType,
        category,
        createdAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    const filePath = path.join(UPLOAD_DIR, fileName)

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

function getCategory(mimeType: string): string | null {
  if (ALLOWED_TYPES.image.includes(mimeType)) return 'image'
  if (ALLOWED_TYPES.video.includes(mimeType)) return 'video'
  if (ALLOWED_TYPES.audio.includes(mimeType)) return 'audio'
  if (ALLOWED_TYPES.document.includes(mimeType)) return 'document'
  return null
}

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
  }
  return types[ext] || 'application/octet-stream'
}
