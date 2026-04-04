'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ShareReceiver() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const text = searchParams.get('text') ?? ''
    if (text) {
      sessionStorage.setItem('import:prefill', text)
    }
    router.replace('/recipes')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <span
        className="text-[11px] text-white/20"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Opening…
      </span>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareReceiver />
    </Suspense>
  )
}
