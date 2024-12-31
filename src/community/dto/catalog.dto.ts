export interface CatalogItem {
  id: number;
  title: string;
  imageUrl: string;
  sequence: number;
}

export interface CatalogResponse {
  hasCatalog: boolean;
  whatsappNumber: string;
  doesDelivery: boolean;
  deliveryText: string;
  deliveryRange: number;
  catalogItems: {
    id: number;
    title: string;
    imageUrl: string;
    sequence: number;
  }[];
}

export class UpdateCatalogDto {
  hasCatalog: boolean;
  doesDelivery: boolean;
  deliveryText: string;
  deliveryRange: number;
}
