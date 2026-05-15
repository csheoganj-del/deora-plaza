"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Shield, 
  Layout, 
  Bell, 
  Database,
  Activity,
  FileText
} from 'lucide-react';
import TabManagement from './TabManagement';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('tabs');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Add body class for CSS targeting
    document.body.classList.add('admin-page');
    
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  const handleTabClick = (tabId: string) => {
    if (!mounted) {
      return;
    }
    
    setActiveTab(tabId);
  };

  // Don't render interactive elements until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const adminTabs = [
    {
      id: 'tabs',
      label: 'Tab Management',
      icon: Layout,
      description: 'Control which tabs are visible to users',
      component: <TabManagement />
    },
    {
      id: 'roles',
      label: 'Role Management',
      icon: Shield,
      description: 'Manage user roles and permissions',
      component: (
        <div className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Role Management</h3>
          <p className="text-muted-foreground">Role management functionality coming soon...</p>
        </div>
      )
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage user accounts and access',
      component: (
        <div className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-muted-foreground">User management functionality coming soon...</p>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration, user access, and administrative features.
        </p>
      </div>



      {/* Custom Tab Navigation */}
      <div className="space-y-6">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
          {adminTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  cursor-pointer hover:bg-white hover:shadow-sm
                  ${isActive 
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {adminTabs.map(tab => {
            const isTabActive = activeTab === tab.id;
            
            return (
              <div
                key={tab.id}
                className={`${isTabActive ? 'block' : 'hidden'}`}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <tab.icon className="h-5 w-5" />
                      <CardTitle>{tab.label}</CardTitle>
                    </div>
                    <CardDescription>{tab.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tab.component}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}