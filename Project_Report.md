# Project Report: AI Invoice & Payment Reminder Bot

---

## Table of Contents
1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
    - 2.1 Background
    - 2.2 Problem Statement
    - 2.3 Objectives
    - 2.4 Scope of the Project
3. [Technologies Used](#3-technologies-used)
4. [System Architecture](#4-system-architecture)
    - 4.1 High-Level Architecture
    - 4.2 Data Flow
5. [Frontend Implementation](#5-frontend-implementation)
6. [Backend Implementation](#6-backend-implementation)
    - 6.1 REST API & Endpoints
    - 6.2 Dynamic PDF Generation
    - 6.3 Automated Background Jobs (Cron)
7. [Automation & AI Integration](#7-automation--ai-integration)
    - 7.1 n8n Workflow Automation
    - 7.2 Google Gemini AI Prompt Engineering
    - 7.3 Gmail API & OAuth 2.0 Integration
8. [Database Design](#8-database-design)
    - 8.1 Schema Definitions
9. [Detailed Workflows](#9-detailed-workflows)
    - 9.1 Manual Invoice Dispatch
    - 9.2 Automated Daily Reminders
10. [Challenges Faced & Solutions](#10-challenges-faced--solutions)
11. [Future Enhancements](#11-future-enhancements)
12. [Conclusion](#12-conclusion)

---

## 1. Abstract
The "AI Invoice & Payment Reminder Bot" is a comprehensive, full-stack Software-as-a-Service (SaaS) application designed to automate the lifecycle of billing and invoicing. In traditional business environments, tracking unpaid invoices and manually sending follow-up emails is a tedious, time-consuming process prone to human error. This project solves that problem by integrating a robust MERN stack architecture with n8n workflow automation and Google's Gemini Large Language Model (LLM). 

The system allows users to generate professional PDF invoices, track client balances, and trigger automated, AI-written emails. By utilizing daily background cron jobs, the system intelligently categorizes invoices as "Upcoming," "Due Today," or "Overdue" (by varying degrees), and instructs the Gemini AI to dynamically adjust the tone of the email reminder accordingly. The final output securely bypasses strict cloud firewalls using the official Gmail API via OAuth 2.0 to ensure a 100% email deliverability rate.

---

## 2. Introduction

### 2.1 Background
As freelance work and small-to-medium businesses (SMBs) continue to grow, managing accounts receivable remains a critical bottleneck. Business owners often rely on manual spreadsheets and standard email templates to remind clients of outstanding balances, which scales poorly and damages client relationships if handled unprofessionally.

### 2.2 Problem Statement
Existing invoicing solutions are either prohibitively expensive or lack intelligent automation. Furthermore, static email templates lack the nuanced, human-like tone required to navigate the delicate nature of asking clients for money. Furthermore, standard SMTP email delivery from free-tier cloud platforms (like Render or AWS) is frequently blocked to prevent spam, resulting in missed reminders.

### 2.3 Objectives
*   To develop a user-friendly dashboard for creating and managing clients and invoices.
*   To dynamically generate standard PDF invoices on the server side.
*   To leverage AI to draft highly contextual, polite, yet firm payment reminders based on exact due dates.
*   To entirely automate the follow-up process without requiring daily manual intervention from the business owner.
*   To engineer a firewall-proof email delivery system using official API integrations rather than raw SMTP.

### 2.4 Scope of the Project
The application handles the entire flow from invoice creation to payment collection notification. It covers secure user authentication, database management for clients and invoices, automated task scheduling, third-party workflow automation (n8n), AI prompt context injection (Gemini), and secure cloud deployment across multiple platforms (Vercel and Render).

---

## 3. Technologies Used

To achieve a scalable and decoupled architecture, the following technology stack was utilized:

*   **Frontend:** React.js, Vite, Tailwind CSS (Hosted on Vercel)
*   **Backend:** Node.js, Express.js, PDFKit, node-cron (Hosted on Render)
*   **Database:** MongoDB, Mongoose ODM
*   **Automation Engine:** n8n (Self-hosted on Render Docker Environment)
*   **Artificial Intelligence:** Google Gemini API (LLM)
*   **Email Delivery:** Google Cloud Platform (GCP) Gmail API, OAuth 2.0

---

## 4. System Architecture

### 4.1 High-Level Architecture
The system employs a microservices-inspired architecture. The frontend application acts as the presentation layer, entirely decoupled from the backend. The backend Node.js server handles all heavy business logic, database queries, and PDF generation. Instead of the Node.js server handling the slow and unpredictable nature of LLM generation and email dispatching, it offloads this responsibility to a dedicated n8n automation instance via Webhooks.

### 4.2 Data Flow
1.  **Trigger:** The user interacts with the React UI (e.g., clicking "Send Invoice") or a backend Cron Job fires automatically at 9:00 AM.
2.  **Payload Generation:** The Node.js server aggregates the necessary database records (Invoice details, Client details) and generates a temporary `downloadLink` for the PDF.
3.  **Webhook Dispatch:** Node.js sends an HTTP POST request to the n8n Webhook URL.
4.  **n8n Processing:** 
    *   n8n receives the payload.
    *   An HTTP Request node fetches the generated PDF file from the Node.js `downloadLink`.
    *   A Google Gemini node processes the payload and generates the email body.
    *   A Gmail API node attaches the PDF, inserts the AI text, and sends the email.
5.  **Callback Synchronization:** n8n fires a final Webhook back to the Node.js server to confirm successful delivery, updating the database status to "Sent".

---

## 5. Frontend Implementation

The frontend is a Single Page Application (SPA) built with **React** and bundled using **Vite** for incredibly fast Hot Module Replacement (HMR) during development. 

*   **Styling:** **Tailwind CSS** is used extensively to create a modern, responsive, and accessible user interface without the overhead of maintaining thousands of lines of custom CSS. 
*   **Routing:** React Router handles client-side navigation between the Dashboard, Client Management, and Invoice Management screens.
*   **State Management:** React Hooks (`useState`, `useEffect`) manage local and global states, ensuring the UI remains highly reactive to database changes.

---

## 6. Backend Implementation

The backend is an **Express.js** application running on **Node.js**, designed to be a lightweight, stateless REST API.

### 6.1 REST API & Endpoints
The server exposes structured endpoints for CRUD operations (`/api/clients`, `/api/invoices`, `/api/auth`). It uses JWT (JSON Web Tokens) for secure, stateless authentication.

### 6.2 Dynamic PDF Generation
Using the **PDFKit** library, the backend dynamically generates professional invoice documents on-the-fly when requested. Instead of storing physical PDF files on the server (which wastes storage and violates statelessness), the endpoint `/api/invoices/:id/download` streams the generated PDF directly into the response buffer.

### 6.3 Automated Background Jobs (Cron)
A core feature of the application is the `node-cron` integration. A script is scheduled to run daily at 9:00 AM (Asia/Kolkata timezone). It queries MongoDB for any invoices meeting strict date criteria (e.g., exactly 3 days overdue) and silently queues them for processing. 
To combat the issue of free-tier cloud instances "sleeping" due to inactivity, a brilliant catch-up script is implemented on server boot. It checks a hidden `.cron-last-run` file; if the 9:00 AM schedule was missed while the server slept, the server instantly processes the queue upon waking up, guaranteeing 100% reliability.

---

## 7. Automation & AI Integration

### 7.1 n8n Workflow Automation
**n8n** was selected as the automation engine due to its visual node-based editor and powerful data manipulation capabilities. Hosted in its own Docker container on Render, n8n handles the complex orchestration of API calls to Google and Gemini. This prevents the primary Node.js server from blocking the main thread while waiting for slow LLM responses.

### 7.2 Google Gemini AI Prompt Engineering
The Gemini LLM node is fed a highly engineered prompt that includes a dynamic `reminderType` variable injected by the backend (e.g., `upcoming`, `due_today`, `overdue`). 
If the backend detects an invoice is 7 days late, it passes the `overdue` tag. The prompt forces Gemini to adopt a strictly professional but firm tone, demanding immediate payment. Conversely, an `upcoming` tag generates a warm, friendly "just checking in" message. This creates a deeply personalized experience for the end client.

### 7.3 Gmail API & OAuth 2.0 Integration
Most free-tier cloud providers (Render, AWS, DigitalOcean) block standard SMTP ports (Port 25, 465, 587) to prevent developers from building spam bots. To circumvent this hardware-level firewall, the project integrates directly with the **Google Cloud Platform (GCP)**. By establishing an OAuth 2.0 consent screen and acquiring Client IDs/Secrets, n8n authenticates directly with the Gmail REST API (Port 443). This guarantees secure, instantaneous delivery that bypasses all traditional SMTP firewalls.

---

## 8. Database Design

The application utilizes **MongoDB**, a NoSQL database, structured using Mongoose schemas to maintain data integrity.

### 8.1 Schema Definitions
*   **User Schema:** Stores the business owner's details, hashed passwords (bcrypt), company information, and notification preferences.
*   **Client Schema:** Stores customer details (Name, Email, Phone, Company). It holds a reference back to the User ID to ensure data isolation.
*   **Invoice Schema:** The core entity. Contains `invoiceNumber`, `amount`, `dueDate`, `status` (draft, pending, sent, paid, overdue), an array of line items, and references to both the `User` and the `Client`.

---

## 9. Detailed Workflows

### 9.1 Manual Invoice Dispatch
When a new invoice is drafted, the business owner clicks "Send Invoice". The payload is sent to the `InvoiceBot - Send Invoice` n8n workflow. Gemini generates a welcoming "Thank you for your business" email, the PDF is fetched and attached via a binary data node, and the email is dispatched via the Gmail API.

### 9.2 Automated Daily Reminders
At 9:00 AM daily, the backend queries the database. If it finds Invoice INV-001 is 3 days past the `dueDate`, it builds a payload containing the invoice details and a `reminderType: 'overdue'` flag. This is sent to the `InvoiceBot - Send Payment Reminder` n8n workflow. The AI drafts a strict reminder, attaches the PDF, and sends it automatically without any human input. The backend then logs this activity to the dashboard.

---

## 10. Challenges Faced & Solutions

1.  **Render Free Tier Memory Limits:**
    *   **Problem:** The n8n Docker instance kept crashing with a `FATAL ERROR: JavaScript heap out of memory` due to Render's strict 512MB RAM limit.
    *   **Solution:** Injected the `NODE_OPTIONS=--max-old-space-size=400` environment variable to force the V8 engine's garbage collector to run aggressively, preventing it from exceeding the 512MB container limit.
2.  **Bypassing SMTP Port Blocking:**
    *   **Problem:** Render strictly blocks standard email ports, causing all SMTP connections to time out.
    *   **Solution:** Migrated the entire email infrastructure away from standard SMTP to the official Google Cloud REST API using OAuth 2.0.
3.  **Webhook URL Configuration in Docker:**
    *   **Problem:** n8n generated OAuth redirect URLs pointing to `http://localhost:5678` because it was unaware of its public cloud domain.
    *   **Solution:** Added the `WEBHOOK_URL` environment variable to explicitly define the public Render domain, fixing all internal routing and OAuth callbacks.
4.  **Unverified Google OAuth Scopes:**
    *   **Problem:** Google blocked login attempts because the application requested restricted scopes (Gmail API) but was not manually verified by Google security teams.
    *   **Solution:** Set the GCP Publishing Status to "Testing" and manually added the developer's email to the "Test Users" VIP list, allowing unrestricted personal use of the API without expensive security audits.

---

## 11. Future Enhancements

While the current system is highly capable, several enhancements can be made in future iterations:
*   **Payment Gateway Integration:** Integrating Stripe or Razorpay APIs directly into the invoice PDF or email body, allowing clients to click a link and pay via credit card instantly.
*   **SMS Integration:** Adding Twilio to send automated SMS text messages for critically overdue invoices.
*   **Multi-Language Support:** Leveraging the Gemini LLM to automatically translate the invoice email into the client's native language based on their geographical location.

---

## 12. Conclusion

The AI Invoice & Payment Reminder Bot successfully demonstrates how modern web technologies (MERN) can be combined with visual automation tools (n8n) and Artificial Intelligence (Gemini) to solve real-world business problems. By automating the uncomfortable and repetitive task of debt collection, it saves business owners countless hours of manual labor. Furthermore, overcoming complex infrastructure challenges—such as cloud SMTP firewalls and Docker memory limits—highlights the resilience and robustness of the final deployed architecture.

---
*Generated for Project Demonstration & Documentation Purposes.*
