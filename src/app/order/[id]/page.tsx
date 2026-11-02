"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, LoaderCircle, Zap } from "lucide-react";

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Order unavailable.");
        if (active) setOrder(data);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Order unavailable."); }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [params.id]);

  async function copyCode() {
    if (!order?.giftCardCode) return;
    await navigator.clipboard.writeText(order.giftCardCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return <main className="checkout-page"><header className="checkout-nav"><Link href="/" className="checkout-brand"><span><Zap size={16} fill="currentColor"/></span> swipe.fun</Link><span className="checkout-mode"><i/> ORDER STATUS</span></header><div className="order-page-shell"><Link href="/checkout" className="checkout-back"><ArrowLeft size={15}/> Back to checkout</Link><div className="checkout-eyebrow">SWIPE ORDER / {params.id.slice(0,8).toUpperCase()}</div><h1 className="order-page-title">Your order<br/><em>is in progress.</em></h1>{error ? <div className="checkout-error">{error}</div> : !order ? <div className="payment-empty"><LoaderCircle className="spin"/> Loading order details…</div> : <section className="checkout-panel order-detail"><div className="checkout-panel-head"><span>{order.item?.brand} GIFT CARD</span><span>{order.status.toUpperCase()}</span></div><div className="payment-amount"><span>ORDER VALUE</span><strong>${order.item?.valueUsd}.00 <i>USD</i></strong></div>{order.giftCardCode ? <><div className="address-label">YOUR GIFT CARD CODE</div><div className="address-copy"><code>{order.giftCardCode}</code><button onClick={copyCode}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button></div></> : <><div className="demo-alert"><strong>DEMO ORDER</strong><span>No real payment or delivery is connected yet. This order is for interface testing only.</span></div><p className="demo-footnote">Status: {order.status}. Your order link is bookmarkable and can be revisited at any time.</p></>}</section>}</div></main>;
}
