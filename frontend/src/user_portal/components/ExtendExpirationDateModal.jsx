import React, { useState, useEffect } from "react";
import { Modal, Box, Button, TextField } from "@mui/material";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../Firebase";
import {
	calculateCharges,
	hasSufficientBalance,
} from "../../../utils/calculateCharge";
import { updateDoc } from "firebase/firestore"; // Import necessary Firestore functions
import { toast, ToastContainer } from "react-toastify";

dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jerusalem");

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

const ExtendExpirationDateModal = ({ open, onClose, userId, simNumber }) => {
	const [endDate, setEndDate] = useState(dayjs().tz("Asia/Jerusalem"));
	const [charges, setCharges] = useState(0);
	const [loading, setLoading] = useState(true);
	const [minDate, setMinDate] = useState(dayjs());

	const updateBalanceAfterActivation = async (
		userDocRef,
		currentBalance,
		charge,
	) => {
		const updatedBalance = currentBalance - charge;
		await updateDoc(userDocRef, { balance: updatedBalance });
	};
	useEffect(() => {
		const fetchStartDate = async () => {
			setLoading(true);
			try {
				console.log("Fetching start date...");

				const userDocRef = doc(db, "users", userId);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					console.log("User document exists.");

					const userData = userDoc.data();
					console.log("User data: ", userData);

					const activatedNumbers = userData.activatedNumbers || {};
					console.log("Activated numbers: ", activatedNumbers);

					const simData = activatedNumbers[simNumber] || {};
					console.log("SIM data: ", simData);

					const types = ["US", "IL"];
					let foundEndDate = null;

					for (const type of types) {
						const typeData = simData[type] || [];
						console.log(`Type data (${type}): `, typeData);

						if (typeData.length > 0) {
							foundEndDate = typeData[0].endDate;
							console.log(`End date found for type ${type}: `, foundEndDate);
							break;
						}
					}

					if (foundEndDate) {
						const minDateParsed = dayjs(foundEndDate).tz("Asia/Jerusalem");
						setMinDate(minDateParsed);
						setEndDate(minDateParsed);
					} else {
						console.log("End date is not found in any type.");
					}
				} else {
					console.log("User document does not exist.");
				}
			} catch (error) {
				console.error("Error fetching start date: ", error);
			} finally {
				setLoading(false);
			}
		};

		if (open) {
			fetchStartDate();
		}
	}, [open, userId, simNumber]);

	const handleConfirmDate = async () => {
		if (endDate) {
			try {
				// Convert endDate to ISO string
				const endDateFormatted = dayjs(endDate)
					.tz("Asia/Jerusalem")
					.toISOString();

				// Fetch the current user document
				const userDocRef = doc(db, "users", userId);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const userData = userDoc.data();
					const currentBalance = userData.balance || 0;
					console.log("balance", currentBalance);

					// Calculate the charges
					const charge = await calculateCharges(minDate, endDate);
					console.log("charge", charge);

					// Check if there is sufficient balance
					if (!hasSufficientBalance(currentBalance, charge)) {
						toast.error("Insufficient balance for SIM activation");
						// Assuming handleReset is defined elsewhere to reset the state
						return;
					}

					const activatedNumbers = userData.activatedNumbers || {};
					const types = ["IL", "US"];
					const updateData = {};

					// Build the update object
					// biome-ignore lint/complexity/noForEach: <explanation>
					types.forEach((type) => {
						const simData = activatedNumbers[simNumber] || {};
						const typeData = simData[type] || [];

						// Update the endDate for each entry of the type
						const updatedTypeData = typeData.map((entry) => ({
							...entry,
							endDate: endDateFormatted,
						}));

						// Set the path for the update
						updateData[`activatedNumbers.${simNumber}.${type}`] =
							updatedTypeData;
					});

					// Apply the updates to the document
					await updateDoc(userDocRef, updateData);

					// Update balance after activation (assuming this function is defined)
					await updateBalanceAfterActivation(
						userDocRef,
						currentBalance,
						charge,
					);

					toast.success("Date Extended");
				} else {
					toast.error("User document does not exist.");
				}
			} catch (error) {
				toast.error(`Error updating end date: ${error}`);
			} finally {
				onClose(); // Close the modal
			}
		} else {
			console.log("Please select an end date");
		}
	};

	useEffect(() => {
		const fetchCharges = async () => {
			try {
				const chargeAmount = await calculateCharges(minDate, endDate);
				setCharges(chargeAmount);
			} catch (err) {
				console.error("Failed to get Charges");
			}
		};

		if (!loading) {
			fetchCharges();
		}
	}, [endDate, loading]);

	return (
		<>
			<ToastContainer />
			<Modal
				open={open}
				onClose={onClose}
				aria-labelledby="modal-title"
				aria-describedby="modal-description"
			>
				<Box sx={style}>
					<div
						id="modal-description"
						className="w-full h-full flex flex-col justify-start items-center gap-3"
					>
						<div className="w-full flex flex-col justify-center items-center gap-5">
							<h2 className="text-xl font-bold">Extend Expiration Date</h2>
						</div>

						<div className="w-full flex flex-col justify-center items-center gap-5">
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateCalendar
									value={dayjs(endDate).tz("Asia/Jerusalem")}
									onChange={(newValue) => {
										if (newValue) {
											// Set the time to 11:59 PM in Israel timezone
											const endOfDay = dayjs(newValue)
												.tz("Asia/Jerusalem")
												.set("hour", 23)
												.set("minute", 59)
												.set("second", 0);
											setEndDate(endOfDay.toDate()); // Save the date object
										}
									}}
									renderInput={(params) => <TextField {...params} />}
									open
									minDate={minDate}
								/>
							</LocalizationProvider>
						</div>

						<div className="w-full text-center my-4">
							<h2 className="text-lg font-semibold">
								Total Charges: ${charges}
							</h2>
						</div>

						<Button
							variant="contained"
							color="primary"
							onClick={handleConfirmDate}
						>
							Confirm
						</Button>
					</div>
				</Box>
			</Modal>
		</>
	);
};

export default ExtendExpirationDateModal;
