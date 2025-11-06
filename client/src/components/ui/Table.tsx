import React from 'react'
import clsx from 'clsx'

interface TableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: any, item: T, index: number) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (item: T, index: number) => void
  sortBy?: keyof T
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: keyof T) => void
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}: TableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (onSort && columns.find(col => col.key === key)?.sortable) {
      onSort(key)
    }
  }

  const renderSortIcon = (key: keyof T) => {
    if (!columns.find(col => col.key === key)?.sortable) {
      return null
    }

    if (sortBy !== key) {
      return (
        <svg
          className="inline-block w-4 h-4 ml-1 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5 12l5-5 5 5H5z" />
        </svg>
      )
    }

    return (
      <svg
        className="inline-block w-4 h-4 ml-1 text-primary-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        {sortOrder === 'asc' ? (
          <path d="M5 12l5-5 5 5H5z" />
        ) : (
          <path d="M15 8l-5 5-5-5h10z" />
        )}
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="min-w-full divide-y divide-gray-300">
          <div className="bg-gray-50 px-6 py-3">
            <div className="skeleton h-4 w-1/4" />
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg', className)}>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={clsx(
                  'table-header-cell',
                  column.sortable && 'cursor-pointer hover:bg-gray-100',
                  column.className
                )}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center">
                  {column.title}
                  {renderSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className={clsx(
                  'table-row',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={clsx('table-cell', column.className)}
                  >
                    {column.render
                      ? column.render(item[column.key], item, index)
                      : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table