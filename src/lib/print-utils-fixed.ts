/**
 * Thermal printer utilities for bill printing
 */

export interface PrintableItem {
  name: string
  quantity: number
  rate: number
  amount: number
}

export interface PrintableBill {
  billNumber: string
  businessName: string
  businessAddress?: string
  gstNumber?: string
  date: Date
  customerName?: string
  customerMobile?: string
  items: PrintableItem[]
  subtotal: number
  gstPercent: number
  gstAmount: number
  grandTotal: number
  paymentMethod?: string
}

/**
 * Generate HTML for thermal printer (58mm/80mm)
 */
export function generateThermalPrintHTML(bill: PrintableBill): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill ${bill.billNumber}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      
      body {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.3;
        margin: 0;
        padding: 5mm;
        color: #000;
        background: #fff;
      }
      
      .header {
        text-align: center;
        margin-bottom: 8px;
        border-bottom: 1px dashed #000000;
        padding-bottom: 8px;
      }
      
      .business-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .business-details {
        font-size: 10px;
        margin-bottom: 2px;
      }
      
      .bill-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 10px;
        border-bottom: 1px dashed #000000;
        padding-bottom: 8px;
      }
      
      .customer-info {
        margin-bottom: 8px;
        font-size: 10px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
      }
      
      th {
        text-align: left;
        border-bottom: 1px dashed #000000;
        padding: 4px 0;
        font-size: 10px;
      }
      
      td {
        padding: 3px 0;
        font-size: 10px;
      }
      
      .item-name {
        max-width: 40mm;
        word-wrap: break-word;
      }
      
      .text-right {
        text-align: right;
      }
      
      .totals {
        border-top: 1px dashed #000000;
        padding-top: 8px;
        margin-top: 8px;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 11px;
      }
      
      .grand-total {
        font-size: 14px;
        font-weight: bold;
        border-top: 1px double #000;
        border-bottom: 1px double #000;
        padding: 6px 0;
        margin-top: 6px;
      }
      
      .footer {
        text-align: center;
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px dashed #000000;
        font-size: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">${bill.businessName}</div>
    ${bill.businessAddress ? `<div class="business-details">${bill.businessAddress}</div>` : ''}
    ${bill.gstNumber ? `<div class="business-details">GST: ${bill.gstNumber}</div>` : ''}
  </div>
  
  <div class="bill-info">
    <span>Bill: ${bill.billNumber}</span>
    <span>${formatDate(bill.date)}</span>
  </div>
  
  ${bill.customerName || bill.customerMobile ? `
  <div class="customer-info">
    ${bill.customerName ? `<div>Customer: ${bill.customerName}</div>` : ''}
    ${bill.customerMobile ? `<div>Mobile: ${bill.customerMobile}</div>` : ''}
  </div>
  ` : ''}
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
      try {
        const items: PrintableItem[] = Array.isArray(bill.items)
          ? bill.items
          : (typeof bill.items === 'string' ? JSON.parse(bill.items) : []);

        return items.map((item: PrintableItem) => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.rate)}</td>
              <td class="text-right">${formatCurrency(item.amount)}</td>
              </tr>
          `).join('');
      } catch (e) {
        console.warn('Failed to parse bill.items in print-utils:', e);
        return '';
      }
    })()}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(bill.subtotal)}</span>
    </div>
    <div class="total-row">
      <span>GST (${bill.gstPercent}%):</span>
      <span>${formatCurrency(bill.gstAmount)}</span>
    </div>
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>₹${formatCurrency(bill.grandTotal)}</span>
    </div>
    ${bill.paymentMethod ? `
    <div class="total-row">
      <span>Payment:</span>
      <span>${bill.paymentMethod}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="footer">
    <div>Thank you for your visit!</div>
    <div>Please visit again</div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Print bill to thermal printer
 */
export function printThermalBill(bill: PrintableBill) {
  const htmlContent = generateThermalPrintHTML(bill)
  const printWindow = window.open('', '_blank', 'width=302,height=500')

  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()

      // Auto close after printing
      setTimeout(() => {
        printWindow.close()
      }, 250)
    }
  }
}

/**
 * Print KOT (Kitchen Order Ticket)
 */
export function printKOT(orderNumber: string, tableName: string, items: PrintableItem[], notes?: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KOT ${orderNumber}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        margin: 0;
        padding: 5mm;
        color: #000;
        background: #fff;
      }
      .header {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
        border-bottom: 2px dashed #000000;
        padding-bottom: 8px;
      }
      .order-info {
        margin-bottom: 10px;
        font-size: 14px;
        font-weight: bold;
      }
      .items {
        margin-bottom: 10px;
      }
      .item {
        margin-bottom: 6px;
        font-size: 13px;
      }
      .qty {
        font-weight: bold;
        font-size: 16px;
      }
      .notes {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px dashed #000000;
        font-style: italic;
      }
      .footer {
        text-align: center;
        margin-top: 12px;
        padding-top: 8px;
        border-top: 2px dashed #000000;
        font-size: 11px;
      }
    }
  </style>
</head>
<body>
  <div class="header">KITCHEN ORDER</div>
  <div class="order-info">
    <div>Order: ${orderNumber}</div>
    <div>Table: ${tableName}</div>
    <div>Time: ${new Date().toLocaleTimeString()}</div>
  </div>
  <div class="items">
    ${items.map(item => `
      <div class="item">
        <span class="qty">${item.quantity}x</span> ${item.name}
      </div>
    `).join('')}
  </div>
  ${notes ? `<div class="notes">Note: ${notes}</div>` : ''}
  <div class="footer">
    <div>------------------------------</div>
  </div>
</body>
</html>
  `.trim()

  const printWindow = window.open('', '_blank', 'width=302,height=400')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      setTimeout(() => printWindow.close(), 250)
    }
  }
}

// Helper functions
function formatCurrency(amount: number): string {
  return amount.toFixed(2)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Print Garden booking receipt (A4 format)
 */
export function printGardenReceipt(booking: any, paymentType: "advance" | "full" = "advance") {
  const printWindow = window.open('', '_blank', 'width=800,height=1000');

  if (!printWindow) {
    alert('Please allow popups to print the receipt');
    return;
  }

  // Import the server-compatible receipt component dynamically
  import('../components/garden/GardenReceiptServer').then(({ GardenReceiptServer }) => {
    import('react-dom/server').then((ReactDOMServer) => {
      import('react').then((React) => {
        const receiptHTML = ReactDOMServer.renderToString(
          React.createElement(GardenReceiptServer, {
            booking,
            receiptNumber: booking.receiptNumber,
            paymentType,
            businessSettings: null, // Will be fetched in component
          })
        );

        const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${booking.receiptNumber}</title>
  <style>
    @media print {
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  ${receiptHTML}
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>
        `;

        printWindow.document.write(fullHTML);
        printWindow.document.close();
      });
    });
  });
}

