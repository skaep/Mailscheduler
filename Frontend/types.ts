export interface Schedule {
  id: string
  name: string
  description: string
  last_update: string | null
  next_update: string | null
  schedule_months: string[]
  schedule_occurrence: string
  schedule_day: string
  schedule_time: string
  recipientemail: string
}

export interface Recipients {
  name: string
  email: string
}