"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';

export default function RoleManagement() {
  const roles = [
    { id: '1', name: 'Super Admin', description: 'Full system access', isActive: true },
    { id: '2', name: 'Manager', description: 'Department management access', isActive: true },
    { id: '3', name: 'Staff', description: 'Basic operational access', isActive: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Role Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage user roles with specific permissions.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map(role => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {role.name}
                    {!role.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={role.name === 'Super Admin'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Role permissions and detailed management coming soon...
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}