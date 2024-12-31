export interface CatalogItem {
  id: number;
  title: string;
  imageUrl: string;
  sequence: number;
}

export interface CatalogResponse {
  hasCatalog: boolean;
  doesDelivery: boolean;
  deliveryText: string | null;
  catalogItems: CatalogItem[];
  whatsappNumber: string | null;
}

export interface UpdateCatalogDto {
  hasCatalog: boolean;
  doesDelivery: boolean;
  deliveryText?: string;
}
