'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, RotateCw, Monitor, Tablet, Smartphone } from 'lucide-react'
import { cx } from './ui'

/**
 * Small, scrollable preview of the page being edited.
 *
 * Rendered in an iframe rather than inline on purpose:
 *  - the public site styles itself with viewport media queries and full-bleed
 *    sections, so an inline render squeezed into a narrow pane would show the
 *    desktop layout crushed into 380px.
 *  - an iframe gets its own viewport, so the device width below produces a
 *    genuine phone/tablet/desktop rendering with the real fonts.
 * Same-origin, so the pane can measure the page height and scroll the whole
 * document instead of trapping a scrollbar inside the frame.
 */

const DEVICES = {
  mobile: { width: 390, label: 'Mobil', icon: Smartphone },
  tablet: { width: 834, label: 'Tablet', icon: Tablet },
  desktop: { width: 1280, label: 'Desktop', icon: Monitor },
} as const

type DeviceKey = keyof typeof DEVICES

export function PagePreview({
  slug,
  revision,
}: {
  slug: string
  /** Bump to force a reload after the page is saved. */
  revision?: number
}) {
  const [device, setDevice] = useState<DeviceKey>('desktop')
  const [paneWidth, setPaneWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const paneRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [nonce, setNonce] = useState(0)

  const href = `/${slug === 'home' ? '' : slug}`
  const deviceWidth = DEVICES[device].width
  const scale = paneWidth > 0 ? paneWidth / deviceWidth : 1

  // Track the pane so the frame can be scaled to fit its width exactly.
  useEffect(() => {
    const el = paneRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setPaneWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    setPaneWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  // Same-origin: measure the rendered page so the pane can scroll the whole
  // document at once, instead of a nested scrollbar inside the frame.
  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument
    if (!doc?.body) return
    const height = Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight,
      doc.body.offsetHeight
    )
    if (height > 0) setContentHeight(height)
  }, [])

  useEffect(() => {
    // Reset until the new document reports its height.
    setContentHeight(0)
  }, [device, href, nonce])

  const DeviceIcon = DEVICES[device].icon

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-l border-[var(--hairline)]">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--hairline)] bg-[var(--surface)] px-3 py-2">
        <div className="flex items-center gap-0.5" role="group" aria-label="Preview bredde">
          {(Object.keys(DEVICES) as DeviceKey[]).map(key => {
            const Icon = DEVICES[key].icon
            const isActive = key === device
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                aria-pressed={isActive}
                title={DEVICES[key].label}
                className={cx(
                  'flex h-6 w-6 items-center justify-center rounded transition-colors',
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--ink-3)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]'
                )}
              >
                <Icon size={13} />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-0.5">
          <span className="admin-num mr-1 hidden text-[10px] text-[var(--ink-3)] sm:inline">
            {deviceWidth}px
          </span>
          <button
            type="button"
            onClick={() => setNonce(n => n + 1)}
            aria-label="Genindlæs preview"
            title="Genindlæs preview"
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
          >
            <RotateCw size={13} />
          </button>
          <Link
            href={href}
            target="_blank"
            aria-label="Åbn side i ny fane"
            title="Åbn side i ny fane"
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
          >
            <Eye size={13} />
          </Link>
        </div>
      </div>

      <div ref={paneRef} className="min-h-0 flex-1 basis-0 overflow-y-auto bg-[var(--surface-sunken)] p-3">
        <div
          className="mx-auto overflow-hidden rounded-md border border-[var(--hairline)] bg-white shadow-sm"
          style={scale < 1 ? { width: deviceWidth * scale, height: contentHeight * scale || undefined } : undefined}
        >
          <div
            className="flex items-center gap-1.5 border-b border-[var(--hairline)] bg-[var(--surface-sunken)] px-2.5 py-1.5">
              <DeviceIcon size={11} className="text-[var(--ink-3)]" />
              <span className="admin-num truncate text-[10px] text-[var(--ink-3)]">
                staymain.dk{href}
              </span>
            </div>
            <iframe
              key={`${href}-${device}-${revision ?? 0}-${nonce}`}
              ref={frameRef}
              src={href}
              title={`Preview af ${slug}`}
              onLoad={measure}
              className="block border-0"
              style={{
                width: deviceWidth,
                height: contentHeight || deviceWidth * 1.4,
                transform: scale < 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
      </div>
  )
}
