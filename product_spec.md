# Plumbing Operations Platform

## Product Overview

This product is a lightweight operations platform for small and medium plumbing companies (2–15 technicians).

The platform helps companies manage:

- customer leads
- job scheduling
- technician workflow
- parts usage
- invoicing
- automated customer communication
- accounting synchronization

The system should feel significantly simpler than ServiceTitan but more operationally capable than Jobber or Housecall Pro.

The mobile experience for technicians is the primary priority.

---

# Target Users

## Owner
- monitors jobs
- views revenue and margins
- manages inventory
- manages pricing

## Dispatcher / Office Staff
- receives leads
- schedules jobs
- communicates with customers
- manages technician assignments

## Technician
- views assigned jobs
- records parts used
- adds notes and photos
- completes jobs
- generates invoices

Technicians must be able to complete a job workflow in under 10 interactions.

---

# Core Product Modules

1. Lead Intake
2. Dispatch / Scheduling
3. Job Management
4. Inventory Tracking
5. Invoicing
6. Messaging Automation
7. Accounting Sync

---

# Job Lifecycle

A job moves through the following states:

Lead  
↓  
Job Requested  
↓  
Scheduled  
↓  
Technician Assigned  
↓  
In Progress  
↓  
Completed  
↓  
Invoiced  
↓  
Paid

The system must allow office staff to move jobs between these states easily.

Technicians primarily interact with:

Assigned → In Progress → Completed.

---

# Lead Intake

Leads can originate from:

- incoming phone calls
- SMS conversations
- manual entry by office staff

Each lead contains:

Name  
Phone  
Address  
Description of problem  
Preferred time (optional)

When a lead is accepted it becomes a Job Request.

---

# Messaging Automation (Homebrew Signpost)

The platform includes an automated customer communication system.

## Features

### Missed Call Auto Text

If a phone call is missed, the system sends an automatic SMS message:

"Sorry we missed your call. What plumbing issue can we help with?"

Customer responses create a Lead.

---

### AI Lead Intake

The system may ask simple follow-up questions:

1. What plumbing issue are you having?
2. What is your address?
3. When would you like service?

These answers populate a Job Request.

---

### Appointment Confirmation

When a job is scheduled, the system sends an SMS confirmation:

"Your plumbing appointment is scheduled for tomorrow between 9–11 AM."

---

### Technician En Route Notification

When a technician marks a job as "En Route", send SMS:

"Your plumber is on the way and should arrive shortly."

---

### Review Request

After a job is completed:

"Thanks for choosing us. If you have a moment, please leave us a review."

---

# Dispatch / Scheduling

Dispatchers must be able to:

- view all open jobs
- assign technicians
- drag jobs onto a schedule
- reassign jobs easily

Dispatch UI should include:

Calendar View  
Technician List  
Unscheduled Jobs Queue

---

# Job Management

Each job contains:

Customer  
Address  
Problem description  
Assigned technician  
Scheduled time  
Notes  
Photos  
Parts used  
Labor entries  
Invoice

Technicians must be able to:

- add parts
- add notes
- take photos
- mark job complete

---

# Inventory Model

Inventory is tracked by location.

Locations include:

Warehouse  
Truck (per technician)  
Supply House Purchases

Each inventory item contains:

SKU  
Name  
Category  
Cost  
Optional default price

Example:

SKU: TEE-075  
Name: 3/4 Copper Tee  
Cost: $1.40

---

# Inventory Balances

Each location tracks a quantity balance.

Example:

Truck 4  
3/4 Tee → 6

Warehouse  
3/4 Tee → 120

Inventory counts are allowed to go negative.

The system must never block a technician from completing a job due to inventory mismatch.

---

# Using Parts on a Job

Technicians can add parts to a job by selecting:

- Truck inventory
- Warehouse inventory
- Supply house purchase

When a part is added:

- the job receives a line item
- the inventory count decreases (if from truck or warehouse)

---

# Invoicing

Invoices are generated directly from the job.

Invoice line items may include:

Service Call  
Labor  
Parts

Example Invoice:

Service Call – $125  
Labor – $150  
Parts – $8.40  

Total – $283.40

Invoices can be marked:

Unsent  
Sent  
Paid

---

# Accounting Integration

The system should sync invoices to accounting software.

Supported platforms:

QuickBooks  
Xero

Only high level invoice data needs to sync.

Do not attempt to replicate accounting logic.

---

# Notifications

System notifications include:

New Lead  
Job Assigned  
Inventory Low  
Job Completed  
Payment Received

Notifications may be sent via:

SMS  
Email  
In-app alerts

---

# Non Goals

The system should NOT attempt to implement:

Full ERP inventory management  
Supplier catalog integration  
Purchase order management  
Complex accounting systems  
Multi-company management

Keep the system focused on operational simplicity.

---

# Example Job

Customer: John Smith  
Phone: 555-1111  

Problem:
Kitchen sink leaking

Technician:
Mike

Parts Used:
1x 3/4 Copper Tee  
2x Copper Coupling

Invoice:

Service Call – $125  
Labor – $150  
Parts – $8.40

Total – $283.40

---

# Key Product Principles

1. Technicians should complete workflows quickly
2. Inventory should be helpful but not strict
3. Mobile UX is the highest priority
4. Office staff need strong visibility into jobs
5. Automation should reduce manual office work