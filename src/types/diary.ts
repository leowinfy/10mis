export interface Diary {
  id: number
  title: string
  content: string
  images: string[]
  created_at: string
  updated_at: string
}

export interface CreateDiaryRequest {
  title: string
  content: string
  images?: string[]
}

export interface UpdateDiaryRequest {
  title?: string
  content?: string
  images?: string[]
}