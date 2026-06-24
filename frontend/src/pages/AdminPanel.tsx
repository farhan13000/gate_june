import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Trash2, Edit2, Clock, X, CheckCircle, XCircle, Info, Clipboard, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LatexRenderer from "../components/LatexRenderer";
import EditorialRenderer from "../components/EditorialRenderer";
import EmbeddedMediaContent from "@/components/EmbeddedMediaContent";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AdminHomeSection from "@/components/admin/AdminHomeSection";
import AdminContestGuide from "@/components/admin/AdminContestGuide";
import AdminContestSection from "@/components/admin/AdminContestSection";
import AdminContestClaimsPage from "@/components/admin/AdminContestClaimsPage";
import AdminTaxonomyManager from "@/components/admin/AdminTaxonomyManager";
import AdminTaxonomyGuide from "@/components/admin/AdminTaxonomyGuide";
import AdminProblemCreationGuide from "@/components/admin/AdminProblemCreationGuide";
import { SiteContainer, MainPanel } from "@/components/layout";
import AdminProblemManager from "@/components/admin/AdminProblemManager";
import AdminTheoryManager from "@/components/admin/AdminTheoryManager";
import AdminExportManager from "@/components/admin/AdminExportManager";
import AdminShell from "@/components/admin/AdminShell";
import AdminPlatformLogs from "@/components/admin/AdminPlatformLogs";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { buildTaxonomyPromptContext } from "@/utils/taxonomyPrompt";

const CREATION_PROTOCOLS = {
  Problem: {
    title: "GATE DA Advanced Problem Generation Protocol",
    description: "Elite multi-layer problem generation protocol: IIT/IISc/TIFR/Olympiad-inspired mathematics with strict JSON safety, LaTeX validation, academic rigor, and concept fusion.",
    promptTemplate: `==================================================
ELITE MATHEMATICAL PROBLEM GENERATION PROTOCOL
==================================================

You are an elite problem designer for:
- GATE Data Science & AI (DA)
- Indian Institute of Technology entrance rigor
- Indian Institute of Science analytical depth
- Tata Institute of Fundamental Research (TIFR)
- International Mathematical Olympiad (IMO)
- ACM algorithmic thinking
- Advanced research-oriented mathematics

==================================================
CORE GENERATION PHILOSOPHY
==================================================

Generate ORIGINAL, mathematically deep problems that:

✓ Test deep understanding (NOT formula recall)
✓ Require multi-step analytical reasoning
✓ Involve hidden mathematical observations
✓ Fuse multiple concepts naturally
✓ Encourage mathematical abstraction & modeling
✓ Reward analytical maturity
✓ Avoid memory-based thinking
✓ Contain elegant mathematical structure

PROBLEMS SHOULD FEEL INSPIRED BY:
- IIT entrance rigor and concept fusion
- IISc analytical screening complexity
- TIFR mathematical maturity
- IMO creative problem design
- ACM algorithmic thinking

PROBLEMS SHOULD AVOID FEELING LIKE:
- Coaching institute memory questions
- Direct formula substitution exercises
- Template-based coaching MCQs
- Repetitive PYQ clones
- Surface-level numericals

==================================================
SYLLABUS DOMAINS (GATE DA)
==================================================

1. PROBABILITY & STATISTICS
   Bayes theorem, distributions, MLE/MAP, hypothesis testing, Bayesian inference

2. LINEAR ALGEBRA
   Eigenvalues, SVD, matrix decomposition, spectral theory, geometric intuition

3. CALCULUS & OPTIMIZATION
   Gradients, Hessian, convex analysis, constrained optimization, asymptotic behavior

4. MACHINE LEARNING
   Regression, classification, dimensionality reduction, kernel theory, probabilistic models

5. ALGORITHMS & DATA STRUCTURES
   Complexity analysis, graph theory, dynamic programming, randomized algorithms

6. DATABASES & SQL
   Relational algebra, normalization, indexing, transaction processing, query optimization

7. ARTIFICIAL INTELLIGENCE
   Search algorithms, game theory, MDPs, reinforcement learning, adversarial reasoning

==================================================
DIFFICULTY SPECIFICATIONS
==================================================

FOUNDATIONAL (Easy):
- Conceptual clarity with direct concept application
- Single-step or dual-step calculations
- Standard theorem/formula application
- Low cognitive overhead

ADVANCED (Medium):
- Multi-step analytical reasoning (3-5 steps)
- Probability insight or algebraic transformation
- Graph interpretation or recursive decomposition
- Constraint propagation and logical deduction
- Requires both concept knowledge and calculation

ELITE HARD (Challenging):
- Asymptotic reasoning and hidden invariants
- Optimization insights and Bayesian interpretation
- Spectral intuition and recursive structure
- Adversarial edge cases and proof-like reasoning
- Theorem derivation or rigorous proof
- Multi-domain concept fusion (2+ domains)
- Deep theoretical foundations
- Elegant mathematical structure with subtlety

==================================================
CONCEPT FUSION REQUIREMENTS
==================================================

Problems SHOULD combine 2+ domains:

- Linear Algebra + Machine Learning (PCA, SVD, projection)
- Probability + Optimization (Bayesian optimization, MAP estimation)
- Calculus + ML (gradient derivation, loss landscape analysis)
- Graph Theory + Algorithms (spectral clustering, network flow)
- Statistics + Information Theory (entropy, KL divergence)
- Algorithms + Probability (randomized algorithms, Markov chains)

==================================================
MATHEMATICAL DEPTH CHARACTERISTICS
==================================================

Problems SHOULD include:

- Asymptotic reasoning (limits, big-O, convergence)
- Hidden invariants (conserved quantities, monotonicity)
- Probabilistic insight (expectation tricks, tail bounds)
- Optimization strategy (duality, gradient flow)
- Graph interpretation (connectivity, spectral properties)
- Algebraic transformation (substitution, decomposition)
- Recursive structure (divide-and-conquer, dynamic programming)
- Bayesian interpretation (prior/posterior, inference)
- Geometric insight (projections, manifolds)
- Generating functions (closed forms, asymptotics)

==================================================
STRICT OUTPUT FORMAT RULES
==================================================

OUTPUT MUST BE:
1. ONLY valid JSON (no markdown, no explanations)
2. SINGLE object (not array)
3. Exactly this structure:

{
  "title": "Problem Title (Clear & Concise)",
  "topic": "Primary GATE DA Domain",
  "subtopic": "Specific Subtopic",
  "difficulty": "Foundational|Advanced|Elite Hard",
  "concepts": ["Concept1", "Concept2", "..."],
   "problem_type": "MCQ",
   "problem_statement": "Statement with LaTeX using only \\\\frac, \\\\sigma, \\\\lambda, etc.",
   "images": [],
  "options": {
    "A": "Option A with \\\\LaTeX",
    "B": "Option B with \\\\LaTeX",
    "C": "Option C with \\\\LaTeX",
    "D": "Option D with \\\\LaTeX"
  },
  "correct_answer": "A",
   "solution": {
     "explanation": "Detailed solution in simple textbook-style paragraphs. Include equations exactly where needed.",
     "images": [],
    "finalAnswer": "Final answer exactly as it should appear in the final answer card."
  },
  "metadata": {
    "exam_style": "GATE DA / IISc / TIFR",
    "difficulty_score": 8.5,
    "estimated_time_minutes": 4,
    "mathematical_maturity": "Asymptotic reasoning, proof intuition",
    "algorithmic_depth": "Decomposition, state-space reasoning",
    "originality_level": "Novel concept fusion"
  }
}

==================================================
STRICT LATEX RULES
==================================================

USE ONLY:
- Double-escaped backslashes: \\\\ (becomes single \ in JSON)
- Compact math: \\\\frac{a}{b}, \\\\sigma, \\\\lambda, \\\\mathbf{v}
- Subscripts: \\\\mu_0, w_1, x_i
- Superscripts: A^T, e^{-x}, w^{(t)}

FORBIDDEN:
- Single backslash: \\
- Dollar signs: $ or $$
- Markdown: backticks, ##, **
- Mixed delimiters
- Unsupported LaTeX commands

VALIDATE:
✓ All math is LaTeX (NO plain text: mu, sigma, lambda)
✓ All backslashes doubled (\\\\)
✓ All quotes escaped ("string with \\" quote")
✓ JSON is parsable
✓ No markdown pollution

==================================================
JSON SAFETY VALIDATION
==================================================

BEFORE FINALIZING:
✓ Entire output is valid JSON
✓ All LaTeX backslashes double-escaped (\\\\)
✓ All quotes properly escaped
✓ No trailing commas
✓ All braces/brackets matched
✓ No explanations outside JSON
✓ No markdown syntax

PARSE CHECK:
- Can be parsed by JSON.parse()
- No syntax errors
- All required fields present
- LaTeX renders without escape artifacts

==================================================
PROHIBITED PATTERNS
==================================================

DO NOT GENERATE:
- Direct theorem recall questions
- Standard PYQ clones or repetitions
- Simple one-step computation
- Trivial matrix calculations
- Memory-based recall
- Coaching institute style templates
- Surface-level numericals
- Obvious elimination in options

DO GENERATE:
- Concept fusion requiring synthesis
- Hidden mathematical observations
- Multi-step analytical decomposition
- Elegant mathematical structures
- Problems with high cognitive depth
- Research-oriented framing
- Originality in problem design

==================================================
QUALITY CHECKSUM
==================================================

The problem is high-quality if:
✓ Concept fusion (2+ domains) OR advanced reasoning
✓ No direct formula substitution path
✓ Distractors exploit common mathematical errors
✓ Solution involves insight, not just computation
✓ Problem statement is unambiguous & rigorous
✓ Mathematical notation is consistent & precise
✓ Problem feels suitable for IIT/IISc/TIFR level
✓ JSON is 100% valid and parsable

==================================================
RETURN ONLY VALID JSON (NO PREAMBLE)
==================================================`,
    rules: [
      "CRITICAL: Return ONLY valid JSON (single object). No markdown, no explanations, no code blocks.",
      "Enforce elite-level academic standards: IIT/IISc/TIFR rigor with concept fusion and mathematical depth.",
      "LaTeX SAFETY: Use ONLY double-escaped backslashes (\\\\frac, \\\\sigma). NO dollar signs, NO single backslash, NO markdown.",
      "JSON SAFETY: All quotes escaped, all braces matched, no trailing commas, parsable by JSON.parse().",
      "MEDIA FORMAT: Use images for statement visuals and solution.images for solution visuals. Each item is { url, alt, caption?, kind: image|diagram, placement: inline|left|right|full }. Place an asset exactly with {{media:0}} in the statement or solution.explanation; left/right become a stacked reading flow on small screens. Only use exact, verified image URLs; never invent URLs, and use [] if none are available.",
      "CONCEPT FUSION: Problems MUST combine 2+ GATE DA domains (e.g., Linear Algebra + Probability + Optimization).",
      "MATHEMATICAL DEPTH: Include asymptotic reasoning, hidden invariants, optimization insights, or proof intuition.",
      "QUALITY: No formula substitution shortcuts, no memory-based questions, no coaching institute templates.",
      "VALIDATION: Before output, verify JSON syntax, LaTeX escaping, and mathematical rigor."
    ]
  },
  "Theory Article": {
    title: "GATE DA Comprehensive Theory Article Protocol",
    description: "Use this protocol to generate syllabus-aligned, conceptually deep theory notes with LaTeX equations and verified image/diagram support when useful.",
    promptTemplate: `You are an academic textbook author designing study materials for the GATE Data Science and AI syllabus.
Your goal is to generate extremely detailed, textbook-quality study notes in standard JSON format.

SYLLABUS & TOPIC COVERAGE:
The content must strictly target the GATE DA syllabus domains: Probability & Statistics, Linear Algebra, Calculus & Optimization, DBMS, Algorithms/Data Structures, Machine Learning, and Artificial Intelligence.

STRUCTURAL COMPONENTS:
1. Concepts & Formulas: Rigorous explanations using double-escaped LaTeX math formulas.
2. Custom Render Blocks:
   - "Theorem: <Title>" followed by the mathematical theorem statement.
   - "Example: <Title>" followed by a detailed illustrative example.
   - "GATE Example: <Title>" followed by historical GATE problems with analytical solutions.
3. VISUALS:
   - Use an optional top-level "images" array for real figures and diagrams: [{ "url": "https://...", "alt": "accessible description", "caption": "optional caption", "kind": "image" | "diagram", "placement": "inline" | "left" | "right" | "full" }]. Place one inside content with {{media:0}}; side placements stack on small screens.
   - Include a visual only when its exact, verified URL is already available. Never fabricate URLs. Use [] when no visual is available.
   - Do not use HTML, SVG markup, Mermaid syntax, base64 blobs, or image-generation prompts in JSON.

CRITICAL LATEX FORMATTING RULES:
1. NEVER write any mathematical variable, constant, equation, fraction, subscript, superscript, matrix, parameter, or math symbol as plain text!
   - BAD (Never do this): "mu_MAP = [ (n/sigma^2)*x_bar + (1/tau^2)*mu_0 ] / [ (n/sigma^2) + (1/tau^2) ]"
   - BAD (Never do this): "mu_0 = 2", "tau^2 = 1", "x_bar = 4", "n = 3", "sigma^2 = 4"
   - BAD (Never do this): "A = A^T", "lambda = 1 and 3"
   - GOOD (Always do this): "\\\\( \\\\mu_{\\\\text{MAP}} = \\\\frac{\\\\frac{n}{\\\\sigma^2}\\\\bar{x} + \\\\frac{1}{\\\\tau^2}\\\\mu_0}{\\\\frac{n}{\\\\sigma^2} + \\\\frac{1}{\\\\tau^2}} \\\\)"
   - GOOD (Always do this): "\\\\( \\\\mu_0 = 2 \\\\)", "\\\\( \\\\tau^2 = 1 \\\\)", "\\\\( \\\\bar{x} = 4 \\\\)", "\\\\( n = 3 \\\\)", "\\\\( \\\\sigma^2 = 4 \\\\)"
   - GOOD (Always do this): "\\\\( A = A^T \\\\)", "\\\\( \\\\lambda = 1 \\\\text{ and } 3 \\\\)"
2. All LaTeX formulas inside the JSON string must have double-escaped backslashes.
   - For inline formulas, wrap them in: "\\\\( ... \\\\)"
   - For block equations, wrap them in: "\\\\[ ... \\\\]"
   - For bold textbook-style text inside LaTeX, use "\\\\mathbf{...}" or "\\\\text{...}".
   - For fractions, use "\\\\frac{numerator}{denominator}".
   - For derivatives, use "\\\\frac{\\\\partial y}{\\\\partial x}".
   - For greek letters, use "\\\\lambda", "\\\\sigma", "\\\\tau", "\\\\mu", "\\\\theta", "\\\\alpha", "\\\\beta".
3. Check and verify that EVERY equation in the article "content" conforms to this rule. No mathematical characters should be naked in the plain text.

OUTPUT REQUIREMENTS:
1. You MUST respond with ONLY a valid, parsable raw JSON array. Do NOT wrap it in markdown block quotes (e.g. do not use \`\`\`json).
2. All LaTeX formulas inside the markdown text MUST be double-escaped for JSON: use "\\\\( ... \\\\)" and "\\\\[ ... \\\\]".
3. Keep the content deeply analytical, focusing on 'Why' rather than just 'What'. Explain trade-offs, constraints, and mathematical proofs.

JSON SCHEME REFERENCE:
[
  {
    "title": "Principal Component Analysis (PCA)",
    "topic": "Machine Learning",
    "chapterId": "4",
    "chapterTitle": "Dimensionality Reduction",
    "sectionId": "4.1",
  "content": "Core Concept of PCA\\n\\nPrincipal Component Analysis is a linear dimensionality reduction technique that finds the directions of maximum variance...\\n\\n\\\\[ \\\\frac{1}{n} X^T X \\\\]\\n\\nTheorem: Maximum Variance Projection\\nLet \\\\( u_1 \\\\) be the first principal direction...\\n\\nExample: 2D Data Projection\\nConsider a dataset of 3 points...",
  "images": []
  }
]`,
    rules: [
      "The response must be a 100% valid JSON array containing double-escaped LaTeX equations.",
      "Use images only when a verified URL is supplied; each image needs url, alt, optional caption, kind (image or diagram), and optional placement (inline, left, right, full). Insert {{media:0}} in content to place the first image.",
      "Use custom block prefixes ('Theorem: [Title]', 'Example: [Title]', 'GATE Example: [Title]') to structure the layout of the notes."
    ]
  }
};

const APPROVAL_TAGS = ["GATE", "GATE DA", "Olympiad", "Advanced"] as const;
type ApprovalTag = (typeof APPROVAL_TAGS)[number];
const REVIEWABLE_STATUSES = ["pending_review", "draft", "rejected"];

const parseMediaForPreview = (raw: string): unknown[] => {
  try {
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  } catch {
    return [];
  }
};

const getInitialApprovalTag = (item: any): ApprovalTag => {
  const existingTag = Array.isArray(item?.tags)
    ? item.tags.find((tag: string) => APPROVAL_TAGS.includes(tag as ApprovalTag))
    : undefined;
  return (existingTag as ApprovalTag | undefined) || "GATE DA";
};

type Section =
  | "Overview"
  | "Taxonomy Manager"
  | "Taxonomy Guide"
  | "Problem Creation Guide"
  | "Problem Manager"
  | "Theory Manager"
  | "Home Management"
  | "User Analytics"
  | "Content Management"
  | "Contest Factory"
  | "Contest Claims"
  | "Contest Guide"
  | "Approval Dashboard"
  | "Content Inventory"
  | "Problem Bank"
  | "Export Manager"
  | "Platform Logs";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tree: taxonomyTree } = useTaxonomy();
  const [bulkPromptSubjectId, setBulkPromptSubjectId] = useState("");
  const selectedPromptSubject = useMemo(
    () => taxonomyTree.find((subject) => subject.subjectId === bulkPromptSubjectId) || taxonomyTree[0],
    [bulkPromptSubjectId, taxonomyTree]
  );
  const taxonomyPromptContext = useMemo(
    () => buildTaxonomyPromptContext(selectedPromptSubject ? [selectedPromptSubject] : []),
    [selectedPromptSubject]
  );
  const completeTaxonomyPromptContext = useMemo(
    () => buildTaxonomyPromptContext(taxonomyTree, Number.MAX_SAFE_INTEGER),
    [taxonomyTree]
  );
  const taxonomyCounts = useMemo(() => {
    const scopedTree = selectedPromptSubject ? [selectedPromptSubject] : [];
    const chapters = scopedTree.flatMap((subject) => subject.chapters || []);
    const topics = chapters.flatMap((chapter) => chapter.topics || []);
    const subtopics = topics.flatMap((topic) => topic.subtopics || []);
    return {
      subjects: scopedTree.length,
      chapters: chapters.length,
      topics: topics.length,
      subtopics: subtopics.length,
    };
  }, [selectedPromptSubject]);

  const completeTaxonomyCounts = useMemo(() => {
    const chapters = taxonomyTree.flatMap((subject) => subject.chapters || []);
    const topics = chapters.flatMap((chapter) => chapter.topics || []);
    const subtopics = topics.flatMap((topic) => topic.subtopics || []);
    return { subjects: taxonomyTree.length, chapters: chapters.length, topics: topics.length, subtopics: subtopics.length };
  }, [taxonomyTree]);

  const buildSyncedCreationPrompt = (scope: "subject" | "complete" = "subject") => {
    const isProblem = qForm.type === "Problem";
    const isCompleteTaxonomy = scope === "complete";
    const subjectName = isCompleteTaxonomy
      ? "the complete currently available taxonomy"
      : selectedPromptSubject
      ? `${selectedPromptSubject.name}${selectedPromptSubject.code ? ` (${selectedPromptSubject.code})` : ""}`
      : "the selected subject";
    const activeTaxonomyContext = isCompleteTaxonomy ? completeTaxonomyPromptContext : taxonomyPromptContext;
    const taxonomyHeading = isCompleteTaxonomy ? "COMPLETE AVAILABLE TAXONOMY" : "CURRENT SUBJECT TAXONOMY";
    const coverageRules = isCompleteTaxonomy
      ? `COMPLETE TAXONOMY COVERAGE
- Use only IDs listed below, and keep every item's four taxonomy IDs on one valid subject-to-subtopic path.
- Spread items across subjects and their available chapters, topics, and subtopics; do not invent or cross-link IDs.
- For a requested subject, generate only within that subject. If no count is specified, create 10 high-quality items distributed sensibly across the available taxonomy.`
      : `SUBJECT-SCOPED COVERAGE
- Generate content only from the subject listed above.
- Spread items across available chapters, topics, and subtopics instead of repeating one branch.
- Prefer underused-looking subtopics and mix direct, conceptual, and synthesis-style items.
- If a requested count is not specified, create 10 high-quality items.`;
    return `Create ${isProblem ? "GATE DA problems" : "GATE DA theory articles"} as valid JSON only for ${subjectName}.

${taxonomyHeading}
Use only these IDs. Do not invent taxonomy, do not use IDs from any other subject, and do not leave taxonomy fields blank.

${activeTaxonomyContext}

${coverageRules}

OUTPUT MODE
- Return a JSON array for bulk creation.
- Every item must include subjectId, chapterId, topicId, and subtopicId.
- Use double-escaped LaTeX: "\\\\frac{a}{b}", "\\\\sigma", "\\\\lambda".
- No markdown wrapper, no prose outside JSON.

RENDERING AND LATEX CONTRACT
- The frontend renders strings with KaTeX/LaTeX-aware renderers, so every mathematical expression must be valid LaTeX inside a valid JSON string.
- Inline math must be wrapped as "\\\\( ... \\\\)".
- Display math must be wrapped as "\\\\[ ... \\\\]".
- Because this is JSON, every LaTeX backslash must be double escaped. Write "\\\\frac", "\\\\sum", "\\\\lambda", "\\\\mathbb{R}", not "\\frac", "\\sum", "\\lambda".
- Never use dollar math delimiters like "$x$", "$$x$$", or markdown code fences for equations.
- Escape quotes inside strings as "\\\"" and newlines as "\\n". Do not insert raw line breaks inside JSON string values.
- Use plain UTF-8 text only for prose. Use LaTeX commands for math symbols, matrices, vectors, probability notation, expectations, gradients, integrals, limits, and complexity notation.
- Good inline example: "For \\\\( X \\\\sim \\\\mathcal{N}(\\\\mu, \\\\sigma^2) \\\\), compute \\\\( \\\\mathbb{E}[X] \\\\)."
- Good display example: "\\\\[ \\\\nabla f(x) = A^T(Ax-b) \\\\]"
- Bad examples: "$E[X]$", "\\frac{a}{b}", "lambda_1", "x^T A x" without LaTeX delimiters.
- For MCQ/MSQ options, each option text can contain inline LaTeX and must be a JSON string.
- For NAT final answers, put the exact answer in solution.finalAnswer and keep options as [] or omit options.
- For PROOF questions, write a proof-style statement and solution; keep options as [] or omit options.
- Keep each problem solution simple: use solution.explanation, solution.finalAnswer, and optional solution.images.
- MEDIA CONTRACT: use a top-level images array for statement visuals and solution.images for solution visuals. Every asset is { "url": "https://...", "alt": "accessible description", "caption": "optional caption", "kind": "image" | "diagram", "placement": "inline" | "left" | "right" | "full" }. Put {{media:0}} directly inside statement or solution.explanation to embed an image at that point; side placements stack on small screens.
- Use media only when a real, verified URL is already supplied by the request or source material. Never invent a URL. Use [] when no visual is available.
- If a diagram would help, include it inline as readable text: "Diagram: <title>\\\\nStep 1 -> Step 2 -> Step 3".
- If a graph would help, include it inline as readable text: "Graph: <title>\\\\nHorizontal axis: ...\\\\nVertical axis: ...\\\\nShape/key points: ...".
- For process/modeling explanations, use compact text flows such as "Inputs in \\\\(A\\\\) -> choices in \\\\(B\\\\) -> product rule".
- For images and diagrams, use only the supported images arrays. Do not include HTML, SVG markup, Mermaid syntax, base64 blobs, or image-generation prompts in JSON.
- A URL is allowed only in a media asset with a verified source. Do not invent a source or an image URL.
- Before returning, mentally run JSON.parse on the response and verify every math string renders with KaTeX.

${isProblem ? `PROBLEM ITEM SHAPE
{
  "subjectId": "SUBJECT_ID",
  "chapterId": "CHAPTER_ID",
  "topicId": "TOPIC_ID",
  "subtopicId": "SUBTOPIC_ID",
  "title": "Problem title",
  "topic": "Exact topic name",
  "subtopic": "Exact subtopic name",
  "difficulty": "Easy|Medium|Hard",
  "questionType": "MCQ|MSQ|NAT|PROOF",
  "statement": "Problem statement with inline math like \\\\( x^T A x \\\\) and display math like \\\\[ A = U\\\\Sigma V^T \\\\].",
  "images": [],
  "solution": {
    "explanation": "Detailed solution in simple paragraphs. Put equations inline as \\\\( ... \\\\) or display as \\\\[ ... \\\\].",
    "images": [],
    "finalAnswer": "Final answer with valid LaTeX if mathematical, e.g. \\\\( \\\\frac{3}{2} \\\\)."
  },
  "options": [
    { "text": "\\\\( \\\\lambda = 1 \\\\)", "isCorrect": true },
    { "text": "\\\\( \\\\lambda = 0 \\\\)", "isCorrect": false }
  ],
  "tags": ["concept"]
}` : `THEORY ITEM SHAPE
{
  "subjectId": "SUBJECT_ID",
  "chapterId": "CHAPTER_ID",
  "topicId": "TOPIC_ID",
  "subtopicId": "SUBTOPIC_ID",
  "title": "Theory title",
  "topic": "Exact topic name",
  "chapterTitle": "Exact chapter name",
  "sectionId": "SUBTOPIC_ID",
  "images": [],
  "content": "Well-structured article. Use headings as plain text, inline math as \\\\( ... \\\\), display equations as \\\\[ ... \\\\], and escaped newlines as \\\\n. Put any visual explanation inline as a readable block such as Diagram: Title\\\\nStep 1 -> Step 2 -> Step 3.",
  "formulas": ["\\\\[ \\\\mathbb{E}[X] = \\\\int_{-\\\\infty}^{\\\\infty} x f_X(x)\\\\,dx \\\\]"],
  "examples": ["Worked example paragraph with valid inline LaTeX like \\\\( \\\\nabla f(x) = 0 \\\\)."],
  "highlights": ["Key point with math wrapped as \\\\( ... \\\\) when needed."]
}`}`;
  };

  // Navigation State
  const [activeSection, setActiveSection] = useState<Section>("Overview");

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [problemsStats, setProblemsStats] = useState<any[]>([]);
  const [activeContestCount, setActiveContestCount] = useState(0);

  // User Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvalTags, setApprovalTags] = useState<Record<string, ApprovalTag>>({});
  const [bulkApprovalTag, setBulkApprovalTag] = useState<ApprovalTag>("GATE DA");

  // Reset selection on section change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeSection]);

  // Content Creation State
  const [uploadMethod, setUploadMethod] = useState<"Manual" | "Bulk">("Manual");
  const [bulkJson, setBulkJson] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[] | null>(null);
  const [bulkParseError, setBulkParseError] = useState("");
  const [qForm, setQForm] = useState({
    type: "Problem", title: "", topic: "", difficulty: "Medium", 
    statement: "Problem Statement -> full LaTeX live-rendering support.", 
    solution: "Authentic Solution --> full LaTeX live-rendering support.", 
    imageUrl: "", images: "", solutionImages: "", questionType: "MCQ", approvalLevel: "Level 1: Draft",
    options: [{ text: "Full LaTeX live-rendering", isCorrect: true }, { text: "Full LaTeX live-rendering", isCorrect: false }],
    positiveMarks: 2, negativeMarks: 0.5,
    chapterId: "1", chapterTitle: "Introduction", sectionId: "1.1"
  });

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    fetchUsers();
    fetchPendingQuestions();
    fetchProblems();
    fetchContestCount();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (error) {}
  };

  const fetchPendingQuestions = async () => {
    try {
      const [qRes, tRes] = await Promise.all([
        fetch("/api/admin/questions"),
        fetch("/api/admin/theories"),
      ]);
      let pending: any[] = [];
      if (qRes.ok) {
        const qs = await qRes.json();
        pending = [...pending, ...qs.filter((q: any) => REVIEWABLE_STATUSES.includes(q.status)).map((q: any) => ({...q, _contentType: "question"}))];
      }
      if (tRes.ok) {
        const ts = await tRes.json();
        pending = [...pending, ...ts.filter((t: any) => REVIEWABLE_STATUSES.includes(t.status)).map((t: any) => ({...t, _contentType: "theory"}))];
      }
      setPendingQuestions(pending);
      setApprovalTags((current) =>
        pending.reduce<Record<string, ApprovalTag>>((next, item) => {
          next[item._id] = current[item._id] || getInitialApprovalTag(item);
          return next;
        }, {})
      );
    } catch (error) {}
  };

  const fetchProblems = async () => {
    try {
      const res = await fetch("/api/admin/questions", { credentials: "include" });
      if (res.ok) setProblemsStats(await res.json());
    } catch (error) {}
  };

  const fetchContestCount = async () => {
    try {
      const res = await fetch("/api/admin/contests", { credentials: "include" });
      if (res.ok) {
        const list = await res.json();
        const now = Date.now();
        const active = list.filter(
          (c: { status: string; endTime: string }) =>
            c.status === "approved" && new Date(c.endTime).getTime() > now
        ).length;
        setActiveContestCount(active);
      }
    } catch {
      /* ignore */
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isTheory = qForm.type === "Theory Article";
      const parseMedia = (raw: string, field: string) => {
        if (!raw.trim()) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) && (!parsed || typeof parsed !== "object")) {
          throw new Error(`${field} must be a media object or array.`);
        }
        return Array.isArray(parsed) ? parsed : [parsed];
      };
      const images = parseMedia(qForm.images, "Statement media");
      const solutionImages = isTheory ? [] : parseMedia(qForm.solutionImages, "Solution media");
      const payload = isTheory
        ? { title: qForm.title, topic: qForm.topic, chapterId: qForm.chapterId, chapterTitle: qForm.chapterTitle, sectionId: qForm.sectionId, content: qForm.statement, imageUrl: qForm.imageUrl, images }
        : {
            ...qForm,
            images,
            solution: solutionImages.length ? { explanation: qForm.solution, images: solutionImages } : qForm.solution,
            options: ["NAT", "PROOF"].includes(qForm.questionType) ? [] : qForm.options,
            markingScheme: { positive: qForm.positiveMarks, negative: qForm.negativeMarks },
          };
      delete (payload as Record<string, unknown>).solutionImages;
      
      const endpoint = isTheory ? "/api/admin/theories" : "/api/admin/questions";
      
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Saved to pending approvals");
        fetchPendingQuestions();
        fetchProblems();
      } else {
        toast.error("Submission failed");
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Network error"); }
  };

  const robustJsonParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      let result = "";
      let i = 0;
      while (i < str.length) {
        if (str[i] === '\\') {
          const next = str[i + 1];
          if (next && '"\\/ntru'.includes(next)) {
            if (next === 'u') {
              const hex = str.substring(i + 2, i + 6);
              if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                result += '\\u' + hex;
                i += 6;
                continue;
              }
            }
            result += '\\' + next;
            i += 2;
          } else {
            result += '\\\\';
            i += 1;
          }
        } else {
          result += str[i];
          i += 1;
        }
      }
      return JSON.parse(result);
    }
  };

  const formatBulkJson = () => {
    try {
      if (!bulkJson.trim()) return;
      const parsed = robustJsonParse(bulkJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setBulkJson(formatted);
      setBulkParseError("");
      toast.success("JSON Formatted Successfully!");
    } catch (e: any) {
      setBulkParseError("Formatting failed. Invalid JSON syntax: " + e.message);
      toast.error("Format failed: Invalid JSON syntax");
    }
  };

  const parseBulkJson = () => {
    try {
      const data = robustJsonParse(bulkJson);
      const normalizedData = Array.isArray(data) ? data : [data];
      
      if (normalizedData.length === 0) { 
        setBulkParseError("JSON must contain at least one item"); 
        return; 
      }
      
      if (!normalizedData.every(item => typeof item === 'object' && item !== null)) {
        setBulkParseError("Each item must be a valid JSON object");
        return;
      }
      
      const transformedData = normalizedData.map(item =>
        qForm.type === "Theory Article" ? transformTheoryProtocol(item) : transformEliteProtocol(item)
      );
      const validationErrors = transformedData.flatMap((item, index) => validateBulkItem(item, index));
      if (validationErrors.length > 0) {
        setBulkParseError(validationErrors.slice(0, 5).join(" | "));
        setBulkPreview(null);
        return;
      }
      
      setBulkParseError("");
      setBulkPreview(transformedData);
    } catch(e: any) {
      setBulkParseError("Invalid JSON: " + e.message);
      setBulkPreview(null);
    }
  };

  const transformEliteProtocol = (item: any): any => {
    // Handle both elite protocol format and legacy format
    // Elite protocol: problem_statement, options{A/B/C/D}, difficulty{Foundational|Advanced|Elite Hard}
    // Backend format: statement, options[{text, isCorrect}], difficulty{Easy|Medium|Hard}
    const normalizedSolution = item.solution && typeof item.solution === "object" && !Array.isArray(item.solution)
      ? { ...item.solution }
      : item.solution || {};
    
      const transformed: any = {
      subjectId: item.subjectId || "",
      chapterId: item.chapterId || "",
      topicId: item.topicId || "",
      subtopicId: item.subtopicId || "",
      title: item.title || "Untitled",
      topic: item.topic || "",
      subtopic: item.subtopic || "",
      difficulty: mapDifficulty(item.difficulty) || "Medium",
      questionType: String(item.problem_type || item.questionType || "MCQ").toUpperCase() === "PROOF"
        ? "PROOF"
        : item.problem_type || item.questionType || "MCQ",
       statement: item.problem_statement || item.statement || "",
       images: item.images ?? item.figures ?? item.visuals ?? item.diagrams ?? [],
       imageUrl: item.imageUrl || "",
       tags: item.concepts || item.tags || [],
      solution: normalizedSolution,
      estimatedTime: item.estimatedTime || ((item.metadata?.estimated_time_minutes || 3) * 60),
      markingScheme: {
        positive: item.markingScheme?.positive ?? item.positiveMarks ?? 2,
        negative: item.markingScheme?.negative ?? item.negativeMarks ?? 0.5,
      },
    };

    // Transform options from {A, B, C, D} format to [{text, isCorrect}] format
    if (item.options && typeof item.options === 'object' && !Array.isArray(item.options)) {
      const optionsArray = [];
      const correctAnswer = (item.correct_answer || item.correctAnswer || "").toUpperCase();
      for (const [key, value] of Object.entries(item.options)) {
        optionsArray.push({
          text: String(value),
          isCorrect: key.toUpperCase() === correctAnswer
        });
      }
      transformed.options = optionsArray;
    } else if (Array.isArray(item.options)) {
      // Already in array format
      transformed.options = item.options;
    }

    return transformed;
  };

  const transformTheoryProtocol = (item: any): any => ({
    subjectId: item.subjectId || "",
    chapterId: item.chapterId || qForm.chapterId || "",
    topicId: item.topicId || "",
    subtopicId: item.subtopicId || item.sectionId || "",
    title: item.title || item.heading || "Untitled theory article",
    topic: item.topic || qForm.topic || "",
    chapterTitle: item.chapterTitle || item.chapter || qForm.chapterTitle || "",
    sectionId: item.sectionId || item.subtopic || qForm.sectionId || "",
    content: item.content || item.statement || item.body || "",
    formulas: Array.isArray(item.formulas) ? item.formulas : String(item.formulas || "").split("\n").filter(Boolean),
    examples: Array.isArray(item.examples) ? item.examples : String(item.examples || "").split("\n").filter(Boolean),
    highlights: Array.isArray(item.highlights) ? item.highlights : String(item.highlights || "").split("\n").filter(Boolean),
    images: item.images ?? item.figures ?? item.visuals ?? item.diagrams ?? [],
    imageUrl: item.imageUrl || "",
  });

  const validateBulkItem = (item: any, index: number) => {
    const itemNo = index + 1;
    const errors: string[] = [];
    if (!item.title || item.title === "Untitled") errors.push(`#${itemNo}: missing title`);
    if (qForm.type === "Problem") {
      if (!item.subjectId || !item.chapterId || !item.topicId || !item.subtopicId) {
        errors.push(`#${itemNo}: missing taxonomy IDs (subjectId, chapterId, topicId, subtopicId)`);
      }
      if (!item.statement) errors.push(`#${itemNo}: missing problem statement`);
      if (!["NAT", "PROOF"].includes(item.questionType) && (!Array.isArray(item.options) || item.options.length < 2)) {
        errors.push(`#${itemNo}: MCQ/MSQ needs at least 2 options`);
      }
      if (!["NAT", "PROOF"].includes(item.questionType) && !item.options?.some((opt: any) => opt.isCorrect)) {
        errors.push(`#${itemNo}: mark at least one correct option`);
      }
    } else {
      if (!item.subjectId || !item.chapterId || !item.topicId || !item.subtopicId) {
        errors.push(`#${itemNo}: missing taxonomy IDs (subjectId, chapterId, topicId, subtopicId)`);
      }
      if (!item.content) errors.push(`#${itemNo}: missing theory content`);
    }
    return errors;
  };

  const mapDifficulty = (difficulty: string): "Easy" | "Medium" | "Hard" => {
    const diff = (difficulty || "").toLowerCase();
    if (diff.includes("foundational") || diff.includes("easy")) return "Easy";
    if (diff.includes("elite") || diff.includes("hard")) return "Hard";
    return "Medium"; // Default for "Advanced" and anything else
  };

  const submitBulk = async () => {
    if (!bulkPreview) return;
    try {
      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: qForm.type, data: bulkPreview }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Bulk Upload Successful!");
        fetchPendingQuestions();
        fetchProblems();
        setBulkJson("");
        setBulkPreview(null);
      } else {
        toast.error(result.message || "Bulk upload failed");
      }
    } catch(e) { toast.error("Network error during upload"); }
  };

  const handleApprove = async (
    id: string,
    status: "approved" | "rejected",
    contentType: "question" | "theory" = "question",
    tag?: ApprovalTag
  ) => {
    try {
      const endpoint = contentType === "theory"
        ? `/api/admin/theories/${id}/approve`
        : `/api/admin/questions/${id}/approve`;
      const selectedTag = tag || approvalTags[id] || "GATE DA";
      
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "approved" ? { status, tag: selectedTag } : { status }),
      });
      
      if (res.ok) {
        toast.success(`Item ${status}!`);
        fetchPendingQuestions();
        fetchProblems();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        toast.error(`Error: ${errorData.message || "Failed to update status"}`);
      }
    } catch { 
      toast.error("Network error updating status"); 
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAllSelection = (items: any[]) => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i._id)));
    }
  };

  const handleBulkApprove = async (status: "approved" | "rejected") => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to bulk ${status} ${selectedIds.size} items?`)) return;
    
    const itemsToProcess = pendingQuestions.filter(q => selectedIds.has(q._id));
    toast.loading(`Processing ${itemsToProcess.length} items...`);
    
    const promises = itemsToProcess.map(item => {
      const endpoint = item._contentType === "theory"
        ? `/api/admin/theories/${item._id}/approve`
        : `/api/admin/questions/${item._id}/approve`;
      return fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "approved" ? { status, tag: bulkApprovalTag } : { status })
      });
    });

    try {
      await Promise.all(promises);
      toast.dismiss();
      toast.success(`Bulk ${status} complete!`);
      setSelectedIds(new Set());
      fetchPendingQuestions();
      fetchProblems();
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred during bulk operation");
    }
  };

  const sections: Section[] = [
    "Overview",
    "Taxonomy Manager",
    "Taxonomy Guide",
    "Problem Creation Guide",
    "Problem Manager",
    "Theory Manager",
    "Home Management",
    "User Analytics",
    "Content Management",
    "Problem Bank",
    "Export Manager",
    "Content Inventory",
    "Contest Factory",
    "Contest Claims",
    "Contest Guide",
    "Approval Dashboard",
    "Platform Logs",
  ];

  // ── Content Inventory State ──
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [allTheories, setAllTheories] = useState<any[]>([]);
  const [inventoryTab, setInventoryTab] = useState<"problems" | "theories">("problems");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("all");
  const [inventoryDifficultyFilter, setInventoryDifficultyFilter] = useState("all");
  const [problemBankStatusFilter, setProblemBankStatusFilter] = useState("approved");
  const [problemBankDifficultyFilter, setProblemBankDifficultyFilter] = useState("all");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editMode, setEditMode] = useState<"fields" | "json">("fields");
  const [editJson, setEditJson] = useState<string>("");
  const [editJsonError, setEditJsonError] = useState<string>("");
  const [historyItem, setHistoryItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editNote, setEditNote] = useState("");

  const handleEditJsonChange = (value: string) => {
    setEditJson(value);
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setEditJsonError("Raw JSON must be an object representing this item");
        return;
      }
      setEditItem({ ...parsed });
      setEditJsonError("");
    } catch (error: any) {
      setEditJsonError(error?.message || "Invalid JSON");
    }
  };

  useEffect(() => {
    if (!editItem) return;
    setEditJson(JSON.stringify(editItem, null, 2));
    setEditJsonError("");
  }, [editItem]);

  const fetchAllContent = async () => {
    try {
      const [qRes, tRes] = await Promise.all([
        fetch("/api/admin/questions"),
        fetch("/api/admin/theories"),
      ]);
      if (qRes.ok) setAllQuestions(await qRes.json());
      if (tRes.ok) setAllTheories(await tRes.json());
    } catch {}
  };

  useEffect(() => {
    if (activeSection === "Content Inventory" || activeSection === "Problem Bank") fetchAllContent();
  }, [activeSection]);

  const handleDelete = async (id: string, type: "question" | "theory") => {
    if (!confirm("Permanently delete this item? This cannot be undone.")) return;
    try {
      const endpoint = type === "question" ? `/api/admin/questions/${id}` : `/api/admin/theories/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted!"); fetchAllContent(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Network error"); }
  };

  const handleBulkDelete = async (itemsSource: any[]) => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} items? This cannot be undone.`)) return;

    const itemsToProcess = itemsSource.filter(i => selectedIds.has(i._id));
    toast.loading(`Deleting ${itemsToProcess.length} items...`);

    const promises = itemsToProcess.map(item => {
      // If it has questionType it's a question, else a theory (since problem bank only has questions, and inventory has both but split by tab)
      const type = item.questionType !== undefined || item.options !== undefined ? "questions" : "theories";
      const endpoint = `/api/admin/${type}/${item._id}`;
      return fetch(endpoint, { method: "DELETE" });
    });

    try {
      await Promise.all(promises);
      toast.dismiss();
      toast.success(`Bulk delete complete!`);
      setSelectedIds(new Set());
      fetchAllContent();
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred during bulk delete");
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      const isTheory = editItem._contentType === "theory" || (editItem.questionType === undefined && editItem.content !== undefined);
      const endpoint = isTheory ? `/api/admin/theories/${editItem._id}` : `/api/admin/questions/${editItem._id}`;
      const editablePayload = { ...editItem };
      delete editablePayload._contentType;
      delete editablePayload._id;
      delete editablePayload.createdBy;
      delete editablePayload.approvedBy;
      delete editablePayload.auditLog;
      delete editablePayload.createdAt;
      delete editablePayload.updatedAt;
      if (["rejected", "draft"].includes(editablePayload.status)) {
        editablePayload.status = "pending_review";
      }
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editablePayload, note: editNote }),
      });
      if (res.ok) {
        toast.success("Saved successfully!");
        setEditItem(null); setEditNote("");
        fetchAllContent(); fetchPendingQuestions();
      } else toast.error("Save failed");
    } catch { toast.error("Network error"); }
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-green-500/10 text-green-600 border-green-500/20";
    if (s === "rejected") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (s === "pending_review") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-secondary text-muted-foreground border-border";
  };

  const reviewStatusLabel = (s: string) => {
    if (s === "pending_review") return "Pending";
    if (s === "rejected") return "Rejected";
    if (s === "draft") return "Draft";
    return s;
  };

  const matchesStatusFilter = (item: any, filter: string) => filter === "all" || item.status === filter;
  const matchesDifficultyFilter = (item: any, filter: string) => filter === "all" || item.difficulty === filter;

  const filteredInventoryQuestions = useMemo(
    () => allQuestions.filter((q) => matchesStatusFilter(q, inventoryStatusFilter) && matchesDifficultyFilter(q, inventoryDifficultyFilter)),
    [allQuestions, inventoryStatusFilter, inventoryDifficultyFilter]
  );
  const filteredInventoryTheories = useMemo(
    () => allTheories.filter((t) => matchesStatusFilter(t, inventoryStatusFilter)),
    [allTheories, inventoryStatusFilter]
  );
  const filteredProblemBankQuestions = useMemo(
    () => allQuestions.filter((q) => matchesStatusFilter(q, problemBankStatusFilter) && matchesDifficultyFilter(q, problemBankDifficultyFilter)),
    [allQuestions, problemBankStatusFilter, problemBankDifficultyFilter]
  );

  return (
    <div className="min-h-screen bg-background pb-20 site-main-shell">
      <SiteContainer className="page-container">
        <MainPanel className="min-h-[calc(100vh-10rem)] p-0 overflow-hidden animate-in fade-in duration-300">
          <AdminShell
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            pendingCount={pendingQuestions.length}
          >
        {/* OVERVIEW SECTION */}
        {activeSection === "Overview" && (
          <div className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="academic-card p-6 border-l-4 border-l-primary">
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-bold">Total Users</div>
                <div className="text-4xl font-bold font-mono text-foreground">{users.length.toLocaleString()}</div>
              </div>
              <div className="academic-card p-6 border-l-4 border-l-amber-500">
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-bold">Pending Reviews</div>
                <div className="text-4xl font-bold font-mono text-foreground">{pendingQuestions.length}</div>
              </div>
              <div className="academic-card p-6 border-l-4 border-l-green-500">
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-bold">Active Contests</div>
                <div className="text-4xl font-bold font-mono text-foreground">{activeContestCount}</div>
              </div>
            </div>
            
            <div className="academic-card p-6 mt-8">
              <h3 className="font-bold text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <button onClick={() => setActiveSection("Home Management")} className="btn-primary px-4 py-2 text-xs">Home & Announcements</button>
                <button onClick={() => setActiveSection("Content Management")} className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Create Content</button>
                <button onClick={() => setActiveSection("Approval Dashboard")} className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Review Queue</button>
                <button onClick={() => setActiveSection("Contest Factory")} className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Schedule Contest</button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "Taxonomy Manager" && <AdminTaxonomyManager />}
        {activeSection === "Taxonomy Guide" && <AdminTaxonomyGuide />}
        {activeSection === "Problem Creation Guide" && <AdminProblemCreationGuide />}
        {activeSection === "Problem Manager" && <AdminProblemManager />}
        {activeSection === "Theory Manager" && <AdminTheoryManager />}

        {activeSection === "Home Management" && <AdminHomeSection />}
        {activeSection === "Contest Guide" && <AdminContestGuide />}

        {/* USER ANALYTICS SECTION */}
        {activeSection === "User Analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* User Directory */}
            <div className="lg:col-span-8">
              <h2 className="text-lg font-bold font-serif mb-3 text-foreground">User Directory & Details</h2>
              <div className="academic-card">
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 bg-secondary/30">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input placeholder="Search users by name or email..." className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:border-primary" />
                  </div>
                  <select className="w-full sm:w-auto px-3 py-1.5 text-xs bg-background border border-border rounded-sm outline-none"><option>All Roles</option></select>
                  <button className="btn-primary px-4 py-1.5 text-xs w-full sm:w-auto">Search</button>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/10 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">User ID</th>
                      <th className="py-2.5 px-4 font-medium">Name <ChevronDown size={12} className="inline"/></th>
                      <th className="py-2.5 px-4 font-medium">Email</th>
                      <th className="py-2.5 px-4 font-medium">Joined</th>
                      <th className="py-2.5 px-4 font-medium">Role</th>
                      <th className="py-2.5 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground">{u._id.substring(0,8).toUpperCase()}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{u.fullName}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4"><span className={`px-1.5 py-0.5 rounded-sm border ${u.role==='admin' ? 'bg-primary/10 border-primary/20 text-primary' : 'border-border text-muted-foreground'}`}>{u.role}</span></td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => setSelectedUser(u)} className="btn-primary px-3 py-1 text-[10px]">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Problem Stats Sidebar */}
            <div className="lg:col-span-4">
               <h2 className="text-lg font-bold font-serif mb-3 text-foreground">Content Engagement</h2>
               <div className="academic-card p-4">
                 <div className="text-xs font-bold text-foreground mb-3 bg-secondary/50 p-2 rounded-sm border border-border">Most Upvoted Problems</div>
                 <div className="space-y-0 divide-y divide-border border border-border rounded-sm">
                   {problemsStats.slice(0, 5).map((p, i) => (
                     <div key={p._id} className="p-3 flex justify-between items-center bg-background">
                       <div className="flex-1 min-w-0 pr-4">
                         <div className="text-xs font-medium text-foreground truncate">{p.title || `Problem ${i+1}`}</div>
                         <div className="text-[10px] text-muted-foreground">{p.topic}</div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         <span className="text-primary"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.56l2.3-10.44A2 2 0 0 0 20.62 8H14zM7 21H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3v12z"/></svg></span>
                         <span className="px-2 py-0.5 border border-border rounded-sm text-[10px] font-mono font-bold">{p.upvotes || 0}</span>
                       </div>
                     </div>
                   ))}
                   {problemsStats.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">No data available</div>}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* CONTENT MANAGEMENT SECTION */}
        {activeSection === "Content Management" && (
          <div className="w-full space-y-4">
            <div className="rounded-sm border border-border bg-card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Content Creation Factory</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create problems and theory manually or parse AI/JSON batches, preview the rendered result, then send everything into the approval queue.
                  </p>
                </div>
                {pendingQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSection("Approval Dashboard")}
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-500/15"
                  >
                    <span className="admin-pending-dot" />
                    {pendingQuestions.length} pending approvals
                  </button>
                )}
              </div>
            </div>
            <div className="academic-card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 border-b border-border pb-4">
                <h3 className="font-bold text-sm text-foreground">Draft New Problem / Theory</h3>
                <button onClick={submitQuestion} className="btn-primary px-5 py-2 text-xs w-full sm:w-auto">Save Content to Drafts</button>
              </div>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                
                {/* Type Selector & Method Toggle */}
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Content Type</label>
                    <div className="flex flex-wrap gap-4 p-2.5 bg-primary/5 border border-primary/20 rounded-sm w-full sm:w-max">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer"><input type="radio" checked={qForm.type==='Problem'} onChange={() => setQForm({...qForm, type: 'Problem'})} className="accent-primary"/> Problem</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer"><input type="radio" checked={qForm.type==='Theory Article'} onChange={() => setQForm({...qForm, type: 'Theory Article'})} className="accent-primary"/> Theory Article</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Input Method</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => setUploadMethod("Manual")} className={`px-4 py-2 text-xs rounded-sm border transition-colors ${uploadMethod === "Manual" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}>Manual Entry</button>
                      <button type="button" onClick={() => setUploadMethod("Bulk")} className={`px-4 py-2 text-xs rounded-sm border transition-colors ${uploadMethod === "Bulk" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}>Bulk JSON Upload</button>
                    </div>
                  </div>
                </div>

                {/* Scalable Guidelines & AI Prompt Protocol */}
                <div className="bg-primary/5 border border-primary/20 rounded-md p-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Info size={16} className="text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">
                        {CREATION_PROTOCOLS[qForm.type as keyof typeof CREATION_PROTOCOLS]?.title}
                      </span>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <select
                        value={selectedPromptSubject?.subjectId || ""}
                        onChange={(e) => setBulkPromptSubjectId(e.target.value)}
                        className="min-w-[12rem] rounded-sm border border-primary/20 bg-background px-2.5 py-1.5 text-[10px] font-semibold text-foreground outline-none focus:border-primary"
                      >
                        {taxonomyTree.length === 0 && <option value="">No taxonomy loaded</option>}
                        {taxonomyTree.map((subject) => (
                          <option key={subject.subjectId} value={subject.subjectId}>
                            {subject.name}{subject.code ? ` (${subject.code})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(buildSyncedCreationPrompt());
                          toast.success(`${selectedPromptSubject?.name || "Subject"} prompt copied!`);
                        }}
                        disabled={!selectedPromptSubject}
                        className="flex items-center justify-center gap-1.5 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1.5 rounded-sm border border-primary/20 transition-all font-bold self-start sm:self-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clipboard size={10} /> Copy Subject Prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(buildSyncedCreationPrompt("complete"));
                          toast.success("Complete taxonomy prompt copied!");
                        }}
                        disabled={taxonomyTree.length === 0}
                        className="flex items-center justify-center gap-1.5 text-[10px] bg-background hover:bg-secondary text-foreground px-2.5 py-1.5 rounded-sm border border-border transition-all font-bold self-start sm:self-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clipboard size={10} /> Copy Complete Prompt
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                    {CREATION_PROTOCOLS[qForm.type as keyof typeof CREATION_PROTOCOLS]?.description}
                  </p>
                  {selectedPromptSubject && (
                    <div className="mb-3 rounded-sm border border-primary/15 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
                      Prompt target: <span className="font-semibold text-foreground">{selectedPromptSubject.name}</span>
                      {selectedPromptSubject.code ? <span className="font-mono"> / {selectedPromptSubject.code}</span> : null}
                      <span className="ml-1">({selectedPromptSubject.subjectId})</span>
                    </div>
                  )}
                  <div className="mb-3 grid grid-cols-2 gap-2 border-y border-primary/10 py-3 sm:grid-cols-4">
                    {(["subjects", "chapters", "topics", "subtopics"] as const).map((key) => (
                      <div key={key} className="rounded-sm border border-primary/15 bg-background/70 px-2 py-1.5 text-center">
                        <div className="font-mono text-sm font-bold text-primary">{taxonomyCounts[key]}</div>
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{key}</div>
                      </div>
                    ))}
                  </div>
                  <details className="mb-3 rounded-sm border border-primary/15 bg-background/70">
                    <summary className="cursor-pointer px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground">
                      Preview selected subject prompt
                    </summary>
                    <pre className="max-h-72 overflow-auto border-t border-primary/10 p-3 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
                      {buildSyncedCreationPrompt()}
                    </pre>
                  </details>
                  <details className="mb-3 rounded-sm border border-border bg-background/70">
                    <summary className="cursor-pointer px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground">
                      Preview complete taxonomy prompt ({completeTaxonomyCounts.subjects} subjects / {completeTaxonomyCounts.subtopics} subtopics)
                    </summary>
                    <pre className="max-h-72 overflow-auto border-t border-border p-3 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
                      {buildSyncedCreationPrompt("complete")}
                    </pre>
                  </details>
                  <div className="space-y-1.5 border-t border-primary/10 pt-3">
                    <span className="text-[10px] font-bold text-foreground block uppercase tracking-wider mb-1">Strict Rules:</span>
                    {CREATION_PROTOCOLS[qForm.type as keyof typeof CREATION_PROTOCOLS]?.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {uploadMethod === "Bulk" ? (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Step 1: JSON Format Guide */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
                      <h4 className="text-xs font-bold text-primary mb-2">📋 Required JSON Format</h4>
                      <pre className="text-[10px] text-muted-foreground font-mono bg-background p-3 rounded-sm overflow-x-auto border border-border">
{qForm.type === 'Problem' ? `[
  {
    "subjectId": "SUBJECT_ID_FROM_TAXONOMY",
    "chapterId": "CHAPTER_ID_FROM_TAXONOMY",
    "topicId": "TOPIC_ID_FROM_TAXONOMY",
    "subtopicId": "SUBTOPIC_ID_FROM_TAXONOMY",
    "title": "Problem Title", "topic": "Exact topic name", "subtopic": "Exact subtopic name",
    "statement": "LaTeX...",
    "solution": {
      "explanation": "Detailed solution with equations like \\\\[ equation \\\\]. If useful, add Diagram: or Graph: text inline.",
      "finalAnswer": "Answer"
    },
    "difficulty": "Medium", "questionType": "MCQ", "positiveMarks": 2, "negativeMarks": 0.5,
    "options": [ { "text": "Option A", "isCorrect": true }, { "text": "Option B", "isCorrect": false } ]
  }
]` : `[
  {
    "subjectId": "SUBJECT_ID_FROM_TAXONOMY",
    "chapterId": "CHAPTER_ID_FROM_TAXONOMY",
    "topicId": "TOPIC_ID_FROM_TAXONOMY",
    "subtopicId": "SUBTOPIC_ID_FROM_TAXONOMY",
    "title": "Section Title", "topic": "Exact topic name",
    "chapterTitle": "Exact chapter name", "sectionId": "SUBTOPIC_ID_FROM_TAXONOMY",
    "content": "LaTeX content..."
  }
]`}
                      </pre>
                    </div>

                    {/* Step 2: Paste & Parse */}
                    {!bulkPreview && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1">
                          <label className="block text-xs font-bold text-foreground">Step 1 — Paste JSON Array</label>
                          <button
                            type="button"
                            onClick={formatBulkJson}
                            disabled={!bulkJson.trim()}
                            className="text-[10px] bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded-sm border border-border transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            ✨ Format JSON
                          </button>
                        </div>
                        <textarea
                          rows={10}
                          value={bulkJson}
                          onChange={e => { setBulkJson(e.target.value); setBulkParseError(""); }}
                          placeholder="[ { ... } ]"
                          className="w-full px-3 py-3 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary resize-y"
                        />
                        {bulkParseError && (
                          <div className="text-xs text-red-500 bg-red-500/10 border border-red-200 px-3 py-2 rounded-sm font-mono">{bulkParseError}</div>
                        )}
                        <div className="flex justify-end">
                          <button type="button" onClick={parseBulkJson} disabled={!bulkJson.trim()} className="btn-primary px-6 py-2 text-xs disabled:opacity-50 w-full sm:w-auto">Parse &amp; Preview →</button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Preview before upload */}
                    {bulkPreview && (
                      <div className="space-y-3 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-xs font-bold text-foreground">Step 2 — Preview ({bulkPreview.length} items)</span>
                          <button type="button" onClick={() => { setBulkPreview(null); }} className="text-xs text-muted-foreground hover:text-foreground underline">← Back to Edit</button>
                        </div>
                        <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-sm text-xs text-green-700 flex items-center gap-2">
                          <span>✓</span>
                          <span><strong>Format detected & transformed:</strong> Elite protocol JSON automatically converted to compatible format</span>
                        </div>
                        
                        {/* Full Problem Preview */}
                        <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-sm p-4 bg-background/50">
                          {bulkPreview.map((item, i) => (
                            <div key={i} className="space-y-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                              {/* Problem Header */}
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">#{i + 1}</span>
                                    <h4 className="font-bold text-sm text-foreground">{item.title || "Untitled"}</h4>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>📍 {item.topic || "—"}</span>
                                    <span>📊 {item.difficulty || "—"}</span>
                                    <span>⏱️ {item.estimatedTime || 180} min</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Problem Statement */}
                              <div className="text-xs text-foreground space-y-1">
                                <div className="font-semibold text-muted-foreground">Problem:</div>
                                <div className="pl-3 border-l-2 border-primary/30 text-xs leading-relaxed">
                                  <EmbeddedMediaContent content={item.statement || item.content || "No content"} media={item.images} imageUrl={item.imageUrl} label="Problem visual" />
                                </div>
                              </div>
                              
                              {/* Options (if MCQ/MSQ) */}
                              {item.options && item.options.length > 0 && (
                                <div className="text-xs text-foreground space-y-1">
                                  <div className="font-semibold text-muted-foreground">Options:</div>
                                  <div className="pl-3 space-y-1">
                                    {item.options.map((opt: any, oi: number) => (
                                      <div key={oi} className={`text-xs leading-relaxed ${opt.isCorrect ? 'font-bold text-green-700' : ''}`}>
                                        <span className="font-mono text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>{' '}
                                        <LatexRenderer latex={opt.text || "—"} />
                                        {opt.isCorrect && <span className="ml-2">✓ Correct</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Solution */}
                              {item.solution && (
                                <div className="text-xs text-foreground space-y-2 bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-900/30 rounded-sm p-3">
                                  <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                    <span>💡</span> Solution
                                  </div>
                                  
                                  <EditorialRenderer solution={item.solution} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm text-xs text-amber-700">
                          ⚠️ All {bulkPreview.length} items will be saved as <strong>pending_review</strong>. You must approve them in the Approval Dashboard before they appear to students.
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-border pt-3">
                          <button type="button" onClick={() => setBulkPreview(null)} className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Cancel</button>
                          <button type="button" onClick={submitBulk} className="btn-primary px-6 py-2 text-xs">✓ Confirm &amp; Upload {bulkPreview.length} Items</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in">
                    {/* Title & Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Title</label>
                    <input value={qForm.title} onChange={e=>setQForm({...qForm, title: e.target.value})} placeholder="e.g. Eigenvalue Decomposition" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Topic</label>
                    <input value={qForm.topic} onChange={e=>setQForm({...qForm, topic: e.target.value})} placeholder="e.g. Linear Algebra" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-3 rounded-sm border border-border bg-secondary/10 p-3 sm:p-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Image URL (Optional, legacy)</label>
                    <input placeholder="https://..." value={qForm.imageUrl} onChange={e=>setQForm({...qForm, imageUrl: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Statement Media (Optional JSON)</label>
                    <textarea rows={3} value={qForm.images} onChange={e=>setQForm({...qForm, images: e.target.value})} placeholder={'[{"url":"https://.../figure.png","alt":"Search graph","caption":"Figure 1","kind":"diagram","placement":"right"}]'} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none resize-y font-mono focus:border-primary leading-relaxed" />
                  </div>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    Put <code className="rounded bg-background px-1 font-mono text-foreground">{"{{media:0}}"}</code> exactly where the first image should appear. Choose <code className="rounded bg-background px-1 font-mono text-foreground">inline</code>, <code className="rounded bg-background px-1 font-mono text-foreground">full</code>, <code className="rounded bg-background px-1 font-mono text-foreground">left</code>, or <code className="rounded bg-background px-1 font-mono text-foreground">right</code>. Side images stack into the reading flow on small screens.
                  </p>
                </div>

                {/* Problem Statement */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Statement (LaTeX Supported)</label>
                  <textarea rows={5} value={qForm.statement} onChange={e=>setQForm({...qForm, statement: e.target.value})} className="w-full px-3 py-3 text-xs bg-background border border-border rounded-sm outline-none resize-y font-mono focus:border-primary leading-relaxed" />
                  {qForm.statement && <div className="mt-2 p-3 bg-secondary/20 border border-border rounded-sm text-sm"><EmbeddedMediaContent content={qForm.statement} media={parseMediaForPreview(qForm.images)} imageUrl={qForm.imageUrl} label="Problem visual" /></div>}
                </div>

                    {/* Theory Specific Fields */}
                    {qForm.type === "Theory Article" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-6 mt-6">
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">Chapter ID</label>
                          <input value={qForm.chapterId} onChange={e=>setQForm({...qForm, chapterId: e.target.value})} placeholder="e.g. 1" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">Chapter Title</label>
                          <input value={qForm.chapterTitle} onChange={e=>setQForm({...qForm, chapterTitle: e.target.value})} placeholder="e.g. Introduction" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">Section ID</label>
                          <input value={qForm.sectionId} onChange={e=>setQForm({...qForm, sectionId: e.target.value})} placeholder="e.g. 1.1" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                        </div>
                      </div>
                    )}

                    {/* Problem Specific Fields */}
                    {qForm.type === "Problem" && (
                      <>
                        {/* Authentic Solution */}
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">Authentic Solution (LaTeX Supported)</label>
                          <textarea rows={4} value={qForm.solution} onChange={e=>setQForm({...qForm, solution: e.target.value})} className="w-full px-3 py-3 text-xs bg-background border border-border rounded-sm outline-none resize-y font-mono focus:border-primary leading-relaxed" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">Solution Media (Optional JSON)</label>
                          <textarea rows={3} value={qForm.solutionImages} onChange={e=>setQForm({...qForm, solutionImages: e.target.value})} placeholder={'[{"url":"https://.../derivation.png","alt":"Derivation","kind":"diagram","placement":"left"}]'} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none resize-y font-mono focus:border-primary leading-relaxed" />
                          <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">Use the same marker in the solution text: <code className="rounded bg-secondary px-1 font-mono text-foreground">{"{{media:0}}"}</code>. Solution image indexes start from 0 independently.</p>
                        </div>

                        <div className="grid grid-cols-12 gap-6 border-t border-border pt-6 mt-6">
                          <div className="col-span-12 md:col-span-6 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <label className="block text-xs font-bold text-foreground">Options (LaTeX)</label>
                              <span className="text-[10px] text-muted-foreground">Tick correct answer(s)</span>
                            </div>
                            {qForm.options.map((option, index) => (
                              <div key={index} className="grid grid-cols-[auto_1fr] items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={option.isCorrect}
                                  onChange={(e) => {
                                    const options = [...qForm.options];
                                    options[index] = { ...options[index], isCorrect: e.target.checked };
                                    setQForm({ ...qForm, options });
                                  }}
                                  className="accent-primary"
                                />
                                <input
                                  value={option.text}
                                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  onChange={(e) => {
                                    const options = [...qForm.options];
                                    options[index] = { ...options[index], text: e.target.value };
                                    setQForm({ ...qForm, options });
                                  }}
                                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">Difficulty Level</label>
                              <select value={qForm.difficulty} onChange={e=>setQForm({...qForm, difficulty: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none">
                                <option>Easy</option><option>Medium</option><option>Hard</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">Question Type</label>
                              <select value={qForm.questionType} onChange={e=>setQForm({...qForm, questionType: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none">
                                <option>MCQ</option><option>MSQ</option><option>NAT</option><option>PROOF</option>
                              </select>
                            </div>
                          </div>

                          <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">Marking Scheme (+ / -)</label>
                              <div className="flex gap-2">
                                <input type="number" step="0.1" value={qForm.positiveMarks} onChange={e=>setQForm({...qForm, positiveMarks: parseFloat(e.target.value)})} className="w-full px-2 py-2 text-xs bg-background border border-border rounded-sm outline-none text-center font-mono" />
                                <input type="number" step="0.1" value={qForm.negativeMarks} onChange={e=>setQForm({...qForm, negativeMarks: parseFloat(e.target.value)})} className="w-full px-2 py-2 text-xs bg-background border border-border rounded-sm outline-none text-center font-mono" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">Workflow Action</label>
                              <select value={qForm.approvalLevel} onChange={e=>setQForm({...qForm, approvalLevel: e.target.value})} className="w-full px-2 py-2 text-xs bg-background border border-primary text-primary rounded-sm outline-none font-bold">
                                <option>Save as Draft</option>
                                <option>Submit for Review</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {(qForm.title || qForm.statement || qForm.solution) && (
                      <div className="rounded-sm border border-border bg-secondary/10 p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Rendered preview before saving</div>
                          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                            <span className="rounded-sm border border-border bg-background px-2 py-1">{qForm.type}</span>
                            {qForm.type === "Problem" && (
                              <>
                                <span className="rounded-sm border border-border bg-background px-2 py-1">{qForm.questionType}</span>
                                <span className="rounded-sm border border-border bg-background px-2 py-1">{qForm.difficulty}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          {qForm.title && (
                            <h4 className="font-serif text-base font-bold text-foreground">
                              <LatexRenderer latex={qForm.title} />
                            </h4>
                          )}
                          {qForm.statement && (
                            <div className="rounded-sm border border-border bg-card p-3 text-sm">
                              <EmbeddedMediaContent content={qForm.statement} media={parseMediaForPreview(qForm.images)} imageUrl={qForm.imageUrl} label="Problem visual" />
                            </div>
                          )}
                          {qForm.type === "Problem" && !["NAT", "PROOF"].includes(qForm.questionType) && (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {qForm.options.filter((option) => option.text.trim()).map((option, index) => (
                                <div
                                  key={index}
                                  className={`rounded-sm border p-3 text-xs ${
                                    option.isCorrect
                                      ? "border-green-500/30 bg-green-500/10 text-green-700"
                                      : "border-border bg-card"
                                  }`}
                                >
                                  <span className="mr-2 font-mono font-bold">{String.fromCharCode(65 + index)}.</span>
                                  <LatexRenderer latex={option.text} />
                                  {option.isCorrect && <span className="ml-2 font-semibold">Correct</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {qForm.solution && (
                            <div className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                              <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">Solution preview</div>
                              <EditorialRenderer solution={parseMediaForPreview(qForm.solutionImages).length ? { explanation: qForm.solution, images: parseMediaForPreview(qForm.solutionImages) } : qForm.solution} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* APPROVAL DASHBOARD SECTION */}
        {activeSection === "Approval Dashboard" && (
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold font-serif text-foreground">Content Approval Queue</h2>
              <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 px-2.5 py-1 rounded-sm font-bold">{pendingQuestions.length} Reviewable Items</span>
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} items selected</span>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={bulkApprovalTag}
                    onChange={(e) => setBulkApprovalTag(e.target.value as ApprovalTag)}
                    className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground"
                    title="Tag to apply when bulk approving"
                  >
                    {APPROVAL_TAGS.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Clear Selection</button>
                  <button onClick={() => handleBulkApprove("rejected")} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-sm font-medium transition-colors">Bulk Reject</button>
                  <button onClick={() => handleBulkApprove("approved")} className="admin-approval-glow px-3 py-1.5 text-xs bg-primary hover:bg-red-hover text-primary-foreground border border-primary rounded-sm font-medium transition-colors">Bulk Approve</button>
                </div>
              </div>
            )}

            <div className="academic-card">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-muted-foreground bg-secondary/20">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={selectedIds.size === pendingQuestions.length && pendingQuestions.length > 0} onChange={() => toggleAllSelection(pendingQuestions)} className="cursor-pointer" /></th>
                    <th className="py-3 px-2 font-bold">Content ID</th>
                    <th className="py-3 px-4 font-bold">Title &amp; Details</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Creator</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Approval Tag</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingQuestions.map(q => (
                    <tr key={q._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 text-center"><input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelection(q._id)} className="cursor-pointer" /></td>
                      <td className="py-3.5 px-2">
                        <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{q.contentId || q._id.substring(0,8).toUpperCase()}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-semibold text-foreground truncate">{q.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {q.topic}{q.sectionId ? ` · §${q.sectionId}` : ""}{q.questionType ? ` · ${q.questionType}` : ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${q._contentType === "theory" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}`}>
                          {q._contentType === "theory" ? "Theory" : "Problem"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{q.createdBy?.fullName || "Admin"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.5 rounded-sm border font-bold text-[10px] uppercase ${statusColor(q.status)}`}>{reviewStatusLabel(q.status)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={approvalTags[q._id] || getInitialApprovalTag(q)}
                          onChange={(e) => setApprovalTags((current) => ({ ...current, [q._id]: e.target.value as ApprovalTag }))}
                          className="w-full min-w-[7rem] rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                        >
                          {APPROVAL_TAGS.map((tag) => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setPreviewItem(q)} className="px-3 py-1.5 text-xs border border-border hover:bg-secondary rounded-sm transition-colors flex items-center gap-1.5"><Eye size={12}/> Preview</button>
                          <button onClick={() => handleApprove(q._id, "rejected", q._contentType)} className="px-3 py-1.5 text-xs border border-border hover:bg-red-500/10 hover:text-red-500 rounded-sm transition-colors">Reject</button>
                          <button onClick={() => handleApprove(q._id, "approved", q._contentType)} className="admin-approval-glow btn-primary px-3 py-1.5 text-xs">Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingQuestions.length === 0 && (
                    <tr><td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">✅ All caught up! No pending content to review.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "Contest Factory" && <AdminContestSection />}
        {activeSection === "Contest Claims" && <AdminContestClaimsPage />}

        {/* ── CONTENT INVENTORY SECTION ── */}
        {activeSection === "Content Inventory" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-bold font-serif text-foreground">Content Inventory</h2>
              <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
                <button onClick={() => setInventoryTab("problems")} className={`px-4 py-2 text-xs rounded-sm border transition-colors ${inventoryTab==="problems" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}>Problems Database</button>
                <button onClick={() => setInventoryTab("theories")} className={`px-4 py-2 text-xs rounded-sm border transition-colors ${inventoryTab==="theories" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}>Theory Database</button>
              </div>
            </div>

            <div className="rounded-md border border-border bg-secondary/10 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</label>
                  <select
                    value={inventoryStatusFilter}
                    onChange={(e) => setInventoryStatusFilter(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground"
                  >
                    <option value="all">All statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending_review">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                {inventoryTab === "problems" && (
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Difficulty</label>
                    <select
                      value={inventoryDifficultyFilter}
                      onChange={(e) => setInventoryDifficultyFilter(e.target.value)}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground"
                    >
                      <option value="all">All difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <div className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    Showing <span className="font-mono font-bold text-foreground">{inventoryTab === "problems" ? filteredInventoryQuestions.length : filteredInventoryTheories.length}</span> of{" "}
                    <span className="font-mono font-bold text-foreground">{inventoryTab === "problems" ? allQuestions.length : allTheories.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} items selected</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Clear Selection</button>
                  <button onClick={() => handleBulkDelete(inventoryTab === "problems" ? filteredInventoryQuestions : filteredInventoryTheories)} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-sm font-medium transition-colors">Delete Selected</button>
                </div>
              </div>
            )}

            {inventoryTab === "problems" && (
              <div className="academic-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/20 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={filteredInventoryQuestions.length > 0 && filteredInventoryQuestions.every(q => selectedIds.has(q._id))} onChange={() => toggleAllSelection(filteredInventoryQuestions)} className="cursor-pointer" /></th>
                      <th className="py-3 px-2 font-bold">Content ID</th>
                      <th className="py-3 px-4 font-bold">Title</th>
                      <th className="py-3 px-4 font-bold">Topic</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Difficulty</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Updated</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredInventoryQuestions.map(q => (
                      <tr key={q._id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 text-center"><input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelection(q._id)} className="cursor-pointer" /></td>
                        <td className="py-3 px-2"><span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{q.contentId || q._id.substring(0,8).toUpperCase()}</span></td>
                        <td className="py-3 px-4 font-medium text-foreground max-w-[180px] truncate">{q.title}</td>
                        <td className="py-3 px-4 text-muted-foreground">{q.topic}</td>
                        <td className="py-3 px-4"><span className="px-1.5 py-0.5 bg-secondary border border-border rounded-sm">{q.questionType}</span></td>
                        <td className="py-3 px-4 text-muted-foreground">{q.difficulty}</td>
                        <td className="py-3 px-4"><span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold uppercase ${statusColor(q.status)}`}>{q.status}</span></td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(q.updatedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setPreviewItem({...q, _contentType: "question"})} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="Preview"><Eye size={12}/></button>
                            <button onClick={() => setHistoryItem(q)} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="View History"><Clock size={12}/></button>
                            <button onClick={() => { setEditItem({...q, _contentType: "question"}); setEditNote(""); }} className="p-1.5 border border-border rounded-sm hover:bg-primary/10 hover:text-primary text-muted-foreground" title="Edit"><Edit2 size={12}/></button>
                            <button onClick={() => handleDelete(q._id, "question")} className="p-1.5 border border-red-200 rounded-sm hover:bg-red-500/10 text-red-400" title="Delete"><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInventoryQuestions.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No problems match the selected filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {inventoryTab === "theories" && (
              <div className="academic-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/20 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={filteredInventoryTheories.length > 0 && filteredInventoryTheories.every(t => selectedIds.has(t._id))} onChange={() => toggleAllSelection(filteredInventoryTheories)} className="cursor-pointer" /></th>
                      <th className="py-3 px-2 font-bold">Content ID</th>
                      <th className="py-3 px-4 font-bold">Title</th>
                      <th className="py-3 px-4 font-bold">Topic</th>
                      <th className="py-3 px-4 font-bold">Section</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Updated</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredInventoryTheories.map(t => (
                      <tr key={t._id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 text-center"><input type="checkbox" checked={selectedIds.has(t._id)} onChange={() => toggleSelection(t._id)} className="cursor-pointer" /></td>
                        <td className="py-3 px-2"><span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{t.contentId || t._id.substring(0,8).toUpperCase()}</span></td>
                        <td className="py-3 px-4 font-medium text-foreground max-w-[180px] truncate">{t.title}</td>
                        <td className="py-3 px-4 text-muted-foreground">{t.topic}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{t.sectionId}</td>
                        <td className="py-3 px-4"><span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold uppercase ${statusColor(t.status)}`}>{t.status}</span></td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(t.updatedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setPreviewItem({...t, _contentType: "theory"})} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="Preview"><Eye size={12}/></button>
                            <button onClick={() => setHistoryItem(t)} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="View History"><Clock size={12}/></button>
                            <button onClick={() => { setEditItem({...t}); setEditNote(""); }} className="p-1.5 border border-border rounded-sm hover:bg-primary/10 hover:text-primary text-muted-foreground" title="Edit"><Edit2 size={12}/></button>
                            <button onClick={() => handleDelete(t._id, "theory")} className="p-1.5 border border-red-200 rounded-sm hover:bg-red-500/10 text-red-400" title="Delete"><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInventoryTheories.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No theory articles match the selected filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PROBLEM BANK (Approved only, with upvotes) ── */}
        {activeSection === "Problem Bank" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-serif text-foreground">Problem Bank</h2>

            <div className="rounded-md border border-border bg-secondary/10 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</label>
                  <select
                    value={problemBankStatusFilter}
                    onChange={(e) => setProblemBankStatusFilter(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground"
                  >
                    <option value="all">All statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending_review">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Difficulty</label>
                  <select
                    value={problemBankDifficultyFilter}
                    onChange={(e) => setProblemBankDifficultyFilter(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground"
                  >
                    <option value="all">All difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    Showing <span className="font-mono font-bold text-foreground">{filteredProblemBankQuestions.length}</span> of{" "}
                    <span className="font-mono font-bold text-foreground">{allQuestions.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} items selected</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Clear Selection</button>
                  <button onClick={() => handleBulkDelete(filteredProblemBankQuestions)} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-sm font-medium transition-colors">Delete Selected</button>
                </div>
              </div>
            )}

            <div className="academic-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/20 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={filteredProblemBankQuestions.length > 0 && filteredProblemBankQuestions.every(q => selectedIds.has(q._id))} onChange={() => toggleAllSelection(filteredProblemBankQuestions)} className="cursor-pointer" /></th>
                    <th className="py-3 px-2 font-bold">Content ID</th>
                    <th className="py-3 px-4 font-bold">Title</th>
                    <th className="py-3 px-4 font-bold">Topic</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Difficulty</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Upvotes</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProblemBankQuestions.map(q => (
                    <tr key={q._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 text-center"><input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelection(q._id)} className="cursor-pointer" /></td>
                      <td className="py-3 px-2"><span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{q.contentId || q._id.substring(0,8).toUpperCase()}</span></td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-[200px] truncate">{q.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{q.topic}</td>
                      <td className="py-3 px-4"><span className="px-1.5 py-0.5 bg-secondary border border-border rounded-sm">{q.questionType}</span></td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${ q.difficulty==="Hard" ? "bg-red-500/10 text-red-600 border-red-500/20" : q.difficulty==="Medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-green-500/10 text-green-600 border-green-500/20" }`}>{q.difficulty}</span>
                      </td>
                      <td className="py-3 px-4"><span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold uppercase ${statusColor(q.status)}`}>{reviewStatusLabel(q.status)}</span></td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">{q.upvotes || 0}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => setPreviewItem({...q, _contentType: "question"})} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="Preview"><Eye size={12}/></button>
                          <button onClick={() => setHistoryItem(q)} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="History"><Clock size={12}/></button>
                          <button onClick={() => { setEditItem({...q, _contentType: "question"}); setEditNote(""); }} className="p-1.5 border border-border rounded-sm hover:bg-primary/10 hover:text-primary text-muted-foreground" title="Edit"><Edit2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProblemBankQuestions.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No problems match the selected filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLATFORM LOGS SECTION */}
        {activeSection === "Export Manager" && <AdminExportManager />}
        {activeSection === "Platform Logs" && (
          <AdminPlatformLogs />
        )}

          </AdminShell>
        </MainPanel>
      </SiteContainer>

      {/* ════ EDIT MODAL ════ */}
      {editItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-md shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-4 sm:px-5 py-4 flex justify-between items-start gap-3 border-b border-border sticky top-0">
              <div>
                <span className="text-sm font-bold text-foreground">Edit Content</span>
                <span className="ml-3 font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{editItem.contentId || editItem._id?.substring(0,8).toUpperCase()}</span>
              </div>
              <button onClick={() => setEditItem(null)} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2 items-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setEditMode("fields")}
                  className={`rounded-sm px-3 py-2 text-xs font-semibold border transition ${editMode === "fields" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}
                >
                  Field editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("json")}
                  className={`rounded-sm px-3 py-2 text-xs font-semibold border transition ${editMode === "json" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}
                >
                  Raw JSON editor
                </button>
                <span className="text-[10px] text-muted-foreground">Switch between field editing and full JSON editing.</span>
              </div>

              {editMode === "json" ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Raw JSON payload</label>
                      <p className="text-[10px] text-muted-foreground">Paste or edit the full problem/theory JSON object here. Valid JSON updates the preview live.</p>
                    </div>
                    <div className={`text-[10px] font-medium ${editJsonError ? "text-red-500" : "text-emerald-700"}`}>
                      {editJsonError ? editJsonError : "JSON is valid"}
                    </div>
                  </div>
                  <textarea
                    rows={16}
                    value={editJson}
                    onChange={e => handleEditJsonChange(e.target.value)}
                    className="w-full px-3 py-3 text-xs bg-background border border-border rounded-sm outline-none font-mono resize-y focus:border-primary"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Title</label>
                      <input value={editItem.title || ""} onChange={e => setEditItem({...editItem, title: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Topic</label>
                      <input value={editItem.topic || ""} onChange={e => setEditItem({...editItem, topic: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                  </div>
              {(editItem._contentType === "theory" || (editItem.questionType === undefined && editItem.content !== undefined)) ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Chapter ID</label>
                      <input value={editItem.chapterId} onChange={e => setEditItem({...editItem, chapterId: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Chapter Title</label>
                      <input value={editItem.chapterTitle} onChange={e => setEditItem({...editItem, chapterTitle: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Section ID</label>
                      <input value={editItem.sectionId} onChange={e => setEditItem({...editItem, sectionId: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                  </div>
                  <div><label className="text-xs font-bold text-foreground block mb-1.5">Content (LaTeX)</label>
                    <textarea rows={6} value={editItem.content} onChange={e => setEditItem({...editItem, content: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono resize-y focus:border-primary" /></div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Subject ID</label>
                      <input value={editItem.subjectId || ""} onChange={e => setEditItem({...editItem, subjectId: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Chapter ID</label>
                      <input value={editItem.chapterId || ""} onChange={e => setEditItem({...editItem, chapterId: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Topic ID</label>
                      <input value={editItem.topicId || ""} onChange={e => setEditItem({...editItem, topicId: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Subtopic ID</label>
                      <input value={editItem.subtopicId || ""} onChange={e => setEditItem({...editItem, subtopicId: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                  </div>
                  <div><label className="text-xs font-bold text-foreground block mb-1.5">Statement (LaTeX)</label>
                    <textarea rows={5} value={editItem.statement} onChange={e => setEditItem({...editItem, statement: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono resize-y focus:border-primary" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Difficulty</label>
                      <select value={editItem.difficulty} onChange={e => setEditItem({...editItem, difficulty: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none">
                        <option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Question Type</label>
                      <select
                        value={editItem.questionType || "MCQ"}
                        onChange={e => setEditItem({
                          ...editItem,
                          questionType: e.target.value,
                          options: ["NAT", "PROOF"].includes(e.target.value) ? [] : (editItem.options?.length ? editItem.options : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]),
                        })}
                        className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none"
                      >
                        <option>MCQ</option><option>MSQ</option><option>NAT</option><option>PROOF</option>
                      </select></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">+Marks</label>
                      <input type="number" step="0.5" value={editItem.markingScheme?.positive} onChange={e => setEditItem({...editItem, markingScheme: {...editItem.markingScheme, positive: parseFloat(e.target.value)}})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">-Marks</label>
                      <input type="number" step="0.5" value={editItem.markingScheme?.negative} onChange={e => setEditItem({...editItem, markingScheme: {...editItem.markingScheme, negative: parseFloat(e.target.value)}})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none" /></div>
                  </div>
                  {!["NAT", "PROOF"].includes(editItem.questionType) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-bold text-foreground">Options</label>
                        <button
                          type="button"
                          onClick={() => setEditItem({...editItem, options: [...(editItem.options || []), { text: "", isCorrect: false }]})}
                          className="px-2 py-1 text-[11px] border border-border rounded-sm hover:bg-secondary"
                        >
                          Add option
                        </button>
                      </div>
                      {(editItem.options || []).map((option: any, index: number) => (
                        <div key={option._id || index} className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(option.isCorrect)}
                            onChange={e => {
                              const options = [...(editItem.options || [])];
                              options[index] = { ...options[index], isCorrect: e.target.checked };
                              setEditItem({ ...editItem, options });
                            }}
                          />
                          <input
                            value={option.text || ""}
                            onChange={e => {
                              const options = [...(editItem.options || [])];
                              options[index] = { ...options[index], text: e.target.value };
                              setEditItem({ ...editItem, options });
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="min-w-0 flex-1 px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setEditItem({ ...editItem, options: (editItem.options || []).filter((_: any, optionIndex: number) => optionIndex !== index) })}
                            className="px-2 py-2 text-[11px] border border-border rounded-sm hover:bg-red-500/10 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div><label className="text-xs font-bold text-foreground block mb-1.5">Tags (comma separated)</label>
                    <input value={(editItem.tags || []).join(", ")} onChange={e => setEditItem({...editItem, tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                  <div><label className="text-xs font-bold text-foreground block mb-1.5">Solution / Editorial</label>
                    <textarea
                      rows={7}
                      value={typeof editItem.solution === "string" ? editItem.solution : JSON.stringify(editItem.solution || {}, null, 2)}
                      onChange={e => {
                        const raw = e.target.value;
                        try {
                          setEditItem({...editItem, solution: JSON.parse(raw)});
                        } catch {
                          setEditItem({...editItem, solution: raw});
                        }
                      }}
                      placeholder='Plain text or JSON, e.g. {"explanation":"Detailed solution with \\\\[...\\\\] where needed.","finalAnswer":"..."}'
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono resize-y focus:border-primary"
                    /></div>
                  <div className="rounded-sm border border-border bg-secondary/10 p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Live preview</div>
                    <div className="space-y-4">
                      <h3 className="font-serif text-base font-bold text-foreground"><LatexRenderer latex={editItem.title || ""} /></h3>
                      <div className="rounded-sm border border-border bg-card p-3 text-sm"><LatexRenderer latex={editItem.statement || ""} /></div>
                      {!["NAT", "PROOF"].includes(editItem.questionType) && (editItem.options || []).length > 0 && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(editItem.options || []).map((option: any, index: number) => (
                            <div key={option._id || index} className={`rounded-sm border p-2 text-xs ${option.isCorrect ? "border-green-500/30 bg-green-500/10 text-green-700" : "border-border bg-card"}`}>
                              <span className="mr-2 font-mono font-bold">{String.fromCharCode(65 + index)}.</span>
                              <LatexRenderer latex={option.text || ""} />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="rounded-sm border border-border bg-card p-3">
                        <EditorialRenderer solution={editItem.solution} />
                      </div>
                    </div>
                  </div>
                </>
              )}
                </>
              )}
              <div><label className="text-xs font-bold text-foreground block mb-1.5">Image URL</label>
                <input value={editItem.imageUrl || ""} onChange={e => setEditItem({...editItem, imageUrl: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary" /></div>
              <div><label className="text-xs font-bold text-foreground block mb-1.5">Edit Note (for audit log)</label>
                <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="e.g. Fixed LaTeX typo in statement" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
                <button onClick={() => setEditItem(null)} className="px-5 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Cancel</button>
                <button onClick={handleSaveEdit} className="btn-primary px-6 py-2 text-xs">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ HISTORY MODAL ════ */}
      {historyItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-md shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-4 sm:px-5 py-4 flex justify-between items-start gap-3 border-b border-border">
              <div>
                <span className="text-sm font-bold text-foreground">Audit History</span>
                <span className="ml-3 font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{historyItem.contentId || historyItem._id?.substring(0,8).toUpperCase()}</span>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>
            <div className="p-5">
              <div className="text-xs text-muted-foreground mb-4 font-bold">{historyItem.title}</div>
              {historyItem.auditLog?.length > 0 ? (
                <div className="border-l-2 border-border ml-2 pl-4 space-y-4">
                  {[...historyItem.auditLog].reverse().map((entry: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-border bg-background"></div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
                          entry.action === "Approved" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                          entry.action === "Rejected" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                          entry.action === "Edited" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                          "bg-secondary text-muted-foreground border-border"
                        }`}>{entry.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-foreground">{entry.performedBy?.fullName || "Admin"}</div>
                      {entry.note && <div className="text-xs text-muted-foreground italic mt-0.5">"{entry.note}"</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">No audit history available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-4 sm:px-5 py-4 flex justify-between items-start gap-3 border-b border-border sticky top-0 z-10">
              <span className="text-sm font-bold text-foreground">Complete Details for {selectedUser.fullName}</span>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="p-6 flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 md:border-r border-border md:pr-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">{selectedUser.fullName.charAt(0)}</div>
                  <div>
                    <div className="font-bold text-foreground text-sm">{selectedUser.fullName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{selectedUser.email}</div>
                  </div>
                </div>
                <div className="space-y-4 text-xs">
                  <div><div className="font-bold text-foreground mb-1">Profile</div><div className="text-muted-foreground bg-secondary/50 p-2 rounded-sm">GATE DA Candidate</div></div>
                  <div><div className="font-bold text-foreground mb-1">Institution</div><div className="text-muted-foreground">{selectedUser.institution || "Not specified"}</div></div>
                  <div><div className="font-bold text-foreground mb-1">Last Active</div><div className="text-muted-foreground">Just now</div></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-xs text-foreground mb-3 uppercase tracking-wide">Activity History</div>
                <div className="overflow-x-auto mb-6">
                <table className="w-full min-w-[20rem] text-xs text-left border border-border">
                  <thead className="bg-secondary/30 text-muted-foreground"><tr><th className="py-2 px-3">Metric</th><th className="py-2 px-3">Count</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 px-3">Problems Solved</td><td className="py-2 px-3 font-mono">0</td></tr>
                    <tr><td className="py-2 px-3">Theory Read</td><td className="py-2 px-3 font-mono">0</td></tr>
                    <tr><td className="py-2 px-3">Contest Participation</td><td className="py-2 px-3 font-mono">0</td></tr>
                  </tbody>
                </table>
                </div>
                <div className="font-bold text-xs text-foreground mb-3 uppercase tracking-wide">Account Actions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button className="text-center px-2 py-2 text-xs border border-border rounded-sm hover:bg-secondary transition-colors">Reset Password</button>
                  <button className="text-center px-2 py-2 text-xs border border-amber-500/30 text-amber-500 rounded-sm hover:bg-amber-500/10 transition-colors">Suspend User</button>
                  <button className="col-span-2 text-center px-2 py-2 text-xs bg-destructive text-destructive-foreground rounded-sm hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"><Trash2 size={12}/> Permanently Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ PREVIEW MODAL ════ */}
      {previewItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-md shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-4 sm:px-5 py-4 flex justify-between items-start gap-3 border-b border-border sticky top-0 z-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-sm font-bold text-foreground">Content Preview</span>
                <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{previewItem.contentId || previewItem._id?.substring(0,8).toUpperCase()}</span>
                <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold uppercase ${
                  previewItem.status === "approved" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                  previewItem.status === "rejected" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                  "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}>
                  {previewItem.status}
                </span>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="px-2.5 py-1 bg-secondary rounded-sm border border-border">
                  <span className="text-muted-foreground">Topic:</span> <strong className="text-foreground">{previewItem.topic}</strong>
                </div>
                {previewItem.chapterTitle && (
                  <div className="px-2.5 py-1 bg-secondary rounded-sm border border-border">
                    <span className="text-muted-foreground">Chapter:</span> <strong className="text-foreground">{previewItem.chapterId} - {previewItem.chapterTitle}</strong>
                  </div>
                )}
                {previewItem.sectionId && (
                  <div className="px-2.5 py-1 bg-secondary rounded-sm border border-border">
                    <span className="text-muted-foreground">Section:</span> <strong className="text-foreground">{previewItem.sectionId}</strong>
                  </div>
                )}
                {previewItem.questionType && (
                  <div className="px-2.5 py-1 bg-secondary rounded-sm border border-border">
                    <span className="text-muted-foreground">Type:</span> <strong className="text-foreground">{previewItem.questionType}</strong>
                  </div>
                )}
                {previewItem.difficulty && (
                  <div className="px-2.5 py-1 bg-secondary rounded-sm border border-border">
                    <span className="text-muted-foreground">Difficulty:</span> <strong className={`font-bold ${
                      previewItem.difficulty === "Hard" ? "text-red-500" :
                      previewItem.difficulty === "Medium" ? "text-amber-500" :
                      "text-green-500"
                    }`}>{previewItem.difficulty}</strong>
                  </div>
                )}
                {previewItem.markingScheme && (
                  <div className="px-2.5 py-1 bg-secondary rounded-sm border border-border">
                    <span className="text-muted-foreground">Marks:</span> <strong className="text-foreground">+{previewItem.markingScheme.positive} / -{previewItem.markingScheme.negative}</strong>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-serif font-bold text-foreground mb-1">{previewItem.title}</h3>
                <span className="text-[10px] text-muted-foreground block">Created by {previewItem.createdBy?.fullName || "Admin"} · {new Date(previewItem.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Main Content / Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {previewItem.questionType ? "Question Statement" : "Article Content"}
                </h4>
                <div className="p-4 bg-secondary/20 border border-border rounded-sm text-sm overflow-x-auto leading-relaxed">
                  <EmbeddedMediaContent
                    content={previewItem.statement || previewItem.content || ""}
                    media={previewItem.images}
                    imageUrl={previewItem.imageUrl}
                    label="Content visual"
                  />
                </div>
              </div>

              {/* Options (for MCQ/MSQ) */}
              {previewItem.options && previewItem.options.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {previewItem.options.map((opt: any, idx: number) => {
                      const labels = ["A", "B", "C", "D"];
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 border rounded-sm flex items-start gap-3 transition-colors ${
                            opt.isCorrect 
                              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-semibold" 
                              : "bg-background border-border text-foreground"
                          }`}
                        >
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono ${
                            opt.isCorrect ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground border border-border"
                          }`}>
                            {labels[idx] || (idx + 1)}
                          </span>
                          <div className="text-xs flex-1">
                            <LatexRenderer latex={opt.text} />
                          </div>
                          {opt.isCorrect && (
                            <span className="text-xs font-bold bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-sm shrink-0">Correct</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NAT answer placeholder */}
              {previewItem.questionType === "NAT" && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm text-xs flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-muted-foreground">Question Format:</span>
                  <span className="font-bold text-primary font-mono uppercase">Numerical Answer Type (NAT)</span>
                </div>
              )}

              {/* Rigorous Solution */}
              {previewItem.solution && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span>💡 Step-by-Step Rigorous Solution</span>
                  </h4>
                  <div className="p-6 bg-[#fdfdfb] dark:bg-zinc-900 border border-border/70 border-l-4 border-l-amber-500 rounded-sm shadow-sm overflow-x-auto text-sm leading-relaxed text-foreground font-serif">
                    <EditorialRenderer solution={previewItem.solution} />
                  </div>
                </div>
              )}

              {previewItem.status !== "approved" && (
                <div className="rounded-sm border border-border bg-secondary/20 p-3">
                  <label className="block text-xs font-bold text-foreground mb-1.5">Approval tag</label>
                  <select
                    value={approvalTags[previewItem._id] || getInitialApprovalTag(previewItem)}
                    onChange={(e) => setApprovalTags((current) => ({ ...current, [previewItem._id]: e.target.value as ApprovalTag }))}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary sm:max-w-xs"
                  >
                    {APPROVAL_TAGS.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons inside Preview */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-border">
                <button onClick={() => setPreviewItem(null)} className="px-5 py-2 text-xs border border-border rounded-sm hover:bg-secondary">
                  Close
                </button>
                {previewItem.status !== "approved" && (
                  <>
                    {previewItem.status !== "rejected" && (
                      <button
                        onClick={() => {
                          handleApprove(previewItem._id, "rejected", previewItem._contentType);
                          setPreviewItem(null);
                        }}
                        className="px-5 py-2 text-xs border border-red-200 hover:bg-red-500/10 hover:text-red-500 rounded-sm transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        handleApprove(previewItem._id, "approved", previewItem._contentType);
                        setPreviewItem(null);
                      }} 
                      className="admin-approval-glow btn-primary px-6 py-2 text-xs"
                    >
                      Approve ✓
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
