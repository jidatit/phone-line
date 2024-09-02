const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());

// Enable CORS for your frontend (adjust the origin as needed)
app.use(
	cors({
		origin: "http://localhost:5173",
	}),
);

app.post("/process-payment", async (req, res) => {
	const paymentDetails = req.body;

	const requestData = {
		xKey: "bestcell929419a5ae5ebf49814fe7a23bf151372458c",
		xVersion: "5.0.0",
		xSoftwareVersion: "1.0.0",
		xSoftwareName: "PhoneLIne",
		xCommand: "cc:sale",
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
