"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Glass Table Component
 * Premium frosted glass table with hover effects
 */
export function GlassTable({ children, className = "" }: GlassTableProps) {
  return (
    <div className={`glass-table-container ${className}`}>
      <div className="glass-table">
        {children}
      </div>
    </div>
  );
}

interface GlassFilterBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Glass Filter Bar
 * Frosted glass filter controls
 */
export function GlassFilterBar({ children, className = "" }: GlassFilterBarProps) {
  return (
    <motion.div 
      className={`glass-filter ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

interface FilterChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Filter Chip Component
 */
export function FilterChip({ children, active = false, onClick, className = "" }: FilterChipProps) {
  return (
    <motion.button
      className={`filter-chip ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}

interface GlassPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Glass Pagination Component
 */
export function GlassPagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = "" 
}: GlassPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <motion.div 
      className={`glass-pagination ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {pages.map(page => (
        <motion.button
          key={page}
          className={`page-btn ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {page}
        </motion.button>
      ))}
    </motion.div>
  );
}

interface GlassChartContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/**
 * Glass Chart Container
 * Perfect for Chart.js, Recharts, etc.
 */
export function GlassChartContainer({ 
  children, 
  title, 
  className = "" 
}: GlassChartContainerProps) {
  return (
    <motion.div 
      className={`glass-chart ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 22 }}
    >
      {title && (
        <h3 className="glass-chart-title">{title}</h3>
      )}
      <div className="glass-chart-content">
        {children}
      </div>
    </motion.div>
  );
}