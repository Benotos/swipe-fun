"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Copy, LoaderCircle, ShieldCheck, Zap } from "lucide-react";

type CatalogItem = { id: string; brand: string; valueUsd: number; solAmount: number };
type Quote = { solUsd: number; priceLockSeconds: number; items: CatalogItem[] };
type CreatedOrder = { id: string; status: string; address: string; solAmount: number; expiresAt: string; paymentMode: "mock"; notice: string };

const brands = ["Amazon", "Steam", "Uber", "PlayStation", "Apple"];

export default function CheckoutPage() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selected, setSelected] = useState("amazon-10");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const item = useMemo(() => quote?.items.find(entry => entry.id === selected), [quote, selected]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load prices.");
        if (active) setQuote(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not load prices.");
      } finally { if (active) setLoading(false); }
    };
    load();
    const timer = window.setInterval(load, 45000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!order) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active && data.status !== order.status) setOrder(current => current ? { ...current, status: data.status } : current);
      } catch { /* Keep the current order state visible. */ }
    };
    const timer = window.setInterval(poll, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [order?.id]);

  async function createOrder() {
    if (!item) return;
    setCreating(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create order.");
      setOrder(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create order."); }
    finally { setCreating(false); }
  }

  async function copyAddress() {
    if (!order) return;
    await navigator.clipboard.writeText(order.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const steps = ["waiting", "detected", "confirmed", "delivered"];
  const currentStep = order ? steps.indexOf(order.status) : -1;

  return <main className="checkout-page">
    <header className="checkout-nav">
      <Link href="/" className="checkout-brand"><span><Zap size={16} fill="currentColor" /></span> swipe.fun</Link>
      <span className="checkout-mode"><i /> DEMO CHECKOUT</span>
    </header>
    <div className="checkout-shell">
      <Link href="/" className="checkout-back"><ArrowLeft size={15} /> Back to SWIPE</Link>
      <div className="checkout-heading"><div className="checkout-eyebrow">THE GENESIS DROP / 001</div><h1>Get something<br /><em>real.</em></h1><p>Choose a digital gift card and see the exact SOL quote before creating your order.</p></div>

      <div className="checkout-grid">
        <section className="checkout-panel">
          <div className="checkout-panel-head"><span>01 / CHOOSE YOUR GIFT CARD</span><span>5 BRANDS</span></div>
          <div className="brand-options">{brands.map(brand => <button key={brand} onClick={() => { setSelected(`${brand.toLowerCase()}-10`); setOrder(null); }} className={selected.startsWith(brand.toLowerCase()) ? "brand-option active" : "brand-option"}>{brand}</button>)}</div>
          <div className="value-options">{[10,25,50].map(value => <button key={value} onClick={() => { setSelected(`${(selected.split("-")[0])}-${value}`); setOrder(null); }} className={selected.endsWith(`-${value}`) ? "value-option active" : "value-option"}><span>${value}</span><small>USD</small></button>)}</div>
          <div className="checkout-summary">
            <div><span>GIFT CARD VALUE</span><strong>{item ? `$${item.valueUsd}.00` : "—"}</strong></div>
            <div><span>LIVE SOL QUOTE</span><strong>{item ? `${item.solAmount.toFixed(6)} SOL` : "—"}</strong></div>
            <p>Quote refreshes every 45 seconds. Your order locks its price for 5 minutes.</p>
          </div>
          {error && <div className="checkout-error">{error}</div>}
          {!order ? <button className="checkout-submit" onClick={createOrder} disabled={!item || creating || loading}>{creating ? <><LoaderCircle className="spin" size={16} /> Creating order</> : <>Create order <ArrowUpRight size={17} /></>}</button> : <div className="checkout-created"><Check size={16} /> Order created <span>#{order.id.slice(0,8)}</span></div>}
          <div className="checkout-safe"><ShieldCheck size={15} /> No wallet connection required</div>
        </section>

        <section className="checkout-panel payment-panel">
          <div className="checkout-panel-head"><span>02 / PAYMENT DETAILS</span><span>{order ? "ORDER ACTIVE" : "AWAITING ORDER"}</span></div>
          {!order ? <div className="payment-empty"><div className="payment-icon"><Zap size={26} /></div><h2>Your payment details<br />will appear here.</h2><p>Select a gift card and create an order to continue.</p></div> : <>
            <div className="demo-alert"><strong>DEMO ONLY</strong><span>{order.notice}</span></div>
            <div className="payment-amount"><span>SEND EXACTLY</span><strong>{order.solAmount.toFixed(6)} <i>SOL</i></strong><small>Price lock: {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</small></div>
            <div className="qr-wrap"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(order.address)}`} alt="Demo address QR code" /></div>
            <div className="address-label">DEMO DEPOSIT IDENTIFIER</div>
            <div className="address-copy"><code>{order.address}</code><button onClick={copyAddress} aria-label="Copy demo address">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
            <div className="order-stepper">{steps.map((step,index) => <div key={step} className={index <= currentStep ? "step-active" : ""}><span>{index < currentStep ? <Check size={12}/> : index+1}</span><small>{step}</small></div>)}</div>
            <p className="demo-footnote">This is a visual checkout prototype. Do not send funds. No payment is being monitored and no gift card will be delivered.</p>
            <Link href={`/order/${order.id}`} className="order-link">Open bookmarkable order page <ArrowUpRight size={14}/></Link>
          </>}
        </section>
      </div>
      <footer className="checkout-footer">SWIPE.FUN <span>SPEND DIFFERENT. STAY EARLY.</span></footer>
    </div>
  </main>;
}
