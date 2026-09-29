/**
 * Joins class names, dropping anything falsy.
 *
 * Lives here rather than in `app/admin/ui` because both the CMS and the public
 * site need it, and neither should have to import from the other. `app/admin/ui`
 * re-exports it, so every existing import keeps working.
 */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
