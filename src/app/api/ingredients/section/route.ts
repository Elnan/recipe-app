import { NextResponse } from 'next/server'
import { saveIngredientSection } from '../../../../../lib/store-sections'
import type { StoreSection } from '../../../../../lib/store-sections'

export async function POST(req: Request) {
  const { name, section } = await req.json() as { name: string; section: StoreSection }
  await saveIngredientSection(name, section)
  return NextResponse.json({ ok: true })
}
