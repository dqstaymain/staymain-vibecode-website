'use client'

import { useRef, useState } from 'react'
import { ChevronDown, GripVertical, ImageIcon, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import { Button, Field, GroupLabel, Input, Select, Textarea, Toggle } from '@/app/admin/ui'
import { cx } from '@/lib/cx'
import { newBlockRowId, type BlockDefinition, type BlockField } from '@/lib/blocks'

/**
 * Renders a block's editor from its declared fields.
 *
 * The old editors were hand-written per block type and used no shared primitive
 * at all - 21 raw `<input>`s, 5 `<textarea>`s and a string of `className=
 * "admin-input"` - so they did not match each other, let alone the rest of the
 * admin. Worse, they and the public renderers were separate lists, which is how
 * `imageAlt` and `button2Text` came to be rendered with no input for them, and
 * `cta.buttonText` came to have an input that rendered nothing.
 *
 * Generating the form from BLOCK_DEFINITIONS makes that class of bug
 * unrepresentable: a field exists because a renderer reads it.
 *
 * Deliberately not generic past the field level. Radio-card groups, the media
 * picker and the sortable repeater all need more than a type switch, and forcing
 * them through one would cost more than it saves.
 */
export function BlockFieldEditor({
  definition,
  content,
  onChange,
  onOpenMediaPicker,
}: {
  definition: BlockDefinition
  content: Record<string, any>
  onChange: (patch: Record<string, any>) => void
  onOpenMediaPicker?: (filter: 'image' | 'video', fieldKey: string) => void
}) {
  return (
    <div className="space-y-6">
      <IncompleteLinks definition={definition} content={content} />
      {definition.fields.map(field => (
        <FieldSlot
          key={field.key}
          field={field}
          value={content[field.key]}
          onChange={value => onChange({ [field.key]: value })}
          onOpenMediaPicker={onOpenMediaPicker}
        />
      ))}
    </div>
  )
}

/**
 * Flags a button with a label but no destination.
 *
 * The CTA renderer only draws a button when it has both, so a section can carry
 * "Kontakt os" in its content and show nothing at all - the one section whose
 * entire job is to offer an action, offering none. That is invisible in the
 * editor, because both fields look filled in on their own.
 *
 * Pairs are found by convention: `buttonText` with `buttonLink`, `button2Text`
 * with `button2Link`, and so on. Deriving it from the names means a new button
 * pair cannot be added without this picking it up.
 */
function IncompleteLinks({
  definition,
  content,
}: {
  definition: BlockDefinition
  content: Record<string, any>
}) {
  const incomplete = definition.fields.filter(field => {
    const match = field.key.match(/^(.*)Text$/)
    if (!match) return false
    const linkKey = `${match[1]}Link`
    if (!definition.fields.some(f => f.key === linkKey)) return false
    return Boolean(content[field.key]) && !content[linkKey]
  })

  if (!incomplete.length) return null

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-3.5 py-2.5">
      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[var(--danger)]" />
      <p className="text-[13px] leading-relaxed text-[var(--danger)]">
        {incomplete
          .map(f => `"${content[f.key]}" er skrevet, men "${f.label.replace(/Link/i, 'link')}" er tom.`)
          .join(' ')}{' '}
        Knappen vises ikke på siden, indtil der står en adresse.
      </p>
    </div>
  )
}

function FieldSlot({
  field,
  value,
  onChange,
  onOpenMediaPicker,
}: {
  field: BlockField
  value: any
  onChange: (value: any) => void
  onOpenMediaPicker?: (filter: 'image' | 'video', fieldKey: string) => void
}) {
  switch (field.kind) {
    case 'text':
      return (
        <Field label={field.label} hint={field.hint}>
          <Input
            value={value ?? ''}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            onChange={e => onChange(e.target.value)}
          />
        </Field>
      )

    case 'textarea':
      return (
        <Field label={field.label} hint={field.hint}>
          <Textarea
            rows={field.rows ?? 4}
            value={value ?? ''}
            placeholder={field.placeholder}
            onChange={e => onChange(e.target.value)}
          />
        </Field>
      )

    case 'select':
      return (
        <Field label={field.label} hint={field.hint}>
          <Select value={value ?? ''} onChange={e => onChange(e.target.value)}>
            {(field.options ?? []).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      )

    case 'toggle':
      return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-[var(--hairline)] bg-[var(--surface-sunken)] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[var(--ink)]">{field.label}</p>
            {field.hint && <p className="mt-0.5 text-[12px] text-[var(--ink-3)]">{field.hint}</p>}
          </div>
          <Toggle
            checked={Boolean(value)}
            onChange={checked => onChange(checked)}
            label={field.label}
          />
        </div>
      )

    case 'media':
      return (
        <MediaField
          field={field}
          value={value ?? ''}
          onChange={onChange}
          onOpenMediaPicker={onOpenMediaPicker}
        />
      )

    case 'repeater':
      return <RepeaterField field={field} items={value} onChange={onChange} />

    default:
      return null
  }
}

/**
 * Image / video slot.
 *
 * Shows a real preview rather than a URL, because the previous editors showed
 * the raw path next to a "Vælg" button and gave no way to judge whether the
 * right asset was chosen.
 */
function MediaField({
  field,
  value,
  onChange,
  onOpenMediaPicker,
}: {
  field: BlockField
  value: string
  onChange: (value: string) => void
  onOpenMediaPicker?: (filter: 'image' | 'video', fieldKey: string) => void
}) {
  const isVideo = field.accept === 'video'

  return (
    <Field label={field.label} hint={field.hint}>
      <div className="space-y-2">
        {value ? (
          <div className="overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-sunken)]">
            {isVideo ? (
              <video src={value} className="h-32 w-full object-cover" muted playsInline />
            ) : (
              <img src={value} alt="" className="h-32 w-full object-cover" />
            )}
            <div className="flex items-center gap-2 border-t border-[var(--hairline)] px-2.5 py-2">
              <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--ink-3)]">
                {value.split('/').pop()}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange('')}
                aria-label={`Fjern ${field.label.toLowerCase()}`}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenMediaPicker?.(field.accept ?? 'image', field.key)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-6 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <ImageIcon size={16} />
            Vælg {isVideo ? 'video' : 'billede'}
          </button>
        )}

        {value && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onOpenMediaPicker?.(field.accept ?? 'image', field.key)}
          >
            Skift
          </Button>
        )}
      </div>
    </Field>
  )
}

/**
 * A sortable, add-and-remove list of sub-fields.
 *
 * Reorderable because these lists are ordered content - the order of the
 * services grid or the gallery tiles is the editor's decision, and a list that
 * can only be rebuilt from scratch is a list nobody will reorder. The drag uses
 * buttons rather than a full DnD sensor: these are short lists inside a panel
 * that already has a drag interaction of its own for reordering sections, and a
 * second pointer-capture layer in the same scroll container fights with it.
 */
function RepeaterField({
  field,
  items,
  onChange,
}: {
  field: BlockField
  items: any
  onChange: (value: any[]) => void
}) {
  const list: any[] = Array.isArray(items) ? items : []
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const commit = (next: any[]) => onChange(next)

  const add = () => {
    const row: Record<string, any> = { id: newBlockRowId('row'), ...(field.itemDefaults ?? {}) }
    for (const sub of field.itemFields ?? []) {
      if (sub.kind === 'select' && row[sub.key] === undefined) {
        row[sub.key] = sub.options?.[0]?.value
      }
    }
    commit([...list, row])
    setExpanded(e => ({ ...e, [row.id]: true }))
  }

  const remove = (index: number) => commit(list.filter((_, i) => i !== index))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const [row] = next.splice(index, 1)
    next.splice(target, 0, row)
    commit(next)
  }

  const patch = (index: number, key: string, value: any) =>
    commit(list.map((item, i) => (i === index ? { ...item, [key]: value } : item)))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <GroupLabel>{field.label}</GroupLabel>
        <span className="admin-num text-[11px] text-[var(--ink-3)]">{list.length}</span>
      </div>

      {field.hint && <p className="mb-3 text-[12px] text-[var(--ink-3)]">{field.hint}</p>}

      <div className="space-y-2">
        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-6 text-center text-[13px] text-[var(--ink-3)]">
            Ingen {field.itemLabel?.toLowerCase() ?? 'rækker'} endnu.
          </p>
        )}

        {list.map((item, index) => {
          const open = expanded[item.id] ?? index === list.length - 1
          const label =
            (item as any)[field.itemFields?.[0]?.key ?? 'title'] ||
            `${field.itemLabel ?? 'Række'} ${index + 1}`

          return (
            <div
              key={item.id || index}
              className="overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-sunken)]"
            >
              <div className="flex items-center gap-1 px-2 py-2">
                <button
                  type="button"
                  onClick={() => setExpanded(e => ({ ...e, [item.id]: !open }))}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left"
                >
                  <ChevronDown
                    size={14}
                    className={cx('shrink-0 text-[var(--ink-3)] transition-transform', !open && '-rotate-90')}
                    aria-hidden="true"
                  />
                  <span className="truncate text-[13px] font-medium text-[var(--ink)]">
                    {String(label) || `${field.itemLabel} ${index + 1}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Flyt ${field.itemLabel ?? 'række'} ${index + 1} op`}
                  className="grid h-7 w-7 place-items-center rounded text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-30"
                >
                  <GripVertical size={13} className="rotate-90" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === list.length - 1}
                  aria-label={`Flyt ${field.itemLabel ?? 'række'} ${index + 1} ned`}
                  className="grid h-7 w-7 place-items-center rounded text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:opacity-30"
                >
                  <GripVertical size={13} className="-rotate-90" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Slet ${field.itemLabel ?? 'række'} ${index + 1}`}
                  className="grid h-7 w-7 place-items-center rounded text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                >
                  <X size={14} />
                </button>
              </div>

              {open && (
                <div className="space-y-3 border-t border-[var(--hairline)] bg-[var(--surface)] px-3 py-3">
                  {(field.itemFields ?? []).map(sub => (
                    <SubField
                      key={sub.key}
                      field={sub}
                      value={item[sub.key]}
                      onChange={value => patch(index, sub.key, value)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--hairline-strong)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        <Plus size={14} />
        Tilføj {field.itemLabel?.toLowerCase() ?? 'række'}
      </button>
    </div>
  )
}

/** A field inside a repeater row. Media is not offered here on purpose. */
function SubField({ field, value, onChange }: { field: BlockField; value: any; onChange: (v: any) => void }) {
  if (field.kind === 'textarea') {
    return (
      <Field label={field.label}>
        <Textarea rows={field.rows ?? 2} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      </Field>
    )
  }
  if (field.kind === 'select') {
    return (
      <Field label={field.label}>
        <Select value={value ?? ''} onChange={e => onChange(e.target.value)}>
          {(field.options ?? []).map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
    )
  }
  return (
    <Field label={field.label}>
      <Input
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  )
}
