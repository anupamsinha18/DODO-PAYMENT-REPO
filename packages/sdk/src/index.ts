import { CheckoutModal } from "./modal";
import { Messenger } from "./messenger";
import {
  DodoCheckoutOptions,
  DodoInboundMessage,
  DodoCloseReason,
} from "./types";

export * from "./types";

/**
 * Global DodoCheckout SDK instance controller.
 * Enforces singleton checkout lifecycle, strict security boundaries,
 * and predictable host callbacks.
 */
class DodoCheckoutManager {
  private activeModal: CheckoutModal | null = null;
  private activeMessenger: Messenger | null = null;
  private activeOptions: DodoCheckoutOptions | null = null;
  private hasSucceeded: boolean = false;
  private loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly DEFAULT_CHECKOUT_URL = "http://localhost:5174";

  /**
   * Opens the embedded Dodo Checkout modal for the specified product.
   * If a checkout is already open, it prevents duplicate instances.
   */
  public open(options: DodoCheckoutOptions): void {
    if (!options || typeof options.productId !== "string" || !options.productId.trim()) {
      options?.onError?.({
        code: "INVALID_ARGUMENT",
        message: "productId is required to open Dodo Checkout.",
      });
      return;
    }

    // Prevent duplicate modals if already active
    if (this.activeModal) {
      console.warn("[DodoCheckout] A checkout instance is already open. Ignoring duplicate request.");
      return;
    }

    this.activeOptions = options;
    this.hasSucceeded = false;

    const rawUrl = options.checkoutUrl || this.DEFAULT_CHECKOUT_URL;
    let checkoutOrigin: string;

    try {
      const parsedUrl = new URL(rawUrl, window.location.href);
      checkoutOrigin = parsedUrl.origin;
    } catch {
      checkoutOrigin = "http://localhost:5174";
    }

    // Build URL with initial query param so the checkout knows the product immediately
    // Note: Never pass sensitive or card data via URL
    const targetUrl = new URL(rawUrl, window.location.href);
    targetUrl.searchParams.set("productId", options.productId);

    // Initialize Messenger
    this.activeMessenger = new Messenger({
      expectedOrigin: checkoutOrigin,
      getIframeWindow: () => this.activeModal?.getIframeWindow() || null,
      onMessage: (msg: DodoInboundMessage) => this.handleInboundMessage(msg),
    });
    this.activeMessenger.start();

    // Initialize Modal
    this.activeModal = new CheckoutModal(targetUrl.toString(), {
      onDismiss: () => {
        this.close("user_closed");
      },
      onIframeLoad: () => {
        if (this.loadTimeoutId) {
          clearTimeout(this.loadTimeoutId);
          this.loadTimeoutId = null;
        }
      },
      onIframeError: () => {
        this.handleCheckoutError("CHECKOUT_LOAD_FAILED", "Failed to load checkout application.");
        this.close("error");
      },
    });

    this.activeModal.mount();

    // Set a safety timeout for checkout iframe initialization
    this.loadTimeoutId = setTimeout(() => {
      if (this.activeModal && !this.hasSucceeded) {
        console.warn("[DodoCheckout] Checkout load handshake timed out.");
      }
    }, 12000);
  }

  /**
   * Closes the active checkout modal and tears down all listeners.
   */
  public close(reason?: DodoCloseReason): void {
    if (!this.activeModal) return;

    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = null;
    }

    const finalReason: DodoCloseReason =
      reason || (this.hasSucceeded ? "completed" : "user_closed");

    const onCloseCallback = this.activeOptions?.onClose;

    // Teardown DOM & communications
    this.activeMessenger?.destroy();
    this.activeMessenger = null;

    this.activeModal.destroy();
    this.activeModal = null;

    this.activeOptions = null;
    this.hasSucceeded = false;

    // Fire host close callback
    try {
      onCloseCallback?.({ reason: finalReason });
    } catch (err) {
      console.error("[DodoCheckout] Error in merchant onClose callback:", err);
    }
  }

  private handleInboundMessage(msg: DodoInboundMessage): void {
    switch (msg.type) {
      case "DODO_CHECKOUT_READY": {
        // Send handshake initialization message to iframe
        if (this.activeOptions) {
          this.activeMessenger?.send({
            type: "DODO_INIT_CHECKOUT",
            productId: this.activeOptions.productId,
          });
        }
        break;
      }

      case "DODO_PAYMENT_SUCCESS": {
        this.hasSucceeded = true;
        try {
          this.activeOptions?.onSuccess?.({
            sessionId: msg.sessionId,
          });
        } catch (err) {
          console.error("[DodoCheckout] Error in merchant onSuccess callback:", err);
        }
        break;
      }

      case "DODO_PAYMENT_ERROR": {
        this.handleCheckoutError(msg.code, msg.message);
        break;
      }

      case "DODO_CHECKOUT_CLOSE": {
        this.close(msg.reason || (this.hasSucceeded ? "completed" : "user_closed"));
        break;
      }

      default:
        // Ignore unhandled messages
        break;
    }
  }

  private handleCheckoutError(code: string, message: string): void {
    try {
      this.activeOptions?.onError?.({
        code,
        message,
      });
    } catch (err) {
      console.error("[DodoCheckout] Error in merchant onError callback:", err);
    }
  }
}

export const DodoCheckout = new DodoCheckoutManager();
export default DodoCheckout;
