import { DodoInboundMessage, DodoOutboundMessage } from "./types";

export interface MessengerOptions {
  expectedOrigin: string;
  getIframeWindow: () => Window | null;
  onMessage: (msg: DodoInboundMessage) => void;
}

export class Messenger {
  private expectedOrigin: string;
  private getIframeWindow: () => Window | null;
  private onMessage: (msg: DodoInboundMessage) => void;
  private listener: ((event: MessageEvent) => void) | null = null;

  constructor(options: MessengerOptions) {
    this.expectedOrigin = options.expectedOrigin;
    this.getIframeWindow = options.getIframeWindow;
    this.onMessage = options.onMessage;
  }

  /**
   * Starts listening for postMessage events from the isolated iframe.
   * Performs strict validation on event.origin, event.source, and message structure.
   */
  public start(): void {
    if (this.listener) return;

    this.listener = (event: MessageEvent) => {
      // 1. Origin Security Validation:
      // Drop any messages not strictly from the expected checkout origin
      if (this.expectedOrigin !== "*" && event.origin !== this.expectedOrigin) {
        return;
      }

      // 2. Window Source Security Validation:
      // Drop any messages not originating from our active iframe's contentWindow
      const iframeWindow = this.getIframeWindow();
      if (!iframeWindow || event.source !== iframeWindow) {
        return;
      }

      // 3. Message Schema Validation:
      const data = event.data;
      if (!data || typeof data !== "object") {
        return;
      }

      if (typeof data.type !== "string" || !data.type.startsWith("DODO_")) {
        return;
      }

      // Safe validated event dispatch
      this.onMessage(data as DodoInboundMessage);
    };

    window.addEventListener("message", this.listener);
  }

  /**
   * Safely dispatches a message to the checkout iframe targeting its specific origin.
   */
  public send(msg: DodoOutboundMessage): void {
    const iframeWindow = this.getIframeWindow();
    if (!iframeWindow) return;

    iframeWindow.postMessage(msg, this.expectedOrigin);
  }

  /**
   * Cleans up the window message listener.
   */
  public destroy(): void {
    if (this.listener) {
      window.removeEventListener("message", this.listener);
      this.listener = null;
    }
  }
}
