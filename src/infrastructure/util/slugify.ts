/** "Él Club: de la Pelea!" → "el-club-de-la-pelea" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug canónico "<id>-<titulo>", máximo 80 caracteres (límite del value object Slug). */
export function slugWithId(id: number, title: string): string {
  const text = slugify(title);
  return `${id}${text ? `-${text}` : ""}`.slice(0, 80).replace(/-+$/, "");
}

/** Extrae el id numérico inicial del slug, o null. */
export function idFromSlug(slug: string): number | null {
  const match = /^(\d{1,12})(?:-|$)/.exec(slug);
  return match ? Number(match[1]) : null;
}
