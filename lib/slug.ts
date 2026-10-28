/** "Jansen Verhuizingen B.V." → "jansen-verhuizingen-b-v" (voor korte links). */
export function slugify(name: string, fallback = "verhuizer"): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || fallback
  );
}
