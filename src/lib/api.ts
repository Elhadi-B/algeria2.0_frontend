import type {
  Team,
  Judge,
  JudgeBasic,
  TeamBasic,
  Evaluation,
  RankingItem,
  Criterion,
  CreateTeamRequest,
  UpdateTeamRequest,
  CreateJudgeRequest,
  UpdateJudgeRequest,
  CreateCriterionRequest,
  UpdateCriterionRequest,
  JudgeLoginRequest,
  JudgeLoginResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
  CSVUploadRequest,
  CSVUploadPreviewResponse,
  CSVUploadCommitResponse,
  RegenerateTokenResponse,
  CreateJudgeResponse,
  ApiError,
} from "./types";

const runtimeOrigin =
  typeof window !== "undefined" ? window.location.origin : undefined;

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  (runtimeOrigin ? `${runtimeOrigin}/api` : "http://localhost:8000/api");

// Helper function to get CSRF token from cookies
const getCsrfToken = (): string | null => {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken") {
      return value;
    }
  }
  return null;
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    let errorData: ApiError;
    try {
      if (contentType?.includes("application/json")) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        errorData = { error: text || `HTTP ${response.status}` };
      }
    } catch (parseError) {
      errorData = { 
        error: `HTTP ${response.status}: ${response.statusText || "Unknown error"}` 
      };
    }
    throw errorData;
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  if (contentType?.includes("application/json")) {
    const data = await response.json();
    
    // Handle Django REST Framework paginated responses
    // If the response has 'results', 'count', 'next', 'previous' structure, extract 'results'
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results as T;
    }
    
    return data;
  }

  // Handle CSV export
  if (contentType?.includes("text/csv")) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = response.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || "export.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return {} as T;
  }

  return response.text() as unknown as T;
}

// Wrapper to handle network errors
async function fetchWithErrorHandling(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error: any) {
    // Network error (CORS, connection refused, etc.)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw {
        error: `Network error: Unable to connect to ${url}. Make sure the backend server is running at http://localhost:8000`,
        detail: error.message,
      } as ApiError;
    }
    throw error;
  }
}

// Helper function to get judge token from localStorage
const getJudgeToken = (): string | null => {
  return localStorage.getItem("judgeToken");
};

// Helper function to create request options
function createRequestOptions(
  method: string,
  body?: any,
  useFormData: boolean = false,
  useToken: boolean = false
): RequestInit {
  const options: RequestInit = {
    method,
    credentials: "include", // Include cookies for Django session auth
  };

  const headers: HeadersInit = {};

  // Add CSRF token if available (for POST/PUT/PATCH/DELETE)
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  // Add judge token if needed
  if (useToken) {
    const token = getJudgeToken();
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }
  }

  // Set content type and body
  if (body) {
    if (useFormData) {
      options.body = body; // FormData sets its own Content-Type with boundary
    } else {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
  }

  options.headers = headers;
  return options;
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Fetch CSRF token from backend
 */
export async function fetchCsrfToken(): Promise<void> {
  try {
    await fetchWithErrorHandling(`${API_BASE_URL}/csrf/`, {
      method: "GET",
      credentials: "include",
    });
  } catch (error) {
    console.warn("Failed to prefetch CSRF token", error);
  }
}

/**
 * Admin: Login with username and password
 * Sets session cookie automatically for subsequent authenticated requests
 */
// export async function adminLogin(username: string, password: string): Promise<{
//   message: string;
//   user: {
//     id: number;
//     username: string;
//     email: string;
//     is_staff: boolean;
//   };
// }> {
//   // Fetch CSRF token first
//   await fetchCsrfToken();
  
//   const response = await fetchWithErrorHandling(
//     `${API_BASE_URL}/admin/login/`,
//     createRequestOptions("POST", { username, password })
//   );
//   return handleResponse<{
//     message: string;
//     user: {
//       id: number;
//       username: string;
//       email: string;
//       is_staff: boolean;
//     };
//   }>(response);
// }

export async function adminLogin(username: string, password: string) {
  // Ensure CSRF cookie is set before attempting login
  await fetchCsrfToken();

  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/login/`,
    createRequestOptions("POST", { username, password })
  );

  return handleResponse<{
    message: string;
    user: {
      id: number;
      username: string;
      email: string;
      is_staff: boolean;
    };
  }>(response);
}


/**
 * Admin: Logout
 * Clears the session cookie
 */
export async function adminLogout(): Promise<void> {
  try {
    await fetch(
      `${API_BASE_URL}/admin/logout/`,
      createRequestOptions("POST")
    );
  } catch (error) {
    console.error("Logout error:", error);
  }
}

/**
 * Admin: List all teams
 */
export async function adminListTeams(): Promise<Team[]> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/teams/`,
    createRequestOptions("GET")
  );
  return handleResponse<Team[]>(response);
}

/**
 * Admin: Get team details
 */
export async function adminGetTeam(id: number): Promise<Team> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/teams/${id}/`,
    createRequestOptions("GET")
  );
  const data = await handleResponse<Team>(response);
  return data;
}

/**
 * Admin: Create team
 */
export async function adminCreateTeam(data: CreateTeamRequest): Promise<Team> {
  const formData = new FormData();
  formData.append("project_name", data.project_name);
  formData.append("short_description", data.short_description);
  formData.append("members", data.members);
  
  // Add optional team leader fields
  if (data.team_leader_name) formData.append("team_leader_name", data.team_leader_name);
  if (data.team_leader_year) formData.append("team_leader_year", data.team_leader_year);
  if (data.team_leader_email) formData.append("team_leader_email", data.team_leader_email);
  if (data.team_leader_phone) formData.append("team_leader_phone", data.team_leader_phone);
  if (data.project_domain) formData.append("project_domain", data.project_domain);
  
  if (data.extra_info) {
    formData.append("extra_info", JSON.stringify(data.extra_info));
  }
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/teams/`,
    createRequestOptions("POST", formData, true)
  );
  return handleResponse<Team>(response);
}

/**
 * Admin: Update team
 */
export async function adminUpdateTeam(
  id: number,
  data: UpdateTeamRequest
): Promise<Team> {
  const formData = new FormData();
  if (data.project_name) formData.append("project_name", data.project_name);
  if (data.short_description) formData.append("short_description", data.short_description);
  if (data.members) formData.append("members", data.members);
  
  // Add optional team leader fields
  if (data.team_leader_name !== undefined) formData.append("team_leader_name", data.team_leader_name);
  if (data.team_leader_year !== undefined) formData.append("team_leader_year", data.team_leader_year);
  if (data.team_leader_email !== undefined) formData.append("team_leader_email", data.team_leader_email);
  if (data.team_leader_phone !== undefined) formData.append("team_leader_phone", data.team_leader_phone);
  if (data.project_domain !== undefined) formData.append("project_domain", data.project_domain);
  
  if (data.extra_info) {
    formData.append("extra_info", JSON.stringify(data.extra_info));
  }
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/teams/${id}/`,
    createRequestOptions("PATCH", formData, true)
  );
  return handleResponse<Team>(response);
}

/**
 * Admin: Delete team
 */
export async function adminDeleteTeam(id: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/teams/${id}/`,
    createRequestOptions("DELETE")
  );
  return handleResponse<void>(response);
}

/**
 * Admin: Upload teams from CSV
 */
export async function adminUploadTeamsCSV(
  data: CSVUploadRequest
): Promise<CSVUploadPreviewResponse | CSVUploadCommitResponse> {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("commit", data.commit.toString());

  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/upload-teams/`,
    createRequestOptions("POST", formData, true)
  );
  return handleResponse<CSVUploadPreviewResponse | CSVUploadCommitResponse>(response);
}

/**
 * Admin: List all judges
 */
export async function adminListJudges(): Promise<Judge[]> {
  const response = await fetch(
    `${API_BASE_URL}/admin/judges/`,
    createRequestOptions("GET")
  );
  return handleResponse<Judge[]>(response);
}

/**
 * Admin: Get judge details
 */
export async function adminGetJudge(id: number): Promise<Judge> {
  const response = await fetch(
    `${API_BASE_URL}/admin/judges/${id}/`,
    createRequestOptions("GET")
  );
  return handleResponse<Judge>(response);
}

/**
 * Admin: Create judge
 */
export async function adminCreateJudge(data: CreateJudgeRequest): Promise<CreateJudgeResponse> {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("email", data.email);
  formData.append("organization", data.organization);
  formData.append("phone", data.phone);
  const response = await fetch(
    `${API_BASE_URL}/admin/create-judge/`,
    createRequestOptions("POST", formData, true)
  );
  return handleResponse<CreateJudgeResponse>(response);
}

/**
 * Admin: Create judge (alternative endpoint using ViewSet)
 */
export async function adminCreateJudgeViewSet(data: CreateJudgeRequest): Promise<Judge> {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("email", data.email);
  formData.append("organization", data.organization);
  formData.append("phone", data.phone);
  const response = await fetch(
    `${API_BASE_URL}/admin/judges/`,
    createRequestOptions("POST", formData, true)
  );
  return handleResponse<Judge>(response);
}

/**
 * Admin: Update judge
 */
export async function adminUpdateJudge(
  id: number,
  data: UpdateJudgeRequest
): Promise<Judge> {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.email) formData.append("email", data.email);
  if (data.organization) formData.append("organization", data.organization);
  if (data.phone) formData.append("phone", data.phone);
  const response = await fetch(
    `${API_BASE_URL}/admin/judges/${id}/`,
    createRequestOptions("PATCH", formData, true)
  );
  return handleResponse<Judge>(response);
}

/**
 * Admin: Delete judge
 */
export async function adminDeleteJudge(id: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/judges/${id}/`,
    createRequestOptions("DELETE")
  );
  return handleResponse<void>(response);
}

/**
 * Admin: Regenerate judge token (ViewSet action)
 */
export async function adminRegenerateToken(id: number): Promise<RegenerateTokenResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/judges/${id}/regenerate_token/`,
    createRequestOptions("POST")
  );
  return handleResponse<RegenerateTokenResponse>(response);
}

/**
 * Admin: Regenerate judge token (alternative endpoint)
 */
export async function adminRegenerateTokenAlt(judgeId: number): Promise<RegenerateTokenResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/regenerate-token/${judgeId}/`,
    createRequestOptions("POST")
  );
  return handleResponse<RegenerateTokenResponse>(response);
}

/**
 * Admin: Get ranking
 */
export async function adminGetRanking(
  criterion?: string,
  judgeId?: number
): Promise<RankingItem[]> {
  const params = new URLSearchParams();
  if (criterion) params.append("criterion", criterion);
  if (judgeId) params.append("judge", judgeId.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/admin/ranking/${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, createRequestOptions("GET"));
  return handleResponse<RankingItem[]>(response);
}

/**
 * Admin: Export results as CSV
 */
export async function adminExportCSV(): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admin/export/csv/`,
    createRequestOptions("GET")
  );
  return handleResponse<void>(response);
}

/**
 * Admin: Export results as PDF
 */
export async function adminExportPDF(): Promise<{ message: string; csv_endpoint: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/export/pdf/`,
    createRequestOptions("GET")
  );
  return handleResponse<{ message: string; csv_endpoint: string }>(response);
}

/**
 * Admin: List all evaluations
 */
export async function adminListEvaluations(): Promise<Evaluation[]> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/evaluations/`,
    createRequestOptions("GET")
  );
  return handleResponse<Evaluation[]>(response);
}

// ==================== CRITERIA ENDPOINTS ====================

/**
 * Admin: List all criteria
 */
export async function adminListCriteria(): Promise<Criterion[]> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/criteria/`,
    createRequestOptions("GET")
  );
  return handleResponse<Criterion[]>(response);
}

/**
 * Admin: Get criterion details
 */
export async function adminGetCriterion(id: number): Promise<Criterion> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/criteria/${id}/`,
    createRequestOptions("GET")
  );
  return handleResponse<Criterion>(response);
}

/**
 * Admin: Create criterion
 */
export async function adminCreateCriterion(data: CreateCriterionRequest): Promise<Criterion> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/criteria/`,
    createRequestOptions("POST", data)
  );
  return handleResponse<Criterion>(response);
}

/**
 * Admin: Update criterion (full update)
 */
export async function adminUpdateCriterion(
  id: number,
  data: CreateCriterionRequest
): Promise<Criterion> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/criteria/${id}/`,
    createRequestOptions("PUT", data)
  );
  return handleResponse<Criterion>(response);
}

/**
 * Admin: Partial update criterion (e.g., just weight)
 */
export async function adminPatchCriterion(
  id: number,
  data: UpdateCriterionRequest
): Promise<Criterion> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/criteria/${id}/`,
    createRequestOptions("PATCH", data)
  );
  return handleResponse<Criterion>(response);
}

/**
 * Admin: Delete criterion
 */
export async function adminDeleteCriterion(id: number): Promise<void> {
  const response = await fetchWithErrorHandling(
    `${API_BASE_URL}/admin/criteria/${id}/`,
    createRequestOptions("DELETE")
  );
  return handleResponse<void>(response);
}

// ==================== JUDGE ENDPOINTS ====================

/**
 * Judge: Login with token
 */
export async function judgeLogin(data: JudgeLoginRequest): Promise<JudgeLoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/judge/login/`,
    createRequestOptions("POST", data)
  );
  const result = await handleResponse<JudgeLoginResponse>(response);
  
  // Store token in localStorage
  if (result.judge.token) {
    localStorage.setItem("judgeToken", result.judge.token);
  }
  
  return result;
}

/**
 * Judge: List teams
 */
export async function judgeListTeams(): Promise<TeamBasic[]> {
  const token = getJudgeToken();
  const url = token 
    ? `${API_BASE_URL}/judge/teams/?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/judge/teams/`;

  const response = await fetch(
    url,
    createRequestOptions("GET", undefined, false, true)
  );
  return handleResponse<TeamBasic[]>(response);
}

/**
 * Judge: Get evaluation for a team
 */
export async function judgeGetEvaluation(teamId: number): Promise<Evaluation | { message: string }> {
  const token = getJudgeToken();
  const url = token
    ? `${API_BASE_URL}/judge/evaluation/${teamId}/?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/judge/evaluation/${teamId}/`;

  const response = await fetch(
    url,
    createRequestOptions("GET", undefined, false, true)
  );
  return handleResponse<Evaluation | { message: string }>(response);
}

/**
 * Judge: Submit score
 */
export async function judgeSubmitScore(data: SubmitScoreRequest): Promise<SubmitScoreResponse> {
  const token = getJudgeToken();
  const url = token
    ? `${API_BASE_URL}/judge/submit-score/?token=${encodeURIComponent(token)}`
    : `${API_BASE_URL}/judge/submit-score/`;

  const response = await fetch(
    url,
    createRequestOptions("POST", data, false, true)
  );
  return handleResponse<SubmitScoreResponse>(response);
}

// ==================== WEBSOCKET ====================

/**
 * Create WebSocket connection for ranking updates
 */
export function createRankingWebSocket(
  onMessage: (data: any) => void,
  onOpen?: () => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket("ws://localhost:8000/ws/ranking/");

  ws.onopen = () => {
    // Request initial ranking
    ws.send(JSON.stringify({ type: "get_ranking" }));
    if (onOpen) {
      onOpen();
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  if (onError) {
    ws.onerror = onError;
  }

  if (onClose) {
    ws.onclose = onClose;
  }

  return ws;
}

