import React, { useState, useEffect } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../../Firebase";

const BillingChargesModal = ({ open, handleClose }) => {
	const [charges, setCharges] = useState({
		days4: 0,
		days7: 0,
		days14: 0,
		days30: 0,
	});
	const [loading, setLoading] = useState(true);

	// Fetch the current charges from Firestore when the modal opens
	useEffect(() => {
		const fetchCharges = async () => {
			const docRef = doc(db, "charges", "billingCharges");
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				setCharges(docSnap.data());
			}
			setLoading(false);
		};

		if (open) {
			fetchCharges();
		}
	}, [open]);

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setCharges((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Save the updated charges to Firestore
	const handleSave = async () => {
		const docRef = doc(db, "charges", "billingCharges");

		try {
			await setDoc(docRef, charges);
			toast.success("Charges updated successfully!");
			handleClose();
		} catch (error) {
			toast.error("Failed to update charges.");
			console.error("Error updating charges:", error);
		}
	};

	return (
		<>
			<ToastContainer />
			<Modal
				open={open}
				onClose={handleClose}
				aria-labelledby="modal-billing-charges"
			>
				<Box sx={{ ...style, width: "851px" }}>
					<div
						id="modal-billing-charges"
						className="w-full h-full flex flex-col justify-start items-center gap-3"
					>
						<h2 className="text-xl font-bold">Set Billing Charges</h2>

						{loading ? (
							<p>Loading current charges...</p>
						) : (
							<form
								onSubmit={(e) => e.preventDefault()}
								className="w-full flex flex-col justify-start items-center gap-3"
							>
								<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
									<TextField
										label="Charges for 4 days"
										type="number"
										fullWidth
										name="days4"
										value={charges.days4}
										onChange={handleInputChange}
									/>
								</div>
								<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
									<TextField
										label="Charges for 7 days"
										type="number"
										fullWidth
										name="days7"
										value={charges.days7}
										onChange={handleInputChange}
									/>
								</div>
								<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
									<TextField
										label="Charges for 14 days"
										type="number"
										fullWidth
										name="days14"
										value={charges.days14}
										onChange={handleInputChange}
									/>
								</div>
								<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
									<TextField
										label="Charges for 30 days"
										type="number"
										fullWidth
										name="days30"
										value={charges.days30}
										onChange={handleInputChange}
									/>
								</div>

								<Button
									variant="contained"
									color="primary"
									onClick={handleSave}
									className="w-full"
									sx={{ backgroundColor: "#FF6D6D", color: "#FFFFFF" }}
								>
									Save Charges
								</Button>
							</form>
						)}
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

export default BillingChargesModal;
