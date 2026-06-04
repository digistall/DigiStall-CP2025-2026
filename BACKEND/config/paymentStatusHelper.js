/**
 * Shared Real-time Payment Status Calculator Helper
 * Replicates the timeline rules of the frontend Monthly Payment Tracker 1:1.
 */

export async function calculateStallholderPaymentStatus(connection, stallholderId, moveInStr, rental, returnRawStatus = false, targetMonth = null) {
  if (!moveInStr || !rental || rental <= 0) {
    return 'pending';
  }

  // Fetch all rental and partial payments for this stallholder
  const [payments] = await connection.execute(`
    SELECT payment_date, payment_for_month, amount, payment_status
    FROM payments
    WHERE stallholder_id = ?
      AND payment_type IN ('rental', 'partial_payment')
      AND payment_status IN ('completed', 'paid', 'partial')
  `, [parseInt(stallholderId)]);

  const moveIn = new Date(moveInStr);
  const now = new Date();
  const dueDay = moveIn.getDate();

  const tracker = [];
  let year = moveIn.getFullYear();
  let month = moveIn.getMonth();

  let maxYear = now.getFullYear();
  let maxMonth = 11; // December

  if (targetMonth) {
    const [tY, tM] = targetMonth.split('-').map(Number);
    if (tY > maxYear || (tY === maxYear && (tM - 1) > maxMonth)) {
      maxYear = tY;
      maxMonth = tM - 1;
    }
  }

  while (year < maxYear || (year === maxYear && month <= maxMonth)) {
    let dueDate = new Date(year, month, dueDay);
    if (dueDate.getMonth() !== month) {
      dueDate = new Date(year, month + 1, 0); // last day of month
    }

    // Find ALL valid payments for this month
    const monthPayments = payments.filter(p => {
      const pStatus = (p.payment_status || '').toLowerCase();
      const isValidStatus = ['completed', 'paid', 'partial'].includes(pStatus);
      if (p.payment_for_month) {
        const [pY, pM] = p.payment_for_month.split('-').map(Number);
        return pY === year && pM === month + 1 && isValidStatus;
      }
      const pd = new Date(p.payment_date);
      return pd.getFullYear() === year && pd.getMonth() === month && isValidStatus;
    });

    const totalPaidForMonth = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    let status;

    const isFirstMonth = moveIn.getFullYear() === year && moveIn.getMonth() === month;

    let expectedAmount = rental;
    const graceDate = new Date(moveIn);
    graceDate.setDate(graceDate.getDate() + 5); // 5 days grace
    graceDate.setHours(23, 59, 59, 999);

    if (isFirstMonth) {
      expectedAmount = rental * 0.75;
    } else if (now > dueDate) {
      expectedAmount = rental * 1.10;
    } else {
      const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDue >= 5) {
        expectedAmount = rental * 0.75;
      } else {
        expectedAmount = rental;
      }
    }

    const hasCompletedPayment = monthPayments.some(p => {
      const pStatus = (p.payment_status || '').toLowerCase();
      return pStatus === 'completed' || pStatus === 'paid' || pStatus === 'discount';
    });

    const isFullyPaid = totalPaidForMonth >= rental * 0.99 || totalPaidForMonth >= expectedAmount * 0.99 || hasCompletedPayment;

    if (isFullyPaid) {
      const firstPayment = monthPayments[0];
      const payDate = firstPayment ? new Date(firstPayment.payment_date) : now;
      const daysEarly = Math.floor((dueDate - payDate) / (1000 * 60 * 60 * 24));
      const daysSinceMoveIn = Math.floor((payDate - moveIn) / (1000 * 60 * 60 * 24));
      const gotFirstMonthDiscount = isFirstMonth && daysSinceMoveIn <= 5;

      if (daysEarly >= 5 || gotFirstMonthDiscount) {
        status = 'discount'; // 'Advance' maps to 'discount' for the main table status column
      } else {
        status = 'paid';
      }
    } else if (totalPaidForMonth > 0) {
      status = 'partial';
    } else {
      if (isFirstMonth) {
        status = now > graceDate ? 'overdue' : 'discount';
      } else if (now > dueDate) {
        status = 'overdue';
      } else {
        const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
        status = daysUntilDue >= 5 ? 'pending' : 'due_soon';
      }
    }

    tracker.push({ year, month, status, hasPaid: isFullyPaid });

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  if (targetMonth) {
    const [tY, tM] = targetMonth.split('-').map(Number);
    const match = tracker.find(t => t.year === tY && t.month === (tM - 1));
    if (match) {
      const computedStatus = match.status;
      const hasPaid = match.hasPaid;

      if (returnRawStatus) {
        if (computedStatus === 'discount' && hasPaid) return 'paid';
        return computedStatus;
      }

      if (computedStatus === 'paid') return 'paid';
      if (computedStatus === 'partial') return 'partial';
      if (computedStatus === 'overdue') return 'overdue';
      if (computedStatus === 'discount') {
        return hasPaid ? 'paid' : 'unpaid';
      }
      if (computedStatus === 'due_soon') return 'unpaid';
      return 'unpaid';
    }
  }

  // Find the latest non-pending month status
  const nonPendingTimeline = tracker.filter(t => t.status !== 'pending');
  if (nonPendingTimeline.length > 0) {
    const latest = nonPendingTimeline[nonPendingTimeline.length - 1];
    const computedStatus = latest.status;
    const hasPaid = latest.hasPaid;

    if (returnRawStatus) {
      if (computedStatus === 'discount' && hasPaid) return 'paid';
      return computedStatus; // 'paid', 'partial', 'overdue', 'discount', 'due_soon'
    }

    // Map strictly to DB Enum: 'paid', 'unpaid', 'overdue', 'partial'
    if (computedStatus === 'paid') return 'paid';
    if (computedStatus === 'partial') return 'partial';
    if (computedStatus === 'overdue') return 'overdue';
    if (computedStatus === 'discount') {
      return hasPaid ? 'paid' : 'unpaid';
    }
    if (computedStatus === 'due_soon') return 'unpaid';
    return 'unpaid';
  }

  return 'unpaid';
}
