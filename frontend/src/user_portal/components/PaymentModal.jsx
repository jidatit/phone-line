import React, { useState } from "react";
import { Modal, Box, Button, TextField } from "@mui/material";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { processPayment } from "./PaymentService"; // Adjust the import path as necessary
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../Firebase";
import { useAuth } from "../../../AuthContext";
import { toast, ToastContainer } from "react-toastify";

const schema = z.object({
	amount: z.coerce
		.number()
		.min(100, "Amount is required and must be greater than 100"),
	cardName: z.string().min(1, "Name on Credit Card is required"),
	cardNumber: z
		.string()
		.min(16, "Smaller! Credit Card Number must be 16 digits")
		.max(16, "Greater! Credit Card Number must be 16 digits"),
	expiryDate: z.string().min(4, "Expiry Date is required in MM/YY format"),
	cvc: z
		.string()
		.min(3, "CVC must be 3 digits")
		.max(4, "CVC must be 3-4 digits"),
});

const PaymentModal = ({ open, handleClose }) => {
	const [formattedExpiryDate, setFormattedExpiryDate] = useState("");
	const { currentUser } = useAuth();
	const userId = currentUser?.uid;
	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(schema),
	});

	const handleExpiryDateChange = (e) => {
		let value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
		if (value.length > 4) value = value.slice(0, 4); // Limit to 4 digits

		// Format the display as MM/YY
		let formatted = value;
		if (value.length >= 3) {
			formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
		}

		setFormattedExpiryDate(formatted); // Update what the user sees

		// Update the raw value in the form (MMYY)
		setValue("expiryDate", value); // MMYY for the backend
	};

	const onSubmit = async (data) => {
		const formData = {
			...data,
			amount: Number.parseFloat(data.amount),
		};

		try {
			const paymentResponse = await processPayment(formData);

			if (paymentResponse.xStatus === "Approved") {
				const { amount } = formData;
				const userDocRef = doc(db, "users", userId);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const currentBalance = Number.parseFloat(userDoc.data().balance) || 0;
					const updatedBalance = currentBalance + amount;
					await updateDoc(userDocRef, {
						balance: updatedBalance,
					});
					toast.success("Payment successful!");
					setTimeout(() => {
						handleClose();
					}, 1000);
				} else {
					toast.error("User document not found.");
				}
			} else {
				if (paymentResponse.xStatus === "Error") {
					toast.error(`Error ${paymentResponse.xError}`);
				}
			}
		} catch (error) {
			toast.error(`Payment processing failed: ${error.message}`);
		}
	};

	return (
		<>
			<ToastContainer />
			<Modal open={open} onClose={handleClose} aria-describedby="modal-data">
				<Box sx={{ ...style, width: "851px" }}>
					<div
						id="modal-data"
						className="w-full h-full flex flex-col justify-start items-center gap-3"
					>
						<h2 className="text-xl font-bold">Add Funds to Your Account</h2>

						<form
							onSubmit={handleSubmit(onSubmit)}
							className="w-full flex flex-col justify-start items-center gap-3"
						>
							<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
								<TextField
									label="Amount to add"
									placeholder="Type Here..."
									type="number"
									fullWidth
									{...register("amount")}
									error={!!errors.amount}
									helperText={errors.amount?.message}
								/>
							</div>
							<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
								<TextField
									label="Name on Credit Card"
									placeholder="Type Here..."
									fullWidth
									{...register("cardName")}
									error={!!errors.cardName}
									helperText={errors.cardName?.message}
								/>
								<TextField
									label="Credit Card Number"
									placeholder="Type Here..."
									fullWidth
									{...register("cardNumber")}
									error={!!errors.cardNumber}
									helperText={errors.cardNumber?.message}
								/>
							</div>
							<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
								<TextField
									label="Expiry Date"
									placeholder="MM/YY"
									fullWidth
									value={formattedExpiryDate}
									onChange={handleExpiryDateChange}
									error={!!errors.expiryDate}
									helperText={errors.expiryDate?.message}
								/>
								<TextField
									label="CVC"
									placeholder="Type Here..."
									fullWidth
									{...register("cvc")}
									error={!!errors.cvc}
									helperText={errors.cvc?.message}
								/>
							</div>
							<Button
								variant="contained"
								color="primary"
								type="submit"
								className="w-full"
								sx={{ backgroundColor: "#FF6D6D", color: "#FFFFFF" }}
							>
								Make Payment
							</Button>
						</form>
					</div>
				</Box>
			</Modal>
		</>
	);
};

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "80%",
	bgcolor: "background.paper",
	borderRadius: "8px",
	boxShadow: 24,
	p: 4,
};

export default PaymentModal;
