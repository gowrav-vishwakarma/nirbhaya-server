export interface OrderItem {
  slideId: number;
  text: string;
}

export class CreateOrderDto {
  businessUserId: number;
  order: OrderItem[];
}
