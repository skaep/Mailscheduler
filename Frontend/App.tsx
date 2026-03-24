import { useState, useEffect } from 'react'
import { ScheduleList } from './ScheduleList'
import { ScheduleModal } from './ScheduleModal'
import type { Schedule, Recipients } from './types'
import LoginForm from './components/LoginForm'
import { useAuth } from './AuthProvider'


export default function App() {
  const { isLoggedIn, logout, token } = useAuth()
  const [schedules, setShedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [recipients, setRecipients] = useState<Recipients[]>([])
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  console.log(apiBaseUrl)
  // Fetch schedules
  useEffect(() => {
    if (!isLoggedIn || !token) return
    setLoading(true)
    fetch(`${apiBaseUrl}/schedules`, {  // <-- Prepend `/api` to all API paths
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch schedules')
        return res.json()
      })
      .then((data: Schedule[]) => {
        setShedules(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [isLoggedIn, token])

  // Fetch recipients
  useEffect(() => {
    if (!isLoggedIn || !token) return
    const fetchRecipients = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/recipients`, {  // <-- Prepend `/api`
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setRecipients(data);
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };
    fetchRecipients();
  }, [isLoggedIn, token])

  const handleEdit = (schedule: Schedule) => {
    setEditing(schedule);
  };

  const handleSave = async (schedule: Schedule) => {
    if (!token) return
    const isNew = !schedules.find((s) => s.id === schedule.id)
    try {
      const res = await fetch(
        `${apiBaseUrl}/schedules${isNew ? '' : '/' + schedule.id}`,  // <-- Prepend `/api`
        {
          method: isNew ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(schedule),
        }
      )
      if (!res.ok) throw new Error('Failed to save schedule')
      const savedSchedule = await res.json()
      setShedules((prev) =>
        isNew
          ? [...prev, savedSchedule]
          : prev.map((s) => (s.id === savedSchedule.id ? savedSchedule : s))
      )
      setEditing(null)
    } catch (err) {
      alert('Error saving Schedule: ' + (err as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    if (!window.confirm('Are you sure you want to delete this schedule?')) return
    try {
      const res = await fetch(`${apiBaseUrl}/schedules/${id}`, {  // <-- Prepend `/api`
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete schedule')
      setShedules((prev) => prev.filter((s) => s.id !== id))
      setEditing(null)
    } catch (err) {
      alert('Error deleting schedule: ' + (err as Error).message)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (!token) return
    if (!window.confirm(`Delete ${ids.length} schedule(s)?`)) return
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`${apiBaseUrl}/schedules/${id}`, {  // <-- Prepend `/api`
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to delete schedule ${id}`)
          })
        )
      )
      setShedules((prev) => prev.filter((s) => !ids.includes(s.id)))
    } catch (err) {
      alert('Error deleting schedules: ' + (err as Error).message)
    }
  }

  if (!isLoggedIn) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Mail Scheduler</h1>
        <button
          onClick={logout}
          className="text-blue-600 underline hover:text-blue-800"
        >
          Log out
        </button>
      </div>

      {loading && <p>Loading Schedules...</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {!loading && !error && (
        <ScheduleList
          schedules={schedules}
          onEdit={handleEdit}
          onBulkDelete={handleBulkDelete}
          recipients={recipients}
        />
      )}

      {editing && (
        <ScheduleModal
          schedule={editing}
          recipients={recipients}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
