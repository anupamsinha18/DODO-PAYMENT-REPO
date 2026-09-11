import React, { useEffect, useState } from "react";
import { getProductById, Product } from "./services/products";
import { paymentEngine, CardDetails } from "./services/paymentEngine";
import { CardForm } from "./components/CardForm";
import { TestCardPills } from "./components/TestCardPills";
import "./styles/checkout.css";

type CheckoutState =
  | "loading"
  | "invalid_product"
  | "ready"
  | "processing"
  | "success"
  | "error";

interface ErrorInfo {
  code: string;
  message: string;
}

export const App: React.FC = () => {
  const [productId, setProductId] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<CheckoutState>("loading");
  const [lastSessionId, setLastSessionId] = useState<string>("");
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);

  // Send message safely to parent window (SDK)
  const notifyParent = (message: any) => {
    if (window.parent && window.parent !== window) {
      // In production, target the configured merchant origin
      window.parent.postMessage(message, "*");
    }
  };

  // Close checkout
  const handleClose = (reason: "user_closed" | "completed" | "error" = "user_closed") => {
    notifyParent({
      type: "DODO_CHECKOUT_CLOSE",
      reason,
    });
  };

  // Initialize product from URL params or handshake
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialProductId = params.get("productId") || "prod_123";
    setProductId(initialProductId);

    const loadedProduct = getProductById(initialProductId);
    if (loadedProduct) {
      setProduct(loadedProduct);
      setState("ready");
    } else {
      setState("invalid_product");
    }

    // Announce to SDK that the checkout iframe is ready
    notifyParent({ type: "DODO_CHECKOUT_READY" });

    // Listen for messages from SDK
    const messageListener = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === "DODO_INIT_CHECKOUT" && data.productId) {
        setProductId(data.productId);
        const p = getProductById(data.productId);
        if (p) {
          setProduct(p);
          setState("ready");
        } else {
          setState("invalid_product");
        }
      }
    };

    window.addEventListener("message", messageListener);
    return () => {
      window.removeEventListener("message", messageListener);
    };
  }, []);

  // Form submission handler
  const handlePaymentSubmit = async (card: CardDetails) => {
    if (!product || state === "processing") return;

    setState("processing");
    setLastError(null);

    const result = await paymentEngine.processPayment(product.id, card);

    if (result.success && result.sessionId) {
      setLastSessionId(result.sessionId);
      setState("success");
      notifyParent({
        type: "DODO_PAYMENT_SUCCESS",
        sessionId: result.sessionId,
      });
    } else {
      const errInfo: ErrorInfo = {
        code: result.errorCode || "PAYMENT_FAILED",
        message: result.errorMessage || "Payment could not be processed. Please check your details and try again.",
      };
      setLastError(errInfo);
      setState("error");
      notifyParent({
        type: "DODO_PAYMENT_ERROR",
        code: errInfo.code,
        message: errInfo.message,
      });
    }
  };

  return (
    <div className="dodo-checkout-app">
      {/* Header */}
      <header className="dodo-header">
        <div className="dodo-brand">
          <div className="dodo-logo-icon" aria-hidden="true">D</div>
          <span className="dodo-brand-name">Dodo Checkout</span>
        </div>
        <button
          type="button"
          onClick={() => handleClose(state === "success" ? "completed" : "user_closed")}
          className="dodo-close-btn"
          aria-label="Close checkout"
          title="Close (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Main Body */}
      <div className="dodo-body">
        {/* State: Loading */}
        {state === "loading" && (
          <div className="dodo-state-view">
            <div className="dodo-spinner" style={{ borderColor: "#cbd5e1", borderTopColor: "#0f172a", width: 28, height: 28 }}></div>
            <p className="dodo-state-subtitle" style={{ marginTop: 16 }}>Loading order details...</p>
          </div>
        )}

        {/* State: Invalid Product */}
        {state === "invalid_product" && (
          <div className="dodo-state-view">
            <div className="dodo-success-icon-box" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="dodo-state-title">Product Unavailable</h2>
            <p className="dodo-state-subtitle">
              The product identifier <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{productId}</code> could not be found or is no longer active.
            </p>
            <button
              type="button"
              className="dodo-secondary-btn"
              onClick={() => handleClose("error")}
            >
              Close Window
            </button>
          </div>
        )}

        {/* State: Success */}
        {state === "success" && (
          <div className="dodo-state-view">
            <div className="dodo-success-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="dodo-state-title">Payment Successful</h2>
            <p className="dodo-state-subtitle">
              Your payment has been confirmed. A receipt has been sent to your email.
            </p>
            <div className="dodo-session-badge" title="Payment Session ID">
              <span>Session:</span>
              <strong>{lastSessionId}</strong>
            </div>
            <button
              type="button"
              className="dodo-pay-btn"
              style={{ width: "100%" }}
              onClick={() => handleClose("completed")}
            >
              Done
            </button>
          </div>
        )}

        {/* State: Ready / Processing / Error */}
        {product && (state === "ready" || state === "processing" || state === "error") && (
          <>
            {/* Product Summary */}
            <section className="dodo-product-summary">
              <div className="dodo-product-title-row">
                <h1 className="dodo-product-name">{product.name}</h1>
                <span className="dodo-product-price">{product.priceFormatted}</span>
              </div>
              <p className="dodo-product-desc">{product.description}</p>
            </section>

            {/* Error Alert Banner if payment failed/declined */}
            {state === "error" && lastError && (
              <div className="dodo-error-banner" role="alert">
                <svg className="dodo-error-banner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="dodo-error-banner-content">
                  <div className="dodo-error-banner-title">
                    {lastError.code === "CARD_DECLINED" ? "Payment Declined" : "Payment Failed"}
                  </div>
                  <div className="dodo-error-banner-desc">
                    {lastError.message}
                  </div>
                </div>
              </div>
            )}

            {/* Card Form */}
            <CardForm
              priceFormatted={product.priceFormatted}
              isProcessing={state === "processing"}
              onSubmit={handlePaymentSubmit}
            />

            {/* Test Cards Quick Simulator */}
            <TestCardPills
              disabled={state === "processing"}
              onSelectCard={(card) => {
                // Pre-fill inputs programmatically
                const cardInput = document.getElementById("dodo-card-number") as HTMLInputElement;
                const expInput = document.getElementById("dodo-expiry") as HTMLInputElement;
                const cvcInput = document.getElementById("dodo-cvc") as HTMLInputElement;
                if (cardInput && expInput && cvcInput) {
                  // Dispatch input events so react state updates
                  const setNativeValue = (element: HTMLInputElement, value: string) => {
                    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
                    const prototype = Object.getPrototypeOf(element);
                    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
                    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
                      prototypeValueSetter.call(element, value);
                    } else if (valueSetter) {
                      valueSetter.call(element, value);
                    } else {
                      element.value = value;
                    }
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                  };
                  setNativeValue(cardInput, card.number);
                  setNativeValue(expInput, card.exp);
                  setNativeValue(cvcInput, card.cvc);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
