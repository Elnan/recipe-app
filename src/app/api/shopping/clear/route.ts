import { NextResponse } from 'next/server'
import { clearAllItems } from '../../../../../lib/shopping'

export async function POST() {
  try {
    await clearAllItems()
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
