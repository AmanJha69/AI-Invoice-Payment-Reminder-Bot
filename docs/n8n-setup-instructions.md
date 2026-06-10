# n8n Setup Instructions

To get AI-powered reminders and invoices working, follow these steps in your n8n instance:

## Step 1: Create Credentials
1. Go to **Credentials** in the left sidebar and click **Add Credential**.
2. Search for **Google Gemini (PaLM) API** and select it.
3. Name it "Google Gemini API".
4. Get your API key from the `.env` file (`GOOGLE_GEMINI_API_KEY`) and paste it in. Save.
5. Click **Add Credential** again.
6. Search for **Gmail** and select **Gmail OAuth2**.
7. Name it "Gmail - aman3fordrive".
8. Complete the Google OAuth flow to connect `aman3fordrive@gmail.com`. Save.

## Step 2: Import Payment Reminder Workflow
1. Go to **Workflows** and click **Add Workflow**.
2. Click the menu (three dots) in the top right corner and select **Import from File...**
3. Select `docs/n8n-reminder-workflow.json` from this project.
4. Open the **Google Gemini** node. In the credentials dropdown, select the "Google Gemini API" credential you created.
5. Open the **Gmail** node. In the credentials dropdown, select the "Gmail - aman3fordrive" credential you created.
6. Double-click the **Webhook** node and copy the **Production URL**.
7. In the top right, toggle the workflow from **Inactive** to **Active**.

## Step 3: Import Invoice Sender Workflow
1. Go to **Workflows** and click **Add Workflow**.
2. Click the menu and select **Import from File...**
3. Select `docs/n8n-invoice-workflow.json`.
4. Update the credentials for both the **Google Gemini** and **Gmail** nodes as you did in Step 2.
5. Double-click the **Webhook** node and copy the **Production URL**.
6. Toggle the workflow to **Active**.

## Step 4: Update Express `.env`
1. Open the `.env` file in the root of your server project.
2. Ensure the URLs match your active n8n webhooks:
   ```env
   N8N_REMINDER_WEBHOOK_URL=http://localhost:5678/webhook/reminder/send
   N8N_INVOICE_WEBHOOK_URL=http://localhost:5678/webhook/invoice/send
   ```
   *(If your n8n is running somewhere other than localhost:5678, update these URLs accordingly).*
3. Restart your Express server for the changes to take effect.
