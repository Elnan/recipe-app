import { NextRequest, NextResponse } from 'next/server'
import { uploadRecipeImage } from '../../../../../../lib/storage'
import { updateRecipe } from '../../../../../../lib/recipes'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing required field: file' }, { status: 400 })
  }

  try {
    const image_url = await uploadRecipeImage(file, id)
    await updateRecipe(id, { image_url })
    return NextResponse.json({ image_url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
