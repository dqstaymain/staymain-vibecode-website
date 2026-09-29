'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, RotateCw, Monitor, Tablet, Smartphone } from 'lucide-react'
import { cx } from './ui'
import { SITE_URL } from '@/lib/site'

/**
 * Small, scrollable preview of the page being edited.
 *
 * Rendered in an iframe rather than inline on purpose:
 *  - the public site styles itself with viewport media queries and full-bleed
 *    sections, so an inline render squeezed into a narrow pane would show the
 *    desktop layout crushed into 380px.
 *  - an iframe gets its own viewport, so the device size below produces a
 *    genuine phone/tablet/desktop rendering with the real fonts.
 *
 * The frame's width is the device width, so the media queries below fire the way
 * they do on the real thing. Its height is whatever fills the box, which is not
 * always the device height - see scaleFor.
 *
 * Sizing the frame from the page's own height is a feedback loop and is not done
 * anywhere here: a taller frame is a taller viewport, so every `min-h-screen`
 * section grows, which makes the document taller, which grows the frame again.
 * It diverges until the tab dies.
 */
const DEVICES = {
  mobile: { width: 390, height: 844, label: 'Mobil', icon: Smartphone },
  tablet: { width: 834, height: 1112, label: 'Tablet', icon: Tablet },
  desktop: { width: 1280, height: 800, label: 'Desktop', icon: Monitor },
} as const

type DeviceKey = keyof typeof DEVICES

const DEFAULT_WIDTH = 384
const MIN_WIDTH = 320
const WIDTH_KEY = 'cms_preview_width'

/**
 * The frame fills the box: 100% of its width, so the whole page is visible
 * with nothing to scroll sideways, and the full height, so there is no dead
 * space under it.
 *
 * Those two only fit together because the frame's viewport is free to be taller
 * than the device it is imitating. Scaling by width gives a legible picture of
 * the whole page; the leftover vertical space is given to the viewport rather
 * than to letterboxing. The cost is that `100vh` inside the preview resolves to
 * that taller value, so `min-h-screen` sections draw taller here than on the
 * real device. Unavoidable: a 1280x800 page cannot be 384px wide and fill a
 * 767px-tall box at the same time, and cropping or scrolling sideways is the
 * worse of the three answers.
 *
 * Capped at 1 so a phone layout is never blown up to fill a wide column.
 */
function scaleFor(boxWidth: number, deviceWidth: number) {
  if (boxWidth <= 0 || deviceWidth <= 0) return 0
  return Math.min(1, boxWidth / deviceWidth)
}

export function PagePreview({
  slug,
  revision,
}: {
  slug: string
  /** Bumped to force a reload after the page is saved. */
  revision?: number
}) {
  const [device, setDevice] = useState<DeviceKey>('desktop')
  const [box, setBox] = useState({ width: 0, height: 0 })
  const frameBoxRef = useRef<HTMLDivElement>(null)
  const [nonce, setNonce] = useState(0)

  /**
   * Column width, dragged rather than toggled. Null until the stored value is
   * read, so the first paint uses the stylesheet default instead of a value
   * that would not match what the server rendered.
   */
  const [width, setWidth] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(WIDTH_KEY))
    if (Number.isFinite(stored) && stored >= MIN_WIDTH) setWidth(stored)
  }, [])

  useEffect(() => {
    if (width === null) return
    window.localStorage.setItem(WIDTH_KEY, String(width))
  }, [width])

  const href = `/${slug === 'home' ? '' : slug}`
  const { width: deviceWidth, height: deviceHeight } = DEVICES[device]
  const scale = scaleFor(box.width, deviceWidth)
  // The viewport is stretched so that, once scaled, it is exactly the box. It
  // depends on the box and the device only, never on the page's own height, so
  // this cannot feed back into the scale.
  const viewportHeight = scale > 0 ? box.height / scale : deviceHeight

  const DeviceIcon = DEVICES[device].icon

  // Measure the box the frame is drawn into. It does not depend on the frame,
  // so measuring it cannot feed back into the scale.
  useEffect(() => {
    const el = frameBoxRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setBox({ width: el.clientWidth, height: el.clientHeight })
    })
    observer.observe(el)
    setBox({ width: el.clientWidth, height: el.clientHeight })
    return () => observer.disconnect()
  }, [])

  const clamp = (value: number) => {
    // Leaving room for the outline on the left, so a drag cannot squeeze the
    // editor it belongs to out of existence.
    const max = Math.max(MIN_WIDTH, window.innerWidth - MIN_WIDTH)
    return Math.min(max, Math.max(MIN_WIDTH, Math.round(value)))
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // A right-click or middle-click should not start a resize.
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = { startX: event.clientX, startWidth: width ?? DEFAULT_WIDTH }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    // Dragging left widens the column, so the delta is inverted.
    setWidth(clamp(drag.startWidth + (drag.startX - event.clientX)))
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // Arrow keys resize too, or the handle is a mouse-only control. A separator
  // is the correct role for a draggable divider, and it wants the value exposed.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 64 : 16
    if (event.key === 'ArrowLeft') setWidth(w => clamp((w ?? DEFAULT_WIDTH) + step))
    else if (event.key === 'ArrowRight') setWidth(w => clamp((w ?? DEFAULT_WIDTH) - step))
    else if (event.key === 'Home') setWidth(MIN_WIDTH)
    else return
    event.preventDefault()
  }

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col lg:w-[var(--preview-width)]"
      style={{ '--preview-width': `${width ?? DEFAULT_WIDTH}px` } as React.CSSProperties}
    >
      {/* Divider on the left edge. Dragging it left makes the preview wider. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Træk for at ændre previewens bredde"
        aria-valuenow={width ?? DEFAULT_WIDTH}
        aria-valuemin={MIN_WIDTH}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={cx(
          'group absolute inset-y-0 -left-1 z-20 w-2 cursor-col-resize touch-none select-none',
          'focus-visible:outline-none focus-visible:bg-[var(--accent-soft)]'
        )}
      >
        <span
          className={cx(
            'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors',
            dragging
              ? 'bg-[var(--accent)]'
              : 'bg-[var(--hairline)] group-hover:bg-[var(--ink-3)]'
          )}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--hairline)] bg-[var(--surface)] px-3 py-2">
        <div className="flex items-center gap-0.5" role="group" aria-label="Preview størrelse">
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
            rel="noopener noreferrer"
            aria-label="Åbn side i ny fane"
            title="Åbn side i ny fane"
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
          >
            <Eye size={13} />
          </Link>
        </div>
      </div>

      {/* Nothing overflows in either axis: the frame is the width of this box
          and the height of it, so a scrollbar here would mean it did not fit. */}
      <div className="min-h-0 flex-1 basis-0 overflow-hidden bg-[var(--surface-sunken)] p-3">
        <div className="flex h-full w-full flex-col">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-[var(--hairline)] bg-[var(--surface-sunken)] px-2.5 py-1.5">
            <DeviceIcon size={11} className="shrink-0 text-[var(--ink-3)]" />
            {/* From the same source as the sitemap and the SEO preview, so the
                three cannot disagree about what the site is called. */}
            <span className="admin-num truncate text-[10px] text-[var(--ink-3)]">
              {new URL(SITE_URL).host}
              {href}
            </span>
          </div>
          {/* flex-1 so the chrome above takes its own height and the frame gets
              exactly what is left. Measured rather than computed, so the scale
              and the box it is drawn into cannot drift apart. */}
          <div
            ref={frameBoxRef}
            className="min-h-0 flex-1 overflow-hidden rounded-b-md border-x border-b border-[var(--hairline)] bg-white shadow-sm"
          >
            {scale > 0 && (
              <iframe
                key={`${href}-${device}-${revision ?? 0}-${nonce}`}
                src={href}
                title={`Preview af ${slug}`}
                // The handle holds the pointer while it is dragged, but the
                // iframe still sits under the cursor for part of the travel.
                // Without this it would start selecting its own text.
                // Centred when the scale cap leaves the frame narrower than the
                // box. Auto margins collapse to zero when it overflows, so the
                // scaled-down case still hugs the left edge as it should.
                className={cx('mx-auto block border-0', dragging && 'pointer-events-none')}
                style={{
                  width: deviceWidth,
                  height: viewportHeight,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
