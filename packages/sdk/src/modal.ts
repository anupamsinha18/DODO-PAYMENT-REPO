export interface ModalCallbacks {
  onDismiss: () => void;
  onIframeLoad?: () => void;
  onIframeError?: () => void;
}

export class CheckoutModal {
  private overlay: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private previousActiveElement: HTMLElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private originalBodyOverflow: string = "";

  constructor(
    private checkoutUrl: string,
    private callbacks: ModalCallbacks
  ) {}

  /**
   * Mounts the modal container and initializes the iframe
   */
  public mount(): HTMLIFrameElement {
    // Preserve previously focused element for accessible restoration
    this.previousActiveElement = (document.activeElement as HTMLElement) || null;

    // Prevent background scrolling while modal is open
    this.originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Overlay backdrop
    const overlay = document.createElement("div");
    overlay.id = "dodo-checkout-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Secure Checkout");
    
    // Style overlay
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "2147483647", // Maximum z-index
      opacity: "0",
      transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      padding: "16px",
      boxSizing: "border-box",
    });

    // Container box
    const container = document.createElement("div");
    container.id = "dodo-checkout-container";
    Object.assign(container.style, {
      position: "relative",
      width: "100%",
      maxWidth: "480px",
      height: "640px",
      maxHeight: "calc(100vh - 32px)",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transform: "scale(0.96) translateY(8px)",
      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    });

    // Loading indicator while iframe is loading
    const loader = document.createElement("div");
    loader.id = "dodo-checkout-loader";
    Object.assign(loader.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fafafa",
      zIndex: "1",
      transition: "opacity 0.2s ease-out",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#64748b",
      fontSize: "14px",
      gap: "12px",
    });

    loader.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        border: 2.5px solid #e2e8f0;
        border-top-color: #0f172a;
        border-radius: 50%;
        animation: dodo-spin 0.8s linear infinite;
      "></div>
      <span style="font-weight: 500; letter-spacing: -0.01em;">Loading secure checkout...</span>
      <style>
        @keyframes dodo-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          #dodo-checkout-overlay { transition: none !important; }
          #dodo-checkout-container { transition: none !important; }
          #dodo-checkout-loader div { animation: none !important; }
        }
      </style>
    `;

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.id = "dodo-checkout-iframe";
    iframe.src = this.checkoutUrl;
    iframe.title = "Dodo Secure Checkout";
    iframe.setAttribute("allow", "payment");
    // Standard sandboxing while allowing necessary capabilities
    iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
      display: "block",
      backgroundColor: "#ffffff",
      opacity: "0",
      transition: "opacity 0.2s ease-in",
    });

    iframe.onload = () => {
      // Hide loader and show iframe smoothly
      loader.style.opacity = "0";
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 200);
      iframe.style.opacity = "1";
      iframe.focus();
      this.callbacks.onIframeLoad?.();
    };

    iframe.onerror = () => {
      this.callbacks.onIframeError?.();
    };

    container.appendChild(loader);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Trigger enter animations
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      container.style.transform = "scale(1) translateY(0)";
    });

    // Backdrop click: Dismiss checkout
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.callbacks.onDismiss();
      }
    });

    // Escape key listener for keyboard accessibility
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.callbacks.onDismiss();
      }
    };
    window.addEventListener("keydown", this.keydownHandler);

    this.overlay = overlay;
    this.container = container;
    this.iframe = iframe;

    return iframe;
  }

  public getIframeWindow(): Window | null {
    return this.iframe?.contentWindow || null;
  }

  /**
   * Destroys the modal, animates out, cleans up listeners and restores body state
   */
  public destroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }

    document.body.style.overflow = this.originalBodyOverflow;

    if (this.overlay) {
      this.overlay.style.opacity = "0";
      if (this.container) {
        this.container.style.transform = "scale(0.96) translateY(8px)";
      }

      const overlayRef = this.overlay;
      setTimeout(() => {
        if (overlayRef.parentNode) {
          overlayRef.parentNode.removeChild(overlayRef);
        }
      }, 200);

      this.overlay = null;
      this.container = null;
      this.iframe = null;
    }

    // Restore previous active element focus
    if (this.previousActiveElement && typeof this.previousActiveElement.focus === "function") {
      try {
        this.previousActiveElement.focus();
      } catch {
        // Ignore if element is no longer focusable
      }
      this.previousActiveElement = null;
    }
  }
}
