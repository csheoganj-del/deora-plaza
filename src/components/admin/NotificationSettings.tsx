"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  BellOff, 
  Mail, 
  MailX,
  Settings,
  TestTube,
  Play,
  Pause
} from 'lucide-react';
import { useNotificationSettings, useNotificationSystem } from '@/hooks/useNotificationSystem';
import { getAudioSystem } from '@/lib/audio/notification-system';

export function NotificationSettings() {
  const {
    getSettings,
    toggleAudio,
    toggleVisual,
    toggleEmail,
    setMasterVolume,
    toggleBusinessUnitAudio,
    toggleBusinessUnitVisual,
    toggleNotificationType
  } = useNotificationSettings();

  const { sendNotification } = useNotificationSystem();
  const [settings, setSettings] = useState(getSettings());
  const [testingAudio, setTestingAudio] = useState(false);

  const refreshSettings = () => {
    setSettings(getSettings());
  };

  const handleAudioToggle = (enabled: boolean) => {
    toggleAudio(enabled);
    refreshSettings();
  };

  const handleVisualToggle = (enabled: boolean) => {
    toggleVisual(enabled);
    refreshSettings();
  };

  const handleEmailToggle = (enabled: boolean) => {
    toggleEmail(enabled);
    refreshSettings();
  };

  const handleVolumeChange = (value: number[]) => {
    setMasterVolume(value[0]);
    refreshSettings();
  };

  const handleBusinessUnitAudioToggle = (unit: string, enabled: boolean) => {
    toggleBusinessUnitAudio(unit, enabled);
    refreshSettings();
  };

  const handleBusinessUnitVisualToggle = (unit: string, enabled: boolean) => {
    toggleBusinessUnitVisual(unit, enabled);
    refreshSettings();
  };

  const handleNotificationTypeToggle = (type: string, enabled: boolean) => {
    toggleNotificationType(type, enabled);
    refreshSettings();
  };

  const testAudioNotification = async (type: string) => {
    setTestingAudio(true);
    try {
      await sendNotification({
        id: `test_${Date.now()}`,
        type: type as any,
        title: 'Test Notification',
        message: `Testing ${type} notification sound`,
        businessUnit: 'restaurant',
        priority: 'medium',
        audioEnabled: true,
        visualEnabled: false,
        emailEnabled: false
      });
    } catch (error) {
      console.error('Failed to test notification:', error);
    } finally {
      setTimeout(() => setTestingAudio(false), 2000);
    }
  };

  const businessUnits = [
    { key: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { key: 'cafe', name: 'Cafe', icon: '☕' },
    { key: 'bar', name: 'Bar', icon: '🍺' },
    { key: 'hotel', name: 'Hotel', icon: '🏨' },
    { key: 'garden', name: 'Garden', icon: '🌿' },
    { key: 'kitchen', name: 'Kitchen', icon: '👨‍🍳' }
  ];

  const notificationTypes = [
    { key: 'order_new', name: 'New Orders', description: 'When new orders are placed' },
    { key: 'order_ready', name: 'Order Ready', description: 'When orders are ready for delivery' },
    { key: 'order_served', name: 'Order Served', description: 'When orders are served to customers' },
    { key: 'waiterless_auto_serve', name: 'Auto-Serve', description: 'When orders are auto-served in waiterless mode' },
    { key: 'internal_order_new', name: 'Internal Orders', description: 'Inter-department order requests' },
    { key: 'payment_success', name: 'Payment Success', description: 'Successful payment notifications' },
    { key: 'kitchen_alert', name: 'Kitchen Alerts', description: 'Critical kitchen notifications' },
    { key: 'gst_toggle_changed', name: 'GST Changes', description: 'GST setting modifications' },
    { key: 'waiterless_toggle_changed', name: 'Waiterless Changes', description: 'Waiterless mode modifications' }
  ];

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card className="apple-glass-card">
        <CardHeader>
          <CardTitle className="apple-text-heading flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Master Notification Settings
          </CardTitle>
          <CardDescription className="apple-text-body">
            Control global notification preferences across all business units
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.audioEnabled ? (
                  <Volume2 className="h-5 w-5 text-green-600" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="apple-text-subheading">Audio Notifications</p>
                  <p className="apple-text-caption">
                    Play sounds for notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.audioEnabled}
                onCheckedChange={handleAudioToggle}
              />
            </div>

            {settings.audioEnabled && (
              <div className="ml-7 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="apple-text-body">Master Volume</span>
                  <span className="apple-text-caption">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.masterVolume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Visual Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.visualEnabled ? (
                <Bell className="h-5 w-5 text-blue-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="apple-text-subheading">Visual Notifications</p>
                <p className="apple-text-caption">
                  Show toast notifications on screen
                </p>
              </div>
            </div>
            <Switch
              checked={settings.visualEnabled}
              onCheckedChange={handleVisualToggle}
            />
          </div>

          <Separator />

          {/* Email Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.emailEnabled ? (
                <Mail className="h-5 w-5 text-purple-600" />
              ) : (
                <MailX className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="apple-text-subheading">Email Notifications</p>
                <p className="apple-text-caption">
                  Send email alerts for important events
                </p>
              </div>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={handleEmailToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Unit Settings */}
      <Card className="apple-glass-card">
        <CardHeader>
          <CardTitle className="apple-text-heading">Business Unit Settings</CardTitle>
          <CardDescription className="apple-text-body">
            Configure notifications for each business unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {businessUnits.map((unit) => {
              const unitSettings = settings.businessUnitSettings[unit.key] || {};
              return (
                <div key={unit.key} className="apple-glass-card-subtle flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{unit.icon}</span>
                    <div>
                      <p className="apple-text-subheading">{unit.name}</p>
                      <div className="flex gap-2 mt-1">
                        {unitSettings.audioEnabled && (
                          <Badge variant="secondary" className="text-xs">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Audio
                          </Badge>
                        )}
                        {unitSettings.visualEnabled && (
                          <Badge variant="secondary" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Visual
                          </Badge>
                        )}
                        {unitSettings.spatialAudio && (
                          <Badge variant="outline" className="text-xs">
                            3D Audio
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Switch
                        checked={unitSettings.audioEnabled || false}
                        onCheckedChange={(enabled) => handleBusinessUnitAudioToggle(unit.key, enabled)}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Switch
                        checked={unitSettings.visualEnabled || false}
                        onCheckedChange={(enabled) => handleBusinessUnitVisualToggle(unit.key, enabled)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="apple-glass-card">
        <CardHeader>
          <CardTitle className="apple-text-heading">Notification Types</CardTitle>
          <CardDescription className="apple-text-body">
            Enable or disable specific types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {notificationTypes.map((type) => {
              const typeSettings = settings.typeSettings[type.key as keyof typeof settings.typeSettings];
              return (
                <div key={type.key} className="apple-glass-card-subtle flex items-center justify-between p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="apple-text-subheading">{type.name}</p>
                      <Badge variant={typeSettings?.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {typeSettings?.priority || 'medium'}
                      </Badge>
                    </div>
                    <p className="apple-text-caption mt-1">
                      {type.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="apple-interactive"
                      variant="outline"
                      size="sm"
                      onClick={() => testAudioNotification(type.key)}
                      disabled={testingAudio || !settings.audioEnabled}
                    >
                      {testingAudio ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Switch
                      checked={typeSettings?.enabled || false}
                      onCheckedChange={(enabled) => handleNotificationTypeToggle(type.key, enabled)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Panel */}
      <Card className="apple-glass-card">
        <CardHeader>
          <CardTitle className="apple-text-heading flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription className="apple-text-body">
            Test different notification types to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              className="apple-interactive"
              variant="outline"
              onClick={() => testAudioNotification('order_new')}
              disabled={testingAudio}
            >
              New Order
            </Button>
            <Button
              className="apple-interactive"
              variant="outline"
              onClick={() => testAudioNotification('order_ready')}
              disabled={testingAudio}
            >
              Order Ready
            </Button>
            <Button
              className="apple-interactive"
              variant="outline"
              onClick={() => testAudioNotification('payment_success')}
              disabled={testingAudio}
            >
              Payment Success
            </Button>
            <Button
              className="apple-interactive"
              variant="outline"
              onClick={() => testAudioNotification('kitchen_alert')}
              disabled={testingAudio}
            >
              Kitchen Alert
            </Button>
            <Button
              className="apple-interactive"
              variant="outline"
              onClick={() => testAudioNotification('waiterless_auto_serve')}
              disabled={testingAudio}
            >
              Auto-Serve
            </Button>
            <Button
              className="apple-interactive"
              variant="outline"
              onClick={() => testAudioNotification('internal_order_new')}
              disabled={testingAudio}
            >
              Internal Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}