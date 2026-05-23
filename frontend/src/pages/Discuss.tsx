import { BookOpen, Target, Sparkles, Layers } from "lucide-react";

export default function Discuss() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-2">Discuss</p>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Mathematical-first problem discussion</h1>
        <p className="text-base text-muted-foreground max-w-3xl">
          Every topic is broken down from first principles, then translated into exam-style reasoning. This page shows how we build questions, align them with GATE-level rigor, and turn them into hard practice for serious learners.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="bg-card border border-border rounded-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <BookOpen size={20} />
            <h2 className="font-semibold text-lg">Mathematical-first approach</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-7">
            Each problem starts with the underlying equation or theorem. We work top-down: definitions, assumptions, transformation, and then the final model. This helps you not just solve a question, but understand why the answer is uniquely correct.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Start from fundamentals: variables, constraints, and objective.</li>
            <li>Build the argument using algebra, geometry, probability or discrete reasoning.</li>
            <li>Isolate the critical insight before selecting the answer strategy.</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Target size={20} />
            <h2 className="font-semibold text-lg">Topic clarity</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-7">
            Problems are grouped by core DA topics: Probability, Linear Algebra, Statistics, Optimization, Machine Learning, and Database Theory. The goal is to make the topic assumptions explicit and preserve the exam-style reasoning path.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Identify the central concept before attempting the solution.</li>
            <li>Break questions into smaller sub-problems where each step is mathematically justified.</li>
            <li>Track the type of reasoning required: derivation, transformation, comparison, or approximation.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="bg-card border border-border rounded-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Sparkles size={20} />
            <h2 className="font-semibold text-lg">How problems are created</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-7">
            Our problem creation process begins with syllabus mapping, then moves to strength-based difficulty calibration. Each question is designed to challenge the mathematical intuition behind DA topics and to expose common traps in exam-style reasoning.
          </p>
          <ol className="mt-4 space-y-3 text-sm list-decimal list-inside">
            <li>Choose a strong concept and validate it against GATE patterns.</li>
            <li>Design multiple answer paths, including distractors that test incomplete reasoning.</li>
            <li>Write a full solution with step-by-step explanation, alternative methods, and final verification.</li>
          </ol>
        </div>

        <div className="bg-card border border-border rounded-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Layers size={20} />
            <h2 className="font-semibold text-lg">Hard practice guidelines</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-7">
            Intensive practice is not only about volume, it is about the right sequence. We recommend layered practice: concept drills, mixed-topic sets, and timed problem solving to sharpen speed and accuracy together.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Begin with theory and worked examples for the topic.</li>
            <li>Move to mixed problem sets that preserve the mathematical strategy.</li>
            <li>Finish with hard practice questions that require reasoning under time pressure.</li>
          </ul>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm p-6">
        <h2 className="font-semibold text-xl text-foreground mb-4">Topic details and problem structure</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Probability",
              description:
                "From distribution properties to conditional inference, problems emphasize exact reasoning and combinatorial structure.",
            },
            {
              title: "Linear Algebra",
              description:
                "Focus on eigenvalues, vector spaces, and matrix optimization with derivation-first examples.",
            },
            {
              title: "Optimization",
              description:
                "Practice convexity, gradients, and duality with rigorous boundary and constraint handling.",
            },
            {
              title: "Machine Learning",
              description:
                "Understand model assumptions and learning curves through mathematically grounded examples.",
            },
            {
              title: "Statistics",
              description:
                "Translate hypothesis testing and estimators into precise exam-style reasoning steps.",
            },
            {
              title: "Databases",
              description:
                "Work through query logic, normalization, and index impact using formal set-based reasoning.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-sm border border-border p-4 bg-background">
              <h3 className="font-semibold text-sm text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-6">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
