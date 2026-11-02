import { randomUUID } from "crypto";

export type DepositRequest = { orderId: string; amountSol: number };
export type DepositAddress = { address: string; mode: "mock" };

export interface PaymentProvider {
  createDepositAddress(input: DepositRequest): Promise<DepositAddress>;
  checkPayment(address: string, expectedSol: number): Promise<"waiting" | "detected" | "confirmed">;
}

/**
 * Deliberately non-payable. Replace this adapter only after deposit wallet
 * custody and transaction monitoring have been approved.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createDepositAddress(): Promise<DepositAddress> {
    return { address: `DEMO_ONLY_${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`, mode: "mock" };
  }

  async checkPayment(): Promise<"waiting"> {
    return "waiting";
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
