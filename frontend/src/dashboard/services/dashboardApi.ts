const DASHBOARD_BASE = "/api/dashboard";

export async function dashboardFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${DASHBOARD_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Dashboard API failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const dashboardApi = {
  overview: () => dashboardFetch<{ stats: Record<string, unknown> }>("/overview"),
  activity: () => dashboardFetch<{
    activity: { date: string; count: number; studyTimeMinutes: number; accuracy: number }[];
    stats: {
      solvedAllTime: number;
      solvedLastYear: number;
      solvedLastMonth: number;
      maxStreak: number;
      streakLastYear: number;
      streakLastMonth: number;
    };
  }>("/activity/heatmap"),
  intelligenceIndex: () => dashboardFetch<{ index: number; details: Record<string, number> }>("/intelligence-index"),
  readinessScore: () => dashboardFetch<{
    readinessScore: number;
    percentileProjection: number;
    motivationalInsight: string;
    dailySummary: { problemsSolved: number; accuracy: number; studyHours: number; mockTests: number };
  }>("/readiness-score"),
  streakTracking: () => dashboardFetch<{ currentStreak: number; consistencyScore: number }>("/streak-tracking"),
  recentActivity: () => dashboardFetch<{ activity: Array<{ type: string; title: string; timestamp: string; meta: string }> }>("/recent-activity"),
  weeklyPerformance: () => dashboardFetch<{ weekly: Array<{ day: string; attempts: number; accuracy: number; hours: number }> }>("/weekly-performance"),
  studyAnalytics: () => dashboardFetch<{ subjects: Array<{ subject: string; completion: number; completedTopics: number; totalTopics: number }> }>("/study-analytics"),
  contestSummary: () => dashboardFetch<{ mockTests: number; currentRank: number | null; bestRank: number | null; averageScore: number; recent: Array<{ label: string; score: number; rank: number | string; solved: number }> }>("/contest-summary"),
  contestPerformance: () => dashboardFetch<{
    ratingData: Array<{ date: string; label?: string; rating: number; contestTitle?: string }>;
    testTypePerformance: Array<{ type: string; attempted: number; avgScore: number; avgAccuracy: number; bestRank: number | string }>;
    contestSummary: { ratedContests: number; highestRating: number; averageRank: number | string; avgPenalty: number };
  }>("/contest-performance"),
  subjectIntelligence: () => dashboardFetch<{
    summary: { averageMastery: number; completedSubjects: number; revisionDue: number; highConfidence: number };
    subjects: Array<{
      id: string;
      subject: string;
      mastery: number;
      syllabusCompletion: number;
      revisionStatus: string;
      revisionFreshness: number;
      confidenceScore: number;
      averageAccuracy: number;
      learningConsistency: number;
      recentActivity: number;
      attempted: number;
      topics: Array<{ topic: string; mastery: number; completion: number; accuracy: number; conceptDecay: number; weakness: boolean }>;
    }>;
  }>("/subjects/intelligence"),
  subjectDetailIntelligence: (subjectId: string) => dashboardFetch<{
    subject: {
      id: string;
      subject: string;
      mastery: number;
      syllabusCompletion: number;
      revisionStatus: string;
      confidenceScore: number;
      averageAccuracy: number;
      learningConsistency: number;
      recentActivity: number;
      attempted: number;
    };
    chapters: Array<{ chapter: string; mastery: number; completion: number; topics: number }>;
    topics: Array<{
      id: string;
      topic: string;
      chapter: string;
      mastery: number;
      completion: number;
      accuracy: number;
      attempts: number;
      timeSpentMinutes: number;
      conceptDecay: number;
      revisionFrequency: number;
      spacedRepetition: string;
      weakness: boolean;
      forecast: number;
    }>;
    dependencyGraph: Array<{ source: string; target: string; strength: number }>;
    conceptCompletion: { totalTracked: number; completed: number; weak: number };
  }>(`/subjects/${encodeURIComponent(subjectId)}/intelligence`),
  timeAnalysis: () => dashboardFetch<{
    summary: { averageTimePerQuestion: number; averageAccuracy: number; totalTimedAttempts: number; hesitationRate: number; retryRate: number; wastedTimeMinutes: number };
    subjectDistribution: Array<{ subject: string; attempts: number; averageTime: number; accuracy: number; timeShare: number; hesitationScore: number }>;
    chapterConsumption: Array<{ chapter: string; subject: string; attempts: number; averageTime: number; totalTime: number }>;
    slowestTopics: Array<{ topic: string; subject: string; averageTime: number; accuracy: number; hesitationScore: number; retries: number; abandoned: number }>;
    fastestAreas: Array<{ topic: string; subject: string; averageTime: number; accuracy: number }>;
    timeAccuracyMap: Array<{ topic: string; time: number; accuracy: number; hesitation: number }>;
    insights: string[];
  }>("/time-analysis"),
  pacing: () => dashboardFetch<{ pacing: Array<{ bucket: string; attempts: number; accuracy: number; averageScore: number }>; contestSummary: { contests: number; averagePenalty: number; lateSlowdown: number }; recommendation: string }>("/pacing"),
  sessionAnalysis: () => dashboardFetch<{ sessions: Array<{ date: string; minutes: number; attempts: number; efficiency: number }> }>("/session-analysis"),
  timeDistribution: () => dashboardFetch<{ distribution: Array<{ bucket: string; count: number; accuracy: number }> }>("/time-distribution"),
  skillsProfile: () => dashboardFetch<{
    summary: { profileScore: number; strongestSkill: { skill: string; score: number }; prioritySkill: { skill: string; score: number }; ratingDelta: number; attempts: number };
    skills: Array<{ skill: string; score: number; percentile: number; peerAverage: number; topPerformer: number; adaptiveWeight: number; forecast: number }>;
    matrices: Array<{ label: string; score: number; percentile: number; weight: number }>;
  }>("/skills"),
  peerComparison: () => dashboardFetch<{
    percentile: number;
    cohorts: Array<{ cohort: string; value: number }>;
    overlays: Array<{ skill: string; you: number; peer: number; top: number }>;
  }>("/peer-comparison"),
  skillProgress: () => dashboardFetch<{ timeline: Array<{ phase: string; profileScore: number; consistency: number; contestHandling: number }> }>("/skill-progress"),
  consistency: () => dashboardFetch<{ consistencyScore: number; activeDays: number; heatmap: Array<{ date: string; count: number }> }>("/consistency"),
  weakAreas: () => dashboardFetch<{
    summary: {
      weakTopicCount: number;
      critical: number;
      highRisk: number;
      confidenceIndex: number;
      retentionIndex: number;
      repeatedErrors: number;
      averageWeakness: number;
    };
    weakTopics: Array<{
      topic: string;
      subject: string;
      chapter: string;
      attempts: number;
      incorrect: number;
      accuracy: number;
      averageTime: number;
      confidence: number;
      revisionGap: number;
      repeatedErrors: number;
      decay: number;
      instability: number;
      weaknessScore: number;
      severity: string;
      retention: number;
      recoveryPriority: number;
    }>;
    timeInefficientTopics: Array<{ topic: string; subject: string; averageTime: number; accuracy: number; confidence: number; weaknessScore: number }>;
    accuracyCollapseZones: Array<{ topic: string; subject: string; accuracy: number; instability: number; weaknessScore: number }>;
    riskMatrix: Array<{ topic: string; subject: string; weakness: number; confidence: number; time: number; decay: number; severity: string }>;
    heatmap: Array<{ date: string; count: number; label: string }>;
    priorityQueue: Array<{ rank: number; topic: string; action: string; score: number; severity: string }>;
    insights: string[];
  }>("/weak-areas"),
  conceptStability: () => dashboardFetch<{
    stability: Array<{ topic: string; stability: number; confidence: number; retention: number; week: string }>;
    confidenceCurve: Array<{ phase: string; confidence: number; retention: number; instability: number }>;
  }>("/concept-stability"),
  revisionRisk: () => dashboardFetch<{
    risks: Array<{ topic: string; subject: string; revisionGap: number; decay: number; retention: number; priority: number }>;
    decayChart: Array<{ topic: string; decay: number; retention: number }>;
  }>("/revision-risk"),
  errorAnalysis: () => dashboardFetch<{
    frequencyMap: Array<{ type: string; count: number }>;
    clusters: Array<{ topic: string; errors: number; repeatedErrors: number; weakness: number; time: number }>;
    repeatedErrors: Array<{ topic: string; subject: string; repeatedErrors: number; weaknessScore: number; confidence: number }>;
  }>("/error-analysis"),
};
