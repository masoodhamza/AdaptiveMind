export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of options
  explanation: string;
  bloomType?: string;
  userAnswer?: number; // Added to track for analysis
}

export interface QuizConfig {
  subjects: string[];
  difficulty: number;
  questionCount: number;
  mode: 'practice' | 'quiz';
  fileContext?: {
    data: string; // Base64
    mimeType: string;
  };
}

export interface UserStats {
  uid: string;
  displayName: string;
  totalPoints: number;
  bestScore: number;
  photoURL?: string;
  lastPlayed?: any;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  points: number;
  difficulty: number;
  subjectStr: string;
  createdAt: any;
}

export interface Lobby {
  id: string;
  seed: number;
  config: QuizConfig;
  status: 'waiting' | 'active' | 'finished';
  hostId: string;
  players: {
    uid: string;
    displayName: string;
    photoURL?: string;
    ready: boolean;
    score?: number;
  }[];
  questions?: Question[];
}
