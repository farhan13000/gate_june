import { useState, useEffect } from "react";
import { Search, ChevronDown, Trash2, Edit2, Clock, X, CheckCircle, XCircle, Info, Clipboard, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LatexRenderer from "../components/LatexRenderer";
import EditorialRenderer from "../components/EditorialRenderer";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const CREATION_PROTOCOLS = {
  Problem: {
    title: "GATE DA Advanced Problem Generation Protocol",
    description: "Use this comprehensive, multi-criteria AI prompt to generate highly authentic, mathematically rigorous GATE Data Science & AI problems, including interdisciplinary topics, diagrams, and multiple question formats (MCQ, MSQ, NAT) with full LaTeX support.",
    promptTemplate: `You are an expert, highly distinguished designer of the GATE (Graduate Aptitude Test in Engineering) Data Science & Artificial Intelligence (DA) exam.
Your mission is to generate a high-fidelity, mathematically rigorous, and syllabus-aligned GATE exam question in standard JSON format.

SYLLABUS & TOPIC COVERAGE:
Ensure the problem is strictly mapped to one or more of the following official syllabus domains:
1. PROBABILITY & STATISTICS (e.g., Bayes theorem, joint distributions, covariance, Correlation, CLT, parameter estimation, MLE/MAP, hypothesis testing (z-test, t-test, chi-square), random variables, distributions (Binomial, Poisson, Normal, Exponential)).
2. LINEAR ALGEBRA (e.g., Vector spaces, basis, dimension, eigenvalues, eigenvectors, symmetric matrices, SVD, systems of linear equations).
3. CALCULUS & OPTIMIZATION (e.g., Maxima/minima, partial derivatives, gradient, Hessian, convex sets/functions, gradient descent updates, constrained optimization).
4. PROGRAMMING, DATA STRUCTURES & ALGORITHMS (e.g., Python implementation, binary heaps, BSTs, sorting/searching, graph traversals, greedy/dynamic programming, Big-O complexity).
5. DATABASE MANAGEMENT & WAREHOUSING (e.g., Relational algebra, SQL, normalization (BCNF/3NF), indexing (B/B+ trees), transactions & ACID properties).
6. MACHINE LEARNING (e.g., Linear/logistic regression, SVM decision boundary, decision trees, k-NN complexity, Random Forest, k-means, PCA math, ROC/AUC, Bias-Variance tradeoff).
7. ARTIFICIAL INTELLIGENCE (e.g., A* search, adversarial minimax, alpha-beta pruning, MDP, Q-learning).

DIFFICULTY LEVEL STANDARDS:
- Easy: Basic conceptual comprehension, direct single-formula applications.
- Medium: Multi-step analytical calculations, standard derivation, or applying concepts to structured scenarios.
- Hard: Deeply rigorous, mathematically intensive problems testing core theoretical limits, or interdisciplinary (hybrid) questions combining concepts across multiple domains.

INTERDISCIPLINARY / MIXTURE OF TOPICS:
Where appropriate, design high-quality "hybrid" questions that fuse topics. Examples:
- Linear Algebra + Machine Learning (e.g., computing projection of data using PCA eigenvectors, low-rank approximations via SVD).
- Calculus + Machine Learning (e.g., analytical derivation of gradient updates for custom loss functions like Huber loss, MSE, or cross-entropy).
- Probability + Machine Learning (e.g., Bayesian decision boundary computation, MLE/MAP derivations for regression coefficients).
- Programming + Machine Learning/Math (e.g., computational complexity of executing a k-NN search or training a decision tree).

QUESTION FORMATS & SCHEMES:
1. MCQ (Multiple Choice Question): Exactly 4 choices. Provide 1 correct option and 3 plausible distractors based on common student errors (e.g., sign errors, off-by-one errors, missing division terms).
2. MSQ (Multiple Select Question): Exactly 4 choices. One or more choices can be correct (can be 1, 2, 3, or all 4). Clearly state that it is an MSQ in the description. No partial marking is awarded.
3. NAT (Numerical Answer Type): No options are provided (set "options" to an empty array []). The statement must specify rounding requirements (e.g., "Round to two decimal places"). The correct answer must be a single real number or integer. The final correct value MUST be explicitly stated at the end of the solution (e.g., "Final Answer: 0.23").

DIAGRAMS & STRUCTURAL DESCRIPTIONS:
- For questions involving architectures, search trees, database tables, or matrices:
  - Use elegant LaTeX matrices (\\\\begin{pmatrix} ... \\\\end{pmatrix}) or mathematical tables for matrices or transition tables.
  - For structural diagrams (like neural networks or state diagrams), provide a clean, descriptive ASCII representation or a detailed LaTeX array representation within the statement.

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
3. Check and verify that EVERY equation in the question "statement", "options", and "solution" conforms to this rule. No mathematical characters should be naked in the plain text.

OUTPUT REQUIREMENTS:
1. You MUST respond with ONLY a valid, parsable raw JSON array. Do NOT wrap it in markdown block quotes (e.g. do not use \`\`\`json).
2. All LaTeX math backslashes MUST be properly double-escaped for JSON. For inline math use "\\\\( ... \\\\)" and for block equations use "\\\\[ ... \\\\]".
3. The "solution" field MUST be a structured, semantic editorial JSON object (NOT a plain string) matching this exact format:
   {
     "type": "editorial",
     "blocks": [
       { "type": "intro", "content": "We are given binary logistic regression with:" },
       { "type": "parameterGrid", "headers": ["Parameter vector", "Training example", "Learning rate"], "rows": [["\\\\( \\\\mathbf{w}^{(0)} = \\\\begin{pmatrix} 1 \\\\\\\\ -1 \\\\end{pmatrix} \\\\)", "\\\\( \\\\mathbf{x} = \\\\begin{pmatrix} 2 \\\\\\\\ 1 \\\\end{pmatrix}, y = 1 \\\\)", "\\\\( \\\\eta = 0.1 \\\\)"]] },
       { "type": "step", "number": "❶", "title": "Compute the linear score z", "equation": "\\\\( z = \\\\mathbf{w}^T \\\\mathbf{x} = 1 \\\\)" },
       { "type": "finalAnswer", "content": "1.054 (rounded to three decimal places)" }
     ]
   }
   Allowed block types: intro, concept, theorem, derivation, proof, parameterGrid, matrixBlock, equationBlock, step, observation, intuition, warning, pitfall, hint, algorithm, pseudocode, complexityAnalysis, graphExplanation, table, finalAnswer, summary.
4. Keep the language academic, direct, precise, and highly rigorous.

JSON SCHEME REFERENCE:
[
  {
    "title": "Gradient Descent Update in Logistic Regression",
    "topic": "Calculus & Optimization + Machine Learning",
    "difficulty": "Medium",
    "questionType": "NAT",
    "statement": "Consider binary logistic regression with parameter vector... Round your answer to three decimal places.",
    "solution": {
      "type": "editorial",
      "blocks": [
        {
          "type": "intro",
          "content": "We are given binary logistic regression with:"
        },
        {
          "type": "parameterGrid",
          "headers": ["Parameter vector", "Training example", "Learning rate"],
          "rows": [
            [
              "\\\\( \\\\mathbf{w}^{(0)} = \\\\begin{pmatrix} 1 \\\\\\\\ -1 \\\\end{pmatrix} \\\\)",
              "\\\\( \\\\mathbf{x} = \\\\begin{pmatrix} 2 \\\\\\\\ 1 \\\\end{pmatrix}, \\\\, y = 1 \\\\)",
              "\\\\( \\\\eta = 0.1 \\\\)"
            ]
          ]
        },
        {
          "type": "step",
          "number": "❶",
          "title": "Compute the linear score z",
          "equation": "\\\\( z = \\\\mathbf{w}^T \\\\mathbf{x} = (1)(2) + (-1)(1) = 2 - 1 = 1 \\\\)"
        },
        {
          "type": "step",
          "number": "❷",
          "title": "Compute the prediction",
          "equation": "\\\\( \\\\sigma(z) = \\\\frac{1}{1 + e^{-z}} = \\\\frac{1}{1 + e^{-1}} \\\\approx 0.7311 \\\\)"
        },
        {
          "type": "step",
          "number": "❸",
          "title": "Compute the gradient",
          "equation": "\\\\( \\\\nabla J(\\\\mathbf{w}) = (\\\\sigma(z) - y)\\\\mathbf{x} = (0.7311 - 1)\\\\begin{pmatrix} 2 \\\\\\\\ 1 \\\\end{pmatrix} = \\\\begin{pmatrix} -0.5378 \\\\\\\\ -0.2689 \\\\end{pmatrix} \\\\)"
        },
        {
          "type": "step",
          "number": "❹",
          "title": "Perform gradient descent update",
          "equation": "\\\\( w_1^{new} = 1 - 0.1(-0.5378) = 1.05378 \\\\)"
        },
        {
          "type": "finalAnswer",
          "content": "1.054 (rounded to three decimal places)"
        }
      ]
    },
    "positiveMarks": 2,
    "negativeMarks": 0,
    "options": []
  }
]`,
    rules: [
      "The response must be a 100% valid JSON array containing properly double-escaped LaTeX equations.",
      "Integrate interdisciplinary concepts (e.g., combining linear algebra and ML) to match premium GATE standards.",
      "Strictly ensure options contain clever distractors for MCQs, multiple correct options for MSQs, and empty option arrays for NATs.",
      "Verify that positive/negative marking conforms to standard GATE norms (+2/-0.66, +1/-0.33, or no negative marks for MSQ/NAT)."
    ]
  },
  "Theory Article": {
    title: "GATE DA Comprehensive Theory Article Protocol",
    description: "Use this protocol to generate syllabus-aligned, conceptually deep theory notes complete with LaTeX equations, Mermaid.js visual diagrams, and customized blocks.",
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
3. MERMAID.JS DIAGRAMS:
   - To illustrate data flows, decision boundaries, neural network layers, search trees, database relation relationships, or algorithmic steps, you MUST embed professional, valid Mermaid.js diagrams directly within the markdown content.
   - Use standard Mermaid syntax inside a standard markdown code block:
     \`\`\`mermaid
     graph TD
     A[Input Data] --> B(Standardization)
     B --> C{PCA Projection}
     C --> D[Eigenvector 1]
     C --> E[Eigenvector 2]
     \`\`\`
   - Ensure the Mermaid code is fully correct, double-escaping any backslashes or newlines in the JSON string representation.

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
    "content": "## Core Concept of PCA\\n\\nPrincipal Component Analysis is a linear dimensionality reduction technique that finds the directions of maximum variance...\\n\\n\\\\frac{1}{n} X^T X\\\\) is the covariance matrix...\\n\\n\`\`\`mermaid\\ngraph LR\\nA[Data] --> B[Covariance Matrix] --> C[Eigenvalue Decomposition] --> D[Principal Components]\\n\`\`\`\\n\\nTheorem: Maximum Variance Projection\\nLet \\\\( u_1 \\\\) be the first principal direction...\\n\\nExample: 2D Data Projection\\nConsider a dataset of 3 points..."
  }
]`,
    rules: [
      "The response must be a 100% valid JSON array containing double-escaped LaTeX equations.",
      "Embed visual Mermaid.js diagrams directly inside the markdown content for all complex structural or flow concepts.",
      "Use custom block prefixes ('Theorem: [Title]', 'Example: [Title]', 'GATE Example: [Title]') to structure the layout of the notes."
    ]
  }
};

type Section = "Overview" | "User Analytics" | "Content Management" | "Contest Factory" | "Approval Dashboard" | "Content Inventory" | "Problem Bank" | "Platform Logs";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation State
  const [activeSection, setActiveSection] = useState<Section>("Overview");

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [problemsStats, setProblemsStats] = useState<any[]>([]);

  // User Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    imageUrl: "", questionType: "MCQ", approvalLevel: "Level 1: Draft",
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
      const pendingStatuses = ["pending_review", "draft"];
      let pending: any[] = [];
      if (qRes.ok) {
        const qs = await qRes.json();
        pending = [...pending, ...qs.filter((q: any) => pendingStatuses.includes(q.status)).map((q: any) => ({...q, _contentType: "question"}))];
      }
      if (tRes.ok) {
        const ts = await tRes.json();
        pending = [...pending, ...ts.filter((t: any) => pendingStatuses.includes(t.status)).map((t: any) => ({...t, _contentType: "theory"}))];
      }
      setPendingQuestions(pending);
    } catch (error) {}
  };

  const fetchProblems = async () => {
    try {
      const res = await fetch("/api/problems");
      if (res.ok) setProblemsStats(await res.json());
    } catch (error) {}
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isTheory = qForm.type === "Theory Article";
      const payload = isTheory 
        ? { title: qForm.title, topic: qForm.topic, chapterId: qForm.chapterId, chapterTitle: qForm.chapterTitle, sectionId: qForm.sectionId, content: qForm.statement, imageUrl: qForm.imageUrl }
        : { ...qForm, options: qForm.questionType === "NAT" ? [] : qForm.options, markingScheme: { positive: qForm.positiveMarks, negative: qForm.negativeMarks } };
      
      const endpoint = isTheory ? "/api/admin/theories" : "/api/admin/questions";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Content Saved!");
        fetchPendingQuestions();
      } else {
        toast.error("Submission failed");
      }
    } catch (error) { toast.error("Network error"); }
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
      if (!Array.isArray(data)) { setBulkParseError("JSON must be an array [ ... ]"); return; }
      setBulkParseError("");
      setBulkPreview(data);
    } catch(e: any) {
      setBulkParseError("Invalid JSON: " + e.message);
      setBulkPreview(null);
    }
  };

  const submitBulk = async () => {
    if (!bulkPreview) return;
    try {
      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: qForm.type, data: bulkPreview }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Bulk Upload Successful!");
        fetchPendingQuestions();
        setBulkJson("");
        setBulkPreview(null);
      } else {
        toast.error(result.message || "Bulk upload failed");
      }
    } catch(e) { toast.error("Network error during upload"); }
  };

  const handleApprove = async (id: string, status: "approved" | "rejected", contentType: "question" | "theory" = "question") => {
    console.log(`[handleApprove] Initiating ${status} for ID: ${id}, Type: ${contentType}`);
    try {
      const endpoint = contentType === "theory"
        ? `/api/admin/theories/${id}/approve`
        : `/api/admin/questions/${id}/approve`;
      
      console.log(`[handleApprove] Making PUT request to endpoint: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        console.log(`[handleApprove] Request successful with status: ${res.status}`);
        toast.success(`Item ${status}!`);
        fetchPendingQuestions();
        fetchProblems();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        console.error(`[handleApprove] Request failed with status ${res.status}:`, errorData);
        toast.error(`Error: ${errorData.message || "Failed to update status"}`);
      }
    } catch (error) { 
      console.error("[handleApprove] Network or execution error:", error);
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
        body: JSON.stringify({ status })
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

  const sections: Section[] = ["Overview", "User Analytics", "Content Management", "Problem Bank", "Content Inventory", "Contest Factory", "Approval Dashboard", "Platform Logs"];

  // ── Content Inventory State ──
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [allTheories, setAllTheories] = useState<any[]>([]);
  const [inventoryTab, setInventoryTab] = useState<"problems" | "theories">("problems");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [historyItem, setHistoryItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editNote, setEditNote] = useState("");

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
      const isTheory = !!editItem.chapterId;
      const endpoint = isTheory ? `/api/admin/theories/${editItem._id}` : `/api/admin/questions/${editItem._id}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editItem, note: editNote }),
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ── Secondary Navigation Bar ── */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center justify-between text-xs font-medium overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {sections.map(sec => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`h-12 flex items-center transition-colors whitespace-nowrap ${activeSection === sec ? "text-foreground border-b-2 border-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                {sec === "Overview" ? "Admin Dashboard Overview" : sec}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pl-6 shrink-0">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-sm font-bold tracking-wider">v1.0</span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto mt-2 animate-in fade-in duration-300">
        
        {/* OVERVIEW SECTION */}
        {activeSection === "Overview" && (
          <div className="space-y-6 max-w-5xl">
            <h2 className="text-lg font-bold font-serif text-foreground">Platform Overview</h2>
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
                <div className="text-4xl font-bold font-mono text-foreground">0</div>
              </div>
            </div>
            
            <div className="academic-card p-6 mt-8">
              <h3 className="font-bold text-sm mb-4">Quick Actions</h3>
              <div className="flex gap-4">
                <button onClick={() => setActiveSection("Content Management")} className="btn-primary px-4 py-2 text-xs">Create Content</button>
                <button onClick={() => setActiveSection("Approval Dashboard")} className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Review Queue</button>
              </div>
            </div>
          </div>
        )}

        {/* USER ANALYTICS SECTION */}
        {activeSection === "User Analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* User Directory */}
            <div className="lg:col-span-8">
              <h2 className="text-lg font-bold font-serif mb-3 text-foreground">User Directory & Details</h2>
              <div className="academic-card">
                <div className="p-3 border-b border-border flex gap-3 bg-secondary/30">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input placeholder="Search users by name or email..." className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:border-primary" />
                  </div>
                  <select className="px-3 py-1.5 text-xs bg-background border border-border rounded-sm outline-none"><option>All Roles</option></select>
                  <button className="btn-primary px-4 py-1.5 text-xs">Search</button>
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
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold font-serif mb-3 text-foreground">Content Creation Factory</h2>
            <div className="academic-card p-6">
              <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <h3 className="font-bold text-sm text-foreground">Draft New Problem / Theory</h3>
                <button onClick={submitQuestion} className="btn-primary px-5 py-2 text-xs">Save Content to Drafts</button>
              </div>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                
                {/* Type Selector & Method Toggle */}
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Content Type</label>
                    <div className="flex gap-4 p-2.5 bg-primary/5 border border-primary/20 rounded-sm w-max">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer"><input type="radio" checked={qForm.type==='Problem'} onChange={() => setQForm({...qForm, type: 'Problem'})} className="accent-primary"/> Problem</label>
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer"><input type="radio" checked={qForm.type==='Theory Article'} onChange={() => setQForm({...qForm, type: 'Theory Article'})} className="accent-primary"/> Theory Article</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Input Method</label>
                    <div className="flex gap-2">
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
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(CREATION_PROTOCOLS[qForm.type as keyof typeof CREATION_PROTOCOLS]?.promptTemplate);
                        toast.success("AI Prompt Template copied to clipboard!");
                      }}
                      className="flex items-center gap-1.5 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-sm border border-primary/20 transition-all font-bold self-start sm:self-auto shrink-0"
                    >
                      <Clipboard size={10} /> Copy AI Prompt Template
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                    {CREATION_PROTOCOLS[qForm.type as keyof typeof CREATION_PROTOCOLS]?.description}
                  </p>
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
    "title": "Problem Title", "topic": "Probability", "statement": "LaTeX...", "solution": "LaTeX...",
    "difficulty": "Medium", "questionType": "MCQ", "positiveMarks": 2, "negativeMarks": 0.5,
    "options": [ { "text": "Option A", "isCorrect": true }, { "text": "Option B", "isCorrect": false } ]
  }
]` : `[
  {
    "title": "Section Title", "topic": "Probability", "chapterId": "1",
    "chapterTitle": "Chapter Name", "sectionId": "1.1", "content": "LaTeX content..."
  }
]`}
                      </pre>
                    </div>

                    {/* Step 2: Paste & Parse */}
                    {!bulkPreview && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1">
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
                          <button type="button" onClick={parseBulkJson} disabled={!bulkJson.trim()} className="btn-primary px-6 py-2 text-xs disabled:opacity-50">Parse &amp; Preview →</button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Preview before upload */}
                    {bulkPreview && (
                      <div className="space-y-3 animate-in fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-foreground">Step 2 — Preview ({bulkPreview.length} items)</span>
                          <button type="button" onClick={() => { setBulkPreview(null); }} className="text-xs text-muted-foreground hover:text-foreground underline">← Back to Edit</button>
                        </div>
                        <div className="border border-border rounded-sm overflow-hidden">
                          <div className="bg-secondary/30 px-4 py-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider grid grid-cols-3 gap-2">
                            <span>#</span><span>Title</span><span>Topic / Section</span>
                          </div>
                          <div className="divide-y divide-border max-h-60 overflow-y-auto">
                            {bulkPreview.map((item, i) => (
                              <div key={i} className="px-4 py-2.5 grid grid-cols-3 gap-2 text-xs hover:bg-secondary/10">
                                <span className="font-mono text-muted-foreground">{i + 1}</span>
                                <span className="font-medium text-foreground truncate">{item.title || "—"}</span>
                                <span className="text-muted-foreground truncate">{item.topic}{item.sectionId ? ` · §${item.sectionId}` : ""}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm text-xs text-amber-700">
                          ⚠️ All {bulkPreview.length} items will be saved as <strong>pending_review</strong>. You must approve them in the Approval Dashboard before they appear to students.
                        </div>
                        <div className="flex justify-end gap-3 border-t border-border pt-3">
                          <button type="button" onClick={() => setBulkPreview(null)} className="px-4 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Cancel</button>
                          <button type="button" onClick={submitBulk} className="btn-primary px-6 py-2 text-xs">✓ Confirm &amp; Upload {bulkPreview.length} Items</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in">
                    {/* Title & Topic */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Title</label>
                    <input value={qForm.title} onChange={e=>setQForm({...qForm, title: e.target.value})} placeholder="e.g. Eigenvalue Decomposition" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Topic</label>
                    <input value={qForm.topic} onChange={e=>setQForm({...qForm, topic: e.target.value})} placeholder="e.g. Linear Algebra" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Image URL (Optional)</label>
                  <input placeholder="https://..." value={qForm.imageUrl} onChange={e=>setQForm({...qForm, imageUrl: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary" />
                </div>

                {/* Problem Statement */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Statement (LaTeX Supported)</label>
                  <textarea rows={5} value={qForm.statement} onChange={e=>setQForm({...qForm, statement: e.target.value})} className="w-full px-3 py-3 text-xs bg-background border border-border rounded-sm outline-none resize-y font-mono focus:border-primary leading-relaxed" />
                  {qForm.statement && <div className="mt-2 p-3 bg-secondary/20 border border-border rounded-sm text-sm"><LatexRenderer latex={qForm.statement}/></div>}
                </div>

                    {/* Theory Specific Fields */}
                    {qForm.type === "Theory Article" && (
                      <div className="grid grid-cols-3 gap-4 border-t border-border pt-6 mt-6">
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

                        {/* Options & Marking Scheme Row */}
                        <div className="grid grid-cols-12 gap-6 border-t border-border pt-6 mt-6">
                          <div className="col-span-12 md:col-span-6 space-y-4">
                            <label className="block text-xs font-bold text-foreground">Option 1 (LaTeX)</label>
                            <input value={qForm.options[0].text} onChange={e=>{const o=[...qForm.options]; o[0].text=e.target.value; setQForm({...qForm, options: o})}} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary" />
                            <label className="block text-xs font-bold text-foreground">Option 2 (LaTeX)</label>
                            <input value={qForm.options[1].text} onChange={e=>{const o=[...qForm.options]; o[1].text=e.target.value; setQForm({...qForm, options: o})}} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary" />
                          </div>
                          
                          <div className="col-span-6 md:col-span-3 space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">Difficulty Level</label>
                              <select value={qForm.difficulty} onChange={e=>setQForm({...qForm, difficulty: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none">
                                <option>Easy</option><option>Medium</option><option>Hard</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">Question Type</label>
                              <select value={qForm.questionType} onChange={e=>setQForm({...qForm, questionType: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none">
                                <option>MCQ</option><option>MSQ</option><option>NAT</option>
                              </select>
                            </div>
                          </div>

                          <div className="col-span-6 md:col-span-3 space-y-4">
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
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* APPROVAL DASHBOARD SECTION */}
        {activeSection === "Approval Dashboard" && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold font-serif text-foreground">Content Approval Queue</h2>
              <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 px-2.5 py-1 rounded-sm font-bold">{pendingQuestions.length} Awaiting Review</span>
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-4 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} items selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Clear Selection</button>
                  <button onClick={() => handleBulkApprove("rejected")} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-sm font-medium transition-colors">Bulk Reject</button>
                  <button onClick={() => handleBulkApprove("approved")} className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-sm font-medium transition-colors">Bulk Approve</button>
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
                        <span className="px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-[10px] uppercase">{q.status === "draft" ? "Draft" : "Pending"}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setPreviewItem(q)} className="px-3 py-1.5 text-xs border border-border hover:bg-secondary rounded-sm transition-colors flex items-center gap-1.5"><Eye size={12}/> Preview</button>
                          <button onClick={() => handleApprove(q._id, "rejected", q._contentType)} className="px-3 py-1.5 text-xs border border-border hover:bg-red-500/10 hover:text-red-500 rounded-sm transition-colors">Reject</button>
                          <button onClick={() => handleApprove(q._id, "approved", q._contentType)} className="btn-primary px-3 py-1.5 text-xs">Approve ✓</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingQuestions.length === 0 && (
                    <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">✅ All caught up! No pending content to review.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEST FACTORY SECTION */}
        {activeSection === "Contest Factory" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-bold font-serif mb-3 text-foreground">Contest Configuration</h2>
            <div className="academic-card p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Contest Name</label>
                  <input placeholder="e.g. GATE DA Mock Test 1" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Scheduled Date & Time</label>
                  <div className="relative">
                    <input type="datetime-local" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-foreground mb-2">Problem Sets Timeline Configuration</label>
                <div className="p-6 border border-dashed border-border rounded-sm bg-secondary/20 text-center">
                  <p className="text-xs text-muted-foreground">Drag and drop verified problems here to build the contest timeline.</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-foreground mb-1.5">Participant Access List (Optional)</label>
                <input placeholder="Leave blank for public contest" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-foreground mb-1.5">Global Scoring Rules Override</label>
                <input placeholder="e.g. Penalty mode active" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <button className="px-5 py-2 text-xs bg-secondary border border-border rounded-sm text-foreground hover:bg-secondary/80">Cancel</button>
                <button className="btn-primary px-6 py-2 text-xs">Save Contest Configuration</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT INVENTORY SECTION ── */}
        {activeSection === "Content Inventory" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold font-serif text-foreground">Content Inventory</h2>
              <div className="flex gap-2">
                <button onClick={() => setInventoryTab("problems")} className={`px-4 py-2 text-xs rounded-sm border transition-colors ${inventoryTab==="problems" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}>Problems Database</button>
                <button onClick={() => setInventoryTab("theories")} className={`px-4 py-2 text-xs rounded-sm border transition-colors ${inventoryTab==="theories" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-secondary"}`}>Theory Database</button>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} items selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Clear Selection</button>
                  <button onClick={() => handleBulkDelete(inventoryTab === "problems" ? allQuestions : allTheories)} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-sm font-medium transition-colors">Delete Selected</button>
                </div>
              </div>
            )}

            {inventoryTab === "problems" && (
              <div className="academic-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/20 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={selectedIds.size === allQuestions.length && allQuestions.length > 0} onChange={() => toggleAllSelection(allQuestions)} className="cursor-pointer" /></th>
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
                    {allQuestions.map(q => (
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
                            <button onClick={() => { setEditItem({...q}); setEditNote(""); }} className="p-1.5 border border-border rounded-sm hover:bg-primary/10 hover:text-primary text-muted-foreground" title="Edit"><Edit2 size={12}/></button>
                            <button onClick={() => handleDelete(q._id, "question")} className="p-1.5 border border-red-200 rounded-sm hover:bg-red-500/10 text-red-400" title="Delete"><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allQuestions.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No problems found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {inventoryTab === "theories" && (
              <div className="academic-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/20 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={selectedIds.size === allTheories.length && allTheories.length > 0} onChange={() => toggleAllSelection(allTheories)} className="cursor-pointer" /></th>
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
                    {allTheories.map(t => (
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
                    {allTheories.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No theory articles found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PROBLEM BANK (Approved only, with upvotes) ── */}
        {activeSection === "Problem Bank" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-serif text-foreground">Problem Bank — Approved & Live</h2>
            
            {selectedIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} items selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Clear Selection</button>
                  <button onClick={() => handleBulkDelete(allQuestions.filter(q => q.status === "approved"))} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-sm font-medium transition-colors">Delete Selected</button>
                </div>
              </div>
            )}

            <div className="academic-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/20 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={selectedIds.size === allQuestions.filter(q => q.status === "approved").length && selectedIds.size > 0} onChange={() => toggleAllSelection(allQuestions.filter(q => q.status === "approved"))} className="cursor-pointer" /></th>
                    <th className="py-3 px-2 font-bold">Content ID</th>
                    <th className="py-3 px-4 font-bold">Title</th>
                    <th className="py-3 px-4 font-bold">Topic</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Difficulty</th>
                    <th className="py-3 px-4 font-bold">Upvotes</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allQuestions.filter(q => q.status === "approved").map(q => (
                    <tr key={q._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 text-center"><input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => toggleSelection(q._id)} className="cursor-pointer" /></td>
                      <td className="py-3 px-2"><span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{q.contentId || q._id.substring(0,8).toUpperCase()}</span></td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-[200px] truncate">{q.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{q.topic}</td>
                      <td className="py-3 px-4"><span className="px-1.5 py-0.5 bg-secondary border border-border rounded-sm">{q.questionType}</span></td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${ q.difficulty==="Hard" ? "bg-red-500/10 text-red-600 border-red-500/20" : q.difficulty==="Medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-green-500/10 text-green-600 border-green-500/20" }`}>{q.difficulty}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">{q.upvotes || 0}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => setPreviewItem({...q, _contentType: "question"})} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="Preview"><Eye size={12}/></button>
                          <button onClick={() => setHistoryItem(q)} className="p-1.5 border border-border rounded-sm hover:bg-secondary text-muted-foreground" title="History"><Clock size={12}/></button>
                          <button onClick={() => { setEditItem({...q}); setEditNote(""); }} className="p-1.5 border border-border rounded-sm hover:bg-primary/10 hover:text-primary text-muted-foreground" title="Edit"><Edit2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allQuestions.filter(q => q.status === "approved").length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No approved problems yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLATFORM LOGS SECTION */}
        {activeSection === "Platform Logs" && (
          <div className="max-w-4xl mx-auto text-center py-20 border border-dashed border-border rounded-md bg-secondary/10">
            <h2 className="text-xl font-bold font-serif mb-2 text-foreground">Platform Logs</h2>
            <p className="text-sm text-muted-foreground">System audit logs and error tracing will appear here in a future update.</p>
          </div>
        )}

      </div>

      {/* ════ EDIT MODAL ════ */}
      {editItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-5 py-4 flex justify-between items-center border-b border-border sticky top-0">
              <div>
                <span className="text-sm font-bold text-foreground">Edit Content</span>
                <span className="ml-3 font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">{editItem.contentId || editItem._id?.substring(0,8).toUpperCase()}</span>
              </div>
              <button onClick={() => setEditItem(null)} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-foreground block mb-1.5">Title</label>
                  <input value={editItem.title || ""} onChange={e => setEditItem({...editItem, title: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
                <div><label className="text-xs font-bold text-foreground block mb-1.5">Topic</label>
                  <input value={editItem.topic || ""} onChange={e => setEditItem({...editItem, topic: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
              </div>
              {editItem.chapterId !== undefined ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
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
                  <div><label className="text-xs font-bold text-foreground block mb-1.5">Statement (LaTeX)</label>
                    <textarea rows={5} value={editItem.statement} onChange={e => setEditItem({...editItem, statement: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono resize-y focus:border-primary" /></div>
                  <div><label className="text-xs font-bold text-foreground block mb-1.5">Solution (LaTeX)</label>
                    <textarea rows={4} value={editItem.solution} onChange={e => setEditItem({...editItem, solution: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono resize-y focus:border-primary" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">Difficulty</label>
                      <select value={editItem.difficulty} onChange={e => setEditItem({...editItem, difficulty: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none">
                        <option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">+Marks</label>
                      <input type="number" step="0.5" value={editItem.markingScheme?.positive} onChange={e => setEditItem({...editItem, markingScheme: {...editItem.markingScheme, positive: parseFloat(e.target.value)}})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none" /></div>
                    <div><label className="text-xs font-bold text-foreground block mb-1.5">-Marks</label>
                      <input type="number" step="0.5" value={editItem.markingScheme?.negative} onChange={e => setEditItem({...editItem, markingScheme: {...editItem.markingScheme, negative: parseFloat(e.target.value)}})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none" /></div>
                  </div>
                </>
              )}
              <div><label className="text-xs font-bold text-foreground block mb-1.5">Image URL</label>
                <input value={editItem.imageUrl || ""} onChange={e => setEditItem({...editItem, imageUrl: e.target.value})} className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none font-mono focus:border-primary" /></div>
              <div><label className="text-xs font-bold text-foreground block mb-1.5">Edit Note (for audit log)</label>
                <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="e.g. Fixed LaTeX typo in statement" className="w-full px-3 py-2 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button onClick={() => setEditItem(null)} className="px-5 py-2 text-xs border border-border rounded-sm hover:bg-secondary">Cancel</button>
                <button onClick={handleSaveEdit} className="btn-primary px-6 py-2 text-xs">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ HISTORY MODAL ════ */}
      {historyItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-5 py-4 flex justify-between items-center border-b border-border">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md shadow-lg w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-5 py-4 flex justify-between items-center border-b border-border">
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
                <table className="w-full text-xs text-left mb-6 border border-border">
                  <thead className="bg-secondary/30 text-muted-foreground"><tr><th className="py-2 px-3">Metric</th><th className="py-2 px-3">Count</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 px-3">Problems Solved</td><td className="py-2 px-3 font-mono">0</td></tr>
                    <tr><td className="py-2 px-3">Theory Read</td><td className="py-2 px-3 font-mono">0</td></tr>
                    <tr><td className="py-2 px-3">Contest Participation</td><td className="py-2 px-3 font-mono">0</td></tr>
                  </tbody>
                </table>
                <div className="font-bold text-xs text-foreground mb-3 uppercase tracking-wide">Account Actions</div>
                <div className="grid grid-cols-2 gap-2">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-md shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/80 px-5 py-4 flex justify-between items-center border-b border-border sticky top-0 z-10">
              <div className="flex items-center gap-3">
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

              {/* Image if any */}
              {previewItem.imageUrl && (
                <div className="border border-border rounded-sm overflow-hidden bg-secondary/15 max-w-md mx-auto p-2">
                  <img src={previewItem.imageUrl} alt={previewItem.title} className="max-h-60 object-contain rounded-sm w-full" />
                </div>
              )}

              {/* Main Content / Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {previewItem.questionType ? "Question Statement" : "Article Content"}
                </h4>
                <div className="p-4 bg-secondary/20 border border-border rounded-sm text-sm overflow-x-auto leading-relaxed">
                  <LatexRenderer latex={previewItem.statement || previewItem.content || ""} />
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
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm text-xs flex justify-between items-center">
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

              {/* Action Buttons inside Preview */}
              <div className="flex justify-end gap-3 pt-5 border-t border-border">
                <button onClick={() => setPreviewItem(null)} className="px-5 py-2 text-xs border border-border rounded-sm hover:bg-secondary">
                  Close
                </button>
                {previewItem.status !== "approved" && previewItem.status !== "rejected" && (
                  <>
                    <button 
                      onClick={() => {
                        handleApprove(previewItem._id, "rejected", previewItem._contentType);
                        setPreviewItem(null);
                      }} 
                      className="px-5 py-2 text-xs border border-red-200 hover:bg-red-500/10 hover:text-red-500 rounded-sm transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => {
                        handleApprove(previewItem._id, "approved", previewItem._contentType);
                        setPreviewItem(null);
                      }} 
                      className="btn-primary px-6 py-2 text-xs"
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
