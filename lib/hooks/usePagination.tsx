"use client"
import { useState, useMemo, useEffect } from "react"

export function usePagination<T>(items: T[], pageSize = 50) {
  const [page, setPage] = useState(1)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((items?.length || 0) / pageSize))
  }, [items, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [items, totalPages])

  const paginated = useMemo(() => {
    if (!items) return [] as T[]
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return { page, setPage, totalPages, paginated }
}

export default usePagination
