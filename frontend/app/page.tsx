"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const PIPELINE = [
  {
    n: "01",
    title: "Claim submitted",
    body: "Natural language enters the ledger — clear, checkable, permanent intent.",
  },
  {
    n: "02",
    title: "Evidence collected",
    body: "Text and links are gathered and bounded for independent review.",
  },
  {
    n: "03",
    title: "Validators reason",
    body: "Each AI validator analyzes the claim without sharing intermediate drafts.",
  },
  {
    n: "04",
    title: "Consensus forms",
    body: "Agreement on verdict (and confidence band) under the Equivalence Principle.",
  },
  {
    n: "05",
    title: "Verdict sealed",
    body: "True, False, or Unverifiable written on-chain with reasoning.",
  },
] as const;

const VALIDATORS = [
  { id: "V1", vote: "True", conf: 88, delay: 0 },
  { id: "V2", vote: "True", conf: 91, delay: 0.35 },
  { id: "V3", vote: "True", conf: 84, delay: 0.7 },
  { id: "V4", vote: "True", conf: 79, delay: 1.05 },
  { id: "V5", vote: "True", conf: 86, delay: 1.4 },
] as const;

const HERO_STAGES = [
  { key: "pending", label: "Pending", detail: "Claim accepted on-chain" },
  { key: "evidence", label: "Evidence", detail: "Fetching linked sources…" },
  { key: "consensus", label: "Consensus", detail: "Validators agreeing…" },
  { key: "judged", label: "Judged", detail: "Verdict sealed permanently" },
] as const;

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
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
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return { ref, visible };
}

/* -------------------------------------------------------------------------- */
/* Small UI pieces                                                            */
/* -------------------------------------------------------------------------- */

function Reveal({
  children,
  className,
  delay = 0,
  active = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  active?: boolean;
}) {
  // Defer is-in one frame so CSS transitions run on first paint.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  return (
    <div
      className={cn("infra-reveal", ready && active && "is-in", className)}
      style={{ transitionDelay: ready && active ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="infra-label">{children}</p>;
}

/** Consistent outline icons for Why cards (explicit attrs for reliable SVG paint) */
function WhyIcon({ kind }: { kind: "evidence" | "validators" | "recorded" }) {
  if (kind === "evidence") {
    // Shield-check — evidence-bound / verified sources
    return (
      <svg
        className="infra-why-svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3.25 5.5 5.75v5.4c0 4.05 2.75 7.85 6.5 8.85 3.75-1 6.5-4.8 6.5-8.85v-5.4L12 3.25Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <path
          d="M9.25 12.1 11.1 14l3.65-3.85"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "validators") {
    // Network nodes — independent validators
    return (
      <svg
        className="infra-why-svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="12" cy="6.25" r="2.35" stroke="currentColor" strokeWidth="1.65" />
        <circle cx="5.75" cy="17.25" r="2.35" stroke="currentColor" strokeWidth="1.65" />
        <circle cx="18.25" cy="17.25" r="2.35" stroke="currentColor" strokeWidth="1.65" />
        <path
          d="M10.15 7.85 7.15 15.15M13.85 7.85l3 7.3M8 17.25h8"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Lock / seal — permanently recorded on-chain
  return (
    <svg
      className="infra-why-svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="10.5"
        width="13"
        height="9.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <path
        d="M8.25 10.5V8.1a3.75 3.75 0 0 1 7.5 0v2.4"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.1" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero live panel                                                            */
/* -------------------------------------------------------------------------- */

function HeroLivePanel({ reduceMotion }: { reduceMotion: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setStage(3);
      return;
    }
    setStage(0);
    const timers = [
      window.setTimeout(() => setStage(1), 1400),
      window.setTimeout(() => setStage(2), 2800),
      window.setTimeout(() => setStage(3), 4400),
    ];
    const loop = window.setInterval(() => {
      setStage(0);
      window.setTimeout(() => setStage(1), 1400);
      window.setTimeout(() => setStage(2), 2800);
      window.setTimeout(() => setStage(3), 4400);
    }, 7000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [reduceMotion]);

  return (
    <div className="infra-live-panel" aria-live="polite">
      <div className="infra-live-top">
        <span className="infra-live-dot" />
        <span className="mono text-[11px] text-[var(--text-muted)]">
          Live resolution path
        </span>
        <span className="mono text-[11px] text-[var(--text-faint)] ml-auto">
          #1042
        </span>
      </div>

      <p className="infra-live-claim">
        “GenLayer validators use an Optimistic Democracy consensus model.”
      </p>

      <div className="infra-live-stages">
        {HERO_STAGES.map((s, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <div
              key={s.key}
              className={cn(
                "infra-live-stage",
                done && "is-done",
                active && "is-active"
              )}
            >
              <span className="infra-live-stage-mark" aria-hidden />
              <div>
                <div className="infra-live-stage-label">{s.label}</div>
                <div className="infra-live-stage-detail">
                  {active || done ? s.detail : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "infra-live-result",
          stage === 3 && "is-sealed"
        )}
      >
        {stage === 3 ? (
          <>
            <span className="badge badge-true badge-lg">
              <span className="badge-icon">✓</span> True
            </span>
            <span className="mono text-xs text-[var(--text-muted)]">
              Confidence 87% · sealed
            </span>
          </>
        ) : (
          <span className="text-xs text-[var(--text-faint)]">
            Awaiting finality…
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  /** Tab hidden → pause any residual ambient CSS. */
  const [pageVisible, setPageVisible] = useState(true);
  /** Low-power / mobile / save-data → static atmosphere only. */
  const [liteAmbient, setLiteAmbient] = useState(false);

  const why = useInView<HTMLElement>();
  const pipeline = useInView<HTMLElement>();
  const mesh = useInView<HTMLElement>();
  const finality = useInView<HTMLElement>();
  const cta = useInView<HTMLElement>();

  const [pipeActive, setPipeActive] = useState(0);

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    // Prefer static atmosphere on constrained devices (real mobile perf win).
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const saveData =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData
      );
    const cores =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
    const update = () => {
      setLiteAmbient(
        reduceMotion ||
          coarse.matches ||
          narrow.matches ||
          saveData ||
          cores <= 4
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

  useEffect(() => {
    if (!pipeline.visible) return;
    if (reduceMotion) {
      setPipeActive(PIPELINE.length);
      return;
    }
    setPipeActive(0);
    const ids: number[] = [];
    PIPELINE.forEach((_, i) => {
      ids.push(window.setTimeout(() => setPipeActive(i + 1), 280 + i * 420));
    });
    return () => ids.forEach(clearTimeout);
  }, [pipeline.visible, reduceMotion]);

  return (
    <div
      ref={stageRef}
      className={cn(
        "infra-landing infra-landing--bleed",
        !pageVisible && "infra-landing--paused",
        (reduceMotion || liteAmbient) && "infra-landing--static"
      )}
    >
      {/*
        Single paint layer atmosphere (no child blobs, no blur filters,
        no pointer parallax, no full-viewport mask animation).
      */}
      <div className="infra-aurora" aria-hidden />

      {/* ─── HERO: open left copy + framed live panel only ─── */}
      <section className="infra-hero">
        <div className="page-shell infra-hero-inner">
          <div className="infra-hero-grid">
            {/* Left: no card / no shell — open on background */}
            <div className="infra-hero-copy">
              <Reveal active delay={80}>
                <SectionLabel>GenLayer-native resolution</SectionLabel>
              </Reveal>
              <Reveal active delay={180}>
                <h1 className="infra-hero-title">
                  Claims enter as language.
                  <br />
                  <span className="infra-hero-accent">
                    They leave as consensus.
                  </span>
                </h1>
              </Reveal>
              <Reveal active delay={320}>
                <p className="infra-hero-lede">
                  GenResolve turns natural-language claims into permanent
                  on-chain verdicts — through evidence, independent AI
                  validators, and cryptographic finality.
                </p>
              </Reveal>
              <Reveal active delay={460}>
                <div className="infra-hero-ctas">
                  <Link href="/create" className="landing-cta-primary">
                    Create first claim
                  </Link>
                  <Link href="/home" className="landing-cta-secondary">
                    Open app
                  </Link>
                </div>
              </Reveal>
              <Reveal active delay={580}>
                <p className="infra-hero-meta mono">
                  Studionet · Bradbury · Equivalence Principle
                </p>
              </Reveal>
            </div>

            {/* Right: only framed surface */}
            <Reveal active delay={400} className="infra-hero-panel-wrap">
              <HeroLivePanel reduceMotion={reduceMotion} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── WHY ─── */}
      <section
        ref={why.ref}
        className="page-shell infra-section infra-section--why"
        aria-labelledby="why-heading"
      >
        <Reveal active={why.visible} delay={0}>
          <SectionLabel>Why it exists</SectionLabel>
        </Reveal>
        <Reveal active={why.visible} delay={100}>
          <h2 id="why-heading" className="infra-h2">
            A single model answer is not a verdict.
          </h2>
        </Reveal>
        <div className="infra-why-grid">
          {(
            [
              {
                title: "Evidence-bound",
                body: "Claims and sources are fixed before judgment — not free-floating chat.",
                icon: "evidence" as const,
              },
              {
                title: "Validator-driven",
                body: "Independent AI nodes re-run the analysis and must agree on the decision.",
                icon: "validators" as const,
              },
              {
                title: "Permanently recorded",
                body: "True, False, or Unverifiable lands on-chain with reasoning and confidence.",
                icon: "recorded" as const,
              },
            ] as const
          ).map((card, i) => (
            <Reveal
              key={card.title}
              active={why.visible}
              delay={180 + i * 100}
            >
              <div className="infra-why-card">
                <div className="infra-why-icon" aria-hidden>
                  <WhyIcon kind={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── PIPELINE ─── */}
      <section
        ref={pipeline.ref}
        className="page-shell infra-section infra-section--pipeline"
        aria-labelledby="pipe-heading"
      >
        <Reveal active={pipeline.visible}>
          <SectionLabel>Resolution pipeline</SectionLabel>
        </Reveal>
        <Reveal active={pipeline.visible} delay={80}>
          <h2 id="pipe-heading" className="infra-h2">
            From language to sealed consensus
          </h2>
        </Reveal>

        <div className="infra-pipeline">
          <div className="infra-pipeline-track" aria-hidden>
            <div
              className="infra-pipeline-fill"
              style={{
                width: reduceMotion
                  ? "100%"
                  : `${Math.min(100, (pipeActive / PIPELINE.length) * 100)}%`,
              }}
            />
          </div>
          <ol className="infra-pipeline-steps">
            {PIPELINE.map((step, i) => {
              const on = pipeActive > i;
              return (
                <li
                  key={step.n}
                  className={cn("infra-pipe-step", on && "is-on")}
                >
                  <div className="infra-pipe-n">{step.n}</div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ─── VALIDATOR MESH ─── */}
      <section
        ref={mesh.ref}
        className="page-shell infra-section infra-section--mesh"
        aria-labelledby="mesh-heading"
      >
        <Reveal active={mesh.visible}>
          <SectionLabel>Validator mesh</SectionLabel>
        </Reveal>
        <Reveal active={mesh.visible} delay={80}>
          <h2 id="mesh-heading" className="infra-h2">
            Independent minds. One decision field.
          </h2>
        </Reveal>
        <Reveal active={mesh.visible} delay={140}>
          <p className="infra-section-lede">
            Each validator reasons in isolation. Consensus forms when verdicts
            match and confidence stays within tolerance — not when a leader is
            trusted alone.
          </p>
        </Reveal>

        <div
          className={cn("infra-mesh", mesh.visible && "is-live")}
          aria-hidden={!mesh.visible}
        >
          <div className="infra-mesh-core">
            <span className="infra-mesh-core-label">Claim</span>
            <span className="infra-mesh-core-sub mono">#1042</span>
          </div>
          <ul className="infra-mesh-nodes">
            {VALIDATORS.map((v, i) => (
              <li
                key={v.id}
                className="infra-mesh-node"
                style={{
                  // stagger report-in
                  animationDelay: mesh.visible
                    ? `${0.4 + v.delay}s`
                    : undefined,
                  ["--i" as string]: i,
                }}
              >
                <div className="infra-mesh-node-id mono">{v.id}</div>
                <div className="infra-mesh-node-vote">{v.vote}</div>
                <div className="infra-mesh-node-conf mono">{v.conf}%</div>
                <div className="infra-mesh-pulse" />
              </li>
            ))}
          </ul>
          <div className="infra-mesh-legend mono">
            5 / 5 reported · verdict agreement · confidence band OK
          </div>
        </div>
      </section>

      {/* ─── FINALITY ─── */}
      <section
        ref={finality.ref}
        className="page-shell infra-section infra-section--finality"
        aria-labelledby="finality-heading"
      >
        <Reveal active={finality.visible}>
          <SectionLabel>Consensus & finality</SectionLabel>
        </Reveal>
        <Reveal active={finality.visible} delay={80}>
          <h2 id="finality-heading" className="infra-h2">
            Irreversible once sealed
          </h2>
        </Reveal>

        <Reveal active={finality.visible} delay={160}>
          <div
            className={cn(
              "infra-finality",
              finality.visible && "is-sealed"
            )}
          >
            <div className="infra-finality-head">
              <span className="badge badge-true badge-lg">
                <span className="badge-icon">✓</span> True
              </span>
              <span className="badge badge-judged">
                <span className="badge-icon">◆</span> Judged
              </span>
            </div>
            <p className="infra-finality-claim">
              “GenLayer validators use an Optimistic Democracy consensus model.”
            </p>
            <div className="infra-finality-conf">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Confidence</span>
                <span className="tabular-nums text-[var(--text)] font-semibold">
                  87%
                </span>
              </div>
              <div className="confidence-track mt-2">
                <div
                  className="confidence-fill infra-conf-anim"
                  style={{ width: finality.visible || reduceMotion ? "87%" : "0%" }}
                />
              </div>
            </div>
            <div className="infra-finality-reason">
              <p className="section-label">Reasoning</p>
              <p>
                Independent validators concur the claim matches documented
                protocol design; sources support the consensus model description.
              </p>
            </div>
            <p className="infra-finality-foot mono">
              On-chain · permanent · no silent rewrite
            </p>
          </div>
        </Reveal>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        ref={cta.ref}
        className="page-shell infra-section infra-section--cta infra-cta-band-wrap"
      >
        <Reveal active={cta.visible}>
          <div className="infra-cta-band">
            <div>
              <SectionLabel>Begin</SectionLabel>
              <h2 className="infra-h2 mt-2">
                Turn a claim into consensus.
              </h2>
              <p className="infra-section-lede !mt-3 !mb-0">
                Submit language. Attach evidence. Let validators seal the
                outcome.
              </p>
            </div>
            <div className="infra-cta-band-actions">
              <Link href="/create" className="landing-cta-primary">
                Create claim
              </Link>
              <Link href="/claims" className="landing-cta-secondary">
                Browse ledger
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
