export interface CreateCatalogItemDto {
  title: string;
  imageUrl: string;
  sequence: number;
}

export interface UpdateCatalogItemDto {
  title?: string;
  imageUrl?: string;
  sequence?: number;
}
