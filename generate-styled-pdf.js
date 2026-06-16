const puppeteer = require('puppeteer');
const fs = require('fs');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      color: #334155;
      background: #ffffff;
    }

    .header-container {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #818cf8;
    }

    .main-title {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 5px 0;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 30px 0 15px 0;
    }

    .tc-card {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      margin-bottom: 25px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .tc-header {
      display: flex;
      align-items: center;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 16px;
    }

    .tc-id {
      font-weight: 700;
      color: #0f172a;
      margin-right: 15px;
      min-width: 50px;
    }

    .tc-title {
      font-weight: 600;
      color: #0f172a;
      flex-grow: 1;
    }

    .badge {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      margin-left: 10px;
      min-width: 80px;
      text-align: center;
    }

    .badge.warning { background-color: #fef08a; color: #854d0e; }
    .badge.failed { background-color: #ffe4e6; color: #be123c; }
    .badge.high-priority { background-color: #ffe4e6; color: #be123c; }
    .badge.medium-priority { background-color: #fef08a; color: #854d0e; }

    .tc-body {
      padding: 16px;
      background-color: #ffffff;
      font-size: 14px;
      line-height: 1.5;
    }

    .tc-row {
      margin-bottom: 12px;
    }

    .tc-row.fix {
      margin-bottom: 0;
      color: #7e22ce;
    }

    .label {
      font-weight: 600;
      color: #1e293b;
    }
    
    .fix .label {
      color: #7e22ce;
    }
  </style>
</head>
<body>

  <div class="header-container">
    <h1 class="main-title">Edge Case Testing Report</h1>
    <p class="subtitle">Invoice Automation Platform — AI Reminder Bot</p>
  </div>

  <div class="section-title">Section 1 — Automated Cron Jobs & Email Delivery</div>

  <!-- TC-01 -->
  <div class="tc-card">
    <div class="tc-header">
      <div class="tc-id">TC-01</div>
      <div class="tc-title">The Timezone Trap</div>
      <div class="badge warning">Warning</div>
      <div class="badge high-priority">High Priority</div>
    </div>
    <div class="tc-body">
      <div class="tc-row">
        <span class="label">Edge Case:</span> Server runs on UTC, causing cron to fire at the wrong local time.
      </div>
      <div class="tc-row">
        <span class="label">Scenario:</span> A user in India expects the 9:00 AM cron job to run at 9:00 AM IST, but the cloud server automatically runs it at 9:00 AM UTC (2:30 PM IST).
      </div>
      <div class="tc-row">
        <span class="label">Expected:</span> The cron job fires exactly at the intended local time regardless of the server's physical location.
      </div>
      <div class="tc-row fix">
        <span class="label">Fix:</span> Force node-cron to respect a specific timezone (like Asia/Kolkata) by passing a timezone options object to the scheduler configuration.
      </div>
    </div>
  </div>

  <!-- TC-02 -->
  <div class="tc-card">
    <div class="tc-header">
      <div class="tc-id">TC-02</div>
      <div class="tc-title">The Spam Filter (Rate Limiting)</div>
      <div class="badge failed">Failed</div>
      <div class="badge high-priority">High Priority</div>
    </div>
    <div class="tc-body">
      <div class="tc-row">
        <span class="label">Edge Case:</span> Firing too many webhooks simultaneously triggers SMTP spam filters.
      </div>
      <div class="tc-row">
        <span class="label">Scenario:</span> 200 invoices are due on the same day. The Express loop fires 200 rapid requests to n8n instantly, causing the SMTP provider to temporarily block the account.
      </div>
      <div class="tc-row">
        <span class="label">Expected:</span> Webhook requests are throttled to mimic human sending behavior and avoid triggering provider rate limits.
      </div>
      <div class="tc-row fix">
        <span class="label">Fix:</span> Add a 2-second asynchronous delay (sleep) between each webhook call inside the Express for loop to trickle out the emails.
      </div>
    </div>
  </div>

  <div class="section-title">Section 2 — Client Data & Invoice Statuses</div>

  <!-- TC-03 -->
  <div class="tc-card">
    <div class="tc-header">
      <div class="tc-id">TC-03</div>
      <div class="tc-title">Invalid Client Email Addresses</div>
      <div class="badge failed">Failed</div>
      <div class="badge high-priority">High Priority</div>
    </div>
    <div class="tc-body">
      <div class="tc-row">
        <span class="label">Edge Case:</span> Malformed emails cause permanent bounce loops without visibility.
      </div>
      <div class="tc-row">
        <span class="label">Scenario:</span> A client's email is saved as "john@gmail..com". n8n's SMTP node rejects it, and Express blindly retries 10 times before silently giving up.
      </div>
      <div class="tc-row">
        <span class="label">Expected:</span> The system handles the bounce gracefully and notifies the user so they can correct the email address.
      </div>
      <div class="tc-row fix">
        <span class="label">Fix:</span> Add a "Failed Reminders" tab to the React Dashboard to visually display bounced emails and allow the user to correct them directly from the UI.
      </div>
    </div>
  </div>

  <!-- TC-04 -->
  <div class="tc-card">
    <div class="tc-header">
      <div class="tc-id">TC-04</div>
      <div class="tc-title">Overdue Harassment (or Lack Thereof)</div>
      <div class="badge warning">Warning</div>
      <div class="badge medium-priority">Medium Priority</div>
    </div>
    <div class="tc-body">
      <div class="tc-row">
        <span class="label">Edge Case:</span> Clients ignore the due date reminder and never receive follow-ups.
      </div>
      <div class="tc-row">
        <span class="label">Scenario:</span> A client is 14 days overdue. The automated system only sent reminders 7 days before and exactly on the due date, stopping all communication afterward.
      </div>
      <div class="tc-row">
        <span class="label">Expected:</span> The system continues to automatically follow up on unpaid invoices at regular overdue intervals until marked paid.
      </div>
      <div class="tc-row fix">
        <span class="label">Fix:</span> Update the daily sweep to search for invoices that are exactly 3 days overdue, 7 days overdue, etc., and send a more "urgent" webhook payload to n8n.
      </div>
    </div>
  </div>

</body>
</html>
`;

(async () => {
  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: 'Edge_Case_Testing_Report.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px' }
  });

  await browser.close();
  console.log('PDF generated successfully!');
})();
