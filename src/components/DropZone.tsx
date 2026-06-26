"use client";
import { useRef, useState, DragEvent } from "react";

interface DropZoneProps {
  accept: string;
  label: string;
  hint?: string;
  file: File | null;
  onChange: (file: File) => void;
}

export function DropZone({ accept, label, hint, file, onChange }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center ${
        dragging ? "border-blue-500 bg-blue-900/10" : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
      />
      {file ? (
        <span className="text-blue-400 text-xs font-medium truncate max-w-full px-2">{file.name}</span>
      ) : (
        <>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-gray-400 text-xs">{label}</span>
          {hint && <span className="text-gray-600 text-xs">{hint}</span>}
        </>
      )}
    </div>
  );
}
