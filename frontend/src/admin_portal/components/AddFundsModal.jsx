import React, { useState, useEffect } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../Firebase";
import { toast } from "react-toastify";

// Modal style
const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "40%",
	bgcolor: "background.paper",
	borderRadius: "8px",
	boxShadow: 24,
	p: 4,
};

const FundsModal = ({ open, handleClose, userId }) => {
	const [balance, setBalance] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch user balance from Firestore
	useEffect(() => {
		const fetchBalance = async () => {
			try {
				const userDocRef = doc(db, "users", userId);
				const userDocSnap = await getDoc(userDocRef);

				if (userDocSnap.exists()) {
					setBalance(userDocSnap.data().balance || "");
				} else {
					console.error("No such document!");
				}
			} catch (error) {
				console.error("Error fetching user balance:", error);
				setError("Failed to fetch balance.");
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			fetchBalance();
		}
	}, [userId]);

	// Handle form submission
	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError(null);

		const MAX_RETRIES = 3;
		let attempt = 0;

		const updateBalance = async () => {
			try {
				const userDocRef = doc(db, "users", userId);

				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Request timed out")), 10000),
				);

				const updateDocPromise = updateDoc(userDocRef, { balance });

				await Promise.race([updateDocPromise, timeoutPromise]);

				toast.success("Funds Updated");
				handleClose();
			} catch (error) {
				attempt++;
				if (attempt < MAX_RETRIES) {
					toast.warning(`Attempt ${attempt} failed. Retrying...`);
					await updateBalance();
				} else {
					toast.error("Error Updating Funds. Please try again later.");
					console.error(
						"Error updating balance after multiple attempts:",
						error,
					);
					setError(
						"Failed to update balance. Please check your internet connection and try again.",
					);
				}
			}
		};

		try {
			await updateBalance();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={!loading ? handleClose : null}
			aria-describedby="modal-data"
		>
			<Box sx={style}>
				<div
					id="modal-data"
					className="w-full h-full flex flex-col justify-start items-center gap-3"
				>
					<h2 className="text-xl font-bold">Manage User Funds</h2>

					<form
						onSubmit={handleSubmit}
						className="w-full flex flex-col justify-start items-center gap-3"
					>
						<div className="flex flex-col lg:flex-row xl:flex-row justify-between items-start gap-5 w-full">
							<TextField
								label="Current Balance"
								placeholder="Enter balance..."
								type="number"
								fullWidth
								value={balance}
								onChange={(e) => setBalance(e.target.value)}
								error={isNaN(balance)}
								helperText={isNaN(balance) ? "Invalid amount" : ""}
								disabled={loading} // Disable input during loading
							/>
						</div>

						<Button
							variant="contained"
							color="primary"
							type="submit"
							className="w-full"
							sx={{ backgroundColor: "#FF6D6D", color: "#FFFFFF" }}
							disabled={loading} // Disable button during loading
						>
							{loading ? "Updating..." : "Update Balance"}{" "}
							{/* Show loading state */}
						</Button>
					</form>
				</div>
			</Box>
		</Modal>
	);
};

export default FundsModal;
