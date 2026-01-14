// src/lib/sundra/trips/slug.ts

export function slugify(input: string): string {
  return (input ?? "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Bakåtkompat: vissa delar i projektet importerar slugifyTitle
export const slugifyTitle = slugify;
