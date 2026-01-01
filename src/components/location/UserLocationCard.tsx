/**
 * User Location Detail Card
 * Shows detailed information about a selected user's location
 */

"use client";

;
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  Smartphone, 
  Navigation,
  User,
  Briefcase,
  Building,
  Signal,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserLocationData {
  userId: string;
  username: string;
  role: string;
  businessUnit: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  source: 'gps' | 'ip' | 'manual';
  isOnline: boolean;
  lastSeen: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
  };
}

interface UserLocationCardProps {
  user: UserLocationData;
}

export function UserLocationCard({ user }: UserLocationCardProps) {
  const getSourceBadge = () => {
    switch (user.source) {
      case 'gps':
        return <Badge className="bg-[#BBF7D0] text-green-800">GPS</Badge>;
      case 'ip':
        return <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]800">IP Location</Badge>;
      case 'manual':
        return <Badge className="bg-[#DBEAFE] text-blue-800">Manual</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = () => {
    if (!user.isOnline) {
      return <Badge variant="secondary" className="bg-[#F1F5F9] text-[#111827]">Offline</Badge>;
    }

    const timeDiff = Date.now() - new Date(user.timestamp).getTime();
    if (timeDiff < 5 * 60 * 1000) {
      return <Badge className="bg-[#BBF7D0] text-green-800">Active</Badge>;
    }
    if (timeDiff < 30 * 60 * 1000) {
      return <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]800">Idle</Badge>;
    }
    return <Badge className="bg-[#FEE2E2] text-red-800">Inactive</Badge>;
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${user.latitude},${user.longitude}`;
    window.open(url, '_blank');
  };

  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${user.latitude},${user.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* User Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EFF6FF]0 to-[#EDEBFF]0 flex items-center justify-center text-white font-bold text-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{user.username}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
              {getSourceBadge()}
            </div>
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Unit:</span>
            <span className="font-medium uppercase">{user.businessUnit}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
            <span className="font-mono text-xs">
              {user.latitude.toFixed(6)}, {user.longitude.toFixed(6)}
            </span>
          </div>

          {user.accuracy && (
            <div className="flex items-center gap-3 text-sm">
              <Signal className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Accuracy:</span>
              <span className="font-medium">±{user.accuracy.toFixed(0)}m</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(user.timestamp), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last Seen:</span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
            </span>
          </div>

          {user.deviceInfo && (
            <div className="flex items-start gap-3 text-sm">
              <Smartphone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <span className="text-muted-foreground">Device:</span>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  {user.deviceInfo.platform || 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={openInMaps}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Google Maps
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={getDirections}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
      </div>

      {/* Timestamp Details */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Recorded:</span>
          <span className="font-mono">{new Date(user.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">User ID:</span>
          <span className="font-mono">{user.userId.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}

