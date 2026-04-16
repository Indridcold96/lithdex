export interface Mineral {
  id: string;
  slug: string;
  name: string;
  scientificName: string | null;
  category: string | null;
  description: string | null;
  hardnessMin: number | null;
  hardnessMax: number | null;
  crystalSystem: string | null;
  colorNotes: string | null;
  lusterNotes: string | null;
  transparencyNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
