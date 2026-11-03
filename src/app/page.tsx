"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Copy, CreditCard, Gift, Globe2, MoveUpRight, ShieldCheck, Sparkles, Wallet, Zap } from "lucide-react";
import LiveCounter from "@/components/LiveCounter";

const steps = [
  { number: "01", title: "Choose what you want", body: "Pick a digital gift card from the catalog. See the value and exact SOL amount before you pay.", icon: Gift },
  { number: "02", title: "Send SOL. That's it.", body: "Get a one time deposit address for your order. Scan the QR or copy the address. No wallet connection.", icon: Wallet },
  { number: "03", title: "Your code lands here", body: "We detect the payment, confirm it on Solana and deliver your digital code to your order page.", icon: CreditCard }
];

const brands = ["AMAZON", "STEAM", "UBER", "PLAYSTATION", "APPLE"];
const SWIPE_TOKEN_CA = "2zCEgd1ntVwVEhYkpBE9csGVQxnuE8pmAWHJYkVupump";

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [caCopied, setCaCopied] = useState(false);

  async function copyTokenAddress() {
    try {
      await navigator.clipboard.writeText(SWIPE_TOKEN_CA);
      setCaCopied(true);
    } catch {
      setCaCopied(false);
    }
  }

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let mounted = true;
    import("gsap").then(({ gsap }) => {
      if (!mounted || !root.current) return;
      ctx = gsap.context(() => {
        gsap.fromTo(".reveal", { y: 28, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.85, stagger: 0.11, ease: "power3.out"
        });
        gsap.to(".hero-orb", { rotate: 360, duration: 36, repeat: -1, ease: "none" });
        gsap.to(".hero-card-main", { y: -12, rotate: -3, duration: 3.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".hero-card-back", { y: 10, rotate: 8, duration: 4.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }, root);
    });
    return () => { mounted = false; ctx?.revert(); };
  }, []);

  return (
    <main ref={root} className="site-root">
      <div className="grain" />
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <nav className="nav shell">
        <a href="#" className="brand" aria-label="Swipe home">
          <span className="brand-symbol"><Zap size={17} fill="currentColor" /></span>
          <span className="brand-name">swipe<span>.</span>fun</span>
        </a>
        <div className="nav-center"><a href="#how">How it works</a><a href="#drop">Genesis drop</a><a href="#utility">The utility</a></div>
        <a href="/checkout" className="nav-button">Explore the drop <ArrowUpRight size={15} /></a>
      </nav>

      <section className="hero shell">
        <div className="hero-content">
          <div className="eyebrow reveal"><span className="eyebrow-pulse" /> THE REAL WORLD, ON SOLANA <span className="eyebrow-rule" /> 001 / GENESIS</div>
          <h1 className="reveal">Crypto should<br />buy <em>real things.</em></h1>
          <p className="hero-lede reveal">Your SOL gets you more than another token. Turn it into gift cards and everyday digital essentials. No wallet connection. No runaround.</p>
          <div className="hero-actions reveal">
            <a className="button button-lime" href="/checkout">Get early access <ArrowUpRight size={17} /></a>
            <a className="text-link" href="#how">See how it works <ArrowDownRight size={16} /></a>
          </div>
          <div className="token-ca reveal">
            <div className="token-ca-heading"><span className="token-ca-dot" /> SWIPE TOKEN <span className="token-ca-network">SOLANA</span></div>
            <div className="token-ca-row">
              <code title={SWIPE_TOKEN_CA}>{SWIPE_TOKEN_CA}</code>
              <button type="button" onClick={copyTokenAddress} aria-label="Copy SWIPE token contract address">
                {caCopied ? <Check size={14} /> : <Copy size={14} />}
                {caCopied ? "COPIED" : "COPY CA"}
              </button>
            </div>
            <span className="token-ca-caption">OFFICIAL CONTRACT ADDRESS</span>
          </div>
          <div className="hero-assurance reveal"><span><ShieldCheck size={15} /> Simple Solana payments</span><i /><span>No wallet connect</span><i /><span>Digital delivery</span></div>
        </div>

        <div className="hero-visual reveal">
          <div className="visual-grid" />
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="visual-index"><span>SWIPE / 001</span><span>PAY DIFFERENT.</span></div>
          <div className="hero-card hero-card-back">
            <div className="mini-card-top"><span>swipe.fun</span><span>02 / 500</span></div>
            <div className="mini-card-chip" />
            <div className="mini-card-bottom"><span>REAL WORLD UTILITY</span><span>◎ SOL</span></div>
          </div>
          <div className="hero-card hero-card-main">
            <div className="card-topline"><span className="card-logo"><Zap size={15} fill="currentColor" /> SWIPE.FUN</span><span className="card-edition">GENESIS MEMBER</span></div>
            <div className="card-middle"><div className="card-emblem"><Zap size={44} fill="currentColor" /></div><div className="card-title">SPEND<br /><span>YOUR SOL.</span></div></div>
            <div className="card-bottomline"><span>ONE TAP FROM SOMETHING REAL</span><span className="card-number">001 — 500</span></div>
            <div className="card-gloss" />
          </div>
          <div className="float-pill pill-top"><span className="pill-icon"><Sparkles size={13} /></span> FIRST EDITION / 500</div>
          <div className="float-pill pill-bottom"><span className="status-dot" /> BUILT FOR THE REAL WORLD</div>
          <div className="visual-caption">A NEW WAY TO SPEND <span>↗</span></div>
        </div>
      </section>

      <section className="brand-band">
        <div className="shell brand-band-inner"><span className="band-label">SHOP THE THINGS YOU KNOW</span><div className="brand-marquee">{brands.map((brand) => <span key={brand}>{brand}<b>✳</b></span>)}</div><span className="band-note">CATALOG SUBJECT TO PROVIDER AVAILABILITY</span></div>
      </section>

      <section className="drop shell" id="drop">
        <div className="section-top reveal"><span className="section-label">01 / THE GENESIS DROP</span><span className="section-side">A LIMITED FIRST EDITION <ArrowUpRight size={13} /></span></div>
        <div className="drop-layout">
          <div className="drop-copy reveal"><div className="drop-kicker"><span className="status-dot" /> THE FIRST 500</div><h2>Small supply.<br /><span>Real utility.</span></h2><p>We are starting with a focused first batch. 500 numbered spots. One simple idea: make spending SOL feel as easy as spending anything else.</p><a href="#how" className="under-link">Understand the drop <ArrowUpRight size={15} /></a></div>
          <div className="stock-card reveal"><LiveCounter /></div>
       </div>
      </section>

      <section className="how shell" id="how">
        <div className="section-top reveal"><span className="section-label">02 / MADE TO BE SIMPLE</span><span className="section-side">THREE STEPS. NO FRICTION.</span></div>
        <div className="how-heading"><h2 className="reveal">From SOL to <em>something real.</em></h2><p className="reveal">No extensions. No wallet popups. Just a clear checkout and a digital delivery.</p></div>
        <div className="steps">
          {steps.map((step) => { const Icon = step.icon; return <article className="step reveal" key={step.number}><div className="step-meta"><span>{step.number}</span><Icon size={20} /></div><div className="step-line" /><h3>{step.title}</h3><p>{step.body}</p><div className="step-corner"><MoveUpRight size={17} /></div></article>; })}
        </div>
      </section>

      <section className="utility shell" id="utility">
        <div className="utility-panel reveal"><div className="utility-copy"><div className="section-label">03 / MORE THAN A MEME</div><h2>Utility you<br /><em>can actually use.</em></h2><p>SWIPE is being built around real world purchases. The token layer is designed to reward holders with lower fees, while platform fees are planned to support buybacks. Final mechanics will be published before launch.</p><a href="/checkout" className="button button-outline">Stay close <ArrowUpRight size={16} /></a></div><div className="utility-graphic"><div className="utility-orbit orbit-large" /><div className="utility-orbit orbit-small" /><div className="utility-core"><Zap size={42} fill="currentColor" /></div><div className="utility-label label-one"><Check size={12} /> REAL PURCHASES</div><div className="utility-label label-two"><Check size={12} /> HOLDER BENEFITS PLANNED</div><div className="utility-label label-three"><Globe2 size={13} /> SOLANA</div></div></div>
      </section>

      <section className="closing shell"><div className="closing-inner reveal"><span className="section-label">THE NEXT MOVE IS YOURS</span><h2>Make your SOL<br /><em>mean something.</em></h2><a href="/checkout" className="button button-lime">Explore SWIPE <ArrowUpRight size={17} /></a><span className="closing-star">✳</span></div></section>

      <footer className="footer shell"><a href="#" className="brand"><span className="brand-symbol"><Zap size={15} fill="currentColor" /></span><span className="brand-name">swipe<span>.</span>fun</span></a><span>SPEND DIFFERENT. STAY EARLY.</span><div><a href="#how">HOW IT WORKS</a><a href="#drop">GENESIS</a></div><span>© 2026 SWIPE.FUN</span></footer>
    </main>
  );
}
