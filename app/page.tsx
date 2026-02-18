'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authStorage } from '@/lib/storage'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const user = authStorage.getUsuarioLogado()
    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <div className="ai-thinking">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  )
}
