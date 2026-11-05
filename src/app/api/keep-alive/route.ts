import { NextResponse } from 'next/server'
import { pingDatabase } from '../../../../lib/supabase'

// Supabase pauses free projects after a week without database activity; the
// daily Vercel cron in vercel.json hits this. No CRON_SECRET check on purpose:
// it reads one id and returns nothing, so an outside caller only helps.
export async function GET() {
  try {
    await pingDatabase()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
