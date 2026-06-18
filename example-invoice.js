const PDFDocument = require('pdfkit');
const fs = require('fs');

function createInvoice() {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream('Example_Invoice.pdf'));

  // Header
  doc.fillColor('#444444')
     .fontSize(20)
     .text('INVOICE', 50, 50);

  doc.fontSize(10)
     .text('Acme Corporation', 200, 50, { align: 'right' })
     .text('123 Business Road', 200, 65, { align: 'right' })
     .text('San Francisco, CA, 94107', 200, 80, { align: 'right' })
     .moveDown();

  // Invoice Details
  const customerInfoTop = 130;
  
  doc.fillColor('#000000')
     .fontSize(12)
     .text('Bill To:', 50, customerInfoTop)
     .fontSize(10)
     .text('John Cena', 50, customerInfoTop + 15)
     .text('john.cena@example.com', 50, customerInfoTop + 30)
     .text('WWE Headquarters, CT', 50, customerInfoTop + 45);

  doc.fontSize(10)
     .text('Invoice Number:', 300, customerInfoTop)
     .font('Helvetica-Bold')
     .text('INV-10042', 400, customerInfoTop)
     .font('Helvetica')
     .text('Invoice Date:', 300, customerInfoTop + 15)
     .text('June 18, 2026', 400, customerInfoTop + 15)
     .text('Due Date:', 300, customerInfoTop + 30)
     .font('Helvetica-Bold')
     .text('June 25, 2026', 400, customerInfoTop + 30)
     .font('Helvetica');

  // Table Header
  const invoiceTableTop = 220;

  doc.font('Helvetica-Bold');
  generateTableRow(doc, invoiceTableTop, 'Item', 'Description', 'Unit Price', 'Quantity', 'Line Total');
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  // Table Rows
  generateTableRow(doc, invoiceTableTop + 30, '1', 'Website Redesign', '$2,500.00', '1', '$2,500.00');
  generateHr(doc, invoiceTableTop + 50);
  
  generateTableRow(doc, invoiceTableTop + 60, '2', 'Monthly Hosting & Maintenance', '$150.00', '1', '$150.00');
  generateHr(doc, invoiceTableTop + 80);

  // Totals
  const subtotalPosition = invoiceTableTop + 100;
  generateTableRow(doc, subtotalPosition, '', '', 'Subtotal', '', '$2,650.00');
  const totalPosition = subtotalPosition + 20;
  doc.font('Helvetica-Bold');
  generateTableRow(doc, totalPosition, '', '', 'Total Due', '', '$2,650.00');
  doc.font('Helvetica');

  // Footer
  doc.fontSize(10)
     .text('Payment is due within 7 days. Thank you for your business!', 50, 700, { align: 'center', width: 500 });

  doc.end();
}

function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
  doc.fontSize(10)
     .text(item, 50, y)
     .text(description, 100, y)
     .text(unitCost, 280, y, { width: 90, align: 'right' })
     .text(quantity, 370, y, { width: 90, align: 'right' })
     .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa')
     .lineWidth(1)
     .moveTo(50, y)
     .lineTo(550, y)
     .stroke();
}

createInvoice();
console.log('Invoice generated!');
