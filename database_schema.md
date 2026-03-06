# Database Schema — Plumbing Operations Platform

**Database:** PostgreSQL  
**ORM:** Prisma  

---

## Entity Relationship Overview

```
User ──────────────────────────────────────────────┐
  │                                                 │
  ├── assignedJobs ──► Job ◄── Customer ◄── Lead    │
  ├── inventoryLocations ──► InventoryLocation       │
  ├── jobNotes ──────► JobNote                      │
  └── notifications ─► Notification                  │
                                                    │
Job ──► JobNote                                     │
     ──► JobPhoto                                   │
     ──► JobPart ──► InventoryItem                  │
     ──► LaborEntry                                 │
     ──► Invoice ──► InvoiceLineItem                │
                                                    │
InventoryLocation ──► InventoryBalance ◄── InventoryItem
                                                    │
Customer ──► Message ◄── Lead                       │
```

---

## Tables

### `users`

Stores all platform users. Role governs what each user can see and do.

| Column    | Type        | Notes                              |
|-----------|-------------|------------------------------------|
| id        | String (cuid) | Primary key                      |
| name      | String      |                                    |
| email     | String      | Unique                             |
| phone     | String?     | Optional                           |
| role      | Role enum   | OWNER, DISPATCHER, TECHNICIAN      |
| password  | String      | Hashed                             |
| createdAt | DateTime    |                                    |
| updatedAt | DateTime    |                                    |

---

### `customers`

People who have contacted the business or had work done.

| Column    | Type          | Notes       |
|-----------|---------------|-------------|
| id        | String (cuid) | Primary key |
| name      | String        |             |
| phone     | String        |             |
| address   | String?       |             |
| email     | String?       |             |
| createdAt | DateTime      |             |
| updatedAt | DateTime      |             |

---

### `leads`

Incoming service requests before they become confirmed jobs. A lead may or may not be linked to an existing customer.

| Column       | Type          | Notes                                       |
|--------------|---------------|---------------------------------------------|
| id           | String (cuid) | Primary key                                 |
| customerId   | String?       | FK → customers (optional at creation time)  |
| name         | String        | Contact name at intake                      |
| phone        | String        |                                             |
| address      | String?       |                                             |
| description  | String        | Problem description                         |
| preferredTime| String?       | Free text (e.g. "Tuesday afternoon")        |
| source       | LeadSource    | PHONE, SMS, MANUAL                          |
| status       | LeadStatus    | NEW, CONTACTED, CONVERTED, CLOSED           |
| createdAt    | DateTime      |                                             |
| updatedAt    | DateTime      |                                             |

---

### `jobs`

The central entity. Tracks a job from scheduling through payment.

| Column              | Type          | Notes                            |
|---------------------|---------------|----------------------------------|
| id                  | String (cuid) | Primary key                      |
| leadId              | String?       | FK → leads (unique, optional)    |
| customerId          | String        | FK → customers                   |
| address             | String        |                                  |
| problemDescription  | String        |                                  |
| technicianId        | String?       | FK → users                       |
| scheduledTime       | DateTime?     |                                  |
| scheduledEndTime    | DateTime?     |                                  |
| status              | JobStatus     | See lifecycle below              |
| createdAt           | DateTime      |                                  |
| updatedAt           | DateTime      |                                  |

**Job Status Lifecycle:**

```
JOB_REQUESTED → SCHEDULED → TECHNICIAN_ASSIGNED → EN_ROUTE → IN_PROGRESS → COMPLETED → INVOICED → PAID
```

---

### `job_notes`

Text notes added by technicians or office staff during a job.

| Column    | Type          | Notes            |
|-----------|---------------|------------------|
| id        | String (cuid) | Primary key      |
| jobId     | String        | FK → jobs        |
| authorId  | String        | FK → users       |
| content   | String        |                  |
| createdAt | DateTime      |                  |

---

### `job_photos`

Photos attached to a job.

| Column    | Type          | Notes       |
|-----------|---------------|-------------|
| id        | String (cuid) | Primary key |
| jobId     | String        | FK → jobs   |
| url       | String        | Storage URL |
| caption   | String?       |             |
| createdAt | DateTime      |             |

---

### `inventory_items`

The catalog of parts and materials.

| Column       | Type          | Notes                |
|--------------|---------------|----------------------|
| id           | String (cuid) | Primary key          |
| sku          | String        | Unique               |
| name         | String        |                      |
| category     | String?       |                      |
| cost         | Float         | Purchase/cost price  |
| defaultPrice | Float?        | Default sell price   |
| createdAt    | DateTime      |                      |
| updatedAt    | DateTime      |                      |

---

### `inventory_locations`

Named stock locations — warehouse, technician truck, or supply house.

| Column       | Type          | Notes                                        |
|--------------|---------------|----------------------------------------------|
| id           | String (cuid) | Primary key                                  |
| name         | String        | e.g. "Truck 4", "Warehouse"                  |
| type         | LocationType  | WAREHOUSE, TRUCK, SUPPLY_HOUSE               |
| technicianId | String?       | FK → users (only set when type = TRUCK)      |
| createdAt    | DateTime      |                                              |

---

### `inventory_balances`

Per-location quantity for each item. **Quantities may go negative** — the system must not block technicians from completing jobs.

| Column     | Type          | Notes                           |
|------------|---------------|---------------------------------|
| id         | String (cuid) | Primary key                     |
| locationId | String        | FK → inventory_locations        |
| itemId     | String        | FK → inventory_items            |
| quantity   | Int           | Can be negative                 |
| updatedAt  | DateTime      |                                 |

Unique constraint: `(locationId, itemId)`

---

### `job_parts`

Parts consumed on a job. Decrements inventory balance when source is TRUCK or WAREHOUSE.

| Column           | Type          | Notes                              |
|------------------|---------------|------------------------------------|
| id               | String (cuid) | Primary key                        |
| jobId            | String        | FK → jobs                          |
| itemId           | String        | FK → inventory_items               |
| quantity         | Int           |                                    |
| unitPrice        | Float         | Price charged to customer          |
| sourceLocationId | String?       | FK → inventory_locations (optional)|
| createdAt        | DateTime      |                                    |

---

### `labor_entries`

Labor line items on a job.

| Column      | Type          | Notes       |
|-------------|---------------|-------------|
| id          | String (cuid) | Primary key |
| jobId       | String        | FK → jobs   |
| description | String        |             |
| amount      | Float         |             |
| createdAt   | DateTime      |             |

---

### `invoices`

One invoice per job.

| Column             | Type          | Notes                              |
|--------------------|---------------|------------------------------------|
| id                 | String (cuid) | Primary key                        |
| jobId              | String        | FK → jobs (unique)                 |
| serviceCallAmount  | Float         | Default 0                          |
| status             | InvoiceStatus | UNSENT, SENT, PAID                 |
| total              | Float         | Computed sum of all line items      |
| externalId         | String?       | QuickBooks / Xero sync ID          |
| createdAt          | DateTime      |                                    |
| updatedAt          | DateTime      |                                    |

---

### `invoice_line_items`

Line items within an invoice.

| Column      | Type          | Notes                        |
|-------------|---------------|------------------------------|
| id          | String (cuid) | Primary key                  |
| invoiceId   | String        | FK → invoices                |
| type        | LineItemType  | SERVICE_CALL, LABOR, PART    |
| description | String        |                              |
| quantity    | Float         | Default 1                    |
| unitPrice   | Float         |                              |
| total       | Float         | quantity × unitPrice         |

---

### `messages`

Inbound and outbound SMS/email messages linked to a customer or lead.

| Column     | Type          | Notes                          |
|------------|---------------|--------------------------------|
| id         | String (cuid) | Primary key                    |
| customerId | String?       | FK → customers                 |
| leadId     | String?       | FK → leads                     |
| direction  | MessageDir    | INBOUND, OUTBOUND              |
| channel    | MessageChannel| SMS, EMAIL                     |
| content    | String        |                                |
| createdAt  | DateTime      |                                |

---

### `notifications`

In-app alerts for platform users.

| Column    | Type             | Notes                                                          |
|-----------|------------------|----------------------------------------------------------------|
| id        | String (cuid)    | Primary key                                                    |
| userId    | String           | FK → users                                                     |
| type      | NotificationType | NEW_LEAD, JOB_ASSIGNED, INVENTORY_LOW, JOB_COMPLETED, PAYMENT_RECEIVED |
| title     | String           |                                                                |
| message   | String           |                                                                |
| read      | Boolean          | Default false                                                  |
| createdAt | DateTime         |                                                                |

---

## Enums

| Enum             | Values                                                                          |
|------------------|---------------------------------------------------------------------------------|
| Role             | OWNER, DISPATCHER, TECHNICIAN                                                   |
| LeadSource       | PHONE, SMS, MANUAL                                                               |
| LeadStatus       | NEW, CONTACTED, CONVERTED, CLOSED                                               |
| JobStatus        | JOB_REQUESTED, SCHEDULED, TECHNICIAN_ASSIGNED, EN_ROUTE, IN_PROGRESS, COMPLETED, INVOICED, PAID |
| LocationType     | WAREHOUSE, TRUCK, SUPPLY_HOUSE                                                  |
| InvoiceStatus    | UNSENT, SENT, PAID                                                               |
| LineItemType     | SERVICE_CALL, LABOR, PART                                                        |
| MessageDir       | INBOUND, OUTBOUND                                                                |
| MessageChannel   | SMS, EMAIL                                                                       |
| NotificationType | NEW_LEAD, JOB_ASSIGNED, INVENTORY_LOW, JOB_COMPLETED, PAYMENT_RECEIVED         |

---

## Key Design Decisions

1. **Inventory can go negative** — never block a technician from completing a job.
2. **Leads and customers are separate** — a lead captures intake data before a customer record is confirmed.
3. **One invoice per job** — invoice total is recalculated from line items on update.
4. **Messages belong to customer or lead** — allows conversation threading even before a customer record exists.
5. **Inventory adjustments are soft** — job parts decrement balance via application logic, not DB triggers, to allow for SUPPLY_HOUSE purchases that have no source location.
