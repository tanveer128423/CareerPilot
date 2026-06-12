import type {
  AnalysisResult,
  ApiErrorEnvelope,
  MentorGrounding,
  MentorMessage,
  MentorResponse,
  ParseResponse,
  RoleEntry,
  RoleName,
  StructuredResume,
} from "../types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

/** Error thrown for any non-2xx response, carrying the standard envelope. */
export class ApiError extends Error {
  code: string;
  retryable: boolean;
  details: ApiErrorEnvelope["error"]["details"];
  status: number;
  constructor(env: ApiErrorEnvelope["error"], status: number) {
    super(env.message);
    this.name = "ApiError";
    this.code = env.code;
    this.retryable = env.retryable;
    this.details = env.details;
    this.status = status;
  }
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const env = (body as ApiErrorEnvelope).error;
    if (env) throw new ApiError(env, res.status);
    throw new ApiError(
      { code: "INTERNAL_ERROR", message: "Unexpected error.", retryable: true, details: null },
      res.status,
    );
  }
  return body as T;
}

export async function getRoles(): Promise<RoleEntry[]> {
  const res = await fetch(`${BASE_URL}/api/roles`, { headers: { Accept: "application/json" } });
  const data = await parseOrThrow<{ roles: RoleEntry[] }>(res);
  return data.roles;
}

export async function postParse(file: File, targetRole: RoleName): Promise<ParseResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("targetRole", targetRole);
  const res = await fetch(`${BASE_URL}/api/parse`, { method: "POST", body: form });
  return parseOrThrow<ParseResponse>(res);
}

export async function postAnalyze(payload: {
  targetRole: RoleName;
  structuredResume: StructuredResume;
  rawResumeText?: string;
}): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  return parseOrThrow<AnalysisResult>(res);
}

export async function postMentor(payload: {
  question: string;
  history: MentorMessage[];
  grounding: MentorGrounding;
}): Promise<MentorResponse> {
  const res = await fetch(`${BASE_URL}/api/mentor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  return parseOrThrow<MentorResponse>(res);
}
