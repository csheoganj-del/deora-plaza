/**
 * Location Permission Dialog Component
 * Handles user consent for location tracking with proper privacy controls
 */

"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
;
import { MapPin, Shield, Clock, Eye, Download } from 'lucide-react';
import { locationService } from '@/lib/location/service';
import { LocationPermissions } from '@/lib/location/types';

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPermissionsUpdated?: (permissions: LocationPermissions) => void;
}

export function LocationPermissionDialog({
  isOpen,
  onClose,
  userId,
  onPermissionsUpdated
}: LocationPermissionDialogProps) {
  const [permissions, setPermissions] = useState<LocationPermissions>({
    userId,
    canTrack: false,
    canView: false,
    canExport: false,
    consentGiven: false,
    retentionDays: 90
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadPermissions();
    }
  }, [isOpen, userId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const currentPermissions = await locationService.checkLocationPermissions(userId);
      setPermissions(currentPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await locationService.updateLocationPermissions(userId, permissions);
      onPermissionsUpdated?.(permissions);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePermission = (key: keyof LocationPermissions, value: any) => {
    setPermissions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Privacy Settings
          </DialogTitle>
          <DialogDescription>
            Control how DEORA Plaza uses your location data. Your privacy is important to us.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Consent */}
            <div className="premium-card">
              <div className="p-8 pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Enable Location Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow DEORA Plaza to track your location for work-related activities
                    </p>
                  </div>
                  <Switch
                    checked={permissions.consentGiven}
                    onCheckedChange={(checked) => {
                      updatePermission('consentGiven', checked);
                      updatePermission('canTrack', checked);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Permissions */}
            {permissions.consentGiven && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Detailed Permissions</h3>
                
                <div className="grid gap-4">
                  <div className="premium-card">
                    <div className="p-8 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">View Location History</Label>
                            <p className="text-xs text-muted-foreground">
                              Allow viewing your location history in reports
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={permissions.canView}
                          onCheckedChange={(checked) => updatePermission('canView', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="premium-card">
                    <div className="p-8 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">Export Location Data</Label>
                            <p className="text-xs text-muted-foreground">
                              Allow exporting your location data for personal use
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={permissions.canExport}
                          onCheckedChange={(checked) => updatePermission('canExport', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="premium-card">
                    <div className="p-8 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">Data Retention</Label>
                            <p className="text-xs text-muted-foreground">
                              How long to keep your location data
                            </p>
                          </div>
                        </div>
                        <select
                          value={permissions.retentionDays}
                          onChange={(e) => updatePermission('retentionDays', parseInt(e.target.value))}
                          className="px-3 py-1 border rounded-md text-sm"
                        >
                          <option value={30}>30 days</option>
                          <option value={90}>90 days</option>
                          <option value={180}>6 months</option>
                          <option value={365}>1 year</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="premium-card border-blue-200 bg-[#EFF6FF]">
              <div className="p-8 pt-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#6D5DFB] mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-900">Privacy Protection</h4>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p>• Your location data is encrypted and stored securely</p>
                      <p>• Data is only used for work-related purposes</p>
                      <p>• You can revoke consent at any time</p>
                      <p>• Data is automatically deleted after the retention period</p>
                      <p>• Only authorized managers can view aggregated location data</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

