import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase";

export const getChargesFromFirestore = async () => {
	try {
		const docRef = doc(db, "charges", "billingCharges");
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			return docSnap.data(); // Returns the charges data
		} else {
			console.error("No such document!");
			return null;
		}
	} catch (error) {
		console.error("Error fetching charges:", error);
		return null;
	}
};

export const calculateCharges = async (startDate, endDate) => {
	const millisecondsPerDay = 1000 * 60 * 60 * 24;
	const daysDifference =
		Math.ceil((endDate - startDate) / millisecondsPerDay) + 1;

	// Fetch dynamic charges from Firestore
	const charges = await getChargesFromFirestore();
	if (!charges) {
		console.error("Failed to fetch charges from Firestore");
		return 0;
	}

	let charge = 0;

	// Use the fetched charges from Firestore instead of static values
	if (daysDifference <= 4) {
		charge = charges.days4; // Charge for 4 days
	} else if (daysDifference <= 7) {
		charge = charges.days7; // Charge for 7 days
	} else if (daysDifference <= 14) {
		charge = charges.days14; // Charge for 14 days
	} else if (daysDifference <= 30) {
		charge = charges.days30; // Charge for 30 days
	} else {
		const fullPeriods = Math.ceil(daysDifference / 30); // Number of full 30-day periods
		charge = charges.days30 * fullPeriods; // Multiply 30-day charge by number of periods
	}

	return charge;
};

export const hasSufficientBalance = (balance, charge) => balance >= charge;
