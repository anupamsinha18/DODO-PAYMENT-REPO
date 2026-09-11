/**
 * Public Merchant SDK Types & Configuration
 */

export interface DodoSuccessPayload {
  sessionId: string;
}

export interface DodoErrorPayload {
  code: 
    | "CARD_DECLINED" 
    | "PAYMENT_FAILED" 
    | "PRODUCT_NOT_FOUND" 
    | "CHECKOUT_LOAD_FAILED" 
    | "COMMUNICATION_ERROR"
    | string;
  message: string;
}

export type DodoCloseReason = "user_closed" | "completed" | "error";

export interface DodoClosePayload {
  reason: DodoCloseReason;
}

export interface DodoCheckoutOptions {
  /** The ID of the product being purchased (e.g., 'prod_123') */
  productId: string;

  /** Optional URL for the checkout application (defaults to http://localhost:5174) */
  checkoutUrl?: string;

  /** Callback fired upon successful payment authorization */
  onSuccess?: (payload: DodoSuccessPayload) => void;

  /** Callback fired when the checkout modal is dismissed or closed */
  onClose?: (payload: DodoClosePayload) => void;

  /** Callback fired if payment fails or an error occurs */
  onError?: (payload: DodoErrorPayload) => void;
}

/**
 * Internal PostMessage Protocol Contracts
 * 
 * Strict schema for messages exchanged between the isolated checkout iframe and the host SDK.
 * Note: SENSITIVE CARD DATA IS NEVER SENT OVER THIS PROTOCOL.
 */

export type DodoInboundEventType = 
  | "DODO_CHECKOUT_READY"
  | "DODO_PAYMENT_SUCCESS"
  | "DODO_PAYMENT_ERROR"
  | "DODO_CHECKOUT_CLOSE";

export interface DodoInboundMessageReady {
  type: "DODO_CHECKOUT_READY";
}

export interface DodoInboundMessageSuccess {
  type: "DODO_PAYMENT_SUCCESS";
  sessionId: string;
}

export interface DodoInboundMessageError {
  type: "DODO_PAYMENT_ERROR";
  code: string;
  message: string;
}

export interface DodoInboundMessageClose {
  type: "DODO_CHECKOUT_CLOSE";
  reason?: DodoCloseReason;
}

export type DodoInboundMessage =
  | DodoInboundMessageReady
  | DodoInboundMessageSuccess
  | DodoInboundMessageError
  | DodoInboundMessageClose;

export type DodoOutboundMessage = {
  type: "DODO_INIT_CHECKOUT";
  productId: string;
};
