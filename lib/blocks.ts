import type { CMSBlock } from './cms'

/**
 * One description of every block: its label, its fields, and the content a new
 * block starts with.
 *
 * This exists because the block editors and the public renderers used to be
 * written independently, and drifted. `content` is `Record<string, any>`, so
 * nothing in the type system said that a renderer reading `imageAlt` had a
 * corresponding input, or that `cta.buttonText` was rendered at all. Half the
 * fields renderers read had no editor, and one field the editor wrote was
 * never displayed.
 *
 * Declaring the fields once and generating the editor from them means a field
 * cannot exist in a renderer without existing in the editor, and a new block
 * cannot be half-built. The public renderers still own presentation; this owns
 * *what can be edited*.
 */

/** How a section's background reads against the ones around it. */
export type SectionTone = 'light' | 'muted' | 'dark'

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'select'
  | 'toggle'
  | 'media'
  | 'repeater'

export interface BlockField {
  key: string
  label: string
  kind: FieldKind
  hint?: string
  placeholder?: string
  rows?: number
  /** select */
  options?: { value: string; label: string }[]
  /** media */
  accept?: 'image' | 'video'
  /** Shows the value as a character count. */
  maxLength?: number
  /** repeater */
  itemLabel?: string
  itemFields?: BlockField[]
  itemDefaults?: Record<string, any>
  /** Section-level fields live here rather than on the block. */
  section?: boolean
}

export interface BlockDefinition {
  type: CMSBlock['type']
  label: string
  description: string
  /** lucide-react icon name; the admin maps it to a component. */
  icon: string
  /** The hero keeps its bespoke editor; everything else is generated. */
  bespokeEditor?: boolean
  fields: BlockField[]
  /** A fresh block's content. Called, not shared, so blocks never alias. */
  defaultContent: () => Record<string, any>
  /** One line for the outline row. */
  summary: (content?: Record<string, any>) => string
}

/** Icons a services item may use. Mapped in the renderer. */
export const SERVICE_ICONS = [
  'globe',
  'shopping',
  'mobile',
  'server',
  'search',
  'megaphone',
  'mail',
  'palette',
  'camera',
  'chart',
  'code',
  'target',
] as const

export const SERVICE_ICON_LABELS: Record<string, string> = {
  globe: 'Globus',
  shopping: 'Webshop',
  mobile: 'Mobil',
  server: 'Server',
  search: 'Søgning',
  megaphone: 'Kampagne',
  mail: 'E-mail',
  palette: 'Design',
  camera: 'Kamera',
  chart: 'Analyse',
  code: 'Kode',
  target: 'Mål',
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const TONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'light', label: 'Hvid' },
  { value: 'muted', label: 'Lys grå' },
  { value: 'dark', label: 'Mørk' },
]

/** Every section shares an eyebrow, a heading and a background tone. */
const headerFields = (): BlockField[] => [
  {
    key: 'eyebrow',
    label: 'Overliggende tekst',
    kind: 'text',
    placeholder: 'f.eks. Ydelser',
    maxLength: 40,
    hint: 'Kort, store bogstaver over overskriften.',
  },
  {
    key: 'title',
    label: 'Overskrift',
    kind: 'text',
    placeholder: 'Vores ydelser',
  },
  {
    key: 'description',
    label: 'Intro',
    kind: 'textarea',
    rows: 3,
    hint: 'En eller to linjer der sætter sektionen i sammenhæng.',
  },
  {
    key: 'tone',
    label: 'Baggrund',
    kind: 'select',
    options: TONE_OPTIONS,
    hint: 'Hvid og lys grå giver siden en rolig rytme. Brug mørk sparsomt.',
  },
]

const linkFields = (): BlockField[] => [
  {
    key: 'buttonText',
    label: 'Knap 1 – tekst',
    kind: 'text',
    placeholder: 'Se vores arbejde',
  },
  { key: 'buttonLink', label: 'Knap 1 – link', kind: 'text', placeholder: '/cases' },
  { key: 'button2Text', label: 'Knap 2 – tekst', kind: 'text', placeholder: 'Kontakt os' },
  { key: 'button2Link', label: 'Knap 2 – link', kind: 'text', placeholder: '/kontakt' },
]

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Første indtryk med billede eller video',
    icon: 'panel-top',
    bespokeEditor: true,
    fields: [],
    defaultContent: () => ({}),
    summary: c => c?.title || 'Hero',
  },
  {
    type: 'text',
    label: 'Tekst',
    description: 'En overskrift og en tekstblok',
    icon: 'type',
    fields: [
      ...headerFields(),
      {
        key: 'body',
        label: 'Tekst',
        kind: 'textarea',
        rows: 8,
        hint: 'Brug et tomt linje for at starte et nyt afsnit.',
      },
      {
        key: 'align',
        label: 'Justering',
        kind: 'select',
        options: [
          { value: 'left', label: 'Venstrestillet' },
          { value: 'center', label: 'Centreret' },
        ],
      },
      { key: 'measure', label: 'Brødtekst', kind: 'select', options: [
        { value: 'narrow', label: 'Smal kolonne' },
        { value: 'wide', label: 'Bred kolonne' },
      ] },
      ...linkFields(),
    ],
    defaultContent: () => ({
      title: 'Ny overskrift',
      body: 'Skriv her, hvad denne sektion handler om.',
      tone: 'light',
      align: 'left',
    }),
    summary: c => c?.title || c?.body?.slice(0, 48) || 'Tom tekstsektion',
  },
  {
    type: 'contentImage',
    label: 'Indhold + Billede',
    description: 'Tekst ved siden af et billede',
    icon: 'image',
    fields: [
      ...headerFields(),
      {
        key: 'layout',
        label: 'Layout',
        kind: 'select',
        options: [
          { value: 'image-left', label: 'Billede til venstre' },
          { value: 'image-right', label: 'Billede til højre' },
        ],
      },
      { key: 'image', label: 'Billede', kind: 'media', accept: 'image' },
      {
        key: 'imageAlt',
        label: 'Billedtekst',
        kind: 'text',
        placeholder: 'Beskriv hvad billedet viser',
        hint: 'Læses højt for blinde. Beskriv billedet, ikke "billede af".',
      },
      {
        key: 'body',
        label: 'Uddybende tekst',
        kind: 'textarea',
        rows: 5,
        hint: 'Valgfrit. Et tomt linje starter et nyt afsnit.',
      },
      ...linkFields(),
    ],
    defaultContent: () => ({
      title: 'Ny overskrift',
      description: 'Beskriv hvad denne sektion tilbyder.',
      layout: 'image-left',
      tone: 'light',
    }),
    summary: c => c?.title || 'Uden overskrift',
  },
  {
    type: 'services',
    label: 'Ydelser',
    description: 'Kort med ikon, titel og beskrivelse',
    icon: 'settings',
    fields: [
      ...headerFields(),
      {
        key: 'items',
        label: 'Ydelser',
        kind: 'repeater',
        itemLabel: 'Ydelse',
        itemFields: [
          { key: 'title', label: 'Titel', kind: 'text', placeholder: 'Webshop' },
          {
            key: 'description',
            label: 'Beskrivelse',
            kind: 'textarea',
            rows: 2,
            placeholder: 'Én linje om ydelsen.',
          },
          {
            key: 'icon',
            label: 'Ikon',
            kind: 'select',
            options: SERVICE_ICONS.map(i => ({ value: i, label: SERVICE_ICON_LABELS[i] })),
          },
        ],
        itemDefaults: { title: 'Ny ydelse', description: '', icon: 'globe' },
        hint: 'Truk for at ændre rækkefølgen.',
      },
    ],
    defaultContent: () => ({
      title: 'Vores ydelser',
      description: 'Vi samler kompetencerne i den løsning, dit projekt har brug for.',
      tone: 'light',
      items: [
        { id: uid('svc'), title: 'Hjemmeside', description: 'Skræddersyede sider der konverterer besøgende til kunder.', icon: 'globe' },
        { id: uid('svc'), title: 'Webshop', description: 'Professionelle webshops med fokus på salg og brugeroplevelse.', icon: 'shopping' },
        { id: uid('svc'), title: 'SEO', description: 'Optimer din synlighed og rank højere på Google.', icon: 'search' },
      ],
    }),
    summary: c =>
      c?.title
        ? `${c.title}${c.items?.length ? ` · ${c.items.length} ydelser` : ''}`
        : `${c?.items?.length ?? 0} ydelser`,
  },
  {
    type: 'testimonials',
    label: 'Anmeldelser',
    description: 'Kundeudtalelser fra Anmeldelser-sektionen',
    icon: 'message-square',
    fields: [
      ...headerFields(),
      {
        key: 'layout',
        label: 'Visning',
        kind: 'select',
        options: [
          { value: 'slider', label: 'En ad gang' },
          { value: 'grid', label: 'Net af kort' },
        ],
      },
      {
        key: 'limit',
        label: 'Maks. antal',
        kind: 'text',
        placeholder: 'Alle',
        hint: 'Tomt viser alle. Talet afgrænser hvor mange der vises.',
      },
    ],
    defaultContent: () => ({
      title: 'Hvad vores kunder siger',
      tone: 'light',
      layout: 'slider',
    }),
    summary: c => c?.title || 'Anmeldelser',
  },
  {
    type: 'stats',
    label: 'Statistik',
    description: 'Tal der fortjener opmærksomhed',
    icon: 'bar-chart',
    fields: [
      ...headerFields(),
      {
        key: 'items',
        label: 'Tal',
        kind: 'repeater',
        itemLabel: 'Tal',
        itemFields: [
          { key: 'number', label: 'Tal', kind: 'text', placeholder: '50+' },
          { key: 'label', label: 'Forklaring', kind: 'text', placeholder: 'Projekter' },
        ],
        itemDefaults: { number: '0', label: 'Nyt tal' },
        hint: 'Truk for at ændre rækkefølgen.',
      },
      {
        key: 'style',
        label: 'Stil',
        kind: 'select',
        options: [
          { value: 'rule', label: 'Med skillelinjer' },
          { value: 'plain', label: 'Uden skillelinjer' },
        ],
      },
    ],
    defaultContent: () => ({
      title: 'Tal der taler',
      tone: 'light',
      style: 'rule',
      items: [
        { id: uid('stat'), number: '50+', label: 'Projekter' },
        { id: uid('stat'), number: '100%', label: 'Tilfredse kunder' },
        { id: uid('stat'), number: '5+', label: 'Års erfaring' },
      ],
    }),
    summary: c => c?.title || `${c?.items?.length ?? 0} tal`,
  },
  {
    type: 'gallery',
    label: 'Galleri',
    description: 'Billeder i et rytmisk grid',
    icon: 'image',
    fields: [
      ...headerFields(),
      {
        key: 'items',
        label: 'Billeder',
        kind: 'repeater',
        itemLabel: 'Billede',
        itemFields: [
          { key: 'title', label: 'Titel', kind: 'text', placeholder: 'Projekttitel' },
          { key: 'category', label: 'Kategori', kind: 'text', placeholder: 'f.eks. Webshop' },
          { key: 'image', label: 'Billede', kind: 'media', accept: 'image' },
          { key: 'link', label: 'Link', kind: 'text', placeholder: '/cases' },
        ],
        itemDefaults: { title: 'Nyt billede', category: '' },
        hint: 'Alle cases vises i samme rolige 4:3-format.',
      },
    ],
    defaultContent: () => ({
      title: 'Udvalgte projekter',
      tone: 'light',
      items: [
        { id: uid('gal'), title: 'Projekt 1', category: 'Hjemmeside' },
        { id: uid('gal'), title: 'Projekt 2', category: 'Webshop' },
        { id: uid('gal'), title: 'Projekt 3', category: 'SEO' },
      ],
    }),
    summary: c => c?.title || `${c?.items?.length ?? 0} billeder`,
  },
  {
    type: 'cta',
    label: 'CTA',
    description: 'En tydelig invitation til at handle',
    icon: 'megaphone',
    fields: [
      ...headerFields(),
      ...linkFields(),
      {
        key: 'style',
        label: 'Baggrund',
        kind: 'select',
        options: [
          { value: 'dark', label: 'Mørk' },
          { value: 'light', label: 'Lys' },
        ],
      },
    ],
    defaultContent: () => ({
      title: 'Klar til at komme i gang?',
      description: 'Fortæl os kort, hvad du gerne vil have lavet, så vender vi tilbage med et forslag.',
      buttonText: 'Kontakt os',
      buttonLink: '/kontakt',
      style: 'light',
    }),
    summary: c => c?.title || 'CTA',
  },
  {
    type: 'contact',
    label: 'Kontakt',
    description: 'Kontaktoplysninger fra Generelle oplysninger',
    icon: 'file-text',
    fields: [
      ...headerFields(),
      {
        key: 'buttonText',
        label: 'Knap – tekst',
        kind: 'text',
        placeholder: 'Få et tilbud',
      },
      { key: 'buttonLink', label: 'Knap – link', kind: 'text', placeholder: '/kontakt' },
      {
        key: 'showCvr',
        label: 'Vis CVR-nummer',
        kind: 'toggle',
        hint: 'CVR-nummeret hentes under Generelle oplysninger.',
      },
    ],
    // Deliberately no contact form. There is no mail provider configured and no
    // POST /api/contact endpoint, so a form here would accept a submission and
    // quietly do nothing with it - the same silent-failure shape as the upload
    // bug this codebase already had once. This block shows the real details,
    // which is a thing that genuinely works. A form belongs here the day an
    // endpoint exists to receive it.
    defaultContent: () => ({
      title: 'Kontakt os',
      description: 'Skriv til os, så hører du fra os hurtigst muligt.',
      tone: 'muted',
      showCvr: false,
    }),
    summary: c => c?.title || 'Kontakt',
  },
]

const byType = new Map(BLOCK_DEFINITIONS.map(d => [d.type, d]))

export function getBlockDefinition(type: CMSBlock['type']): BlockDefinition | undefined {
  return byType.get(type)
}

/** Block types offered in the "Tilføj sektion" picker. Hero is excluded. */
export const ADDABLE_BLOCK_TYPES = BLOCK_DEFINITIONS.filter(d => d.type !== 'hero')

/**
 * Normalises stored content against the definition.
 *
 * Two jobs, both about not showing an editor a field it cannot keep. Content
 * written by an older build, or by hand in the database, can be missing keys the
 * renderer now expects or carry keys it no longer reads; a repeater in
 * particular needs an array of objects with ids, or the editor renders nothing
 * and the additions have nowhere to go.
 */
export function normaliseBlockContent(
  type: CMSBlock['type'],
  content?: Record<string, any>
): Record<string, any> {
  const def = byType.get(type)
  if (!def) return content ?? {}

  const next: Record<string, any> = { ...(content ?? {}) }

  // Blocks written before the repeater key was unified all called it `stats`
  // while services and gallery called theirs `items`. A stats block saved by an
  // older build would therefore reach the new renderer with no `items` array
  // and render as a full-height empty band - the same silent-blank failure this
  // pass is meant to end. Renaming on read fixes it without a migration, and
  // leaves the original key in place so an older build can still read the row.
  if (type === 'stats' && !Array.isArray(next.items) && Array.isArray(next.stats)) {
    next.items = next.stats
  }

  for (const field of def.fields) {
    if (field.kind === 'repeater') {
      const raw = next[field.key]
      if (Array.isArray(raw)) {
        next[field.key] = raw.map(item => ({ ...(itemDefaultsFor(field)), ...item, id: item?.id || uid('row') }))
      }
    } else if (field.kind === 'toggle' && typeof next[field.key] !== 'boolean') {
      next[field.key] = Boolean(next[field.key])
    }
  }

  return next
}

function itemDefaultsFor(field: BlockField): Record<string, any> {
  const defaults: Record<string, any> = { ...(field.itemDefaults ?? {}) }
  // Selects need a valid starting value or the first option wins silently.
  for (const sub of field.itemFields ?? []) {
    if (sub.kind === 'select' && !defaults[sub.key]) {
      defaults[sub.key] = sub.options?.[0]?.value
    }
  }
  return defaults
}

export { uid as newBlockRowId }
