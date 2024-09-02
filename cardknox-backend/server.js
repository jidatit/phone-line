require('dotenv').config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin"); // For Firebase integration
const app = express();

app.use(express.json());

admin.initializeApp({
	credential: admin.credential.cert(require("./utils/serviceAccountKey.json")),
	databaseURL: "https://phone-line-cb413-default-rtdb.firebaseio.com/",
  });
// Enable CORS for your frontend (adjust the origin as needed)
app.use(
	cors({
		origin: "http://localhost:5173",
	}),
);

app.post("/activate-sim", async (req, res) => {
    const { authId, hash, authAccount, accountId, simNumber, packageId, startDate, endDate } = req.body;
    
    let responseDetails = {
        step1: { status: "", error: "", domainUserId: null },
        step2: { status: "", error: "", numbers: [] },
        step3: { status: "", error: "" }
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

            if (userCreationResponse.data.status !== "OK") {
                responseDetails.step1.status = "Failed";
                responseDetails.step1.error = "Failed to create user via API";
                return res.json(responseDetails);
            }

            responseDetails.step1.status = "Success";
            responseDetails.step1.domainUserId = userCreationResponse.data.data.id;

        } catch (error) {
            responseDetails.step1.status = "Failed";
            responseDetails.step1.error = axios.isAxiosError(error) ? error.message : "Unexpected error";
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

            if (apiResponse.data.status !== "OK") {
                responseDetails.step2.status = "Failed";
                responseDetails.step2.error = "Failed to activate SIM";
                return res.json(responseDetails);
            }

            responseDetails.step2.status = "Success";
            const notes = apiResponse.data.data.notes;
            responseDetails.step2.numbers = notes.map(note => {
                const [country, number] = note.split(" הופעל הוא ");
                const type = country.includes("IL") ? "IL" : "US";
                return { number: number.trim(), type };
            });

        } catch (error) {
            responseDetails.step2.status = "Failed";
            responseDetails.step2.error = axios.isAxiosError(error) ? error.message : "Unexpected error";
            return res.json(responseDetails);
        }

        // Step 3: Modify caller ID for US numbers
        const usNumber = responseDetails.step2.numbers.find(num => num.type === "US");
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
                } else {
                    responseDetails.step3.status = "Failed";
                    responseDetails.step3.error = "Failed to modify caller ID";
                }

            } catch (error) {
                responseDetails.step3.status = "Failed";
                responseDetails.step3.error = axios.isAxiosError(error) ? error.message : "Unexpected error";
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
            let existingData = userDoc.exists ? userDoc.data().activatedNumbers || {} : {};

            // Group numbers by IL and US
            const groupedNumbers = responseDetails.step2.numbers.reduce((acc, num) => {
                if (!acc[num.type]) {
                    acc[num.type] = [];
                }
                acc[num.type].push(num);
                return acc;
            }, {});

            // Merge new data with existing data, keyed by simNumber
            const updatedNumbers = {
                ...existingData,
                [simNumber]: {
                    IL: groupedNumbers.IL || [],
                    US: groupedNumbers.US || [],
                    startDate: startDate ? admin.firestore.Timestamp.fromDate(new Date(startDate)) : null,
                    endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
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
        res.status(500).json({ error: "Unexpected error occurred during SIM activation" });
    }
});


app.post("/process-payment", async (req, res) => {
	const paymentDetails = req.body;

	const requestData = {
		xKey: process.env.CARDKNOX_API_KEY,
		xVersion: "5.0.0",
		xSoftwareVersion: "1.0.0",
		xSoftwareName: "PhoneLIne",
		xCommand: "cc:Credit",
		xCardNum: paymentDetails.cardNumber,
		xExp: paymentDetails.expiryDate, // Format MMYY
		xCVV: paymentDetails.cvc,
		xAmount: paymentDetails.amount,
		xName: paymentDetails.cardName,
		xCustom01: paymentDetails.simNumber, // Custom fields as needed
	};
	console.log("request data", requestData);
	try {
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
