import type { Tag } from "../entities/Tag";

export interface CreateTagData {
  name: string;
  slug: string;
}

export interface TagRepository {
  findBySlug(slug: string): Promise<Tag | null>;
  create(data: CreateTagData): Promise<Tag>;
}
