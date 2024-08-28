import React, { useState } from "react";
import { Modal, Box, Button, TextField } from "@mui/material";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { processPayment } from "./PaymentService"; // Adjust the import path as necessary

const schema = z.object({
	simNumber: z.string().min(1, "Sim Number is required"),
	amount: z.coerce
		.number()
		.min(1, "Amount is required and must be greater than 0"),
	cardName: z.string().min(1, "Name on Credit Card is required"),
	cardNumber: z
		.string()
		.min(16, "Credit Card Number must be 16 digits")
		.max(16, "Credit Card Number must be 16 digits"),
	expiryDate: z.string().min(5, "Expiry Date is required in MM/YY format"),
	cvc: z
		.string()
		.min(3, "CVC must be 3 digits")
		.max(4, "CVC must be 3-4 digits"),
});

const PaymentModal = ({ open, handleClose }) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data) => {
		const formData = {
			...data,
			amount: Number.parseFloat(data.amount),
		};
		console.log("Form Data", formData);

		try {
			// Call the processPayment function with the form data
			const paymentResponse = await processPayment(formData);
			console.log("Payment Response", paymentResponse);

			// Handle success, e.g., show a success message or close the modal
			handleClose();
			alert("Payment successful!");
		} catch (error) {
			// Handle errors, e.g., show an error message
			console.error("Payment processing failed", error);
			alert("Payment failed. Please try again.");
		}
	};

	return (
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
								label="Sim Number"
								placeholder="Type Here..."
								fullWidth
								{...register("simNumber")}
								error={!!errors.simNumber}
								helperText={errors.simNumber?.message}
							/>
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
								{...register("expiryDate")}
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
