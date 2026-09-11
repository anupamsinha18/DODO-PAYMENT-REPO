import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DodoCheckout } from "./index";
import { Messenger } from "./messenger";

describe("DodoCheckout SDK", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    DodoCheckout.close();
  });

  it("mounts checkout iframe and overlay when open is called", () => {
    DodoCheckout.open({
      productId: "prod_123",
    });

    const overlay = document.getElementById("dodo-checkout-overlay");
    const iframe = document.getElementById("dodo-checkout-iframe") as HTMLIFrameElement;

    expect(overlay).not.toBeNull();
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toContain("productId=prod_123");
  });

  it("prevents duplicate checkout instances on repeated open() calls", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    DodoCheckout.open({ productId: "prod_123" });
    DodoCheckout.open({ productId: "prod_456" });

    const overlays = document.querySelectorAll("#dodo-checkout-overlay");
    expect(overlays.length).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("A checkout instance is already open")
    );
  });

  it("cleans up modal from DOM when close is called", () => {
    const onClose = vi.fn();
    DodoCheckout.open({
      productId: "prod_123",
      onClose,
    });

    expect(document.getElementById("dodo-checkout-overlay")).not.toBeNull();
    DodoCheckout.close("user_closed");

    expect(onClose).toHaveBeenCalledWith({ reason: "user_closed" });
  });
});

describe("Messenger Security Validation", () => {
  it("drops messages from untrusted origins", () => {
    const onMessage = vi.fn();
    const fakeIframeWindow = {} as Window;

    const messenger = new Messenger({
      expectedOrigin: "http://localhost:5174",
      getIframeWindow: () => fakeIframeWindow,
      onMessage,
    });

    messenger.start();

    // Dispatch message with attacker origin
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "DODO_PAYMENT_SUCCESS", sessionId: "sess_fake" },
        origin: "http://malicious-site.com",
        source: fakeIframeWindow,
      })
    );

    expect(onMessage).not.toHaveBeenCalled();
    messenger.destroy();
  });

  it("drops messages from untrusted window sources", () => {
    const onMessage = vi.fn();
    const fakeIframeWindow = {} as Window;
    const rogueWindow = {} as Window;

    const messenger = new Messenger({
      expectedOrigin: "http://localhost:5174",
      getIframeWindow: () => fakeIframeWindow,
      onMessage,
    });

    messenger.start();

    // Dispatch message with correct origin but rogue window source
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "DODO_PAYMENT_SUCCESS", sessionId: "sess_fake" },
        origin: "http://localhost:5174",
        source: rogueWindow,
      })
    );

    expect(onMessage).not.toHaveBeenCalled();
    messenger.destroy();
  });

  it("accepts valid messages with matching origin and source window", () => {
    const onMessage = vi.fn();
    const fakeIframeWindow = {} as Window;

    const messenger = new Messenger({
      expectedOrigin: "http://localhost:5174",
      getIframeWindow: () => fakeIframeWindow,
      onMessage,
    });

    messenger.start();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "DODO_PAYMENT_SUCCESS", sessionId: "sess_test123" },
        origin: "http://localhost:5174",
        source: fakeIframeWindow,
      })
    );

    expect(onMessage).toHaveBeenCalledWith({
      type: "DODO_PAYMENT_SUCCESS",
      sessionId: "sess_test123",
    });

    messenger.destroy();
  });
});
