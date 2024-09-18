const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin"); // For Firebase integration
const app = express();
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
require("dotenv").config();
app.use(express.json());
const { hash, authAccount, authId } = require("./utils/auth");
const { errorMessages } = require("./utils/errorMessages");

const getApiKeyFromFirestore = async () => {
	try {
		const docRef = db.collection("config").doc("apiKeys");
		const docSnap = await docRef.get();

		if (docSnap.exists) {
			return docSnap.data().CARDKNOX_API_KEY;
		} else {
			console.error("No API key document found!");
			return null;
		}
	} catch (error) {
		console.error("Error fetching API key from Firestore:", error);
		return null;
	}
};

const serviceAccount = {
	type: "service_account",
	project_id: process.env.project_id,
	private_key_id: process.env.private_key_id,
	private_key: (process.env.private_key || "").replace(/\\n/g, "\n"), // Handle newline characters
	client_email: process.env.client_email,
	client_id: process.env.client_id,
	auth_uri: process.env.auth_uri,
	token_uri: process.env.token_uri,
	auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
	client_x509_cert_url: process.env.client_x509_cert_url,
	universe_domain: "googleapis.com",
};
// console.log("service acco", serviceAccount);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://phone-line-cb413-default-rtdb.firebaseio.com/",
});
// Enable CORS for your frontend (adjust the origin as needed)
app.use(
	cors({
		origin: "*",
	}),
);
const db = admin.firestore();
app.post("/activate-sim", async (req, res) => {
	const {
		authId,
		hash,
		authAccount,
		accountId,
		simNumber,
		packageId,
		startDate,
		endDate,
		userId,
	} = req.body;

	let responseDetails = {
		step1: { status: "", error: "", domainUserId: null },
		step2: { status: "", error: "", numbers: [] },
		step3: { status: "", error: "" },
	};

	try {
		// Step 1: Create a user via the API before activating the SIM
		let userCreationResponse;
		try {
			userCreationResponse = await axios.post(
				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
				{
					auth: { auth_id: authId, hash: hash, auth: authAccount },
					func_name: "prov_create_user",
					data: { account_id: accountId, name: simNumber },
				},
			);
			const errorCode = userCreationResponse.data.error_code;

			if (errorCode !== 200) {
				const errorMessage =
					errorMessages[errorCode] || "Unknown error occurred";
				responseDetails.step1.status = "Failed";
				responseDetails.step1.error = errorMessage;
				return res.json(responseDetails);
			}

			responseDetails.step1.status = "Success";
			responseDetails.step1.domainUserId = userCreationResponse.data.data.id;
		} catch (error) {
			const errorCode = userCreationResponse.data.error_code;
			if (errorCode !== 200) {
				const errorMessage =
					errorMessages[errorCode] || "Unknown error occurred";
				responseDetails.step2.status = "Failed";
				responseDetails.step2.error = errorMessage;
				return res.json(responseDetails);
			}

			responseDetails.step1.status = "Failed";
			responseDetails.step1.error = axios.isAxiosError(error)
				? error.message
				: "Unexpected error";
			return res.json(responseDetails);
		}

		const domainUserId = responseDetails.step1.domainUserId;

		// Step 2: Proceed to activate the SIM
		let apiResponse;
		try {
			apiResponse = await axios.post(
				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
				{
					auth: { auth_id: authId, hash: hash, auth: authAccount },
					func_name: "prov_create_mobile",
					data: {
						domain_user_id: domainUserId,
						iccid: simNumber,
						service_id: packageId,
						dids: [
							{ purchase_type: "new", type: "mobile", country: "IL" },
							{ purchase_type: "new", type: "mobile", country: "US" },
						],
					},
				},
			);

			const errorCode = apiResponse.data.error_code;
			if (errorCode !== 200) {
				const errorMessage =
					errorMessages[errorCode] || "Unknown error occurred";
				responseDetails.step2.status = "Failed";
				responseDetails.step2.error = errorMessage;

				await terminateUser(
					domainUserId,
					userId,
					authId,
					hash,
					authAccount,
					false,
				);

				return res.json(responseDetails);
			}

			responseDetails.step2.status = "Success";

			if (apiResponse.data.status === "OK") {
				const notes = apiResponse.data.data.notes;
				const msisdn = apiResponse.data.data.msisdn;
				const endpointId = apiResponse.data.data.endpoint_id;

				// Convert dayjs objects to JavaScript Date objects
				// const convertedStartDate = startDate ? startDate.toDate() : null;
				// const convertedEndDate = endDate ? endDate.toDate() : null;
				// console.log("without converted date", startDate, " ", endDate);
				const convertedStartDate = startDate
					? admin.firestore.Timestamp.fromDate(new Date(startDate))
					: null;
				const convertedEndDate = endDate
					? admin.firestore.Timestamp.fromDate(new Date(endDate))
					: null;
				// console.log(
				// 	"converted date",
				// 	convertedStartDate,
				// 	" ",
				// 	convertedEndDate,
				// );
				// Mapping over notes to create the numbers array with all required data
				responseDetails.step2.numbers = notes.map((note) => {
					const [country, number] = note.split(" הופעל הוא ");
					const type = country.includes("IL") ? "IL" : "US";

					return {
						number: number.trim(),
						type,
						endpointId, // Storing endpoint ID
						msisdn, // Storing MSISDN
						modify: false,
						startDate: startDate,
						endDate: endDate,
						simNumber, // Storing the entered SIM number
						Activated: "Activated",
						domainUserId: domainUserId, // Storing the domain user ID
					};
				});
			}
		} catch (error) {
			const errorCode = apiResponse.data.error_code;
			if (errorCode !== 200) {
				const errorMessage =
					errorMessages[errorCode] || "Unknown error occurred";
				responseDetails.step2.status = "Failed";
				responseDetails.step2.error = errorMessage;
				return res.json(responseDetails);
			}

			responseDetails.step2.status = "Failed";
			responseDetails.step2.error = axios.isAxiosError(error)
				? error.message
				: "Unexpected error";
			return res.json(responseDetails);
		}

		// Step 3: Modify caller ID for US numbers
		const usNumber = responseDetails.step2.numbers.find(
			(num) => num.type === "US",
		);
		if (usNumber) {
			try {
				let modifyResponse = await axios.post(
					"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
					{
						auth: { auth_id: authId, hash: hash, auth: authAccount },
						func_name: "modify_caller_ids",
						data: {
							domain_user_id: domainUserId,
							caller_ids_to_update: [
								{
									id: -1,
									owner_id: null,
									status: "on",
									cid_name: "1",
									number: usNumber.number,
									to_remove: false,
								},
							],
						},
					},
				);

				if (modifyResponse.data.status === "OK") {
					responseDetails.step3.status = "Success";
					responseDetails.step2.numbers.forEach((num) => {
						if (num.type === "US" && num.number === usNumber.number) {
							num.modify = true;
						}
					});

					// console.log("resp3", responseDetails.step2.numbers);
				} else {
					const errorCode = apiResponse.data.error_code;
					if (errorCode) {
						const errorMessage =
							errorMessages[errorCode] || "Unknown error occurred";
						responseDetails.step3.status = "Failed";
						responseDetails.step3.error = errorMessage;
						return res.json(responseDetails);
					}
				}
			} catch (error) {
				const errorCode = apiResponse.data.error_code;
				if (errorCode !== 200) {
					const errorMessage =
						errorMessages[errorCode] || "Unknown error occurred";
					responseDetails.step3.status = "Failed";
					responseDetails.step3.error = errorMessage;
					return res.json(responseDetails);
				}
				responseDetails.step3.status = "Failed";
				responseDetails.step3.error = axios.isAxiosError(error)
					? error.message
					: "Unexpected error";
				return res.json(responseDetails);
			}
		} else {
			responseDetails.step3.status = "Failed";
			responseDetails.step3.error = "US number not found in the response";
		}

		// Step 4: Store the activated numbers in Firestore, organized by simNumber
		if (responseDetails.step2.status === "Success") {
			const userDocRef = db.collection("users").doc(userId);
			const userDoc = await userDocRef.get();
			let existingData = userDoc.exists
				? userDoc.data().activatedNumbers || {}
				: {};

			// Group numbers by IL and US
			const groupedNumbers = responseDetails.step2.numbers.reduce(
				(acc, num) => {
					if (!acc[num.type]) {
						acc[num.type] = [];
					}
					acc[num.type].push(num);
					return acc;
				},
				{},
			);

			// Merge new data with existing data, keyed by simNumber
			const updatedNumbers = {
				...existingData,
				[simNumber]: {
					IL: groupedNumbers.IL || [],
					US: groupedNumbers.US || [],
				},
			};

			// Update Firestore with the merged data
			await userDocRef.update({
				activatedNumbers: updatedNumbers,
			});

			responseDetails.step3.status = "Success";
		}

		res.json(responseDetails);
	} catch (error) {
		console.error("Unexpected error during SIM activation:", error.message);
		res
			.status(500)
			.json({ error: "Unexpected error occurred during SIM activation" });
	}
});

app.post("/terminate-user", async (req, res) => {
	const { domainUserId, userId, authId, hash, authAccount, updateFirebase } =
		req.body; // 'updateFirebase' is the new flag

	try {
		// Make the API request to terminate the user
		const apiResponse = await axios.post(
			"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
			{
				auth: { auth_id: authId, hash: hash, auth: authAccount },
				func_name: "prov_terminate_user",
				data: { domain_user_id: domainUserId },
			},
		);

		const errorCode = apiResponse.data.error_code;

		// Check for errors in API response
		if (errorCode && errorCode !== 200) {
			const errorMessage = errorMessages[errorCode] || "Unknown error occurred";
			return res.status(400).json({ status: "Failed", message: errorMessage });
		}

		if (apiResponse.data.status === "OK") {
			// Only proceed with Firebase update if updateFirebase flag is true
			if (updateFirebase) {
				const userDocRef = admin.firestore().collection("users").doc(userId);
				const userDoc = await userDocRef.get();

				if (userDoc.exists) {
					const activatedNumbers = userDoc.data().activatedNumbers || {};

					// Update only the numbers associated with the specific domainUserId
					const updatedNumbers = {};
					for (let simNumber in activatedNumbers) {
						updatedNumbers[simNumber] = {};
						for (const type in activatedNumbers[simNumber]) {
							const numbers = activatedNumbers[simNumber][type];

							// Check if numbers is an array
							if (Array.isArray(numbers)) {
								updatedNumbers[simNumber][type] = numbers.map((num) => {
									// Only deactivate numbers with the matching domainUserId
									if (num.domainUserId === domainUserId) {
										return { ...num, Activated: "Deactivated" };
									}
									return num;
								});
							} else {
								updatedNumbers[simNumber][type] = numbers; // Handle non-array case
							}
						}
					}

					// Update the Firestore document with the new status
					await userDocRef.update({ activatedNumbers: updatedNumbers });
					return res.status(200).json({
						status: "Success",
						message: "User is terminated successfully and Firebase is updated",
					});
				} else {
					return res
						.status(404)
						.json({ status: "Failed", message: "User not found" });
				}
			} else {
				// If updateFirebase is false, skip the Firebase part
				return res.status(200).json({
					status: "Success",
					message: "User is terminated successfully without updating Firebase",
				});
			}
		} else {
			return res.status(400).json({
				status: "Failed",
				message: "Failed to terminate the user",
			});
		}
	} catch (error) {
		console.error("Error terminating user:", error.message);
		return res.status(500).json({ status: "Failed", message: error.message });
	}
});

dayjs.extend(utc);

const terminateUser = async (
	domainUserId,
	userId,
	authId,
	hash,
	authAccount,
) => {
	const updateFirebase = true;
	try {
		await axios.post("https://phone-line-backend.onrender.com/terminate-user", {
			// Adjust URL if needed
			domainUserId,
			userId,
			authId,
			hash,
			authAccount,
			updateFirebase,
		});
	} catch (error) {
		console.error(`Error terminating user ${domainUserId}:`, error.message);
	}
};
const checkExpiredUsers = async () => {
	try {
		const israelNow = dayjs().tz("Asia/Jerusalem");

		const usersSnapshot = await admin.firestore().collection("users").get();

		if (usersSnapshot.empty) {
			console.log("No users found.");
			return;
		}

		const terminatePromises = [];

		// biome-ignore lint/complexity/noForEach: <explanation>
		usersSnapshot.forEach((userDoc) => {
			const userId = userDoc.id;
			const userData = userDoc.data();
			const activatedNumbers = userData.activatedNumbers || {};

			for (const [simNumber, numbersByType] of Object.entries(
				activatedNumbers,
			)) {
				for (const [type, numbers] of Object.entries(numbersByType)) {
					if (Array.isArray(numbers)) {
						// biome-ignore lint/complexity/noForEach: <explanation>
						numbers.forEach((num) => {
							if (num.Activated === "Deactivated") {
								return;
							}

							if (num.endDate) {
								const israelExpiryDate = dayjs(num.endDate)
									.tz("Asia/Jerusalem")
									.endOf("day");
								if (israelNow.isAfter(israelExpiryDate)) {
									terminatePromises.push(
										terminateUser(
											num.domainUserId,
											userId,
											authId,
											hash,
											authAccount,
										),
									);
								}
							}
						});
					} else if (numbers && typeof numbers === "object") {
						if (numbers.Activated === "Deactivated") {
							return;
						}

						if (numbers.endDate) {
							const israelExpiryDate = dayjs(numbers.endDate)
								.tz("Asia/Jerusalem")
								.endOf("day");
							if (israelNow.isAfter(israelExpiryDate)) {
								terminatePromises.push(
									terminateUser(
										numbers.domainUserId,
										userId,
										authId,
										hash,
										authAccount,
									),
								);
							}
						}
					}
				}
			}
		});

		await Promise.all(terminatePromises);
	} catch (error) {
		console.error("Error checking expired users:", error.message);
	}
};

cron.schedule("0 * * * *", () => {
	console.log("Running the cron job to check expired users every hour");
	checkExpiredUsers();
});

app.post("/process-payment", async (req, res) => {
	const paymentDetails = req.body;

	try {
		const apiKey = await getApiKeyFromFirestore();
		if (!apiKey) {
			return res.status(500).json({ error: "API key not found" });
		}

		const requestData = {
			xKey: apiKey,
			xVersion: "5.0.0",
			xSoftwareVersion: "1.0.0",
			xSoftwareName: "PhoneLIne",
			xCommand: "cc:sale",
			xCardNum: paymentDetails.cardNumber,
			xExp: paymentDetails.expiryDate, // Format MMYY
			xCVV: paymentDetails.cvc,
			xAmount: paymentDetails.amount,
			xName: paymentDetails.cardName,
		};
		const response = await axios.post(
			"https://x1.cardknox.com/gatewayjson",
			requestData,
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
		res.json(response.data);
	} catch (error) {
		console.error("Payment processing failed:", error);
		res.status(500).json({ error: "Payment processing failed" });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
