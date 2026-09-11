import React from "react";

interface TestCardPillsProps {
  onSelectCard: (card: { number: string; exp: string; cvc: string }) => void;
  disabled?: boolean;
}

export const TestCardPills: React.FC<TestCardPillsProps> = ({
  onSelectCard,
  disabled,
}) => {
  return (
    <div className="dodo-test-cards-wrapper" aria-label="Quick test cards">
      <div className="dodo-test-cards-header">
        <span className="dodo-test-badge">DEV SIMULATOR</span>
        <span className="dodo-test-title">One-Click Test Cards</span>
      </div>
      <div className="dodo-test-cards-grid">
        <button
          type="button"
          disabled={disabled}
          className="dodo-pill-btn dodo-pill-success"
          onClick={() =>
            onSelectCard({
              number: "4242 4242 4242 4242",
              exp: "12 / 28",
              cvc: "123",
            })
          }
          title="Click to fill success card: 4242 4242 4242 4242"
        >
          <span className="dodo-pill-indicator green"></span>
          <span>4242 (Success)</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          className="dodo-pill-btn dodo-pill-decline"
          onClick={() =>
            onSelectCard({
              number: "4000 0000 0000 0002",
              exp: "12 / 28",
              cvc: "456",
            })
          }
          title="Click to fill decline card: 4000 0000 0000 0002"
        >
          <span className="dodo-pill-indicator red"></span>
          <span>4000...02 (Decline)</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          className="dodo-pill-btn dodo-pill-failonce"
          onClick={() =>
            onSelectCard({
              number: "4000 0000 0000 0341",
              exp: "12 / 28",
              cvc: "789",
            })
          }
          title="Click to fill fail-once card: 4000 0000 0000 0341"
        >
          <span className="dodo-pill-indicator amber"></span>
          <span>4000...0341 (Fail Once)</span>
        </button>
      </div>
    </div>
  );
};
