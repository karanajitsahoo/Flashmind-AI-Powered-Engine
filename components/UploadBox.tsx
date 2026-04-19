'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadBoxProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export default function UploadBox({ onFile, disabled }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0])
      setDragActive(false)
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
        isDragActive || dragActive
          ? 'border-accent bg-accent/10 scale-[1.01]'
          : 'border-ink hover:border-ink hover:bg-ink/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
            isDragActive ? 'bg-accent text-cream' : 'bg-ink-100 text-ink-500'
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>

        <div>
          <p className="text-ink font-medium text-lg mb-1">
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
          </p>
          <p className="text-ink text-sm">
            or <span className="text-ink font-medium underline underline-offset-2">click to browse</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink">
          <span>PDF only</span>
          <span>·</span>
          <span>Max 10MB</span>
          <span>·</span>
          <span>Text-based PDFs only</span>
        </div>
      </div>
    </div>
  )
}
