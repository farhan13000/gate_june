import { useState } from "react";
import { Bookmark, ChevronRight, ChevronDown } from "lucide-react";

const toc = [
  { id: "1", label: "1. Introduction to Probability", level: 1 },
  { id: "1.1", label: "1.1 Sample Spaces", level: 2 },
  { id: "1.2", label: "1.2 Events and Axioms", level: 2 },
  { id: "1.3", label: "1.3 Conditional Probability", level: 2 },
  { id: "2", label: "2. Random Variables", level: 1 },
  { id: "2.1", label: "2.1 Discrete RVs", level: 2 },
  { id: "2.2", label: "2.2 Continuous RVs", level: 2 },
  { id: "2.3", label: "2.3 Expectation & Variance", level: 2 },
  { id: "3", label: "3. Common Distributions", level: 1 },
  { id: "3.1", label: "3.1 Normal Distribution", level: 2 },
  { id: "3.2", label: "3.2 Binomial Distribution", level: 2 },
  { id: "4", label: "4. Hypothesis Testing", level: 1 },
];

export default function Theory() {
  const [active, setActive] = useState("1.3");
  const [bookmarked, setBookmarked] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
      {/* ToC sidebar */}
      <aside className="w-56 shrink-0 hidden md:block">
        <div className="sticky top-20">
          <div className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Contents</div>
          <nav className="space-y-0.5">
            {toc.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`block w-full text-left py-1 px-2 rounded-sm text-xs transition-colors duration-150 ${item.level === 2 ? "pl-5" : "font-medium"} ${active === item.id ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Article content */}
      <article className="flex-1 min-w-0 max-w-3xl">
        {/* Article header */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="text-xs font-mono text-muted-foreground mb-2">Theory · Probability & Statistics</div>
          <div className="flex items-start justify-between">
            <h1 className="font-serif text-3xl font-bold text-foreground leading-tight">
              Conditional Probability & Bayes' Theorem
            </h1>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`mt-1 p-1.5 rounded-sm border transition-colors duration-150 ${bookmarked ? "border-primary text-primary bg-primary/8" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>Section 1.3</span>
            <span>·</span>
            <span>18 min read</span>
            <span>·</span>
            <span>GATE DA 2024 Syllabus</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose-academic space-y-8 text-sm leading-relaxed text-foreground/85">

          {/* Definition */}
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">1.3.1 Definition</h2>
            <p className="mb-4">
              Let <em>A</em> and <em>B</em> be two events defined on a sample space Ω, with P(B) &gt; 0. The <strong>conditional probability</strong> of event <em>A</em> given event <em>B</em> has occurred is defined as:
            </p>
            <div className="theorem-box my-4">
              <div className="text-xs text-muted-foreground font-mono mb-2">Definition 1.3.1 — Conditional Probability</div>
              <div className="font-mono text-sm text-foreground text-center py-2">
                P(A | B) = P(A ∩ B) / P(B)
              </div>
            </div>
            <p>
              Intuitively, conditioning on B restricts our universe from Ω to B — we recompute probabilities relative to this reduced sample space.
            </p>
          </div>

          {/* Collapsible section */}
          <div>
            <button
              onClick={() => toggle("props")}
              className="flex items-center gap-2 font-serif text-xl font-bold text-foreground mb-3 w-full text-left"
            >
              {collapsed["props"] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              1.3.2 Properties
            </button>
            {!collapsed["props"] && (
              <div className="space-y-3 pl-2">
                <p>Conditional probability satisfies all axioms of probability:</p>
                <ul className="space-y-2 pl-4">
                  {["0 ≤ P(A | B) ≤ 1 for any event A", "P(Ω | B) = 1", "If A₁, A₂, ... are mutually exclusive, then P(⋃Aᵢ | B) = Σ P(Aᵢ | B)"].map(p => (
                    <li key={p} className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      <span className="font-mono text-xs text-foreground/80">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-border-faint" />

          {/* Bayes theorem */}
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">1.3.3 Bayes' Theorem</h2>
            <p className="mb-4">
              Bayes' Theorem provides a way to update prior beliefs in light of new evidence. It is foundational to Bayesian statistics, machine learning, and information retrieval.
            </p>
            <div className="theorem-box my-4">
              <div className="text-xs text-muted-foreground font-mono mb-2">Theorem 1.3.1 — Bayes' Theorem</div>
              <div className="font-mono text-sm text-foreground text-center py-2">
                P(A | B) = P(B | A) · P(A) / P(B)
              </div>
              <div className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
                where P(B) = Σₖ P(B | Aₖ) · P(Aₖ) by the Law of Total Probability.
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="border border-border rounded-sm">
            <div className="px-4 py-2.5 border-b border-border bg-secondary/40">
              <span className="text-xs font-mono text-muted-foreground">Example 1.3.1 — Medical Diagnosis</span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm">
                A disease affects 1% of the population. A diagnostic test has 95% sensitivity (true positive rate) and 90% specificity (true negative rate). Given a positive test result, find the probability that the patient actually has the disease.
              </p>
              <div className="definition-box text-xs font-mono">
                <div>Let D = patient has disease, T⁺ = positive test</div>
                <div className="mt-1">P(D) = 0.01, P(T⁺|D) = 0.95, P(T⁺|D̄) = 0.10</div>
                <div className="mt-1">P(T⁺) = 0.95(0.01) + 0.10(0.99) = 0.1085</div>
                <div className="mt-1 text-primary">P(D|T⁺) = (0.95 × 0.01) / 0.1085 ≈ 0.0876</div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Note the counterintuitive result: even with a positive test, the posterior probability of disease is only ~8.76%. This is the base rate fallacy.
              </p>
            </div>
          </div>

          {/* Practice problems */}
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Practice Problems</h2>
            <div className="space-y-2">
              {[
                { id: "DA004", title: "Bayes' Theorem Application", diff: "Easy" },
                { id: "DA007", title: "Hypothesis Testing — Type II Error", diff: "Hard" },
              ].map(p => (
                <div key={p.id} className="flex items-center justify-between border border-border p-3 rounded-sm hover:bg-secondary/30 transition-colors duration-150">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                    <span className="text-sm text-foreground">{p.title}</span>
                  </div>
                  <span className={p.diff === "Hard" ? "difficulty-hard" : "difficulty-easy"}>{p.diff}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
