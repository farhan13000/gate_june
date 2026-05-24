/**
 * GATE DA Platform — Taxonomy seed (Subject → Chapter → Topic → Subtopic)
 * Semantic IDs only. Ordered for Beginner → Intermediate → Advanced flow.
 */

export interface SubtopicSeed {
  subtopicId: string;
  name: string;
  order: number;
}

export interface TopicSeed {
  topicId: string;
  name: string;
  order: number;
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  subtopics: SubtopicSeed[];
}

export interface ChapterSeed {
  chapterId: string;
  name: string;
  order: number;
  topics: TopicSeed[];
}

export interface SubjectSeed {
  subjectId: string;
  name: string;
  code: string;
  order: number;
  chapters: ChapterSeed[];
}

function st(id: string, name: string, order: number): SubtopicSeed {
  return { subtopicId: id, name, order };
}

function tp(
  id: string,
  name: string,
  order: number,
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced",
  subtopics: SubtopicSeed[]
): TopicSeed {
  return { topicId: id, name, order, difficultyLevel, subtopics };
}

function ch(id: string, name: string, order: number, topics: TopicSeed[]): ChapterSeed {
  return { chapterId: id, name, order, topics };
}

export const TAXONOMY_SEED: SubjectSeed[] = [
  {
    subjectId: "SUBJECT_MATHEMATICS",
    name: "Mathematics",
    code: "MATH",
    order: 1,
    chapters: [
      ch("CHAPTER_MATH_SETS_LOGIC", "Sets & Logic", 1, [
        tp("TOPIC_MATH_SETS", "Sets", 1, "Beginner", [
          st("SUBTOPIC_MATH_SET_OPERATIONS", "Set Operations", 1),
          st("SUBTOPIC_MATH_VENN_DIAGRAMS", "Venn Diagrams", 2),
        ]),
        tp("TOPIC_MATH_LOGIC", "Mathematical Logic", 2, "Beginner", [
          st("SUBTOPIC_MATH_PROPOSITIONS", "Propositions & Connectives", 1),
          st("SUBTOPIC_MATH_PROOF_TECHNIQUES", "Proof Techniques", 2),
        ]),
      ]),
      ch("CHAPTER_MATH_FUNCTIONS", "Functions & Relations", 2, [
        tp("TOPIC_MATH_FUNCTIONS", "Functions", 1, "Intermediate", [
          st("SUBTOPIC_MATH_INJECTIVE_SURJECTIVE", "Injective & Surjective", 1),
          st("SUBTOPIC_MATH_COMPOSITION", "Composition & Inverse", 2),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_PROBABILITY",
    name: "Probability & Statistics",
    code: "PROB",
    order: 2,
    chapters: [
      ch("CHAPTER_PROB_BASICS", "Probability Basics", 1, [
        tp("TOPIC_PROB_SAMPLE_SPACE", "Sample Space & Events", 1, "Beginner", [
          st("SUBTOPIC_PROB_AXIOMS", "Probability Axioms", 1),
          st("SUBTOPIC_PROB_CONDITIONAL", "Conditional Probability", 2),
        ]),
        tp("TOPIC_PROB_BAYES", "Bayes Theorem", 2, "Intermediate", [
          st("SUBTOPIC_PROB_BAYES_FORMULA", "Bayes Formula", 1),
          st("SUBTOPIC_PROB_TOTAL_PROBABILITY", "Law of Total Probability", 2),
        ]),
      ]),
      ch("CHAPTER_PROB_RANDOM_VARIABLES", "Random Variables", 2, [
        tp("TOPIC_PROB_EXPECTATION", "Expectation", 1, "Intermediate", [
          st("SUBTOPIC_PROB_LINEARITY_EXPECTATION", "Linearity of Expectation", 1),
          st("SUBTOPIC_PROB_VARIANCE", "Variance & Covariance", 2),
        ]),
        tp("TOPIC_PROB_DISTRIBUTIONS", "Distributions", 2, "Advanced", [
          st("SUBTOPIC_PROB_BINOMIAL_POISSON", "Binomial & Poisson", 1),
          st("SUBTOPIC_PROB_NORMAL", "Normal Distribution", 2),
        ]),
      ]),
      ch("CHAPTER_PROB_INFERENCE", "Statistical Inference", 3, [
        tp("TOPIC_PROB_ESTIMATION", "Estimation", 1, "Advanced", [
          st("SUBTOPIC_PROB_MLE", "Maximum Likelihood", 1),
          st("SUBTOPIC_PROB_MAP", "MAP Estimation", 2),
        ]),
        tp("TOPIC_PROB_HYPOTHESIS", "Hypothesis Testing", 2, "Advanced", [
          st("SUBTOPIC_PROB_ZT_CHI", "Z, t & Chi-square Tests", 1),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_LINEAR_ALGEBRA",
    name: "Linear Algebra",
    code: "LINALG",
    order: 3,
    chapters: [
      ch("CHAPTER_LA_VECTORS", "Vectors & Spaces", 1, [
        tp("TOPIC_LA_VECTOR_SPACES", "Vector Spaces", 1, "Beginner", [
          st("SUBTOPIC_LA_BASIS_DIMENSION", "Basis & Dimension", 1),
          st("SUBTOPIC_LA_LINEAR_INDEPENDENCE", "Linear Independence", 2),
        ]),
      ]),
      ch("CHAPTER_LA_MATRICES", "Matrices", 2, [
        tp("TOPIC_LA_EIGENVALUES", "Eigenvalues & Eigenvectors", 1, "Intermediate", [
          st("SUBTOPIC_LA_CHARACTERISTIC", "Characteristic Polynomial", 1),
          st("SUBTOPIC_LA_DIAGONALIZATION", "Diagonalization", 2),
        ]),
        tp("TOPIC_LA_SVD", "Singular Value Decomposition", 2, "Advanced", [
          st("SUBTOPIC_LA_SVD_COMPUTATION", "SVD Computation", 1),
          st("SUBTOPIC_LA_LOW_RANK", "Low-Rank Approximation", 2),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_CALCULUS",
    name: "Calculus",
    code: "CALC",
    order: 4,
    chapters: [
      ch("CHAPTER_CALC_LIMITS", "Limits & Continuity", 1, [
        tp("TOPIC_CALC_LIMITS", "Limits", 1, "Beginner", [
          st("SUBTOPIC_CALC_LIMIT_LAWS", "Limit Laws", 1),
          st("SUBTOPIC_CALC_LHOPITAL", "L'Hôpital's Rule", 2),
        ]),
        tp("TOPIC_CALC_CONTINUITY", "Continuity", 2, "Beginner", [
          st("SUBTOPIC_CALC_CONTINUOUS_FUNCTIONS", "Continuous Functions", 1),
        ]),
      ]),
      ch("CHAPTER_CALC_DIFFERENTIATION", "Differentiation", 2, [
        tp("TOPIC_CALC_DERIVATIVES", "Differentiation", 1, "Intermediate", [
          st("SUBTOPIC_CALC_CHAIN_RULE", "Chain Rule", 1),
          st("SUBTOPIC_CALC_PARTIAL", "Partial Derivatives", 2),
        ]),
        tp("TOPIC_CALC_APPLICATIONS", "Applications of Derivatives", 2, "Intermediate", [
          st("SUBTOPIC_CALC_OPTIMIZATION", "Optimization Problems", 1),
          st("SUBTOPIC_CALC_TAYLOR", "Taylor Series", 2),
        ]),
      ]),
      ch("CHAPTER_CALC_INTEGRATION", "Integration", 3, [
        tp("TOPIC_CALC_INTEGRATION", "Integration", 1, "Intermediate", [
          st("SUBTOPIC_CALC_DEFINITE", "Definite Integrals", 1),
          st("SUBTOPIC_CALC_SUBSTITUTION", "Substitution & Parts", 2),
        ]),
        tp("TOPIC_CALC_DIFFEQ", "Differential Equations", 2, "Advanced", [
          st("SUBTOPIC_CALC_FIRST_ORDER", "First Order ODEs", 1),
          st("SUBTOPIC_CALC_SECOND_ORDER", "Second Order ODEs", 2),
        ]),
      ]),
      ch("CHAPTER_CALC_MULTIVARIABLE", "Multivariable Calculus", 4, [
        tp("TOPIC_CALC_MULTIVAR", "Multivariable Calculus", 1, "Advanced", [
          st("SUBTOPIC_CALC_GRADIENT", "Gradient & Directional Derivatives", 1),
          st("SUBTOPIC_CALC_MULTIPLE_INTEGRALS", "Multiple Integrals", 2),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_OPTIMIZATION",
    name: "Optimization",
    code: "OPT",
    order: 5,
    chapters: [
      ch("CHAPTER_OPT_CONVEX", "Convex Optimization", 1, [
        tp("TOPIC_OPT_CONVEX_SETS", "Convex Sets & Functions", 1, "Intermediate", [
          st("SUBTOPIC_OPT_CONVEX_DEFINITION", "Convexity Definitions", 1),
        ]),
        tp("TOPIC_OPT_GRADIENT_DESCENT", "Gradient Descent", 2, "Advanced", [
          st("SUBTOPIC_OPT_GD_UPDATE", "Gradient Update Rules", 1),
          st("SUBTOPIC_OPT_CONSTRAINED", "Constrained Optimization", 2),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_MACHINE_LEARNING",
    name: "Machine Learning",
    code: "ML",
    order: 6,
    chapters: [
      ch("CHAPTER_ML_SUPERVISED", "Supervised Learning", 1, [
        tp("TOPIC_ML_LINEAR_REGRESSION", "Linear Regression", 1, "Beginner", [
          st("SUBTOPIC_ML_OLS", "Ordinary Least Squares", 1),
          st("SUBTOPIC_ML_REGULARIZATION", "Regularization (Ridge/Lasso)", 2),
        ]),
        tp("TOPIC_ML_LOGISTIC_REGRESSION", "Logistic Regression", 2, "Intermediate", [
          st("SUBTOPIC_ML_SIGMOID", "Sigmoid & Cross-Entropy", 1),
          st("SUBTOPIC_ML_GRADIENT_DESCENT", "Gradient Descent", 2),
        ]),
        tp("TOPIC_ML_SVM", "Support Vector Machines", 3, "Advanced", [
          st("SUBTOPIC_ML_SVM_MARGIN", "Margin & Kernels", 1),
        ]),
      ]),
      ch("CHAPTER_ML_TREES", "Tree-Based Methods", 2, [
        tp("TOPIC_ML_DECISION_TREES", "Decision Trees", 1, "Intermediate", [
          st("SUBTOPIC_ML_ENTROPY_GINI", "Entropy & Gini", 1),
        ]),
      ]),
      ch("CHAPTER_ML_UNSUPERVISED", "Unsupervised Learning", 3, [
        tp("TOPIC_ML_CLUSTERING", "Clustering", 1, "Intermediate", [
          st("SUBTOPIC_ML_KMEANS", "K-Means", 1),
        ]),
        tp("TOPIC_ML_PCA", "PCA", 2, "Advanced", [
          st("SUBTOPIC_ML_PCA_EIGEN", "Eigenvalue Decomposition", 1),
        ]),
      ]),
      ch("CHAPTER_ML_NEURAL", "Neural Networks", 4, [
        tp("TOPIC_ML_NEURAL_NETWORKS", "Neural Networks", 1, "Advanced", [
          st("SUBTOPIC_ML_BACKPROP", "Backpropagation", 1),
          st("SUBTOPIC_ML_ACTIVATION", "Activation Functions", 2),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_DATABASES",
    name: "Databases",
    code: "DB",
    order: 7,
    chapters: [
      ch("CHAPTER_DB_RELATIONAL", "Relational Model", 1, [
        tp("TOPIC_DB_RELATIONAL_ALGEBRA", "Relational Algebra", 1, "Beginner", [
          st("SUBTOPIC_DB_RA_OPERATIONS", "Selection, Projection, Join", 1),
        ]),
        tp("TOPIC_DB_SQL", "SQL", 2, "Intermediate", [
          st("SUBTOPIC_DB_SQL_JOINS", "Joins & Subqueries", 1),
        ]),
      ]),
      ch("CHAPTER_DB_DESIGN", "Database Design", 2, [
        tp("TOPIC_DB_NORMALIZATION", "Normalization", 1, "Intermediate", [
          st("SUBTOPIC_DB_BCNF", "BCNF & 3NF", 1),
        ]),
        tp("TOPIC_DB_INDEXING", "Indexing & Transactions", 2, "Advanced", [
          st("SUBTOPIC_DB_B_TREE", "B/B+ Trees", 1),
          st("SUBTOPIC_DB_ACID", "ACID Properties", 2),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_PROGRAMMING_PYTHON",
    name: "Programming & Python",
    code: "PY",
    order: 8,
    chapters: [
      ch("CHAPTER_PY_BASICS", "Python Fundamentals", 1, [
        tp("TOPIC_PY_SYNTAX", "Syntax & Data Types", 1, "Beginner", [
          st("SUBTOPIC_PY_LISTS_DICTS", "Lists & Dictionaries", 1),
        ]),
        tp("TOPIC_PY_NUMPY", "NumPy", 2, "Intermediate", [
          st("SUBTOPIC_PY_ARRAY_OPS", "Array Operations", 1),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_DATA_STRUCTURES",
    name: "Data Structures",
    code: "DS",
    order: 9,
    chapters: [
      ch("CHAPTER_DS_ARRAYS", "Arrays & Strings", 1, [
        tp("TOPIC_DS_ARRAYS", "Arrays", 1, "Beginner", [
          st("SUBTOPIC_DS_ARRAY_TRAVERSAL", "Traversal & Insertion", 1),
          st("SUBTOPIC_DS_TWO_POINTERS", "Two Pointers", 2),
        ]),
        tp("TOPIC_DS_STRINGS", "Strings", 2, "Beginner", [
          st("SUBTOPIC_DS_STRING_MATCHING", "Pattern Matching", 1),
        ]),
      ]),
      ch("CHAPTER_DS_LINKED", "Linked Lists", 2, [
        tp("TOPIC_DS_LINKED_LIST", "Linked Lists", 1, "Beginner", [
          st("SUBTOPIC_DS_LL_INSERTION", "Insertion & Deletion", 1),
          st("SUBTOPIC_DS_LL_REVERSAL", "Reversal", 2),
        ]),
      ]),
      ch("CHAPTER_DS_STACKS_QUEUES", "Stacks & Queues", 3, [
        tp("TOPIC_DS_STACKS", "Stacks", 1, "Beginner", [
          st("SUBTOPIC_DS_STACK_OPS", "Stack Operations", 1),
        ]),
        tp("TOPIC_DS_QUEUES", "Queues", 2, "Beginner", [
          st("SUBTOPIC_DS_QUEUE_OPS", "Queue Operations", 1),
          st("SUBTOPIC_DS_DEQUE", "Deque", 2),
        ]),
      ]),
      ch("CHAPTER_DS_HASHING", "Hashing", 4, [
        tp("TOPIC_DS_HASHING", "Hashing", 1, "Intermediate", [
          st("SUBTOPIC_DS_HASH_TABLES", "Hash Tables", 1),
          st("SUBTOPIC_DS_COLLISION", "Collision Resolution", 2),
        ]),
      ]),
      ch("CHAPTER_DS_TREES", "Trees", 5, [
        tp("TOPIC_DS_TREES", "Trees", 1, "Intermediate", [
          st("SUBTOPIC_DS_TREE_TRAVERSAL", "Tree Traversals", 1),
        ]),
        tp("TOPIC_DS_BST", "Binary Search Trees", 2, "Intermediate", [
          st("SUBTOPIC_DS_BST_INSERTION", "BST Insertion", 1),
          st("SUBTOPIC_DS_BST_SEARCH", "BST Search & Delete", 2),
        ]),
        tp("TOPIC_DS_HEAPS", "Heaps", 3, "Intermediate", [
          st("SUBTOPIC_DS_HEAP_OPS", "Heap Operations", 1),
        ]),
      ]),
      ch("CHAPTER_DS_GRAPHS", "Graphs", 6, [
        tp("TOPIC_DS_GRAPHS", "Graphs", 1, "Advanced", [
          st("SUBTOPIC_DS_GRAPH_REP", "Graph Representations", 1),
        ]),
      ]),
      ch("CHAPTER_DS_ADVANCED", "Advanced Structures", 7, [
        tp("TOPIC_DS_TRIES", "Tries", 1, "Advanced", [
          st("SUBTOPIC_DS_TRIE_OPS", "Trie Operations", 1),
        ]),
        tp("TOPIC_DS_SEGMENT_TREE", "Segment Trees", 2, "Advanced", [
          st("SUBTOPIC_DS_SEG_TREE_QUERY", "Range Queries", 1),
        ]),
        tp("TOPIC_DS_FENWICK", "Fenwick Trees", 3, "Advanced", [
          st("SUBTOPIC_DS_BIT_OPS", "Binary Indexed Tree", 1),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_ALGORITHMS",
    name: "Algorithms",
    code: "ALGO",
    order: 10,
    chapters: [
      ch("CHAPTER_ALGO_COMPLEXITY", "Complexity Analysis", 1, [
        tp("TOPIC_ALGO_TIME_COMPLEXITY", "Time Complexity", 1, "Beginner", [
          st("SUBTOPIC_ALGO_BIG_O", "Big-O Notation", 1),
          st("SUBTOPIC_ALGO_AMORTIZED", "Amortized Analysis", 2),
        ]),
      ]),
      ch("CHAPTER_ALGO_SEARCH_SORT", "Searching & Sorting", 2, [
        tp("TOPIC_ALGO_SEARCHING", "Searching", 1, "Beginner", [
          st("SUBTOPIC_ALGO_BINARY_SEARCH", "Binary Search", 1),
        ]),
        tp("TOPIC_ALGO_SORTING", "Sorting", 2, "Intermediate", [
          st("SUBTOPIC_ALGO_MERGE_SORT", "Merge Sort", 1),
          st("SUBTOPIC_ALGO_QUICK_SORT", "Quick Sort", 2),
        ]),
      ]),
      ch("CHAPTER_ALGO_RECURSION", "Recursion", 3, [
        tp("TOPIC_ALGO_RECURSION", "Recursion", 1, "Intermediate", [
          st("SUBTOPIC_ALGO_RECURRENCE", "Recurrence Relations", 1),
        ]),
      ]),
      ch("CHAPTER_ALGO_DP_GREEDY", "DP & Greedy", 4, [
        tp("TOPIC_ALGO_GREEDY", "Greedy Algorithms", 1, "Intermediate", [
          st("SUBTOPIC_ALGO_GREEDY_CHOICE", "Greedy Choice Property", 1),
        ]),
        tp("TOPIC_ALGO_DP", "Dynamic Programming", 2, "Advanced", [
          st("SUBTOPIC_ALGO_DP_MEMO", "Memoization & Tabulation", 1),
        ]),
        tp("TOPIC_ALGO_BACKTRACKING", "Backtracking", 3, "Advanced", [
          st("SUBTOPIC_ALGO_BACKTRACK_TEMPLATE", "Backtracking Template", 1),
        ]),
      ]),
      ch("CHAPTER_ALGO_GRAPHS", "Graph Algorithms", 5, [
        tp("TOPIC_ALGO_GRAPH_TRAVERSAL", "Graph Traversals", 1, "Intermediate", [
          st("SUBTOPIC_ALGO_BFS_DFS", "BFS & DFS", 1),
        ]),
        tp("TOPIC_ALGO_SHORTEST_PATH", "Shortest Path", 2, "Advanced", [
          st("SUBTOPIC_ALGO_DIJKSTRA", "Dijkstra's Algorithm", 1),
          st("SUBTOPIC_ALGO_BELLMAN_FORD", "Bellman-Ford", 2),
        ]),
        tp("TOPIC_ALGO_MST", "Minimum Spanning Tree", 3, "Advanced", [
          st("SUBTOPIC_ALGO_KRUSKAL_PRIM", "Kruskal & Prim", 1),
        ]),
      ]),
      ch("CHAPTER_ALGO_STRINGS", "String Algorithms", 6, [
        tp("TOPIC_ALGO_STRING_ALGO", "String Algorithms", 1, "Advanced", [
          st("SUBTOPIC_ALGO_KMP", "KMP Algorithm", 1),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_APTITUDE",
    name: "Aptitude",
    code: "APT",
    order: 11,
    chapters: [
      ch("CHAPTER_APT_ARITHMETIC", "Arithmetic", 1, [
        tp("TOPIC_APT_PERCENTAGES", "Percentages", 1, "Beginner", [
          st("SUBTOPIC_APT_PERCENT_CALC", "Percentage Calculations", 1),
        ]),
        tp("TOPIC_APT_RATIO", "Ratio & Proportion", 2, "Beginner", [
          st("SUBTOPIC_APT_RATIO_PROBLEMS", "Ratio Problems", 1),
        ]),
        tp("TOPIC_APT_TIME_WORK", "Time & Work", 3, "Intermediate", [
          st("SUBTOPIC_APT_TIME_WORK_FORMULAS", "Time-Work Formulas", 1),
        ]),
        tp("TOPIC_APT_PROFIT_LOSS", "Profit & Loss", 4, "Intermediate", [
          st("SUBTOPIC_APT_PROFIT_MARGIN", "Profit & Margin", 1),
        ]),
      ]),
      ch("CHAPTER_APT_COMBINATORICS", "Combinatorics", 2, [
        tp("TOPIC_APT_PERM_COMB", "Permutation & Combination", 1, "Intermediate", [
          st("SUBTOPIC_APT_PNC_FORMULAS", "PnC Formulas", 1),
        ]),
        tp("TOPIC_APT_PROBABILITY", "Probability", 2, "Intermediate", [
          st("SUBTOPIC_APT_BASIC_PROB", "Basic Probability", 1),
        ]),
      ]),
      ch("CHAPTER_APT_REASONING", "Reasoning & DI", 3, [
        tp("TOPIC_APT_LOGICAL", "Logical Reasoning", 1, "Intermediate", [
          st("SUBTOPIC_APT_SYLLOGISMS", "Syllogisms", 1),
        ]),
        tp("TOPIC_APT_DATA_INTERP", "Data Interpretation", 2, "Advanced", [
          st("SUBTOPIC_APT_CHARTS", "Charts & Tables", 1),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_DISCRETE_MATHEMATICS",
    name: "Discrete Mathematics",
    code: "DM",
    order: 12,
    chapters: [
      ch("CHAPTER_DM_COMBINATORICS", "Combinatorics", 1, [
        tp("TOPIC_DM_COUNTING", "Counting Principles", 1, "Beginner", [
          st("SUBTOPIC_DM_PIGEONHOLE", "Pigeonhole Principle", 1),
        ]),
      ]),
      ch("CHAPTER_DM_GRAPHS", "Graph Theory", 2, [
        tp("TOPIC_DM_GRAPH_BASICS", "Graph Basics", 1, "Intermediate", [
          st("SUBTOPIC_DM_EULER_HAMILTON", "Euler & Hamilton Paths", 1),
        ]),
      ]),
    ],
  },
  {
    subjectId: "SUBJECT_CS_FOUNDATIONS",
    name: "Computer Science Foundations",
    code: "CS",
    order: 13,
    chapters: [
      ch("CHAPTER_CS_ARCH", "Computer Architecture", 1, [
        tp("TOPIC_CS_MEMORY", "Memory Systems", 1, "Intermediate", [
          st("SUBTOPIC_CS_CACHE", "Cache Memory", 1),
        ]),
      ]),
      ch("CHAPTER_CS_OS", "Operating Systems", 2, [
        tp("TOPIC_CS_PROCESSES", "Processes & Threads", 1, "Intermediate", [
          st("SUBTOPIC_CS_SCHEDULING", "CPU Scheduling", 1),
        ]),
      ]),
    ],
  },
];

/** Flatten seed into DB-ready documents */
export function flattenTaxonomySeed() {
  const subjects: Array<{
    subjectId: string;
    name: string;
    code: string;
    order: number;
    enabled: boolean;
  }> = [];
  const chapters: Array<{
    chapterId: string;
    subjectId: string;
    name: string;
    order: number;
    enabled: boolean;
  }> = [];
  const topics: Array<{
    topicId: string;
    chapterId: string;
    subjectId: string;
    name: string;
    order: number;
    difficultyLevel: string;
    enabled: boolean;
  }> = [];
  const subtopics: Array<{
    subtopicId: string;
    topicId: string;
    chapterId: string;
    subjectId: string;
    name: string;
    order: number;
    enabled: boolean;
  }> = [];

  for (const s of TAXONOMY_SEED) {
    subjects.push({
      subjectId: s.subjectId,
      name: s.name,
      code: s.code,
      order: s.order,
      enabled: true,
    });
    for (const c of s.chapters) {
      chapters.push({
        chapterId: c.chapterId,
        subjectId: s.subjectId,
        name: c.name,
        order: c.order,
        enabled: true,
      });
      for (const t of c.topics) {
        topics.push({
          topicId: t.topicId,
          chapterId: c.chapterId,
          subjectId: s.subjectId,
          name: t.name,
          order: t.order,
          difficultyLevel: t.difficultyLevel,
          enabled: true,
        });
        for (const st of t.subtopics) {
          subtopics.push({
            subtopicId: st.subtopicId,
            topicId: t.topicId,
            chapterId: c.chapterId,
            subjectId: s.subjectId,
            name: st.name,
            order: st.order,
            enabled: true,
          });
        }
      }
    }
  }

  return { subjects, chapters, topics, subtopics };
}
