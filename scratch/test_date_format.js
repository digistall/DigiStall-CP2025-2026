function buildTrackerTest() {
  const monthPayments = [
    {
      id: 29,
      amount: "1929.00",
      paymentDate: "2026-05-22T16:00:00.000Z",
      paymentForMonth: "2026-05",
      promiseDate: "2026-05-23T16:00:00.000Z",
      status: "partial"
    }
  ];

  const lastPayment = monthPayments[monthPayments.length - 1];
  const promiseDateStr = lastPayment?.promiseDate ? new Date(lastPayment.promiseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  console.log("Promise Date Displayed:", promiseDateStr);
}

buildTrackerTest();
