import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type {
  AnalysisResult,
  AppStatus,
  MentorMessage,
  RoleName,
  StructuredResume,
} from "../types";

const STORAGE_KEY = "careerpilot:analysis";
const APIKEY_STORAGE = "careerpilot:apikey";

export interface AppState {
  file: File | null;
  fileName: string | null;
  targetRole: RoleName | null;
  apiKey: string;
  structuredResume: StructuredResume | null;
  rawResumeText: string;
  analysisResult: AnalysisResult | null;
  chatHistory: MentorMessage[];
  status: AppStatus;
  error: { code: string; message: string; retryable: boolean } | null;
  /** True when running a key-free sample session (mentor uses canned grounded answers). */
  demoSession: boolean;
}

type Action =
  | { type: "SET_FILE"; file: File | null }
  | { type: "SET_ROLE"; role: RoleName }
  | { type: "SET_API_KEY"; apiKey: string }
  | { type: "SET_DEMO_SESSION"; demo: boolean }
  | { type: "PARSE_START" }
  | { type: "PARSE_SUCCESS"; structuredResume: StructuredResume; rawResumeText: string }
  | { type: "ANALYZE_START" }
  | { type: "ANALYZE_SUCCESS"; analysisResult: AnalysisResult }
  | { type: "SET_ERROR"; error: { code: string; message: string; retryable: boolean } }
  | { type: "ADD_MESSAGE"; message: MentorMessage }
  | { type: "HYDRATE"; analysisResult: AnalysisResult }
  | { type: "RESET" };

const initialState: AppState = {
  file: null,
  fileName: null,
  targetRole: null,
  apiKey: "",
  structuredResume: null,
  rawResumeText: "",
  analysisResult: null,
  chatHistory: [],
  status: "idle",
  error: null,
  demoSession: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_FILE":
      return { ...state, file: action.file, fileName: action.file?.name ?? null, error: null };
    case "SET_ROLE":
      return { ...state, targetRole: action.role, error: null };
    case "SET_API_KEY":
      return { ...state, apiKey: action.apiKey };
    case "SET_DEMO_SESSION":
      return { ...state, demoSession: action.demo };
    case "PARSE_START":
      return { ...state, status: "parsing", error: null };
    case "PARSE_SUCCESS":
      return {
        ...state,
        structuredResume: action.structuredResume,
        rawResumeText: action.rawResumeText,
      };
    case "ANALYZE_START":
      return { ...state, status: "analyzing", error: null };
    case "ANALYZE_SUCCESS":
      return { ...state, status: "ready", analysisResult: action.analysisResult, error: null };
    case "SET_ERROR":
      return { ...state, status: "error", error: action.error };
    case "ADD_MESSAGE":
      return { ...state, chatHistory: [...state.chatHistory, action.message] };
    case "HYDRATE":
      return { ...state, analysisResult: action.analysisResult, status: "ready" };
    case "RESET":
      return { ...initialState, apiKey: state.apiKey };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate analysisResult + apiKey from sessionStorage on first load (demo-safety).
  useEffect(() => {
    try {
      const savedKey = sessionStorage.getItem(APIKEY_STORAGE);
      if (savedKey) dispatch({ type: "SET_API_KEY", apiKey: savedKey });
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", analysisResult: JSON.parse(raw) as AnalysisResult });
    } catch {
      /* ignore */
    }
  }, []);

  // Mirror analysisResult to sessionStorage (and clear on reset).
  useEffect(() => {
    try {
      if (state.analysisResult) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.analysisResult));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [state.analysisResult]);

  // Mirror the API key to sessionStorage so it survives a refresh.
  useEffect(() => {
    try {
      if (state.apiKey) sessionStorage.setItem(APIKEY_STORAGE, state.apiKey);
      else sessionStorage.removeItem(APIKEY_STORAGE);
    } catch {
      /* ignore */
    }
  }, [state.apiKey]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
