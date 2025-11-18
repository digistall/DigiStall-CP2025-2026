# Monthly Payment Automation - Quick Reference

## 🚀 What Was Implemented

**Automatic monthly payment tracking system** where:
- ✅ Stallholders who pay disappear from the dropdown
- ✅ On the 1st of every month, all "paid" stallholders reset to "pending"
- ✅ They reappear in dropdown for the new month
- ✅ Late fees (₱100/month) still apply for overdue payments

## 📅 How It Works

```
November 18 (Today)
├── Maria Santos pays ₱2400 → Status: 'paid'
├── Maria disappears from dropdown ✨
└── Other stallholders still visible

December 1, 2025 at 12:01 AM (Automatic)
├── EVENT runs: reset_monthly_payment_status
├── Maria Santos: 'paid' → 'pending'
├── Maria reappears in dropdown for December payment ✨
└── Cycle repeats monthly
```

## 🎯 Payment Statuses

| Status | In Dropdown? | Meaning |
|--------|--------------|---------|
| `pending` | ✅ Yes | Needs to pay this month |
| `current` | ✅ Yes | Up to date (legacy) |
| `overdue` | ✅ Yes | Late payment (₱100/month fee) |
| `paid` | ❌ **NO** | Already paid this month |

## 💻 Commands

### Check What's Running
```sql
-- View the monthly reset event
SHOW EVENTS WHERE Name = 'reset_monthly_payment_status';

-- Check event scheduler status
SHOW VARIABLES LIKE 'event_scheduler';

-- View reset history
SELECT * FROM payment_status_log ORDER BY created_at DESC;
```

### Manual Testing
```sql
-- Manually trigger monthly reset (for testing only)
CALL manual_reset_payment_status();

-- Check current payment statuses
SELECT payment_status, COUNT(*) as count
FROM stallholder
WHERE contract_status = 'Active'
GROUP BY payment_status;
```

### Run Tests
```bash
cd Backend
node test-monthly-payment-automation.cjs
```

## 📊 Example Scenario

**Scenario:** Elena Reyes hasn't paid in 51 days (overdue since Sept 28)

1. **Admin opens onsite payment screen**
   - Elena appears in stallholder dropdown
   - Shows: "Elena Reyes - ₱2,100.00/month"

2. **Admin processes payment**
   - System calculates: 51 days overdue = 2 months = ₱200 late fee
   - Total charge: ₱2,100 + ₱200 = ₱2,300
   - Elena's status → `'paid'`
   - Elena **disappears from dropdown** ✨

3. **Next day (Nov 19)**
   - Elena still hidden from dropdown
   - Can't pay twice for same month

4. **December 1, 12:01 AM**
   - Automatic event runs
   - Elena's status → `'pending'`
   - Elena **reappears in dropdown** ✨
   - Ready for December payment

## ⚠️ Important Notes

1. **First Automatic Reset:** December 1, 2025 at 12:01 AM
2. **Event Scheduler:** Already enabled (required for auto-reset)
3. **Frontend:** No changes needed - already works with updated procedures
4. **Dropdown:** Automatically filters based on `payment_status`

## 🔧 Troubleshooting

**Problem:** Stallholder still appears after payment
- Check status: `SELECT payment_status FROM stallholder WHERE stallholder_id = X`
- Should be `'paid'`, not `'current'`

**Problem:** Event not running automatically
- Check: `SHOW VARIABLES LIKE 'event_scheduler'`
- Should be `ON`
- Enable: `SET GLOBAL event_scheduler = ON`

**Problem:** Need to test monthly reset
- Run: `CALL manual_reset_payment_status()`
- Check log: `SELECT * FROM payment_status_log`

## 📁 Files Location

```
DigiStall-CP2025-2026/
├── database/
│   └── monthly_payment_automation.sql      (Full SQL script)
├── Backend/
│   ├── apply-monthly-payment-automation.cjs (Migration script)
│   └── test-monthly-payment-automation.cjs  (Test suite)
└── MONTHLY_PAYMENT_AUTOMATION_SUMMARY.md    (Full documentation)
```

## ✅ Verification Checklist

- [x] Stallholder payment_status enum includes 'paid' and 'pending'
- [x] addOnsitePayment sets status to 'paid' after payment
- [x] sp_get_all_stallholders filters out 'paid' stallholders
- [x] Monthly reset event created and enabled
- [x] Event scheduled for December 1, 2025
- [x] payment_status_log table created
- [x] Manual reset procedure available
- [x] All tests passed

## 🎉 Ready for Production!

The system is fully operational and will automatically:
1. Hide paid stallholders from dropdown
2. Reset all statuses on the 1st of each month
3. Make stallholders reappear for new month's payment
4. Log all reset actions for auditing

No manual intervention needed! 🚀
