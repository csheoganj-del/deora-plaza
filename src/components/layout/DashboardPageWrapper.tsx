import { ReactNode } from 'react'

interface DashboardPageWrapperProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DashboardPageWrapper({ 
  title, 
  description, 
  children, 
  className = '' 
}: DashboardPageWrapperProps) {
  return (
    <div className={`dashboard-page-container ${className}`}>
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">{title}</h1>
      </div>
      
      <div className="dashboard-page-content">
        {children}
      </div>
    </div>
  )
}