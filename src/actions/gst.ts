"use server"

import { queryDocuments, timestampToDate } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function getGSTReport(startDate: Date, endDate: Date, businessUnit?: string) {
    try {
        // Build filters
        const filters: any[] = [
            { field: 'createdAt', operator: '>=', value: startDate },
            { field: 'createdAt', operator: '<=', value: endDate }
        ]

        if (businessUnit && businessUnit !== 'all') {
            filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        }

        // Get all bills in date range
        const billsSnapshot = await adminDb.collection('bills')
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<=', endDate)
            .get()

        const bills: any[] = []
        billsSnapshot.forEach(doc => {
            const data = doc.data()

            // Filter by business unit if specified
            if (businessUnit && businessUnit !== 'all' && data.businessUnit !== businessUnit) {
                return
            }

            bills.push({
                id: doc.id,
                billNumber: data.billNumber,
                date: timestampToDate(data.createdAt).toISOString(),
                businessUnit: data.businessUnit,
                customerName: data.customerName || 'Guest',
                customerMobile: data.customerMobile || '-',
                subtotal: data.subtotal || 0,
                gstPercent: data.gstPercent || 0,
                gstAmount: data.gstAmount || 0,
                grandTotal: data.grandTotal || 0,
                source: data.source || 'dine-in',
                paymentMethod: data.paymentMethod || 'cash'
            })
        })

        // Sort by date descending
        bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return bills
    } catch (error) {
        console.error('Error fetching GST report:', error)
        return []
    }
}

export async function getGSTSummary(startDate: Date, endDate: Date, businessUnit?: string) {
    try {
        const bills = await getGSTReport(startDate, endDate, businessUnit)

        // Calculate totals
        const totalGST = bills.reduce((sum, bill) => sum + bill.gstAmount, 0)
        const totalSales = bills.reduce((sum, bill) => sum + bill.grandTotal, 0)
        const totalSubtotal = bills.reduce((sum, bill) => sum + bill.subtotal, 0)
        const billCount = bills.length

        // Group by GST rate
        const byGSTRate: Record<string, { count: number, subtotal: number, gst: number, total: number }> = {}

        bills.forEach(bill => {
            const rate = `${bill.gstPercent}%`
            if (!byGSTRate[rate]) {
                byGSTRate[rate] = { count: 0, subtotal: 0, gst: 0, total: 0 }
            }
            byGSTRate[rate].count++
            byGSTRate[rate].subtotal += bill.subtotal
            byGSTRate[rate].gst += bill.gstAmount
            byGSTRate[rate].total += bill.grandTotal
        })

        return {
            totalGST,
            totalSales,
            totalSubtotal,
            billCount,
            averageGST: billCount > 0 ? totalGST / billCount : 0,
            byGSTRate
        }
    } catch (error) {
        console.error('Error calculating GST summary:', error)
        return {
            totalGST: 0,
            totalSales: 0,
            totalSubtotal: 0,
            billCount: 0,
            averageGST: 0,
            byGSTRate: {}
        }
    }
}

export async function exportGSTData(startDate: Date, endDate: Date, businessUnit?: string) {
    try {
        const bills = await getGSTReport(startDate, endDate, businessUnit)

        // Convert to CSV format
        const headers = [
            'Bill Number',
            'Date',
            'Time',
            'Business Unit',
            'Customer Name',
            'Mobile',
            'Subtotal',
            'GST %',
            'GST Amount',
            'Grand Total',
            'Payment Method',
            'Source'
        ]

        const rows = bills.map(bill => {
            const date = new Date(bill.date)
            return [
                bill.billNumber,
                date.toLocaleDateString('en-IN'),
                date.toLocaleTimeString('en-IN'),
                bill.businessUnit,
                bill.customerName,
                bill.customerMobile,
                bill.subtotal.toFixed(2),
                bill.gstPercent,
                bill.gstAmount.toFixed(2),
                bill.grandTotal.toFixed(2),
                bill.paymentMethod,
                bill.source
            ]
        })

        return {
            headers,
            rows,
            filename: `GST_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`
        }
    } catch (error) {
        console.error('Error exporting GST data:', error)
        return {
            headers: [],
            rows: [],
            filename: 'GST_Report.csv'
        }
    }
}
