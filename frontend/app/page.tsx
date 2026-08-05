"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WaxSeal, SealMeta } from "@/components/register/WaxSeal";
import { DocketCard, CustodyList } from "@/components/register/DocketCard";
import { ClauseList } from "@/components/register/ClauseList";
import { CustodySpine } from "@/components/register/CustodySpine";
import { Bench } from "@/components/register/Bench";
import { ExhibitCard } from "@/components/register/ExhibitCard";

/* -------------------------------------------------------------------------- */
/* Copy — verbatim from the mockup (design system §7: reuse it)               */
/* -------------------------------------------------------------------------- */

const CLAUSES = [
  {
    num: "§1",
    title: "Evidence-bound",
    body: "The claim and its sources are fixed before judgment begins — not argued out in free-floating chat.",
  },
  {
    num: "§2",
    title: "Validator-driven",
    body: "Independent AI nodes re-run the analysis in isolation and must agree before a verdict is recorded.",
  },
  {
    num: "§3",
    title: "Permanently recorded",
    body: "True, False, or Unverifiable is written on-chain with its reasoning and confidence — and stays there.",
  },
];

const SPINE_STEPS = [
  {
    title: "Claim submitted",
    body: "Natural language enters the register — clear, checkable, permanent intent.",
  },
  {
    title: "Evidence collected",
    body: "Text and links are gathered and bounded for independent review.",
  },
  {
    title: "Validators reason",
    body: "Each AI validator analyzes the claim alone, without seeing another's draft.",
  },
  {
    title: "Consensus forms",
    body: "Agreement on the verdict and its confidence band, under the Equivalence Principle.",
  },
  {
    title: "Verdict sealed",
    body: "True, False, or Unverifiable is written on-chain with its reasoning.",
  },
];

const SEATS = [
  { roman: "JUROR I", verdict: "True", conf: 88 },
  { roman: "JUROR II", verdict: "True", conf: 91 },
  { roman: "JUROR III", verdict: "True", conf: 84 },
  { roman: "JUROR IV", verdict: "True", conf: 79 },
  { roman: "JUROR V", verdict: "True", conf: 86 },
];

/* -------------------------------------------------------------------------- */
/* Motion utilities (design §6: 350ms fade + slight rise, respects reduced    */
/* motion; hero copy paints immediately for LCP)                              */
/* -------------------------------------------------------------------------- */

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const fn = () => setReduce(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduce;
}

function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return { ref, visible };
}

function Reveal({
  children,
  className,
  delay = 0,
  active = true,
  priority = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  active?: boolean;
  priority?: boolean;
}) {
  const [ready, setReady] = useState(priority);
  useEffect(() => {
    if (!active) {
      if (!priority) setReady(false);
      return;
    }
    if (priority) {
      setReady(true);
      return;
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [active, priority]);

  return (
    <div
      className={cn(
        "infra-reveal",
        priority && "infra-reveal--priority",
        ready && active && "is-in",
        className
      )}
      style={{ transitionDelay: ready && active && !priority ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero docket — the live resolution stage machine, ported into the           */
/* docket card. Live behavior preserved: stages cycle, verdict seal appears   */
/* at the final stage, reduced-motion jumps to sealed.                        */
/* -------------------------------------------------------------------------- */

const DOCKET_STAGES = [
  { title: "Claim accepted", sub: "Entered the register on-chain" },
  { title: "Evidence gathered", sub: "Sources fetched and bounded" },
  { title: "Consensus reached", sub: "5 of 5 validators agree" },
  { title: "Verdict sealed", sub: "Written permanently, with reasoning" },
];

function HeroDocket({
  reduceMotion,
  active,
  playOnce,
}: {
  reduceMotion: boolean;
  active: boolean;
  playOnce: boolean;
}) {
  const [stage, setStage] = useState(reduceMotion ? 3 : 0);

  useEffect(() => {
    if (reduceMotion) {
      setStage(3);
      return;
    }
    if (!active) return;

    let cancelled = false;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, ms);
      timers.add(id);
    };

    const sequence = () => {
      setStage(0);
      later(() => setStage(1), 1600);
      later(() => setStage(2), 3400);
      later(() => setStage(3), 5400);
      if (!playOnce) later(sequence, 11_000);
    };

    sequence();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduceMotion, active, playOnce]);

  const custody = DOCKET_STAGES.map((s, i) => ({
    ...s,
    state: (i < stage ? "done" : i === stage ? "active" : "pending") as
      | "done"
      | "active"
      | "pending",
  }));

  return (
    <DocketCard headLeft="Live resolution" headRight="Docket #1042">
      <p className="docket-quote">
        “GenLayer validators use an Optimistic Democracy consensus model.”
      </p>
      <CustodyList items={custody} />
      <div className="seal-row">
        {stage === 3 ? (
          <>
            <WaxSeal verdict="true" label="True" />
            <SealMeta
              title="Sealed at 87% confidence"
              sub="Reasoning attached · no silent rewrite possible"
            />
          </>
        ) : (
          <span className="mono text-xs text-[var(--text-faint)]">
            Awaiting finality…
          </span>
        )}
      </div>
    </DocketCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);
  const [playOnce, setPlayOnce] = useState(false);

  const why = useInView<HTMLElement>();
  const custody = useInView<HTMLElement>();
  const bench = useInView<HTMLElement>();
  const sealed = useInView<HTMLElement>();
  const cta = useInView<HTMLElement>();
  const heroDocket = useInView<HTMLDivElement>(false);

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setPlayOnce(
        reduceMotion || coarse.matches || narrow.matches
      );
    };
    update();
    coarse.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      coarse.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, [reduceMotion]);

  return (
    <div className="pb-4">
      {/* ─── HERO: open copy + live docket ─── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div>
          <Reveal priority active>
            <p className="eyebrow">GenLayer Public Register · No. 001042</p>
          </Reveal>
          <Reveal priority active>
            <h1 id="hero-heading">
              Claims enter as language.
              <span className="dim">They leave under seal.</span>
            </h1>
          </Reveal>
          <Reveal priority active>
            <p className="lede">
              GenResolve records a claim, gathers its evidence, and lets
              independent AI validators reach a verdict — True, False, or
              Unverifiable — sealed permanently on-chain.
            </p>
          </Reveal>
          <Reveal priority active>
            <div className="ctarow">
              <Link href="/create" className="btn btn-primary btn-lg min-h-11">
                File a claim
              </Link>
              <Link href="/home" className="btn btn-secondary btn-lg min-h-11">
                Open the register
              </Link>
            </div>
          </Reveal>
          <Reveal priority active>
            <p className="meta">
              GenLayer testnets — Studionet &amp; Bradbury · verdicts sealed
              on-chain, never rewritten
            </p>
          </Reveal>
        </div>

        <Reveal active delay={120} className="max-w-[480px] justify-self-end w-full">
          <div ref={heroDocket.ref}>
            <HeroDocket
              reduceMotion={reduceMotion}
              active={pageVisible && (heroDocket.visible || playOnce)}
              playOnce={playOnce}
            />
          </div>
        </Reveal>
      </section>

      {/* ─── WHY IT EXISTS — clause list ─── */}
      <section
        ref={why.ref}
        className="section"
        aria-labelledby="why-heading"
      >
        <div className="section-head">
          <Reveal active={why.visible}>
            <p className="eyebrow">The case for a hearing</p>
          </Reveal>
          <Reveal active={why.visible} delay={80}>
            <h2 id="why-heading">A single model&apos;s answer isn&apos;t a verdict.</h2>
          </Reveal>
        </div>
        <Reveal active={why.visible} delay={120}>
          <ClauseList clauses={CLAUSES} />
        </Reveal>
      </section>

      {/* ─── CHAIN OF CUSTODY — spine ─── */}
      <section
        ref={custody.ref}
        className="section"
        aria-labelledby="custody-heading"
      >
        <div className="section-head">
          <Reveal active={custody.visible}>
            <p className="eyebrow">Chain of custody</p>
          </Reveal>
          <Reveal active={custody.visible} delay={80}>
            <h2 id="custody-heading">From language to sealed judgment</h2>
          </Reveal>
        </div>
        <Reveal active={custody.visible} delay={120}>
          <div className="max-w-2xl">
            <CustodySpine steps={SPINE_STEPS} />
          </div>
        </Reveal>
      </section>

      {/* ─── THE BENCH ─── */}
      <section
        ref={bench.ref}
        className="section"
        aria-labelledby="bench-heading"
      >
        <div className="bench-intro section-head">
          <Reveal active={bench.visible}>
            <p className="eyebrow">The bench</p>
          </Reveal>
          <Reveal active={bench.visible} delay={80}>
            <h2 id="bench-heading">Independent minds. One decision.</h2>
          </Reveal>
          <Reveal active={bench.visible} delay={140}>
            <p>
              Each validator reasons alone. Consensus forms when verdicts match
              and confidence stays within tolerance — not when one voice is
              trusted over the rest.
            </p>
          </Reveal>
        </div>
        <Reveal active={bench.visible} delay={180}>
          <Bench
            seats={SEATS}
            foot="5 / 5 reported · verdict agreement · confidence band OK"
          />
        </Reveal>
      </section>

      {/* ─── ONCE SEALED — exhibit ─── */}
      <section
        ref={sealed.ref}
        className="section"
        aria-labelledby="sealed-heading"
      >
        <div className="section-head">
          <Reveal active={sealed.visible}>
            <p className="eyebrow">Once sealed</p>
          </Reveal>
          <Reveal active={sealed.visible} delay={80}>
            <h2 id="sealed-heading">Irreversible by design</h2>
          </Reveal>
        </div>
        <Reveal active={sealed.visible} delay={160}>
          <ExhibitCard
            verdict="true"
            sealLabel="True"
            ring="DOCKET 1042 · GENRESOLVE ·"
            tags={["Judged", "Docket #1042"]}
            quote="GenLayer validators use an Optimistic Democracy consensus model."
            confidence={87}
            reasoning="Independent validators concur the claim matches documented protocol design; the cited sources support the consensus-model description."
            foot="ON-CHAIN · PERMANENT · NO SILENT REWRITE"
          />
        </Reveal>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section ref={cta.ref} aria-labelledby="cta-heading">
        <Reveal active={cta.visible}>
          <div className="ctaband">
            <div>
              <h2 id="cta-heading">Turn a claim into judgment.</h2>
              <p>
                Submit language. Attach evidence. Let the bench seal the
                outcome.
              </p>
            </div>
            <div className="ctas">
              <Link href="/create" className="btn btn-primary btn-lg min-h-11">
                File a claim
              </Link>
              <Link href="/claims" className="btn btn-secondary btn-lg min-h-11">
                Browse the register
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
