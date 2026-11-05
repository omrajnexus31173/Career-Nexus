/** Client-safe copy of the résumé template metadata (the renderer itself is server-only). */
export const RESUME_TEMPLATES: { id: string; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Centred header, single column — the safest choice for ATS parsing." },
  { id: "modern", name: "Modern", description: "Dark contact rail with an accent spine. Strong for design and product roles." },
  { id: "compact", name: "Compact", description: "Tighter type and spacing to fit more evidence on one page." },
];
