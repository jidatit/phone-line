export const processPayment = async (paymentDetails) => {
	try {
		const response = await fetch(
			"https://phone-line-backend.onrender.com/process-payment",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(paymentDetails),
			},
		);

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Payment processing failed:", error);
		throw error;
	}
};
