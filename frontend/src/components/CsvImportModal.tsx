import { useRef, useState } from "react";
import Modal from "./Modal";
import { usePortfolio } from "../context/PortfolioContext";
import { parseHoldingsCsv, SAMPLE_CSV, CsvImportResult } from "../lib/csv";

export default function CsvImportModal({ onClose }: { onClose: () => void }) {
  const { addHoldings } = usePortfolio();
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setResult(parseHoldingsCsv(text));
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    if (!result || result.holdings.length === 0) return;
    addHoldings(result.holdings);
    onClose();
  }

  function loadSample() {
    setResult(parseHoldingsCsv(SAMPLE_CSV));
  }

  return (
    <Modal title="Import from broker CSV" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-ink70 leading-relaxed">
          Upload a contract-note export from Zerodha, Groww, or Upstox. Expected columns:{" "}
          <span className="text-ink50">symbol, quantity, buyPrice, buyDate</span> (header names are
          matched flexibly).
        </p>

        <div
          className="border border-dashed border-ink-border rounded-md p-6 text-center cursor-pointer hover:border-brand/50 transition-colors"
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <p className="text-sm text-ink50">Click to choose a .csv file</p>
          <p className="text-xs text-ink70 mt-1">or</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadSample();
            }}
            className="mt-2 text-xs text-brand hover:underline"
          >
            Try with sample data
          </button>
        </div>

        {result && (
          <div className="space-y-2">
            <p className="text-xs text-ink50">
              {result.holdings.length} row{result.holdings.length === 1 ? "" : "s"} ready to import
              {result.skipped.length > 0 && `, ${result.skipped.length} skipped`}.
            </p>
            {result.skipped.length > 0 && (
              <ul className="max-h-24 overflow-y-auto text-[11px] text-loss space-y-0.5">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!result || result.holdings.length === 0}
          className="w-full bg-brand text-ink font-medium text-sm rounded-md py-2.5 hover:bg-brand-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Import {result?.holdings.length ?? 0} holding{result?.holdings.length === 1 ? "" : "s"}
        </button>
      </div>
    </Modal>
  );
}
