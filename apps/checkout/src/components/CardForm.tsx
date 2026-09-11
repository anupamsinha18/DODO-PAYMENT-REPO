import React, { useState } from "react";
import { CardDetails } from "../services/paymentEngine";

interface CardFormProps {
  priceFormatted: string;
  isProcessing: boolean;
  onSubmit: (details: CardDetails) => void;
}

export const CardForm: React.FC<CardFormProps> = ({
  priceFormatted,
  isProcessing,
  onSubmit,
}) => {
  const [email, setEmail] = useState("alex@example.com");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(raw);
  };

  const isCardComplete = cardNumber.replace(/\s/g, "").length >= 15;
  const isExpiryComplete = expiry.length === 7; // "MM / YY"
  const isCvcComplete = cvc.length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValid = isCardComplete && isExpiryComplete && isCvcComplete && isEmailValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isProcessing) return;

    onSubmit({
      email,
      cardNumber,
      expiry,
      cvc,
    });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Detect card brand icon
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s/g, "");
    if (clean.startsWith("4")) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
    return "generic";
  };

  const cardBrand = getCardBrand();

  return (
    <form className="dodo-card-form" onSubmit={handleSubmit} noValidate>
      {/* Email Field */}
      <div className="dodo-form-group">
        <label htmlFor="dodo-email" className="dodo-form-label">
          Email address
        </label>
        <input
          id="dodo-email"
          type="email"
          name="email"
          autoComplete="email"
          disabled={isProcessing}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur("email")}
          className={`dodo-input ${
            touched.email && !isEmailValid ? "dodo-input-error" : ""
          }`}
          required
        />
        {touched.email && !isEmailValid && (
          <span className="dodo-field-error">Please enter a valid email address</span>
        )}
      </div>

      {/* Card Details Section */}
      <div className="dodo-form-group">
        <label htmlFor="dodo-card-number" className="dodo-form-label">
          Card details
        </label>
        
        <div className="dodo-card-input-wrapper">
          <input
            id="dodo-card-number"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={isProcessing}
            placeholder="4242  4242  4242  4242"
            value={cardNumber}
            onChange={handleCardNumberChange}
            onBlur={() => handleBlur("cardNumber")}
            className={`dodo-input dodo-input-card ${
              touched.cardNumber && !isCardComplete ? "dodo-input-error" : ""
            }`}
            required
          />
          <div className="dodo-card-brand-badge" aria-hidden="true">
            {cardBrand === "visa" && (
              <span className="brand-icon visa">VISA</span>
            )}
            {cardBrand === "mastercard" && (
              <span className="brand-icon mc">MC</span>
            )}
            {cardBrand === "generic" && (
              <svg className="brand-icon-svg" width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            )}
          </div>
        </div>

        {/* Row for Expiry & CVC */}
        <div className="dodo-form-row">
          <div className="dodo-form-col">
            <label htmlFor="dodo-expiry" className="dodo-form-sublabel">
              Expiry
            </label>
            <input
              id="dodo-expiry"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              disabled={isProcessing}
              placeholder="MM / YY"
              value={expiry}
              onChange={handleExpiryChange}
              onBlur={() => handleBlur("expiry")}
              className={`dodo-input ${
                touched.expiry && !isExpiryComplete ? "dodo-input-error" : ""
              }`}
              required
            />
          </div>

          <div className="dodo-form-col">
            <label htmlFor="dodo-cvc" className="dodo-form-sublabel">
              CVC
            </label>
            <input
              id="dodo-cvc"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              disabled={isProcessing}
              maxLength={4}
              placeholder="CVC"
              value={cvc}
              onChange={handleCvcChange}
              onBlur={() => handleBlur("cvc")}
              className={`dodo-input ${
                touched.cvc && !isCvcComplete ? "dodo-input-error" : ""
              }`}
              required
            />
          </div>
        </div>
      </div>

      {/* Primary Pay CTA */}
      <button
        type="submit"
        disabled={!isValid || isProcessing}
        className={`dodo-pay-btn ${isProcessing ? "processing" : ""}`}
      >
        {isProcessing ? (
          <span className="dodo-btn-content">
            <span className="dodo-spinner" aria-hidden="true"></span>
            <span>Processing...</span>
          </span>
        ) : (
          <span className="dodo-btn-content">
            <span>Pay {priceFormatted}</span>
          </span>
        )}
      </button>

      {/* Security reassurance banner */}
      <div className="dodo-security-footer">
        <svg
          width="13"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dodo-lock-icon"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Encrypted &amp; secure checkout</span>
      </div>
    </form>
  );
};
