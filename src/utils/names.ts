export interface PersonName {
  firstName?: string | null
  lastName?: string | null
  login?: string | null
}

export function personName(person: PersonName | null | undefined, fallback = '—') {
  if (!person) return fallback
  const fullName = [person.firstName, person.lastName]
    .filter((part) => !!part?.trim())
    .map((part) => part!.trim())
    .join(' ')
  return fullName || person.login || fallback
}
