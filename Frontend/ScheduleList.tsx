// ScheduleList.tsx
import React, { useState } from 'react'
import type { Schedule, Recipients } from './types'

interface ScheduleListProps {
  schedules: Schedule[]
  recipients: Recipients[]
  onEdit: (schedule: Schedule) => void
  onBulkDelete: (ids: string[]) => void
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  onEdit,
  onBulkDelete,
}) => {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredSchedules = schedules.filter((s) => {
    const searchLower = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(searchLower) ||
      (s.recipientemail && s.recipientemail.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Schedules</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() =>
            onEdit({
              id: '',
              name: '',
              description: '',
              last_update: '',
              next_update: '',
              schedule_months: [],
              schedule_occurrence: 'First',
              schedule_day: 'Monday',
              schedule_time: '',
              recipientemail: '',
            })
          }
        >
          Add Schedule
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by Schedule name or Recipient email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 border px-3 py-2 rounded w-full max-w-md"
      />

      {selectedIds.length > 0 && (
        <button
          className="mb-2 bg-red-600 text-white px-4 py-2 rounded"
          onClick={() => onBulkDelete(selectedIds)}
        >
          Delete selected ({selectedIds.length})
        </button>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-2 py-2 border-b w-8"></th>
              <th className="px-4 py-2 border-b">Schedule Name</th>
              <th className="px-4 py-2 border-b">Recipient</th>
              <th className="px-4 py-2 border-b">Last Run</th>
              <th className="px-4 py-2 border-b">Next Run</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-blue-50">
                <td className="px-2 py-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(schedule.id)}
                    onChange={() => toggleSelect(schedule.id)}
                  />
                </td>
                <td
                  className="px-4 py-2 border-b font-medium cursor-pointer"
                  onClick={() => onEdit(schedule)}
                >
                  {schedule.name}
                </td>
                <td
                  className="px-4 py-2 border-b font-medium cursor-pointer"
                  onClick={() => onEdit(schedule)}
                >
                  {schedule.recipientemail}
                </td>
                <td
                  className="px-4 py-2 border-b text-gray-700 cursor-pointer"
                  onClick={() => onEdit(schedule)}
                >
                  {schedule.last_update ? new Date(schedule.last_update).toLocaleString() : ''}
                </td>
                <td
                  className="px-4 py-2 border-b text-gray-700 cursor-pointer"
                  onClick={() => onEdit(schedule)}
                >
                  {schedule.next_update ? new Date(schedule.next_update).toLocaleString() : ''}
                </td>
              </tr>
            ))}
            {filteredSchedules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                  {search ? 'No matching schedules found.' : 'No schedules found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
