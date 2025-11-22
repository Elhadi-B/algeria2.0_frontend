// API Data Models

export interface Team {
  num_equipe: string;
  nom_equipe: string;
}

export interface Judge {
  id: number;
  name: string;
  image: string | null;
  image_path: string;
  image_url: string | null;
  organization: string;
  email: string;
  phone: string;
  token: string; // UUID - shown only in detail/create
  token_display: string; // Masked in list view
  active: boolean;
  created_at: string; // ISO 8601
}

export interface JudgeBasic {
  id: number;
  name: string;
  email: string;
  organization: string;
  phone: string;
  token: string;
  token_display: string;
  active: boolean;
  created_at: string;
}

export interface TeamBasic {
  num_equipe: string;
  nom_equipe: string;
}

export interface Criterion {
  id: number;
  key: string;
  name: string;
  description: string;
  weight: number; // 0.0 to 1.0
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCriterionRequest {
  name: string;
  description: string;
  weight: number;
  order?: number;
}

export interface UpdateCriterionRequest {
  name?: string;
  description?: string;
  weight?: number;
  order?: number;
}

export interface CriterionScore {
  score: number; // 0-10
  note?: string;
}

export interface Evaluation {
  id: number;
  team: TeamBasic;
  judge: number;
  judge_name: string;
  scores: {
    [criterionKey: string]: CriterionScore;
  };
  total: string; // Decimal as string
  general_comment: string;
  updated_at: string;
}

export interface RankingItem {
  num_equipe: string;
  nom_equipe: string;
  average_score: string; // Decimal as string
  total_evaluations: number;
  rank?: number; // Rank with tie handling
  criterion_breakdown: {
    [criterionName: string]: {
      average: number;
      count: number;
    };
  };
}

export interface CreateTeamRequest {
  num_equipe: string;
  nom_equipe: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {}

export interface CreateJudgeRequest {
  name: string;
  email: string;
  organization: string;
  phone: string;
  image_path?: string;
  image?: File; // For multipart upload
}

export interface UpdateJudgeRequest extends Partial<CreateJudgeRequest> {}

export interface JudgeLoginRequest {
  token: string;
}

export interface JudgeLoginResponse {
  judge: JudgeBasic;
  message: string;
}

export interface SubmitScoreRequest {
  team_id: string;
  scores: {
    [criterionKey: string]: CriterionScore;
  };
  general_comment?: string;
}

export interface SubmitScoreResponse {
  message: string;
  evaluation: {
    team_id: string;
    total: string;
    scores: {
      [criterionKey: string]: CriterionScore;
    };
    general_comment: string;
  };
}

export interface CSVUploadRequest {
  file: File;
  commit: boolean;
}

export interface CSVUploadPreviewResponse {
  preview_rows: any[];
  total_rows: number;
  errors: string[];
  warnings?: string[];
  commit: false;
  message?: string;
}

export interface CSVUploadCommitResponse {
  message: string;
  created: Array<{ num_equipe: string; nom_equipe: string }>;
  errors: string[];
  warnings?: string[];
}

export interface RegenerateTokenResponse {
  judge_id: number;
  token: string;
  login_link?: string;
  message: string;
}

export interface CreateJudgeResponse {
  judge: Judge;
  token?: string;
  login_link?: string;
  message: string;
}

export interface WebSocketMessage {
  type: "initial_ranking" | "ranking_update" | "get_ranking";
  ranking?: RankingItem[];
  judge_id?: number;
  team_id?: string;
  total?: number;
}

export interface ApiError {
  error?: string;
  detail?: string;
  [field: string]: any; // For validation errors
}

