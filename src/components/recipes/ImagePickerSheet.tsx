'use client'

import { useState, useRef } from 'react'
import type { RecipeIconKey } from '../../../lib/recipe-icons'
import { RECIPE_ICON_KEYS, RECIPE_ICON_LABELS, RecipeIcon } from '../../../lib/recipe-icons'

type SheetTab = 'upload' | 'url' | 'icon'

interface ImagePickerSheetProps {
  currentUrl?:   string
  currentIcon?:  RecipeIconKey
  onClose:       () => void
  onPickUrl:     (url: string) => void
  onPickIcon:    (icon: RecipeIconKey) => void
  onPickFile:    (file: File) => Promise<void>
}

export default function ImagePickerSheet({
  currentUrl,
  currentIcon,
  onClose,
  onPickUrl,
  onPickIcon,
  onPickFile,
}: ImagePickerSheetProps) {
  const [tab,        setTab]        = useState<SheetTab>('upload')
  const [urlInput,   setUrlInput]   = useState(currentUrl ?? '')
  const [previewUrl, setPreviewUrl] = useState(currentUrl ?? '')
  const [uploading,  setUploading]  = useState(false)
  const [dragOver,   setDragOver]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select a JPEG, PNG, or WebP image')
      return
    }
    setError(null)
    setUploading(true)
    try {
      await onPickFile(file)
      onClose()
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  function handleUrlConfirm() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    onPickUrl(trimmed)
    onClose()
  }

  function handleIconPick(icon: RecipeIconKey) {
    onPickIcon(icon)
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background:    'var(--color-surface)',
          borderTop:     '1px solid var(--color-border)',
          maxHeight:     '80vh',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        <div className="px-5 pt-2 pb-8 flex flex-col flex-1 min-h-0 overflow-y-auto">

          {/* Title row */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h2
              className="text-[15px] font-semibold"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-geist-sans)' }}
            >
              Change image
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
            >
              ✕
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl p-1 mb-5 shrink-0" style={{ background: 'var(--color-surface)' }}>
            {(['upload', 'url', 'icon'] as SheetTab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null) }}
                className="flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.07em] transition-colors"
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  background: tab === t ? 'var(--color-subtle)' : 'transparent',
                  color:      tab === t ? 'var(--color-text)' : 'var(--color-text-dim)',
                  fontWeight: tab === t ? 600 : 400,
                }}
              >
                {t === 'upload' ? 'Upload' : t === 'url' ? 'URL' : 'Icon'}
              </button>
            ))}
          </div>

          {/* ── Upload tab ── */}
          {tab === 'upload' && (
            <div className="flex flex-col gap-3">
              <div
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors cursor-pointer"
                style={{
                  background: dragOver ? 'rgba(244,162,97,0.04)' : 'transparent',
                  borderColor: dragOver ? 'rgba(244,162,97,0.6)' : 'var(--color-border)',
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
              >
                {uploading ? (
                  <>
                    <div
                      className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'var(--color-border)', borderTopColor: '#f4a261' }}
                    />
                    <p
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                    >
                      Uploading…
                    </p>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p
                      className="text-[12px] text-center"
                      style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-geist-mono)' }}
                    >
                      Drop image here or tap to select
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  style={{ fontSize: 16 }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </div>
              {error && <ErrorNote message={error} />}
            </div>
          )}

          {/* ── URL tab ── */}
          {tab === 'url' && (
            <div className="flex flex-col gap-3">
              <input
                value={urlInput}
                onChange={e => {
                  setUrlInput(e.target.value)
                  setPreviewUrl(e.target.value.trim())
                }}
                onKeyDown={e => e.key === 'Enter' && handleUrlConfirm()}
                placeholder="https://…"
                className="w-full rounded-xl border px-4 py-3 placeholder:text-[color:var(--color-text-dim)] focus:outline-none focus:border-[color:var(--color-border)]"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', fontFamily: 'var(--font-geist-mono)', fontSize: 16 }}
              />

              {previewUrl && (
                <div
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '16/9', background: 'var(--color-subtle)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}

              {error && <ErrorNote message={error} />}

              <button
                onClick={handleUrlConfirm}
                disabled={!urlInput.trim()}
                className="w-full rounded-2xl py-4 text-[13px] font-semibold tracking-[0.04em] text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{ background: '#f4a261', fontFamily: 'var(--font-geist-mono)' }}
              >
                Use this image
              </button>
            </div>
          )}

          {/* ── Icon tab ── */}
          {tab === 'icon' && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-4 gap-2">
                {RECIPE_ICON_KEYS.map(key => {
                  const active = currentIcon === key
                  return (
                    <button
                      key={key}
                      onClick={() => handleIconPick(key)}
                      className="flex flex-col items-center gap-2 rounded-2xl py-4 transition-colors"
                      style={{
                        background:  active ? 'rgba(244,162,97,0.12)' : 'var(--color-subtle)',
                        border:      `1.5px solid ${active ? '#f4a261' : 'var(--color-border)'}`,
                      }}
                    >
                      <RecipeIcon
                        icon={key}
                        color={active ? '#f4a261' : 'var(--color-text-dim)'}
                        size={32}
                      />
                      <span
                        className="text-[9px] uppercase tracking-[0.07em]"
                        style={{
                          fontFamily: 'var(--font-geist-mono)',
                          color: active ? '#f4a261' : 'var(--color-text-dim)',
                        }}
                      >
                        {RECIPE_ICON_LABELS[key]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      className="text-[11px] text-[#e94560]/80 px-1"
      style={{ fontFamily: 'var(--font-geist-mono)' }}
    >
      {message}
    </p>
  )
}
