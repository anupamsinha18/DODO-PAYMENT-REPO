import React, { useState } from "react";
import { DodoCheckout, DodoSuccessPayload, DodoErrorPayload, DodoClosePayload } from "@dodo/sdk";
import "./styles/demo.css";

interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: "OPENED" | "SUCCESS" | "ERROR" | "CLOSED";
  details: string;
}

export const App: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const addLog = (type: ActivityLogItem["type"], details: string) => {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newEntry: ActivityLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      type,
      details,
    };

    setLogs((prev) => [newEntry, ...prev]);
  };

  const getCheckoutUrl = () => {
    if (import.meta.env.VITE_CHECKOUT_URL) {
      return import.meta.env.VITE_CHECKOUT_URL;
    }
    if (window.location.hostname.includes("github.io")) {
      return `${window.location.origin}/DODO-PAYMENT-REPO/checkout/`;
    }
    return "http://localhost:5174";
  };

  const handleBuy = (productId: string) => {
    addLog("OPENED", `Checkout initiated for productId: "${productId}"`);

    DodoCheckout.open({
      productId,
      // Target live deployed checkout URL, GitHub Pages subpath, or local dev
      checkoutUrl: getCheckoutUrl(),
      onSuccess: (data: DodoSuccessPayload) => {
        addLog("SUCCESS", `sessionId: ${data.sessionId}`);
      },
      onError: (err: DodoErrorPayload) => {
        addLog("ERROR", `[${err.code}] ${err.message}`);
      },
      onClose: (data: DodoClosePayload) => {
        addLog("CLOSED", `reason: "${data.reason}"`);
      },
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="demo-layout">
      {/* Navbar */}
      <nav className="demo-navbar">
        <div className="demo-brand-container">
          <div className="demo-brand-logo">D</div>
          <span className="demo-brand-title">Dodo</span>
        </div>
        <span className="demo-nav-badge">Merchant Store Demo</span>
      </nav>

      {/* Main Page */}
      <main className="demo-main">
        {/* Hero */}
        <section className="demo-hero">
          <span className="demo-hero-tag">Embeddable Checkout SDK Demo</span>
          <h1 className="demo-hero-title">Developer Infrastructure for Modern Teams</h1>
          <p className="demo-hero-subtitle">
            Ship faster with managed environments, preview deploys, and instant rollbacks. Choose a plan to test the Dodo Tiny Checkout SDK flow.
          </p>
        </section>

        {/* Products Grid */}
        <section className="demo-grid" aria-label="Product Pricing">
          {/* Card 1: Standard Pro */}
          <div className="demo-card featured">
            <span className="demo-badge-popular">MOST POPULAR</span>
            <div className="demo-card-header">
              <h2 className="demo-card-title">Premium Developer Plan</h2>
              <p className="demo-card-desc">
                Everything you need to build and scale modern web applications with speed.
              </p>
            </div>
            <div className="demo-card-price-box">
              <span className="demo-card-price">$49.00</span>
              <span className="demo-card-price-sub">/ month</span>
            </div>
            <ul className="demo-card-features">
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited cloud dev sandboxes
              </li>
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Instant preview deployments
              </li>
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Community Discord access
              </li>
            </ul>
            <button
              type="button"
              className="demo-buy-btn"
              onClick={() => handleBuy("prod_123")}
            >
              Buy now ($49.00)
            </button>
          </div>

          {/* Card 2: Enterprise Team */}
          <div className="demo-card">
            <div className="demo-card-header">
              <h2 className="demo-card-title">Team Enterprise License</h2>
              <p className="demo-card-desc">
                Dedicated infrastructure, custom security policies, and 24/7 priority support.
              </p>
            </div>
            <div className="demo-card-price-box">
              <span className="demo-card-price">$149.00</span>
              <span className="demo-card-price-sub">/ month</span>
            </div>
            <ul className="demo-card-features">
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Up to 25 team seats
              </li>
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Custom domain isolation &amp; SSO
              </li>
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                99.99% SLA &amp; dedicated manager
              </li>
            </ul>
            <button
              type="button"
              className="demo-buy-btn secondary"
              onClick={() => handleBuy("prod_team")}
            >
              Buy team license ($149.00)
            </button>
          </div>

          {/* Card 3: Test Error / Edge Case */}
          <div className="demo-card">
            <div className="demo-card-header">
              <h2 className="demo-card-title">Edge Case Tester</h2>
              <p className="demo-card-desc">
                Simulates an invalid or missing product ID to verify graceful SDK fallback.
              </p>
            </div>
            <div className="demo-card-price-box">
              <span className="demo-card-price" style={{ color: "#e11d48" }}>$0.00</span>
              <span className="demo-card-price-sub">(Unknown SKU)</span>
            </div>
            <ul className="demo-card-features">
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Tests <code>prod_invalid_999</code>
              </li>
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Verifies "Product unavailable" state
              </li>
              <li className="demo-card-feature-item">
                <svg className="demo-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Tests clean error close handling
              </li>
            </ul>
            <button
              type="button"
              className="demo-buy-btn invalid-btn"
              onClick={() => handleBuy("prod_invalid_999")}
            >
              Test Invalid Product
            </button>
          </div>
        </section>

        {/* Developer Activity Feed & Test Cards Cheatsheet */}
        <section className="demo-panels-container">
          {/* Real-time SDK callback log */}
          <div className="demo-panel-box">
            <div className="demo-panel-header">
              <div className="demo-panel-title-group">
                <span className="demo-panel-title">SDK Callback Activity Log</span>
              </div>
              {logs.length > 0 && (
                <button
                  type="button"
                  className="demo-clear-btn"
                  onClick={() => setLogs([])}
                >
                  Clear Log
                </button>
              )}
            </div>

            <div className="demo-log-feed">
              {logs.length === 0 ? (
                <div className="demo-log-empty">
                  No events yet. Click "Buy now" to trigger the SDK checkout flow.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`demo-log-entry ${
                      log.type === "SUCCESS"
                        ? "success"
                        : log.type === "ERROR"
                        ? "error"
                        : log.type === "CLOSED"
                        ? "closed"
                        : ""
                    }`}
                  >
                    <div className="demo-log-top">
                      <span
                        className={`demo-log-tag ${
                          log.type === "SUCCESS"
                            ? "success"
                            : log.type === "ERROR"
                            ? "error"
                            : log.type === "CLOSED"
                            ? "closed"
                            : ""
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="demo-log-time">{log.timestamp}</span>
                    </div>
                    <div className="demo-log-payload">{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Test Card Reference */}
          <div className="demo-panel-box">
            <div className="demo-panel-header">
              <div className="demo-panel-title-group">
                <span className="demo-panel-title">Test Payment Cards</span>
              </div>
            </div>

            <div>
              <div className="demo-test-card-item">
                <div className="demo-test-card-left">
                  <span className="demo-test-card-num">4242 4242 4242 4242</span>
                  <span className="demo-test-card-desc">Always succeeds (generates session ID)</span>
                </div>
                <button
                  type="button"
                  className="demo-copy-btn"
                  onClick={() => copyToClipboard("4242424242424242", 1)}
                >
                  {copiedIndex === 1 ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="demo-test-card-item">
                <div className="demo-test-card-left">
                  <span className="demo-test-card-num">4000 0000 0000 0002</span>
                  <span className="demo-test-card-desc">Hard decline (CARD_DECLINED)</span>
                </div>
                <button
                  type="button"
                  className="demo-copy-btn"
                  onClick={() => copyToClipboard("4000000000000002", 2)}
                >
                  {copiedIndex === 2 ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="demo-test-card-item">
                <div className="demo-test-card-left">
                  <span className="demo-test-card-num">4000 0000 0000 0341</span>
                  <span className="demo-test-card-desc">Fails on 1st attempt, succeeds on retry</span>
                </div>
                <button
                  type="button"
                  className="demo-copy-btn"
                  onClick={() => copyToClipboard("4000000000000341", 3)}
                >
                  {copiedIndex === 3 ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Integration snippet */}
        <section className="demo-snippet-box">
          <div className="demo-snippet-title">Merchant Integration Code</div>
          <pre className="demo-snippet-code">
{`DodoCheckout.open({
  productId: "prod_123",
  onSuccess: ({ sessionId }) => {
    console.log("Payment successful:", sessionId);
  },
  onError: ({ code, message }) => {
    console.error("Payment failed:", code, message);
  },
  onClose: ({ reason }) => {
    console.log("Checkout closed:", reason);
  }
});`}
          </pre>
        </section>
      </main>
    </div>
  );
};

export default App;
