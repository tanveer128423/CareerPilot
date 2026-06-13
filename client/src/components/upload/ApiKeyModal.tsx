import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronDown, ExternalLink, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "../common/Button";
import { ApiError, postValidateKey } from "../../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onContinue: (apiKey: string) => void;
  initialKey?: string;
  /** When true, the server already has a key — allow proceeding without one. */
  allowSkip?: boolean;
  onSkip?: () => void;
}

export function ApiKeyModal({ open, onClose, onContinue, initialKey = "", allowSkip = false, onSkip }: Props) {
  const [key, setKey] = useState(initialKey);
  const [show, setShow] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const trimmed = key.trim();

  const submit = async () => {
    if (!trimmed || verifying) return;
    setKeyError(null);
    setVerifying(true);
    try {
      const { valid, reason } = await postValidateKey(trimmed);
      if (!valid) {
        setKeyError(reason ?? "That API key was rejected. Please check it and try again.");
        return;
      }
      onContinue(trimmed);
    } catch (err) {
      const e = err as ApiError;
      setKeyError(
        e?.message ?? "Couldn't verify your key right now. Please try again.",
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="API key entry dialog"
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
                    <KeyRound size={18} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-ink">Add your Gemini API key</h2>
                    <p className="text-xs text-ink-muted">Powers your AI analysis & Career Mentor</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label htmlFor="gemini-key" className="block text-sm font-medium text-ink mb-1.5">
                    Gemini API key
                  </label>
                  <div className="relative">
                    <input
                      id="gemini-key"
                      type={show ? "text" : "password"}
                      value={key}
                      onChange={(e) => {
                        setKey(e.target.value);
                        if (keyError) setKeyError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && void submit()}
                      disabled={verifying}
                      placeholder="AIza…"
                      autoComplete="off"
                      className="w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                      aria-label={show ? "Hide key" : "Show key"}
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
                    <ShieldCheck size={13} className="text-success" />
                    Used only for your requests. Never stored on our servers.
                  </p>
                  {keyError && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-danger">
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      {keyError}
                    </p>
                  )}
                </div>

                {/* Help section */}
                <div className="rounded-xl border border-black/[0.06] bg-surface-2/60">
                  <button
                    type="button"
                    onClick={() => setHelpOpen((h) => !h)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-ink"
                  >
                    How do I get an API key?
                    <ChevronDown size={16} className={`transition-transform ${helpOpen ? "rotate-180" : ""}`} />
                  </button>
                  {helpOpen && (
                    <div className="px-3 pb-3 text-sm text-ink-soft space-y-2">
                      <ol className="list-decimal list-inside space-y-1.5">
                        <li>
                          Go to{" "}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                          >
                            aistudio.google.com/app/apikey <ExternalLink size={12} />
                          </a>
                        </li>
                        <li>Sign in with your Google account.</li>
                        <li>
                          Click <span className="font-medium">“Create API key”</span> (it's free).
                        </li>
                        <li>Copy the key and paste it above.</li>
                      </ol>
                      <p className="text-xs text-ink-muted">
                        The free tier is plenty for analyzing your resume and chatting with the mentor. Your key stays in your browser.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button className="flex-1" disabled={!trimmed || verifying} onClick={() => void submit()}>
                    {verifying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Verifying…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
                {allowSkip && onSkip && (
                  <button
                    onClick={onSkip}
                    className="w-full text-center text-xs text-ink-muted hover:text-ink"
                  >
                    Skip — a key is already configured on the server
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ApiKeyModal;
