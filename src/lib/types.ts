export type OrderStatus = "waiting" | "detected" | "confirmed" | "delivered" | "expired" | "failed";

export type Order = {
  id: string;
  itemId: string;
  brand: string;
  valueUsd: number;
  solAmount: number;
  depositAddress: string;
  status: OrderStatus;
  paymentMode: "mock";
  createdAt: string;
  expiresAt: string;
  giftCardCode?: string;
  failureReason?: string;
};
