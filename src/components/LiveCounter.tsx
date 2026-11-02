"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Flame } from "lucide-react";

type Stock = { total: number; sold: number; remaining: number; source: "preview" | "database" };

export default function LiveCounter() {
  const [stock, setStock] = useState<Stock>({ total: 500, sold: 0, remaining: 500, source: "preview" });
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const loadStock = async () => {
      try {
        const response = await fetch("/api/stock", { cache: "no-store" });
        if (!response.ok) throw new Error("Inventory unavailable");
        const data = await response.json();
        if (active) { setStock({ total: data.total, sold: data.sold, remaining: data.remaining, source: "database" }); setUnavailable(false); }
      } catch {
        if (active) setUnavailable(true);
      } finally { if (active) setLoading(false); }
    };
    loadStock();
    const interval = window.setInterval(loadStock, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const soldOut = stock.remaining <= 0;
  const progress = stock.total > 0 ? Math.min(100, stock.sold / stock.total * 100) : 0;

  return <div className="counter-card" aria-live="polite">
    <div className="counter-heading"><span><span className="status-dot" /> {stock.source === "database" ? "LIVE INVENTORY" : "PREVIEW INVENTORY"}</span><span className="counter-edition">GENESIS / {stock.total}</span></div>
    <div className="counter-numbers"><div><div className="counter-value">{stock.remaining.toLocaleString("en-US")}</div><div className="counter-caption">ITEMS LEFT</div></div><div className="sold-stat"><strong>{stock.sold.toLocaleString("en-US")}</strong><span>SOLD</span></div></div>
    <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
    <div className="progress-labels"><span>{Math.round(progress)}% claimed</span><span>{stock.total.toLocaleString("en-US")} total</span></div>
    {soldOut ? <div className="counter-button is-sold-out">FIRST DROP SOLD OUT <Flame size={15}/></div> : <Link href="/checkout" className="counter-button is-locked">EXPLORE THE DROP <ArrowUpRight size={15}/></Link>}
    <p className="counter-note">{loading ? "Loading inventory…" : unavailable ? "Database connection required for live inventory. Preview figures shown." : stock.source === "preview" ? "Preview inventory. Confirmed orders will update this counter after database setup." : "Inventory refreshes automatically every 15 seconds."}</p>
  </div>;
}
