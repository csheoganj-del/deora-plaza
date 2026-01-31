"use client";

import { useEffect, useState } from 'react';
import WaiterDashboard from '@/components/waiter/WaiterDashboard';
import WaiterMobile from '@/components/waiter/WaiterMobile';

export default function WaiterPageClient() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect if running in Android app or mobile device
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isAndroidApp = userAgent.includes('android');
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isSmallScreen = window.innerWidth < 768;

            return isAndroidApp || (isMobileDevice && isSmallScreen);
        };

        setIsMobile(checkMobile());

        // Re-check on resize
        const handleResize = () => setIsMobile(checkMobile());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Show mobile version for Android app and mobile devices
    if (isMobile) {
        return <WaiterMobile />;
    }

    // Show full desktop version for desktop
    return (
        <div className="pb-20">
            <WaiterDashboard />
        </div>
    );
}
