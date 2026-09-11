import { describe, it, expect, beforeEach } from "vitest";
import { paymentEngine } from "./paymentEngine";

describe("PaymentEngine Test Card Simulation", () => {
  beforeEach(() => {
    paymentEngine.resetSession();
  });

  it("handles 4242 success card correctly with dynamic session ID", async () => {
    const result = await paymentEngine.processPayment("prod_123", {
      cardNumber: "4242 4242 4242 4242",
      expiry: "12 / 28",
      cvc: "123",
      email: "test@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.sessionId).toMatch(/^sess_demo_/);
  });

  it("handles 4000...02 decline card", async () => {
    const result = await paymentEngine.processPayment("prod_123", {
      cardNumber: "4000 0000 0000 0002",
      expiry: "12 / 28",
      cvc: "456",
      email: "test@example.com",
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("CARD_DECLINED");
    expect(result.errorMessage).toContain("declined");
  });

  it("handles 4000...0341 fail-once-then-succeed card across attempts", async () => {
    // Attempt 1: Should fail
    const firstAttempt = await paymentEngine.processPayment("prod_123", {
      cardNumber: "4000 0000 0000 0341",
      expiry: "12 / 28",
      cvc: "789",
      email: "test@example.com",
    });

    expect(firstAttempt.success).toBe(false);
    expect(firstAttempt.errorCode).toBe("PAYMENT_FAILED");

    // Attempt 2: Should succeed in the same session
    const secondAttempt = await paymentEngine.processPayment("prod_123", {
      cardNumber: "4000 0000 0000 0341",
      expiry: "12 / 28",
      cvc: "789",
      email: "test@example.com",
    });

    expect(secondAttempt.success).toBe(true);
    expect(secondAttempt.sessionId).toMatch(/^sess_demo_/);
  });
});
