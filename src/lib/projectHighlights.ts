interface HighlightProject {
  slug: string;
  data: { highlight: boolean; order: number };
}

export function selectHighlights<T extends HighlightProject>(projects: T[]): T[] {
  return projects
    .filter((project) => project.data.highlight)
    .sort((a, b) => a.data.order - b.data.order || a.slug.localeCompare(b.slug))
    .slice(0, 3);
}

export function highlightDescription(data: { subtitle?: string; description: string }): string {
  const text = data.subtitle?.trim() || data.description.trim();
  return text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text;
}
