# n8n Workflows Expected By The React App

Set the React environment variable:

```env
REACT_APP_N8N_WEBHOOK_BASE=http://localhost:5678/webhook
```

During development, you can temporarily use:

```env
REACT_APP_N8N_WEBHOOK_BASE=http://localhost:5678/webhook-test
```

## Required Webhooks

| Workflow | Method | Path | Purpose |
| --- | --- | --- | --- |
| Auth - Register | POST | `/auth/register` | Create a user in MongoDB |
| Auth - Login | POST | `/auth/login` | Verify user and return user JSON |
| Dashboard - Get Data | POST | `/dashboard` | Return stats, invoices, and clients |
| Client - Create | POST | `/clients/create` | Create client records |
| Invoice - Create | POST | `/invoices/create` | Create invoice records |
| Reminder - Send | POST | `/reminders/send` | Generate and send reminder |

## Response Shapes

Login and register should return:

```json
{
  "token": "any-session-token-or-demo-token",
  "user": {
    "id": "mongodb-user-id",
    "name": "Aman Jha",
    "email": "aman@example.com",
    "company": "Internship Project",
    "timezone": "Asia/Kolkata"
  }
}
```

Dashboard should return:

```json
{
  "stats": {
    "totalAmount": 154500,
    "paidAmount": 64000,
    "overdueAmount": 28000,
    "overdueCount": 1,
    "dueSoonCount": 1,
    "invoiceCount": 3,
    "clientCount": 3,
    "collectionRate": 41
  },
  "invoices": [],
  "clients": []
}
```

Reminder send should return:

```json
{
  "message": "Reminder sent from n8n"
}
```
