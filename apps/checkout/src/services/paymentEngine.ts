export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvc: string;
  email: string;
}

class PaymentEngine {
  // Session-scoped attempt tracker for the fail-once test card
  private attemptCounts: Map<string, number> = new Map();

  public async processPayment(
    _productId: string,
    card: CardDetails
  ): Promise<PaymentResult> {
    // Strip all whitespace from card number
    const cleanNumber = card.cardNumber.replace(/\s+/g, "");

    // Realistic processing latency (700ms - 900ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Card 1: Standard Success
    if (cleanNumber === "4242424242424242") {
      return {
        success: true,
        sessionId: this.generateSessionId(),
      };
    }

    // Card 2: Hard Decline
    if (cleanNumber === "4000000000000002") {
      return {
        success: false,
        errorCode: "CARD_DECLINED",
        errorMessage: "Your card was declined. No money was charged.",
      };
    }

    // Card 3: Fail on 1st attempt, succeed on 2nd attempt in this session
    if (cleanNumber === "4000000000000341") {
      const currentAttempts = this.attemptCounts.get(cleanNumber) || 0;
      this.attemptCounts.set(cleanNumber, currentAttempts + 1);

      if (currentAttempts === 0) {
        return {
          success: false,
          errorCode: "PAYMENT_FAILED",
          errorMessage: "Temporary payment failure. Please retry your card.",
        };
      } else {
        return {
          success: true,
          sessionId: this.generateSessionId(),
        };
      }
    }

    // Fallback: Default test behavior for valid Luhn-like inputs or unrecognized numbers
    if (cleanNumber.length >= 15) {
      return {
        success: true,
        sessionId: this.generateSessionId(),
      };
    }

    return {
      success: false,
      errorCode: "INVALID_CARD",
      errorMessage: "Invalid card number or security code.",
    };
  }

  private generateSessionId(): string {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `sess_demo_${randomSuffix}`;
  }

  public resetSession(): void {
    this.attemptCounts.clear();
  }
}

export const paymentEngine = new PaymentEngine();
