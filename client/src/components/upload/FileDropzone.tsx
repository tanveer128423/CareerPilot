import { useCallback, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { ACCEPTED_EXT, ACCEPTED_TYPES, MAX_FILE_SIZE } from "../../utils/constants";

export function FileDropzone({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const validate = useCallback(
    (f: File): boolean => {
      const okType =
        ACCEPTED_TYPES.includes(f.type) || /\.(pdf|docx)$/i.test(f.name);
      if (!okType) {
        setErr("Please upload a PDF or DOCX file.");
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        setErr("File is larger than 5 MB.");
        return false;
      }
      setErr(null);
      return true;
    },
    [],
  );

  const handle = (f: File | undefined) => {
    if (!f) return;
    if (validate(f)) onFile(f);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragging ? "border-brand-500 bg-brand-500/5" : "border-brand-400/40 hover:border-brand-500 hover:bg-surface-2"
        }`}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-brand-600" />
            <div className="text-left">
              <p className="font-medium text-ink">{file.name}</p>
              <p className="text-xs text-ink-muted">{(file.size / 1024).toFixed(0)} KB · ready</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="ml-2 rounded-full p-1 hover:bg-surface-2"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={40} className="text-brand-500 mb-3" />
            <p className="font-medium text-ink">Drop your resume here, or click to browse</p>
            <p className="text-sm text-ink-muted mt-1">PDF or DOCX · up to 5 MB · processed in memory</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {err && <p className="text-sm text-danger mt-2">{err}</p>}
    </div>
  );
}

export default FileDropzone;
