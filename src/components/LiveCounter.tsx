"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Flame } from "lucide-react";

type Stock = {
  total: number;
  sold: number;
  remaining: number;
  source: "preview" | "database";
};

export default function LiveCounter() {
  const [stock, setStock] = useState<Stock>({ total: 500, sold: 0, remaining: 500, source: "preview" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadStock = async () => {
      try {
        const response = await fetch("/api/stock", { cache: "no-store" });
        if (!response.ok) throw new Error("Stock unavailable");
        const data: Stock = await response.json();
        if (active) setStock(data);
      } catch {
        // Keep the last known count visible if the endpoint is temporarily unavailable.
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStock();
    const interval = window.setInterval(loadStock, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const soldOut = stock.remaining <= 0;
  const progress = stock.total > 0 ? Math.min(100, stock.sold / stock.total * 100) : 0;

  return (
    <div className="counter-card" aria-live="polite">
      <div className="counter-heading">
        <span><span className="status-dot" /> {stock.source === "database" ? "LIVE INVENTORY" : "DROP PREVIEW"}</span>
        <span className="counter-edition">GENESIS / {stock.total}</span>
      </div>
      <div className="counter-numbers">
        <div><div className="counter-value">{stock.remaining.toLocaleString("en-US")}</div><div className="counter-caption">ITEMS LEFT</div></div>
        <div className="sold-stat"><strong>{stock.sold.toLocaleString("en-US")}</strong><span>SOLD</span></div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="progress-labels"><span>{Math.round(progress)}% claimed</span><span>{stock.total.toLocaleString("en-US")} total</span></div>
      <div className={`counter-button ${soldOut ? "is-sold-out" : "is-locked"}`}>
        {soldOut ? "FIRST DROP SOLD OUT" : "PURCHASE FLOW OPENING SOON"} {soldOut ? <Flame size={15} /> : <ArrowUpRight size={15} />}
      </div>
      <p className="counter-note">{loading ? "Checking inventory…" : stock.source === "preview" ? "Preview inventory. Confirmed sales will update this counter when the order system is connected." : "Inventory refreshes automatically every 15 seconds."}</p>
    </div>
  );
}
