/**
 * Price book seed — run with:
 *   npx tsx prisma/seedPricebook.ts
 *
 * Upserts all tasks from the 2022 master price book PDF into the
 * bootstrap-company (and any other company that already exists).
 * Safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TASKS: { category: string; name: string; description?: string; unitPrice: number }[] = [
  // ── Fees ──────────────────────────────────────────────────────────────────
  { category: 'Fees', name: 'Service Fee — Same Day Emergency (Before 4 PM)', unitPrice: 79 },
  { category: 'Fees', name: 'Emergency Fee (Weekend & Weekday 5–8 PM)', unitPrice: 79 },
  { category: 'Fees', name: 'Saturday Same Day (8–4)', unitPrice: 129 },
  { category: 'Fees', name: 'Emergency Fee (After 8 PM)', unitPrice: 149 },
  { category: 'Fees', name: 'Emergency Fee (Weekday After 5)', unitPrice: 129 },
  { category: 'Fees', name: 'Saturday Pre-Scheduled (8–5)', unitPrice: 79 },
  { category: 'Fees', name: 'Saturday After 5 PM', unitPrice: 199 },
  { category: 'Fees', name: 'Sunday Late Night', unitPrice: 249 },
  { category: 'Fees', name: 'Leak Inspection (not responsible for drywall repair)', unitPrice: 260 },
  { category: 'Fees', name: 'Realtor Letter', unitPrice: 165 },
  { category: 'Fees', name: 'Limited Access Fee', unitPrice: 170 },
  { category: 'Fees', name: 'High Rise / Water Main Shut-Down Fee', unitPrice: 170 },
  { category: 'Fees', name: 'Permit Fee', unitPrice: 390 },
  { category: 'Fees', name: '½ Hour Written Inspection', unitPrice: 165 },
  { category: 'Fees', name: '1 Hour Written Inspection', unitPrice: 235 },
  { category: 'Fees', name: 'Winterization (starting at)', unitPrice: 695 },
  { category: 'Fees', name: 'De-Winterization (starting at)', unitPrice: 555 },
  { category: 'Fees', name: 'Water Pressure Test', unitPrice: 85 },
  { category: 'Fees', name: 'Water Quality Test', unitPrice: 145 },
  { category: 'Fees', name: 'Hourly Labor (1–4 hours)', unitPrice: 165 },
  { category: 'Fees', name: 'Smoke Test', unitPrice: 1150 },
  { category: 'Fees', name: 'Visual Inspection of Home Drains & Exposed Venting', unitPrice: 149 },

  // ── Drain Cleaning ────────────────────────────────────────────────────────
  { category: 'Drain Cleaning', name: 'Hydro-Jetting (up to 2 hours)', unitPrice: 1150 },
  { category: 'Drain Cleaning', name: 'Hydro-Jetting — Each Additional Hour', unitPrice: 255 },
  { category: 'Drain Cleaning', name: 'Hydro-Jetting 3" Lines or Smaller (up to 2 hours)', unitPrice: 785 },
  { category: 'Drain Cleaning', name: 'Hydro-Jetting 3" Lines — Each Additional Hour', unitPrice: 205 },
  { category: 'Drain Cleaning', name: 'Cable Sewer Main through Accessible Cleanout', unitPrice: 385 },
  { category: 'Drain Cleaning', name: 'Manually Remove Blockage from Sewage Pump', unitPrice: 385 },
  { category: 'Drain Cleaning', name: 'Cable 2–4" Drain through Cleanout or Floor Drain', unitPrice: 330 },
  { category: 'Drain Cleaning', name: 'Vacuum Floor Drain Only', unitPrice: 165 },
  { category: 'Drain Cleaning', name: 'Cable Toilet with Closet Auger', unitPrice: 255 },
  { category: 'Drain Cleaning', name: 'Cable Toilet by Removing & Resetting (no machine)', unitPrice: 395 },
  { category: 'Drain Cleaning', name: 'Cable Sewer Main — Pull & Reset Toilet (up to 100\')', unitPrice: 605 },
  { category: 'Drain Cleaning', name: 'Manually Remove Blockage from Garbage Disposal', unitPrice: 185 },
  { category: 'Drain Cleaning', name: 'Individual Fixture Drain Cleaning — ¼" Machine', unitPrice: 255 },
  { category: 'Drain Cleaning', name: 'Individual Fixture Drain Cleaning — ½" Machine', unitPrice: 330 },
  { category: 'Drain Cleaning', name: 'Cable Lavatory Drain with P-Trap Replacement', unitPrice: 350 },
  { category: 'Drain Cleaning', name: 'Cable Tub Drain — Remove & Replace Drum Trap Cap', unitPrice: 505 },
  { category: 'Drain Cleaning', name: 'Chemical Treatment', unitPrice: 260 },
  { category: 'Drain Cleaning', name: 'Add-On Chemical Treatment', unitPrice: 115 },
  { category: 'Drain Cleaning', name: 'Add-On: Removal & Replacement of Cleanout Cap', unitPrice: 95 },
  { category: 'Drain Cleaning', name: 'Remove & Replace Broken Cleanout Cap', unitPrice: 245 },
  { category: 'Drain Cleaning', name: 'Add-On: Interior Overhead Cleanout (Drill, Drain, Pump)', unitPrice: 445 },
  { category: 'Drain Cleaning', name: 'Video Camera Inspection (up to 1 hour)', unitPrice: 260 },
  { category: 'Drain Cleaning', name: 'Add-On Video Inspection', unitPrice: 120 },
  { category: 'Drain Cleaning', name: 'Add-On Drain Cleaning — ¼" Cable', unitPrice: 130 },
  { category: 'Drain Cleaning', name: 'Add-On Drain Cleaning — ⅜" Cable', unitPrice: 195 },

  // ── Kitchen Sinks ─────────────────────────────────────────────────────────
  { category: 'Kitchen Sinks', name: 'Install Customer-Supplied Kitchen Faucet', description: '$8 charge for each supply line', unitPrice: 259 },
  { category: 'Kitchen Sinks', name: 'Install Customer-Supplied Electronic Faucet', unitPrice: 319 },
  { category: 'Kitchen Sinks', name: 'Install Customer-Supplied Kitchen Sink with Faucet (basic)', unitPrice: 749 },
  { category: 'Kitchen Sinks', name: 'Install Braided SS Supply Line', unitPrice: 179 },
  { category: 'Kitchen Sinks', name: 'Install Customer-Supplied Garbage Disposal', unitPrice: 329 },
  { category: 'Kitchen Sinks', name: 'Install Customer-Supplied Dishwasher', unitPrice: 509 },
  { category: 'Kitchen Sinks', name: 'Install Braided Stainless Supply Line for Dishwasher', unitPrice: 275 },
  { category: 'Kitchen Sinks', name: 'Install Copper Tee and ½" Angle Stop', unitPrice: 365 },
  { category: 'Kitchen Sinks', name: 'Re-Connect Service for New Countertops (basic)', unitPrice: 529 },
  { category: 'Kitchen Sinks', name: 'Replace Continuous Waste with Proper Sink Drainage', unitPrice: 435 },
  { category: 'Kitchen Sinks', name: '1 Basket Strainer', unitPrice: 465 },
  { category: 'Kitchen Sinks', name: '2 Basket Strainers', unitPrice: 480 },
  { category: 'Kitchen Sinks', name: 'Add-On P-Trap or Minor Tubular Repair', unitPrice: 95 },
  { category: 'Kitchen Sinks', name: 'Re-Pipe All Kitchen Sink Drainage with New Basket Strainers', unitPrice: 535 },
  { category: 'Kitchen Sinks', name: 'Lower Waste Arm & Re-Pipe All Kitchen Sink Drainage', unitPrice: 815 },
  { category: 'Kitchen Sinks', name: 'Install Stainless Steel Basket Strainer', unitPrice: 225 },
  { category: 'Kitchen Sinks', name: 'Remove Garbage Disposal & Replace with Basket Strainer', unitPrice: 365 },
  { category: 'Kitchen Sinks', name: 'Install Customer-Supplied Reverse Osmosis System', unitPrice: 510 },
  { category: 'Kitchen Sinks', name: 'Cable Kitchen Sink (up to 25\') — ½" Cable', unitPrice: 255 },
  { category: 'Kitchen Sinks', name: 'Cable Kitchen Sink (up to 50\') — ½" Cable', unitPrice: 330 },

  // ── Toilets & Urinals ─────────────────────────────────────────────────────
  { category: 'Toilets & Urinals', name: 'Replace Wax Ring with New Supply Line (up to 2, no repair)', unitPrice: 285 },
  { category: 'Toilets & Urinals', name: 'Pull & Reset Toilet with New Wax Seal (up to 2, no repair)', unitPrice: 260 },
  { category: 'Toilets & Urinals', name: 'Pull & Reset Toilet — with Minor Flange Repair', unitPrice: 385 },
  { category: 'Toilets & Urinals', name: 'Install Urinal Wax/Foam Ring', unitPrice: 510 },
  { category: 'Toilets & Urinals', name: 'Install Fluidmaster PRO Fill Valve with New Supply Line', unitPrice: 265 },
  { category: 'Toilets & Urinals', name: 'Install Fluidmaster Fill Valve and Flapper', unitPrice: 355 },
  { category: 'Toilets & Urinals', name: 'Install Manufacturer Toilet Flapper', unitPrice: 195 },
  { category: 'Toilets & Urinals', name: 'Add-On Toilet Flapper', unitPrice: 120 },
  { category: 'Toilets & Urinals', name: 'Install New Tank-to-Bowl Bolts and Gasket', unitPrice: 360 },
  { category: 'Toilets & Urinals', name: 'Install New Flush Valve, Flapper, and Bolts', unitPrice: 425 },
  { category: 'Toilets & Urinals', name: 'Flush Lever and Korky Flapper Replacement', unitPrice: 265 },
  { category: 'Toilets & Urinals', name: 'Complete Toilet Rebuild', unitPrice: 490 },
  { category: 'Toilets & Urinals', name: 'Install Customer-Supplied Toilet', unitPrice: 365 },
  { category: 'Toilets & Urinals', name: 'Add-On: Minor Flange Repair', unitPrice: 225 },
  { category: 'Toilets & Urinals', name: 'Add-On: Angle Stop and Escutcheon', unitPrice: 145 },
  { category: 'Toilets & Urinals', name: 'Install White Plastic Slow-Close Toilet Seat', unitPrice: 235 },
  { category: 'Toilets & Urinals', name: 'Cable Toilet — Manual Auger', unitPrice: 245 },
  { category: 'Toilets & Urinals', name: 'Cable Toilet — Remove & Reset (no machine)', unitPrice: 405 },
  { category: 'Toilets & Urinals', name: 'Install Angle Stop for Toilet with New Supply Line', unitPrice: 235 },
  { category: 'Toilets & Urinals', name: 'Install Toilet Flush Lever', unitPrice: 225 },

  // ── Bathroom Sinks & Faucets ──────────────────────────────────────────────
  { category: 'Bathroom Sinks & Faucets', name: 'Replace Single Handle Faucet Cartridge', unitPrice: 305 },
  { category: 'Bathroom Sinks & Faucets', name: 'Replace Double Handle Valve Stem/Cartridge (each)', unitPrice: 260 },
  { category: 'Bathroom Sinks & Faucets', name: 'Install Customer-Supplied 4" Lavatory Faucet', description: 'Extra charge for supply lines', unitPrice: 299 },
  { category: 'Bathroom Sinks & Faucets', name: 'Install Customer-Supplied 8" Lavatory Faucet', description: 'Extra charge for supply lines', unitPrice: 339 },
  { category: 'Bathroom Sinks & Faucets', name: 'Rebuild Marvel Adapter & Install New P-Trap', unitPrice: 425 },
  { category: 'Bathroom Sinks & Faucets', name: 'Replace Angle Stop', unitPrice: 180 },
  { category: 'Bathroom Sinks & Faucets', name: 'Replace Angle Stop with New Supply Line', unitPrice: 220 },
  { category: 'Bathroom Sinks & Faucets', name: 'Replace Pop-Up Assembly', unitPrice: 245 },
  { category: 'Bathroom Sinks & Faucets', name: 'Install Commercial Grid Strainer (Kohler, Chrome)', unitPrice: 350 },
  { category: 'Bathroom Sinks & Faucets', name: 'Replace P-Trap', unitPrice: 245 },
  { category: 'Bathroom Sinks & Faucets', name: 'Install Customer-Supplied Bathroom Vanity (up to 30")', description: 'Starting at', unitPrice: 770 },
  { category: 'Bathroom Sinks & Faucets', name: 'Install Customer-Supplied Pedestal Sink', description: 'Starting at', unitPrice: 830 },
  { category: 'Bathroom Sinks & Faucets', name: 'Cable Bathroom Sink (up to 25\')', unitPrice: 255 },
  { category: 'Bathroom Sinks & Faucets', name: 'Cable Bathroom Sink (up to 50\')', unitPrice: 330 },

  // ── Tubs & Showers ────────────────────────────────────────────────────────
  { category: 'Tubs & Showers', name: 'Replace Moen 1225 Cartridge', unitPrice: 305 },
  { category: 'Tubs & Showers', name: 'Replace Moen Posi-Temp Cartridge', unitPrice: 365 },
  { category: 'Tubs & Showers', name: 'Replace Delta Pressure Balancing Cartridge', unitPrice: 405 },
  { category: 'Tubs & Showers', name: 'Replace Price Pfister Single Handle Cartridge', unitPrice: 390 },
  { category: 'Tubs & Showers', name: 'Replace Delta Seats & Springs', unitPrice: 285 },
  { category: 'Tubs & Showers', name: 'Replace Kohler 2-Part Cartridge & Pressure Balancing Assembly', unitPrice: 415 },
  { category: 'Tubs & Showers', name: 'Install Customer-Supplied Tub/Shower/Sink Cartridge (no warranty)', unitPrice: 265 },
  { category: 'Tubs & Showers', name: 'Install New Tub/Shower Trim Kit (basic chrome)', description: 'Starting at', unitPrice: 410 },
  { category: 'Tubs & Showers', name: 'Replace Single Handle on Tub/Shower Valve', unitPrice: 205 },
  { category: 'Tubs & Showers', name: 'Replace 2-Handle Valve Stems', unitPrice: 405 },
  { category: 'Tubs & Showers', name: 'Replace 3-Handle Valve Stems', unitPrice: 595 },
  { category: 'Tubs & Showers', name: 'Install Customer-Supplied Shower Valve (basic, no warranty)', unitPrice: 760 },
  { category: 'Tubs & Showers', name: 'Install Moen Posi-Temp Shower Valve — Chateau Trim', unitPrice: 935 },
  { category: 'Tubs & Showers', name: 'Install Moen Posi-Temp Shower Valve — 3-Hole Conversion Plate', unitPrice: 1095 },
  { category: 'Tubs & Showers', name: 'Replace Toe-Tip Drain & Overflow Plate (chrome)', unitPrice: 310 },
  { category: 'Tubs & Showers', name: 'Replace Toe-Tip Drain Only (chrome)', unitPrice: 225 },
  { category: 'Tubs & Showers', name: 'Replace Waste & Overflow — Poly/Chrome', unitPrice: 540 },
  { category: 'Tubs & Showers', name: 'Replace Waste & Overflow — PVC/Chrome', unitPrice: 635 },
  { category: 'Tubs & Showers', name: 'Replace Waste & Overflow + P-Trap — Poly/Chrome', unitPrice: 720 },
  { category: 'Tubs & Showers', name: 'Remove Drum Trap & Install New PVC P-Trap', unitPrice: 995 },
  { category: 'Tubs & Showers', name: 'Install New Brass Shower Drain and PVC P-Trap', unitPrice: 605 },
  { category: 'Tubs & Showers', name: 'Replace Tub P-Trap', description: 'May require new waste and overflow', unitPrice: 435 },
  { category: 'Tubs & Showers', name: 'Replace Tub Spout (chrome)', unitPrice: 235 },
  { category: 'Tubs & Showers', name: 'Replace Shower Head', unitPrice: 230 },
  { category: 'Tubs & Showers', name: 'Install Customer-Supplied Showerhead', unitPrice: 195 },

  // ── Pumps ─────────────────────────────────────────────────────────────────
  { category: 'Pumps', name: 'Install Economy Sump Pump with New Check Valve', unitPrice: 480 },
  { category: 'Pumps', name: 'Install Liberty ⅓ HP Sump Pump with New Check Valve', unitPrice: 595 },
  { category: 'Pumps', name: 'Install Liberty ½ HP Sump Pump with New Check Valve', unitPrice: 635 },
  { category: 'Pumps', name: 'Install Liberty Ejector Pump with New Check Valve', unitPrice: 845 },
  { category: 'Pumps', name: 'Manually Remove Blockage from Sewage Pump', unitPrice: 390 },
  { category: 'Pumps', name: 'Install Economy Sump Pump — Under-Sink System', unitPrice: 610 },
  { category: 'Pumps', name: 'Install Customer-Supplied Sump Pump (no warranty)', unitPrice: 360 },
  { category: 'Pumps', name: 'Install Customer-Supplied BBU System (no warranty)', unitPrice: 550 },
  { category: 'Pumps', name: 'Install Customer-Supplied Sewage Pump (no warranty)', unitPrice: 465 },
  { category: 'Pumps', name: 'Install 1¼" Quiet-Close Check Valve', unitPrice: 235 },
  { category: 'Pumps', name: 'Install 2" Quiet-Close Check Valve', unitPrice: 335 },
  { category: 'Pumps', name: 'Install Vertical Float Switch — Sump Pump', unitPrice: 265 },
  { category: 'Pumps', name: 'Install Vertical Float Switch — Sewage Pump', unitPrice: 425 },
  { category: 'Pumps', name: 'Re-Pipe Sump Pump Discharge with New Check Valve (up to 10\')', unitPrice: 365 },
  { category: 'Pumps', name: 'Install Liberty 441 Battery Backup System (basic)', unitPrice: 1305 },
  { category: 'Pumps', name: 'Install Liberty 442-10A Battery Backup System (basic)', unitPrice: 1780 },
  { category: 'Pumps', name: 'Install Liberty 442-10A-EYE Battery Backup System (basic)', unitPrice: 2115 },
  { category: 'Pumps', name: 'Install Zoeller Aquanot Gel Battery', unitPrice: 575 },
  { category: 'Pumps', name: 'Install Basement Watchdog Acid Battery', unitPrice: 515 },

  // ── Water Heaters ─────────────────────────────────────────────────────────
  { category: 'Water Heaters', name: 'Drain Water Heater / Recharge Air Chambers', unitPrice: 255 },
  { category: 'Water Heaters', name: 'Install Customer-Supplied Water Heater 40 or 50 Gal. (no warranty)', unitPrice: 705 },
  { category: 'Water Heaters', name: 'Install Bradford White 40 Gallon', unitPrice: 1750 },
  { category: 'Water Heaters', name: 'Install Bradford White 50 Gallon', unitPrice: 1825 },
  { category: 'Water Heaters', name: 'Install Bradford White 75 Gallon', unitPrice: 2540 },
  { category: 'Water Heaters', name: 'Install Bradford White 40 Gallon POWERVENT', unitPrice: 2585 },
  { category: 'Water Heaters', name: 'Install Bradford White 50 Gallon POWERVENT', unitPrice: 2695 },
  { category: 'Water Heaters', name: 'Install Bradford White 75 Gallon POWERVENT', unitPrice: 3250 },
  { category: 'Water Heaters', name: 'Add-On Ball Valve', unitPrice: 95 },
  { category: 'Water Heaters', name: 'Add-On Saddle Valve to Angle Stop', unitPrice: 120 },
  { category: 'Water Heaters', name: 'Add-On Galvanized/Flex Conversion', unitPrice: 165 },
  { category: 'Water Heaters', name: 'Add-On Flexible Gas Conversion', unitPrice: 150 },
  { category: 'Water Heaters', name: 'Add-On Drip Pan with 1" Piping', unitPrice: 250 },
  { category: 'Water Heaters', name: 'Add-On Return/Re-Circulating Line Installation', unitPrice: 205 },
  { category: 'Water Heaters', name: 'Navien NPE 240-A Tankless (basic install)', unitPrice: 5005 },
  { category: 'Water Heaters', name: 'Navien NPE 240-S Tankless (basic install)', unitPrice: 4775 },
  { category: 'Water Heaters', name: 'Add-On Navi-Link Wi-Fi Controller', unitPrice: 340 },
  { category: 'Water Heaters', name: 'Tankless Water Heater Flushing / Service', unitPrice: 325 },
  { category: 'Water Heaters', name: 'Supply & Install Gas Control Valve', unitPrice: 765 },
  { category: 'Water Heaters', name: 'Install Customer-Supplied Gas Control Valve (no warranty)', unitPrice: 505 },
  { category: 'Water Heaters', name: 'Install Watts Hot Water Recirculating System', unitPrice: 840 },
  { category: 'Water Heaters', name: 'Install T&P Valve with Piping', unitPrice: 345 },
  { category: 'Water Heaters', name: 'New Install Expansion Tank', unitPrice: 410 },
  { category: 'Water Heaters', name: 'Expansion Tank Swap Out', unitPrice: 320 },
  { category: 'Water Heaters', name: 'Replace ½" Saddle Valve with Tee and Angle Stop', unitPrice: 365 },

  // ── Laundry & Utility ─────────────────────────────────────────────────────
  { category: 'Laundry & Utility', name: 'Supply & Install Brass Laundry Faucet', unitPrice: 440 },
  { category: 'Laundry & Utility', name: 'Install New SS Supply Lines for Washing Machine', unitPrice: 290 },
  { category: 'Laundry & Utility', name: 'Install ½" Gas Cock', unitPrice: 255 },
  { category: 'Laundry & Utility', name: 'Install Flexible Gas Supply Line', unitPrice: 295 },
  { category: 'Laundry & Utility', name: 'Install Flexible Gas Supply Line with New Gas Cock', unitPrice: 390 },
  { category: 'Laundry & Utility', name: 'Install ½" Ball Valve', unitPrice: 290 },
  { category: 'Laundry & Utility', name: 'Install ¾" Ball Valve', unitPrice: 370 },
  { category: 'Laundry & Utility', name: 'Install ¾" Ball Valve on Water Main (with village shut-down)', unitPrice: 480 },
  { category: 'Laundry & Utility', name: 'Install 1" Ball Valve', unitPrice: 440 },
  { category: 'Laundry & Utility', name: 'Re-Pipe Water Meter (plus permit fees)', unitPrice: 695 },
  { category: 'Laundry & Utility', name: 'Bypass and Remove Water Softener', unitPrice: 485 },
  { category: 'Laundry & Utility', name: 'Install Frost-Proof Silcock', unitPrice: 355 },
  { category: 'Laundry & Utility', name: 'Limited Access Silcock Install', unitPrice: 435 },
]

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true } })
  console.log(`Seeding price book for ${companies.length} company/companies…`)

  for (const company of companies) {
    let created = 0
    for (const task of TASKS) {
      // Skip if already exists (by companyId + name)
      const exists = await prisma.priceBookTask.findFirst({
        where: { companyId: company.id, name: task.name },
      })
      if (!exists) {
        await prisma.priceBookTask.create({
          data: {
            companyId: company.id,
            category: task.category,
            name: task.name,
            description: task.description ?? null,
            unitPrice: task.unitPrice,
            isActive: true,
          },
        })
        created++
      }
    }
    console.log(`  ${company.id}: ${created} tasks created (${TASKS.length - created} already existed)`)
  }

  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
