export interface GstBreakdown {
    cgst: number;
    sgst: number;
    totalGst: number;
    rate: number;
}

export interface BusinessGstSettings {
    gstEnabled: boolean;
    barGstPercentage?: number;
    cafeGstPercentage?: number;
    hotelGstPercentage?: number;
    gardenGstPercentage?: number;
}

export function calculateGst(
    amount: number,
    businessType: 'cafe' | 'restaurant' | 'bar' | 'hotel' | 'marriage_garden',
    itemType: 'food' | 'alcohol' | 'room' | 'event' | 'decoration' | 'service',
    settings: BusinessGstSettings
): GstBreakdown {
    if (!settings.gstEnabled) {
        return { cgst: 0, sgst: 0, totalGst: 0, rate: 0 };
    }

    let rate = 0;

    switch (businessType) {
        case 'cafe':
        case 'restaurant':
            // 5% default (No ITC) or Admin Configured
            rate = settings.cafeGstPercentage || 5;
            break;

        case 'bar':
            if (itemType === 'alcohol') {
                rate = 0; // No GST on alcohol
            } else {
                rate = settings.barGstPercentage || 5; // Food served in bar
            }
            break;

        case 'hotel':
            if (itemType === 'room') {
                if (amount <= 1000) rate = 0;
                else if (amount <= 7500) rate = 12;
                else rate = 18;
            } else {
                rate = settings.hotelGstPercentage || 5; // Food in hotel
            }
            break;

        case 'marriage_garden':
            if (itemType === 'event' || itemType === 'decoration') {
                rate = 18; // 18% standard for events/decor
            } else {
                rate = settings.gardenGstPercentage || 5; // Catering default
            }
            break;

        default:
            rate = 0;
    }

    const totalGst = (amount * rate) / 100;
    return {
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        totalGst,
        rate
    };
}

