type Props = {
  taxAmount: number;
  tipAmount: number;
  onTaxChange: (v: number) => void;
  onTipChange: (v: number) => void;
};

export function TaxTip({ taxAmount, tipAmount, onTaxChange, onTipChange }: Props) {
  return (
    <div className="tax-section">
      <div className="amount-input">
        <label htmlFor="tax-amount">Total Tax Amount: $</label>
        <input
          id="tax-amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={taxAmount || ''}
          onChange={(e) => onTaxChange(parseFloat(e.target.value) || 0)}
          min={0}
        />
      </div>
      <div className="amount-input">
        <label htmlFor="tip-amount">Total Tip Amount: $</label>
        <input
          id="tip-amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={tipAmount || ''}
          onChange={(e) => onTipChange(parseFloat(e.target.value) || 0)}
          min={0}
        />
      </div>
    </div>
  );
}
