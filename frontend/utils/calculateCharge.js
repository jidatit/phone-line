const CHARGES = {
	4: 8,
	7: 14,
	14: 19,
	30: 29,
};
export const calculateCharges = (startDate, endDate) => {
	// console.log("start", startDate);
	// console.log("end date", endDate);

	const millisecondsPerDay = 1000 * 60 * 60 * 24;
	const daysDifference =
		Math.ceil((endDate - startDate) / millisecondsPerDay) + 1;
	// console.log("days differ", daysDifference);

	let charge = 0;
	if (daysDifference <= 4) {
		charge = 8; // Charge for 4 days
	} else if (daysDifference <= 7) {
		charge = 14; // Charge for 7 days
	} else if (daysDifference <= 14) {
		charge = 19; // Charge for 14 days
	} else if (daysDifference <= 30) {
		charge = 29; // Charge for 30 days
	} else {
		const fullPeriods = Math.ceil(daysDifference / 30); // Number of full 30-day periods
		charge = 29 * fullPeriods; // Multiply 29 by the number of periods
	}

	return charge;
};

export const hasSufficientBalance = (balance, charge) => balance >= charge;
