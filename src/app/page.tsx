import { ArrowUpRight, ArrowRight, Zap, ShieldCheck, Gift, Wallet, MoveUpRight } from "lucide-react";
import LiveCounter from "@/components/LiveCounter";

const steps = [
  {
    number: "01",
    title: "Pick your thing",
    description: "Choose a gift card and the value you want. Your order is created in seconds.",
    icon: Gift
  },
  {
    number: "02",
    title: "Send SOL",
    description: "Get a unique deposit address and QR code for your order. No wallet connection.",
    icon: Wallet
  },
  {
    number: "03",
    title: "Get the goods",
    description: "Once your payment is confirmed, your digital gift card is delivered to your order page.",
    icon: Zap
  }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="site-nav shell">
        <a href="#" className="brand" aria-label="Swipe home">
          <span className="brand-mark"><Zap size={17} fill="currentColor" /></span>
          <span>SWIPE<span className="brand-dot">.</span>FUN</span>
        </a>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#drop">The drop</a>
        </div>
        <a className="nav-cta" href="#drop">Explore drop <ArrowUpRight size={15} /></a>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> BUILT ON SOLANA <span className="eyebrow-line" /> REAL WORLD UTILITY</div>
          <h1>Your SOL.<br /><span>Real world.</span></h1>
          <p className="hero-description">
            Turn SOL into the things you actually want. Gift cards, digital goods and more.
            No wallet connection. No unnecessary steps.
          </p>
          <div className="hero-actions">
            <a href="#drop" className="button-primary">Get in early <ArrowUpRight size={17} /></a>
            <a href="#how-it-works" className="button-quiet">See how it works <ArrowRight size={16} /></a>
          </div>
          <div className="hero-proof">
            <span><ShieldCheck size={15} /> Non custodial flow is not live yet</span>
            <span className="proof-divider" />
            <span>Solana powered</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Abstract Swipe digital gift card artwork">
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="orbit orbit-c" />
          <div className="card-shadow" />
          <div className="swipe-card">
            <div className="card-top">
              <span className="card-brand">SWIPE<span>.</span>FUN</span>
              <span className="card-edition">GENESIS / 001</span>
            </div>
            <div className="card-center">
              <div className="card-symbol"><Zap size={46} fill="currentColor" /></div>
              <div className="card-word">SPEND<br /><span>DIFFERENT.</span></div>
            </div>
            <div className="card-bottom">
              <span>YOUR SOL. REAL WORLD.</span>
              <span className="card-chip">S / 001</span>
            </div>
          </div>
          <div className="float-tag tag-top">500 GENESIS ITEMS</div>
          <div className="float-tag tag-bottom"><span className="live-dot" /> THE FIRST DROP</div>
          <div className="hero-star star-one">✳</div>
          <div className="hero-star star-two">✳</div>
        </div>
      </section>

      <section className="drop-section shell" id="drop">
        <div className="section-kicker">THE GENESIS DROP <span>001 / 500</span></div>
        <div className="drop-panel">
          <div className="drop-intro">
            <div>
              <p className="small-label">FIRST COME. FIRST SWIPED.</p>
              <h2>Small batch.<br /><span>Big utility.</span></h2>
            </div>
            <p className="drop-description">The first 500 numbered items mark the beginning of spending SOL in the real world. Get in before the first batch is gone.</p>
          </div>
          <LiveCounter />
        </div>
      </section>

      <section className="how-section shell" id="how-it-works">
        <div className="how-heading">
          <div>
            <div className="section-kicker">NO WALLET CONNECT. NO DRAMA.</div>
            <h2>Three steps.<br /><span>That's it.</span></h2>
          </div>
          <p>Pay with SOL. Get something useful. Get on with your day.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="step-card" key={step.number}>
                <div className="step-top"><span>{step.number}</span><Icon size={21} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <div className="step-arrow"><MoveUpRight size={17} /></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="token-strip shell">
        <div className="token-icon"><Zap size={21} fill="currentColor" /></div>
        <div className="token-copy">
          <span className="small-label">THE SWIPE TOKEN</span>
          <strong>More than a ticker.</strong>
          <p>Holder fee benefits and buyback mechanics are planned. Token details will be announced by the team.</p>
        </div>
        <span className="token-status">COMING SOON</span>
      </section>

      <footer className="site-footer shell">
        <a href="#" className="brand"><span className="brand-mark"><Zap size={15} fill="currentColor" /></span><span>SWIPE<span className="brand-dot">.</span>FUN</span></a>
        <span>Spend different. Stay early.</span>
        <span>© 2026 SWIPE.FUN</span>
      </footer>
    </main>
  );
}
