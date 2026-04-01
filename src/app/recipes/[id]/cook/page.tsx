import { getRecipe } from '../../../../../lib/recipes'
import CookingMode from '../../../../components/recipes/CookingMode'

export default async function CookPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ servings?: string }>
}) {
  const { id }       = await params
  const { servings } = await searchParams
  const recipe        = await getRecipe(id)
  const scaledServings = parseInt(servings ?? '') || recipe.servings

  return <CookingMode recipe={recipe} scaledServings={scaledServings} />
}
