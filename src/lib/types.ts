export type OrderStatus = "waiting" | "detected" | "confirmed" | "delivered" | "expired" | "failed";

export type Order = {
  id: string;
  itemId: string;
  brand: string;
  valueUsd: number;
  solAmount: number;
  depositAddress: string;
  status: OrderStatus;
  paymentMode: "solana" | "mock";
  paymentSignature?: string;
  payerAddress?: string;
  createdAt: string;
  expiresAt: string;
  giftCardCode?: string;
  failureReason?: string;
  sogoReference?: string;
  sogoTransactionId?: string;
  sogoStatus?: "processing" | "completed" | "failed" | "refunded" | "cancelled";
  sogoFailureReason?: string;
  sogoUpdatedAt?: string;
};
