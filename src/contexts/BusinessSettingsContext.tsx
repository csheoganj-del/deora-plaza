"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBusinessSettings } from '@/actions/businessSettings';

interface BusinessSettings {
    id?: string;
    businessName?: string;
    address?: string;
    mobileNumber?: string;
    gstEnabled?: boolean;
    gstPercentage?: number;
    cafeGstEnabled?: boolean;
    cafeGstPercentage?: number;
    barGstEnabled?: boolean;
    barGstPercentage?: number;
    businessLogo?: string;
    [key: string]: any;
}

interface BusinessSettingsContextType {
    settings: BusinessSettings | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const BusinessSettingsContext = createContext<BusinessSettingsContextType | undefined>(undefined);

export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<BusinessSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getBusinessSettings();
            setSettings(data);
        } catch (err) {
            console.error('Failed to fetch business settings:', err);
            setError('Failed to load business settings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <BusinessSettingsContext.Provider
            value={{
                settings,
                isLoading,
                error,
                refetch: fetchSettings
            }}
        >
            {children}
        </BusinessSettingsContext.Provider>
    );
}

export function useBusinessSettings() {
    const context = useContext(BusinessSettingsContext);
    if (context === undefined) {
        throw new Error('useBusinessSettings must be used within a BusinessSettingsProvider');
    }
    return context;
}
