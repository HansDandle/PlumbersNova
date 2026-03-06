# Field Service Platform – Required Integrations

This document defines the third‑party integrations the platform must support to be competitive with modern field service software used by plumbing, HVAC, and electrical companies.

The system should be designed with an **integration layer** that supports REST APIs, OAuth authentication, and webhook ingestion.

---

# 1. Payroll Integration

## Gusto Integration
Platform: Gusto  
Website: https://gusto.com

Purpose:
Allow automatic payroll processing based on technician work hours and commissions logged inside the field service platform.

Capabilities Required:

- OAuth authentication with Gusto
- Sync employees from Gusto to the platform
- Map technicians to Gusto employee IDs
- Send payroll data to Gusto

Data to Send:

- Regular hours
- Overtime hours
- Bonuses
- Sales commissions
- Technician ID
- Pay period

Example Flow:

1. Technician completes a job
2. Job logs work hours
3. Platform aggregates hours per pay period
4. Hours and bonuses are sent to Gusto payroll API
5. Gusto processes payroll and direct deposits employee pay

---

# 2. Accounting Integration

## QuickBooks Online Integration
Platform: QuickBooks Online  
Company: Intuit

Purpose:
Allow invoices, payments, and expenses from the platform to sync automatically with the company’s accounting system.

Capabilities Required:

- OAuth connection
- Customer sync
- Invoice creation
- Payment reconciliation
- Tax mapping
- Expense tracking

Data to Sync:

From Platform → QuickBooks:
- Invoices
- Payments
- Customers
- Job revenue

From QuickBooks → Platform:
- Customer records
- Tax rules

---

# 3. Lead Marketplace Integrations

## Thumbtack Integration
Platform: Thumbtack

Purpose:
Import leads and customer messages from Thumbtack into the unified inbox.

Capabilities:

- Lead import
- Customer contact information
- Job request data
- Messaging webhook support (if available)

Fallback Option:
Parse incoming email notifications if direct messaging APIs are not available.

---

## Angi Integration
Platform: Angi (formerly Angie’s List)

Purpose:
Import leads and customer communications from Angi.

Capabilities:

- Lead ingestion
- Customer job requests
- Message notifications
- Lead status tracking

Fallback Option:
Email parsing integration.

---

# 4. Customer Messaging Integration

## SMS Integration
Provider Options:
- Twilio
- Vonage

Capabilities:

- Send SMS notifications
- Receive inbound customer messages
- Two‑way messaging
- Appointment reminders
- Job status updates

Example Use Cases:

- "Your plumber is on the way"
- Appointment confirmation
- Customer replies with questions

---

# 5. Maps & Routing

## Google Maps Integration
Platform: Google Maps Platform

Purpose:
Provide technician routing and job location services.

Capabilities:

- Address geocoding
- Technician route optimization
- Distance calculation
- Travel time estimation
- Map display inside technician mobile app

---

# 6. Payments

## Stripe Integration
Platform: Stripe

Purpose:
Allow businesses to accept payments directly through the platform.

Capabilities:

- Credit card payments
- ACH bank payments
- Save customer payment methods
- Invoice payment links
- Refunds
- Payment reporting

---

# 7. Email Integration

Provider Options:

- Gmail API
- Microsoft Outlook API

Purpose:
Capture customer messages and lead notifications from external platforms.

Capabilities:

- Email inbox monitoring
- Parsing structured lead notifications
- Converting email messages into platform chat messages

---

# 8. Calendar Integration

Supported Platforms:

- Google Calendar
- Microsoft Outlook Calendar

Purpose:
Allow technicians and dispatchers to sync schedules.

Capabilities:

- Two‑way calendar sync
- Job appointment creation
- Technician availability tracking
- Conflict detection

---

# 9. Architecture Requirements

The platform should implement a **modular integration service layer**.

Recommended architecture:
External Platforms
│
├ Payroll (Gusto)
├ Accounting (QuickBooks)
├ Lead Marketplaces (Thumbtack, Angi)
├ Messaging (Twilio)
├ Maps (Google Maps)
├ Payments (Stripe)
│
Integration Layer
│
Webhook Processor
│
Internal API
│
Core Platform


---

# 10. Unified Inbox Requirement

All customer communications must flow into a **single unified messaging inbox**.

Supported message sources:

- Platform native chat
- SMS
- Lead marketplaces
- Email

Inbox features:

- Message threading
- Customer identification
- Job association
- Technician assignment
- Notifications

---

# 11. Future Integrations (Optional but Recommended)

Possible additional integrations:

- Zapier
- Slack
- HubSpot
- Salesforce
- ServiceTitan data migration

---

# Goal

The goal is to ensure the platform becomes a **central operating system for home service businesses**, handling:

- Job scheduling
- Dispatch
- Messaging
- Payments
- Payroll
- Accounting
- Lead management