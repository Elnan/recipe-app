import { getRecipe } from '../../../../lib/recipes'
import RecipeDetail from '../../../components/recipes/RecipeDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params

  try {
    const recipe = await getRecipe(id)
    return <RecipeDetail recipe={recipe} />
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <p
          className="text-[13px] text-white/30"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Recipe not found.
        </p>
      </div>
    )
  }
}
