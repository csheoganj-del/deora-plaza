// Print utilities for receipts and invoices

export interface HotelBooking {
  id: string
  customer_name: string
  customer_phone?: string
  room_number: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  advance_paid: number
  balance_amount: number
  status: string
  created_at: string
  payments?: Payment[]
}

export interface GardenBooking {
  id: string
  customer_name: string
  customer_phone?: string
  event_date: string
  event_time: string
  guest_count: number
  total_amount: number
  advance_paid: number
  balance_amount: number
  status: string
  created_at: string
  payments?: Payment[]
}

export interface Payment {
  id: string
  amount: number
  payment_method: string
  created_at: string
}

/**
 * Print hotel booking receipt
 */
export function printHotelReceipt(booking: HotelBooking): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print receipts')
    return
  }

  const receiptHTML = generateHotelReceiptHTML(booking)
  
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

/**
 * Print garden booking receipt
 */
export function printGardenReceipt(booking: GardenBooking): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print receipts')
    return
  }

  const receiptHTML = generateGardenReceiptHTML(booking)
  
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

/**
 * Generate HTML for hotel receipt
 */
function generateHotelReceiptHTML(booking: HotelBooking): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hotel Booking Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .receipt {
          max-width: 300px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 10px;
          color: #666;
        }
        .section {
          margin-bottom: 15px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .label {
          font-weight: bold;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .total {
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
          padding-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .receipt { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="title">DEORA PLAZA</div>
          <div class="subtitle">Hotel Booking Receipt</div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Booking ID:</span>
            <span>${booking.id.slice(-8).toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span>${formatDate(booking.created_at)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span class="label">Guest Name:</span>
            <span>${booking.customer_name}</span>
          </div>
          ${booking.customer_phone ? `
          <div class="row">
            <span class="label">Phone:</span>
            <span>${booking.customer_phone}</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">Room:</span>
            <span>${booking.room_number}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span class="label">Check-in:</span>
            <span>${formatDate(booking.check_in_date)}</span>
          </div>
          <div class="row">
            <span class="label">Check-out:</span>
            <span>${formatDate(booking.check_out_date)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span class="label">Total Amount:</span>
            <span>${formatCurrency(booking.total_amount)}</span>
          </div>
          <div class="row">
            <span class="label">Advance Paid:</span>
            <span>${formatCurrency(booking.advance_paid)}</span>
          </div>
          <div class="row total">
            <span class="label">Balance:</span>
            <span>${formatCurrency(booking.balance_amount)}</span>
          </div>
        </div>

        ${booking.payments && booking.payments.length > 0 ? `
        <div class="divider"></div>
        <div class="section">
          <div class="label" style="margin-bottom: 5px;">Payment History:</div>
          ${booking.payments.map(payment => `
            <div class="row" style="font-size: 10px;">
              <span>${formatDate(payment.created_at)}</span>
              <span>${payment.payment_method}</span>
              <span>${formatCurrency(payment.amount)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="footer">
          <div>Thank you for choosing DEORA Plaza!</div>
          <div>Status: ${booking.status.toUpperCase()}</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML for garden booking receipt
 */
function generateGardenReceiptHTML(booking: GardenBooking): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Garden Booking Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .receipt {
          max-width: 300px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 10px;
          color: #666;
        }
        .section {
          margin-bottom: 15px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .label {
          font-weight: bold;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .total {
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
          padding-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .receipt { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="title">DEORA PLAZA</div>
          <div class="subtitle">Garden Booking Receipt</div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Booking ID:</span>
            <span>${booking.id.slice(-8).toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span>${formatDate(booking.created_at)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span class="label">Customer:</span>
            <span>${booking.customer_name}</span>
          </div>
          ${booking.customer_phone ? `
          <div class="row">
            <span class="label">Phone:</span>
            <span>${booking.customer_phone}</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">Guests:</span>
            <span>${booking.guest_count}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span class="label">Event Date:</span>
            <span>${formatDate(booking.event_date)}</span>
          </div>
          <div class="row">
            <span class="label">Event Time:</span>
            <span>${booking.event_time}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <div class="row">
            <span class="label">Total Amount:</span>
            <span>${formatCurrency(booking.total_amount)}</span>
          </div>
          <div class="row">
            <span class="label">Advance Paid:</span>
            <span>${formatCurrency(booking.advance_paid)}</span>
          </div>
          <div class="row total">
            <span class="label">Balance:</span>
            <span>${formatCurrency(booking.balance_amount)}</span>
          </div>
        </div>

        ${booking.payments && booking.payments.length > 0 ? `
        <div class="divider"></div>
        <div class="section">
          <div class="label" style="margin-bottom: 5px;">Payment History:</div>
          ${booking.payments.map(payment => `
            <div class="row" style="font-size: 10px;">
              <span>${formatDate(payment.created_at)}</span>
              <span>${payment.payment_method}</span>
              <span>${formatCurrency(payment.amount)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="footer">
          <div>Thank you for choosing DEORA Plaza!</div>
          <div>Status: ${booking.status.toUpperCase()}</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Download receipt as PDF (requires additional setup)
 */
export function downloadReceiptAsPDF(html: string, filename: string): void {
  // This would require a PDF generation library like jsPDF or Puppeteer
  // For now, we'll just trigger the print dialog
  console.log('PDF download would be implemented here')
  alert('PDF download feature coming soon. Please use print for now.')
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}