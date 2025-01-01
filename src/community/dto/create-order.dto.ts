export interface OrderItem {
  slideId: number;
  text: string;
}

export interface BoxData {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export class CreateOrderDto {
  businessUserId: number;
  order: OrderItem[];
}
