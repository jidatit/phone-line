import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../Firebase";

export const getApiKeyFromFirestore = async () => {
	try {
		const docRef = doc(db, "config", "apiKeys");
		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			return docSnap.data().CARDKNOX_API_KEY;
		} else {
			console.error("No API key found!");
			return null;
		}
	} catch (error) {
		console.error("Error fetching API key from Firestore:", error);
		return null;
	}
};

export const setApiKeyInFirestore = async (apiKey) => {
	try {
		const docRef = doc(db, "config", "apiKeys");
		await setDoc(docRef, { CARDKNOX_API_KEY: apiKey });
		console.log("API key updated successfully");
	} catch (error) {
		console.error("Error updating API key in Firestore:", error);
	}
};
