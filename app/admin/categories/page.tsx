import { createClient } from '@/lib/supabase/server'
import AddCategoryForm from './AddCategoryForm'
import DeleteCategoryButton from './DeleteCategoryButton'

export const dynamic = 'force-dynamic'

export default async function AdminCategories() {
  const supabase = createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-light text-[#3d2535] mb-8">Categories</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-[#fff0eb] border border-[#edddd4] rounded-2xl overflow-hidden">
            {categories && categories.length > 0 ? (
              <ul className="divide-y divide-[#edddd4]/60">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-[#3d2535]">{cat.name}</p>
                      <p className="text-xs text-[#7a5060] mt-0.5">/{cat.slug}</p>
                    </div>
                    <DeleteCategoryButton id={cat.id} name={cat.name} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-[#7a5060]">No categories yet.</div>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-heading text-xl font-light text-[#3d2535] mb-4">Add Category</h2>
          <AddCategoryForm />
        </div>
      </div>
    </div>
  )
}
