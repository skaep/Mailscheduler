import React, { useState, useEffect, useRef } from 'react'
import type { Schedule, Recipients } from './types'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  recipients: Recipients[] // Removed `?` since it's required
  schedule?: Schedule
  onSave: (schedule: Schedule) => void
  onClose: () => void
  onDelete: (id: string) => void
}

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const occurrences = ['First', 'Second', 'Third', 'Fourth', 'Last']
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const ScheduleModal: React.FC<Props> = ({ recipients, schedule, onSave, onClose, onDelete }) => {
  const [form, setForm] = useState<Schedule>(
    schedule || {
      id: uuidv4(),
      name: '',
      description: '',
      last_update: '',
      next_update: '',
      schedule_months: [],
      schedule_occurrence: 'First',
      schedule_day: 'Monday',
      schedule_time: '',
      recipientemail: '',
    }
  )
  const modalRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Auto-resize textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto'
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`
    }
  }, [form.description])

  // Update form when schedule prop changes
  useEffect(() => {
    if (schedule) {
      setForm({
        ...schedule,
        schedule_months: schedule.schedule_months || [],
        next_update: schedule.next_update ?? '',
        last_update: schedule.last_update ?? '',
      })
    }
  }, [schedule])

  // Calculate next_update whenever schedule config changes
  useEffect(() => {
    if (form.schedule_months.length && form.schedule_time && form.schedule_day && form.schedule_occurrence) {
      const calculated = generateNextUpdateTimestamp({
        months: form.schedule_months,
        day: form.schedule_day,
        occurrence: form.schedule_occurrence,
        time: form.schedule_time,
      })
      setForm((f) => ({ ...f, next_update: calculated }))
    }
  }, [form.schedule_months, form.schedule_day, form.schedule_occurrence, form.schedule_time])

  const canSave = form.name.trim() !== '' && form.next_update?.toString().trim() !== ''

  const toggleMonth = (month: string) => {
    setForm((prev) => ({
      ...prev,
      schedule_months: prev.schedule_months.includes(month)
        ? prev.schedule_months.filter((m) => m !== month)
        : [...prev.schedule_months, month]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-xl" ref={modalRef}>
        <h2 className="text-xl font-semibold mb-4">{schedule ? 'Edit' : 'Add'} Schedule</h2>

        {/* Schedule Name */}
        <label className="block mb-2 font-medium">Schedule Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mb-4 border px-3 py-2 rounded"
        />
        {form.name.trim() === '' && (
          <p className="text-red-600 text-sm mt-1">Schedule name is required.</p>
        )}

        {/* Description */}
        <label className="block mb-2 font-medium">Description</label>
        <textarea
          ref={descriptionRef}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full mb-4 border px-3 py-2 rounded resize-none overflow-hidden"
          rows={1}
        />

        {/* Recipient Dropdown */}
        <label className="block mb-2 font-medium">Recipient</label>
        <select
          value={form.recipientemail}
          onChange={(e) => setForm({ ...form, recipientemail: e.target.value })}
          className="w-full mb-4 border px-3 py-2 rounded"
          disabled={!recipients.length}
        >
          <option value="">Select a recipient</option>
          {recipients.map((recipient) => (
            <option key={recipient.email} value={recipient.email}>
              {recipient.name || recipient.email}
            </option>
          ))}
        </select>
        {!recipients.length && (
          <p className="text-sm text-gray-500 mb-4">No recipients available.</p>
        )}

        {/* Last Update */}
        <label className="block mb-2 font-medium">Last Update</label>
        <input
          type="datetime-local"
          value={form.last_update || ''}
          readOnly
          className="w-full mb-4 border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
        />

        {/* Schedule Configuration */}
        <label className="block mb-2 font-medium">Schedule</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {monthsList.map((month) => (
            <label key={month} className="flex items-center">
              <input
                type="checkbox"
                checked={form.schedule_months.includes(month)}
                onChange={() => toggleMonth(month)}
                className="mr-2"
              />
              {month}
            </label>
          ))}
        </div>

        <div className="flex gap-4 mb-4">
          <select
            value={form.schedule_occurrence}
            onChange={(e) => setForm({ ...form, schedule_occurrence: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            {occurrences.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={form.schedule_day}
            onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            {weekdays.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            type="time"
            value={form.schedule_time || ''}
            onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
            className="border px-3 py-2 rounded"
          />
        </div>

        {/* Next Update Preview */}
        <div className="text-sm mb-4 text-gray-600">
          <strong>Next Update:</strong> {form.next_update ? new Date(form.next_update).toLocaleString() : 'Not set'}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${canSave ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
          >
            Save
          </button>
        </div>

        {/* Delete Button (for existing schedules) */}
        {schedule && (
          <button
            className="mt-4 text-red-600 hover:underline"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this schedule?')) {
                onDelete(schedule.id)
              }
            }}
          >
            Delete this schedule?
          </button>
        )}
      </div>
    </div>
  )
}

// Helper function to calculate next update timestamp
function generateNextUpdateTimestamp(schedule: {
  months: string[]
  occurrence: string
  day: string
  time: string
}): string {
  if (!schedule.months.length || !schedule.time) return ''

  const weekdayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }

  const occurrenceMap: Record<string, number> = {
    First: 1,
    Second: 2,
    Third: 3,
    Fourth: 4,
    Last: -1,
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const [hours, minutes] = schedule.time.split(':').map(Number)

  const monthNumbers = schedule.months.map(
    (m) => new Date(Date.parse(m + ' 1, 2020')).getMonth()
  )

  let candidateDates: Date[] = []

  for (const monthNum of monthNumbers) {
    const weekdayNum = weekdayMap[schedule.day]
    const weekNum = occurrenceMap[schedule.occurrence]
    const daysInMonth = new Date(currentYear, monthNum + 1, 0).getDate()
    let matchingDays: number[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, monthNum, day)
      if (d.getDay() === weekdayNum) {
        matchingDays.push(day)
      }
    }

    let targetDay: number
    if (weekNum === -1) {
      targetDay = matchingDays[matchingDays.length - 1]
    } else {
      targetDay = matchingDays[weekNum - 1]
    }

    let date = new Date(currentYear, monthNum, targetDay, hours, minutes)
    if (date <= now) {
      date = new Date(currentYear + 1, monthNum, targetDay, hours, minutes)
    }
    candidateDates.push(date)
  }

  candidateDates.sort((a, b) => a.getTime() - b.getTime())
  return candidateDates[0].toISOString()
}
