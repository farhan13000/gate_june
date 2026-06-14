export interface HomeProblemOption {
  _id: string;
  text: string;
}

export interface HomeProblemOfTheDay {
  _id: string;
  contentId?: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;
  questionType: "MCQ" | "MSQ" | "NAT" | "PROOF";
  options?: HomeProblemOption[];
  imageUrl?: string;
}

export interface HomeContest {
  _id: string;
  month: string;
  day: string;
  title: string;
  meta: string;
  countdown: string;
  startTime: string;
  endTime: string;
}

export interface HomeAnnouncement {
  _id: string;
  title: string;
  link?: string;
  date: string;
  isNew: boolean;
}

export interface HomeStats {
  problems: number;
  theories: number;
  contests: number;
  users: number;
}

export interface HomeData {
  problemOfTheDay: HomeProblemOfTheDay | null;
  contests: HomeContest[];
  importantAnnouncements: HomeAnnouncement[];
  recentAnnouncements: HomeAnnouncement[];
  stats: HomeStats;
  fetchedAt: string;
}
