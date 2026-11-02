export type GiftCardDelivery = { code: string };

export interface GiftCardProvider {
  deliver(input: { brand: string; valueUsd: number; orderId: string }): Promise<GiftCardDelivery>;
}

/** Mock only. Never returns a redeemable gift card. */
export class MockGiftCardProvider implements GiftCardProvider {
  async deliver(input: { brand: string; valueUsd: number; orderId: string }): Promise<GiftCardDelivery> {
    return { code: `DEMO-${input.brand.toUpperCase().replace(/[^A-Z]/g, "")}-NOT-REDEEMABLE` };
  }
}

export const giftCardProvider: GiftCardProvider = new MockGiftCardProvider();
