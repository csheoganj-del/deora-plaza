"use client"

import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className
}: PaginationProps) {
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(currentPage - half, 1)
    let end = Math.min(start + maxVisiblePages - 1, totalPages)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1)
    }

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const visiblePages = getVisiblePages()
  const showStartEllipsis = visiblePages[0] > 2
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn("flex items-center justify-center space-x-1", className)}
    >
      {/* First page */}
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          aria-label="Go to first page"
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="h-4 w-4 -ml-2" />
        </Button>
      )}

      {/* Previous page */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* First page number */}
      {showStartEllipsis && (
        <>
          <Button
            variant={1 === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(1)}
            aria-label="Go to page 1"
            aria-current={1 === currentPage ? "page" : undefined}
            className="h-9 w-9"
          >
            1
          </Button>
          <div className="flex items-center justify-center w-9 h-9">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </>
      )}

      {/* Visible page numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(page)}
          aria-label={`Go to page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          className="h-9 w-9"
        >
          {page}
        </Button>
      ))}

      {/* Last page number */}
      {showEndEllipsis && (
        <>
          <div className="flex items-center justify-center w-9 h-9">
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <Button
            variant={totalPages === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(totalPages)}
            aria-label={`Go to page ${totalPages}`}
            aria-current={totalPages === currentPage ? "page" : undefined}
            className="h-9 w-9"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next page */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Last page */}
      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          aria-label="Go to last page"
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -ml-2" />
        </Button>
      )}
    </nav>
  )
}

// Simple pagination info component
export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      Showing {startItem} to {endItem} of {totalItems} results
    </div>
  )
}

// Hook for pagination logic
export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1
}: {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage)
  
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  const goToPage = React.useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }, [totalPages])
  
  const goToNextPage = React.useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])
  
  const goToPreviousPage = React.useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])
  
  const goToFirstPage = React.useCallback(() => {
    goToPage(1)
  }, [goToPage])
  
  const goToLastPage = React.useCallback(() => {
    goToPage(totalPages)
  }, [goToPage, totalPages])
  
  // Reset to first page when total items change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalItems, totalPages, currentPage])
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  
  return {
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  }
}

// Mobile-friendly pagination
export function MobilePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage <= 1}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}