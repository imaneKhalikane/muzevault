export type Profile = {
  id: string
  email: string
  full_name?: string | null
  is_admin: boolean
}

export type Category = {
  id: string
  name: string
  slug: string
}

export type Prompt = {
  id: string
  title: string
  category_id: string
  tags: string[]
  image_url: string
  image_prompt: string
  motion_prompt: string
  created_at: string
  category?: Category
}
