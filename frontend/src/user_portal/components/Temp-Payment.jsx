import React from "react";
import { Modal, Box, Button, TextField } from "@mui/material";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CardKnoxIField, { CARD_TYPE, CVV_TYPE } from "@cardknox/react-ifields";

const schema = z.object({
	simNumber: z.string().min(1, "Sim Number is required"),
	amount: z.coerce
		.number()
		.min(1, "Amount is required and must be greater than 0"),
	cardName: z.string().min(1, "Name on Credit Card is required"),
	zip: z.string().min(1, "ZIP code is required"),
});

const cardKnoxAccountConfig = {
	xKey: "bestcell929419a5ae5ebf49814fe7a23bf151372458c",
	xSoftwareVersion: "5.0.0",
	xSoftwareName: "YourSoftwareName",
};

const cardKnoxInputStyles = {
	height: 26,
	width: "100%",
	color: "black",
};

const PaymentModal = ({ open, handleClose }) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data) => {
		try {
			// Handle payment logic here after getting the token from CardKnox
			console.log("Payment data to be processed", data);

			// Add logic here to send the token along with other payment details to your server

			handleClose();
			alert("Payment successful!");
		} catch (error) {
			console.error("Payment processing failed", error);
			alert("Payment failed. Please try again.");
		}
	};

	const handleToken = (token) => {
		console.log("Received token from CardKnox:", token);
		// You can now use this token for processing the payment
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
							<CardKnoxIField
								type={CARD_TYPE}
								account={cardKnoxAccountConfig}
								options={{
									autoFormat: true,
									autoFormatSeparator: " ",
									placeholder: "Card Number",
									iFieldstyle: cardKnoxInputStyles,
								}}
								onToken={handleToken}
							/>
						</div>
						<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
							<TextField
								label="Expiry Date"
								placeholder="MM/YY"
								autoComplete="cc-exp"
								fullWidth
								{...register("expiryDate")}
								error={!!errors.expiryDate}
								helperText={errors.expiryDate?.message}
							/>
							<CardKnoxIField
								type={CVV_TYPE}
								account={cardKnoxAccountConfig}
								options={{
									placeholder: "CVV",
									iFieldstyle: cardKnoxInputStyles,
								}}
								onToken={handleToken}
							/>
						</div>
						<TextField
							label="Zip Code"
							placeholder="Type Here..."
							fullWidth
							{...register("zip")}
							error={!!errors.zip}
							helperText={errors.zip?.message}
						/>
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
