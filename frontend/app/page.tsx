"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { posts as initialPosts, rules as baseRules } from "@/lib/mockData";
import { rankPosts } from "@/lib/rank";
import { Rule } from "@/lib/types";
import ConnectWallet from "./ConnectWallet";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"] });
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"] });

const PITCH = "#0E3B2C";
const CHALK = "#EEF3EF";
const INK = "#12231C";
const LIGHT = "#FFD23F"; // recency
const TIPS = "#2FB574"; // tips
const BACKERS = "#5B8DEF"; // backers

type W = { r: number; t: number; b: number }; // percents, always sum to 100

const ago = (t: number) => {
  const h = (Date.now() - t) / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 48) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

// Move one slider; the other two share what is left, so the total stays 100
function adjust(w: W, key: keyof W, v: number): W {
  const keys: (keyof W)[] = ["r", "t", "b"];
  const [a, b] = keys.filter((k) => k !== key);
  const rest = 100 - v;
  const sum = w[a] + w[b];
  const na = sum === 0 ? Math.round(rest / 2) : Math.round((w[a] / sum) * rest);
  return { ...w, [key]: v, [a]: na, [b]: rest - na } as W;
}

function WeightBar({ r, t, b }: { r: number; t: number; b: number }) {
  const parts = [
    { w: r, c: LIGHT },
    { w: t, c: TIPS },
    { w: b, c: BACKERS },
  ];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-black/10">
      {parts.map((p, i) => (
        <div key={i} style={{ width: `${p.w}%`, background: p.c }} />
      ))}
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [rules, setRules] = useState<Rule[]>(baseRules);
  const [ruleId, setRuleId] = useState(baseRules[0].id);
  const [posts, setPosts] = useState(initialPosts);
  const rule = rules.find((r) => r.id === ruleId)!;
  const ranked = useMemo(() => rankPosts(posts, rule), [posts, rule]);
  const topScore = ranked[0]?.score || 1;

  // "Write your own rule" form
  const [name, setName] = useState("");
  const [w, setW] = useState<W>({ r: 34, t: 33, b: 33 });
  const [published, setPublished] = useState("");

  useEffect(() => setMounted(true), []);

  // New post box
  const [draft, setDraft] = useState("");
  const addPost = () => {
    const text = draft.trim();
    if (!text) return;
    const id = Math.max(...posts.map((p) => p.id)) + 1;
    setPosts([{ id, author: "you", text, createdAt: Date.now(), tips: [] }, ...posts]);
    setDraft("");
  };

  // Earnings: every tip splits 90% to the post author, 10% to the author of the rule in use.
  // Starter tips have no rule recorded, so they are spread across the starter rules for the demo.
  const [withdrawn, setWithdrawn] = useState(0);
  const earned = useMemo(() => {
    const m = new Map<string, { post: number; rule: number }>();
    const add = (who: string, k: "post" | "rule", v: number) => {
      const e = m.get(who) ?? { post: 0, rule: 0 };
      e[k] += v;
      m.set(who, e);
    };
    posts.forEach((p) =>
      p.tips.forEach((t) => {
        const rid = t.ruleId ?? baseRules[p.id % baseRules.length].id;
        const cut = t.amount * 0.1;
        add(p.author, "post", t.amount - cut);
        const ra = rules.find((r) => r.id === rid)?.author;
        if (ra) add(ra, "rule", cut);
      })
    );
    return m;
  }, [posts, rules]);
  const mine = earned.get("you") ?? { post: 0, rule: 0 };
  const balance = mine.post + mine.rule - withdrawn;
  const topRuleAuthors = [...earned.entries()]
    .filter(([, e]) => e.rule > 0)
    .sort((a, b) => b[1].rule - a[1].rule)
    .slice(0, 3);
  const fmt = (n: number) => n.toFixed(1);

  // Slide posts to their new positions when the order changes
  const els = useRef(new Map<number, HTMLElement>());
  const prevTop = useRef(new Map<number, number>());
  useLayoutEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ranked.forEach((p) => {
      const el = els.current.get(p.id);
      if (!el) return;
      const top = el.offsetTop;
      const before = prevTop.current.get(p.id);
      if (!calm && before !== undefined && before !== top) {
        el.animate(
          [{ transform: `translateY(${before - top}px)` }, { transform: "none" }],
          { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
      }
      prevTop.current.set(p.id, top);
    });
  }, [ranked]);

  // Fake tip for now: adds 1 from "you". Real tips come from David's contract later.
  const tip = (id: number) =>
    setPosts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, tips: [...p.tips, { tipper: "you", amount: 1, ruleId: rule.id }] } : p))
    );

  // Fake publish for now: adds the rule to this page. Later this calls RuleRegistry.publishRule.
  const publish = () => {
    const clean = name.trim();
    if (!clean) return;
    const id = Math.max(...rules.map((r) => r.id)) + 1;
    const next: Rule = {
      id,
      author: "you",
      name: clean,
      description: "Written by you",
      wRecency: w.r * 100,
      wTips: w.t * 100,
      wBackers: w.b * 100,
    };
    setRules([...rules, next]);
    setRuleId(id);
    setPublished(clean);
    setName("");
  };

  const sliders: { key: keyof W; label: string; c: string }[] = [
    { key: "r", label: "Recency", c: LIGHT },
    { key: "t", label: "Tips", c: TIPS },
    { key: "b", label: "Different backers", c: BACKERS },
  ];

  return (
    <div className={`${body.className} min-h-screen`} style={{ background: CHALK, color: INK }}>
      <header style={{ background: PITCH }} className="px-5 py-8 text-white sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`${display.className} text-5xl font-bold leading-none sm:text-6xl`}>Terrace</h1>
            <p className="mt-2 max-w-xl text-lg text-white/80">
              Football talk, ranked by rules the fans write. Pick a rule or write your own.
            </p>
          </div>
          <ConnectWallet />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-5 py-8 sm:px-10 lg:grid-cols-[300px_1fr]">
        <aside className="lg:self-start">
          <h2 className={`${display.className} text-2xl font-semibold`}>How should the feed rank?</h2>
          <div className="mt-3 flex flex-col gap-2">
            {rules.map((r) => {
              const on = r.id === ruleId;
              return (
                <button
                  key={r.id}
                  onClick={() => setRuleId(r.id)}
                  aria-pressed={on}
                  className="rounded-xl p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: on ? PITCH : "white",
                    color: on ? "white" : INK,
                    outlineColor: LIGHT,
                    boxShadow: on ? `0 0 0 2px ${LIGHT}` : "0 0 0 1px rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="font-semibold">{r.name}</div>
                  <div className={`mb-2 text-sm ${on ? "text-white/75" : "text-black/60"}`}>{r.description}</div>
                  <WeightBar r={r.wRecency / 100} t={r.wTips / 100} b={r.wBackers / 100} />
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-white p-3 text-sm ring-1 ring-black/10">
            <div className="mb-2 font-semibold">What this rule counts</div>
            {[
              { label: "Recency", v: rule.wRecency, c: LIGHT },
              { label: "Tips", v: rule.wTips, c: TIPS },
              { label: "Different backers", v: rule.wBackers, c: BACKERS },
            ].map((x) => (
              <div key={x.label} className="flex items-center gap-2 py-0.5">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: x.c }} />
                <span className="flex-1">{x.label}</span>
                <span className="font-semibold">{x.v / 100}%</span>
              </div>
            ))}
            <div className="mt-2 text-black/60">Written by {rule.author}. Rules like this will live onchain.</div>
          </div>

          <div className="mt-4 rounded-xl bg-white p-3 text-sm ring-1 ring-black/10">
            <h2 className={`${display.className} mb-2 text-xl font-semibold`}>Write your own rule</h2>
            <label className="block">
              <span className="font-semibold">Rule name</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value.slice(0, 30));
                  setPublished("");
                }}
                placeholder="e.g. Derby day heat"
                className="mt-1 w-full rounded-lg px-3 py-2 ring-1 ring-black/20 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: LIGHT }}
              />
            </label>

            <div className="mt-3 flex flex-col gap-3">
              {sliders.map((s) => (
                <label key={s.key} className="block">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: s.c }} />
                    <span className="flex-1 font-semibold">{s.label}</span>
                    <span className="font-semibold">{w[s.key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={w[s.key]}
                    onChange={(e) => setW(adjust(w, s.key, Number(e.target.value)))}
                    className="mt-1 w-full"
                    style={{ accentColor: s.c }}
                    aria-label={`${s.label} weight`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3">
              <WeightBar r={w.r} t={w.t} b={w.b} />
              <div className="mt-1 text-black/60">The three always add up to 100%.</div>
            </div>

            <button
              onClick={publish}
              disabled={!name.trim()}
              className="mt-3 w-full rounded-full px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
              style={{ background: PITCH, outlineColor: LIGHT }}
            >
              Publish rule
            </button>
            {published ? (
              <div className="mt-2 font-semibold" style={{ color: PITCH }} role="status">
                Published. The feed now ranks by {published}.
              </div>
            ) : (
              !name.trim() && <div className="mt-2 text-black/60">Give your rule a name to publish it.</div>
            )}
          </div>
        </aside>

        <section>
          <div className="mb-6 rounded-xl p-4 text-white" style={{ background: PITCH }}>
            <h2 className={`${display.className} text-2xl font-semibold`}>Earnings</h2>
            <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-2">
              <div>
                <div className={`${display.className} text-5xl font-bold leading-none`} style={{ color: LIGHT }}>
                  {fmt(balance)}
                </div>
                <div className="text-sm text-white/75">ready to withdraw</div>
              </div>
              <div className="text-sm text-white/85">
                <div>{fmt(mine.post)} from your posts</div>
                <div>{fmt(mine.rule)} from your rules</div>
              </div>
              <button
                onClick={() => setWithdrawn(mine.post + mine.rule)}
                disabled={balance <= 0}
                className="ml-auto rounded-full px-4 py-1.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
                style={{ background: LIGHT, color: INK, outlineColor: "white" }}
              >
                Withdraw
              </button>
            </div>
            <div className="mt-4 border-t border-white/20 pt-3 text-sm text-white/85">
              <div className="mb-1 font-semibold text-white">Rule authors earning the most</div>
              {topRuleAuthors.length === 0 ? (
                <div>No tips yet. Tip a post and the rule author gets 10%.</div>
              ) : (
                topRuleAuthors.map(([who, e]) => (
                  <div key={who} className="flex justify-between py-0.5">
                    <span>{who}</span>
                    <span className="font-semibold">{fmt(e.rule)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-xs text-white/60">Every tip splits 90% to the post author and 10% to the rule author.</div>
          </div>

          <div className="mb-6 rounded-xl bg-white p-4 ring-1 ring-black/10">
            <label className="block">
              <span className="font-semibold">Share a football take</span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 280))}
                rows={2}
                placeholder="Who is your player of the season?"
                className="mt-1 w-full rounded-lg px-3 py-2 ring-1 ring-black/20 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: LIGHT }}
              />
            </label>
            <div className="mt-2 flex items-center justify-between text-sm text-black/60">
              <span>{draft.length}/280</span>
              <button
                onClick={addPost}
                disabled={!draft.trim()}
                className="rounded-full px-4 py-1.5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
                style={{ background: PITCH, outlineColor: LIGHT }}
              >
                Post
              </button>
            </div>
          </div>

          <h2 className={`${display.className} mb-3 text-2xl font-semibold`}>Ranked by {rule.name}</h2>
          {mounted && (
            <ol className="relative flex flex-col gap-3">
              {ranked.map((p, i) => (
                <li
                  key={p.id}
                  ref={(el) => {
                    if (el) els.current.set(p.id, el);
                  }}
                  className="flex gap-4 rounded-xl bg-white p-4 ring-1 ring-black/10"
                >
                  <div
                    className={`${display.className} w-9 shrink-0 text-4xl font-bold leading-none`}
                    style={{ color: i === 0 ? TIPS : "rgba(0,0,0,0.3)" }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg leading-snug">{p.text}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10" title="Rank score">
                      <div className="h-full rounded-full" style={{ width: `${(p.score / topScore) * 100}%`, background: PITCH }} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-black/65">
                      <span className="font-semibold text-black/80">{p.author}</span>
                      <span>{ago(p.createdAt)}</span>
                      <span>{p.totalTips} tipped</span>
                      <span>
                        {p.backers} {p.backers === 1 ? "backer" : "backers"}
                      </span>
                      <button
                        onClick={() => tip(p.id)}
                        className="ml-auto rounded-full px-4 py-1.5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ background: PITCH, outlineColor: LIGHT }}
                      >
                        Tip 1
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
