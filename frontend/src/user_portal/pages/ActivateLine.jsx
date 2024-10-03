import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import EastIcon from "@mui/icons-material/East";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../AuthContext";
import { db } from "../../../Firebase";
import dayjs from "dayjs";
import {
	hash,
	authAccount,
	authId,
	packageId,
	accountId,
} from "../../../utils/auth";
import utc from "dayjs/plugin/utc";
import Loader from "../../../utils/Loader";
import {
	calculateCharges,
	hasSufficientBalance,
} from "../../../utils/calculateCharge";
const ActivateLine = () => {
	dayjs.extend(utc);
	const Today = dayjs();
	const [simNumber, setSimNumber] = useState("");
	const [startDate, setStartDate] = useState(Today);
	const [endDate, setEndDate] = useState(dayjs().add(1, "day"));
	const [simNumberState, setSimNumberState] = useState(true);
	const [datePickerState, setDatePickerState] = useState(false);
	const [displayNumbers, setDisplayNumbers] = useState(false);
	const { currentUser } = useAuth();
	const [charges, setCharges] = useState(0); // State for charges
	const [loading, setLoading] = useState(false);
	const userId = currentUser.uid;
	const [numbers, setNumbers] = useState("");
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState("");
	const handleReset = () => {
		setSimNumberState(true);
		setDatePickerState(false);
		setDisplayNumbers(false);
		setStartDate(dayjs());
		setEndDate(dayjs().add(1, "day"));
		setmsg("");
	};

	// Function to update balance after activation
	const updateBalanceAfterActivation = async (
		userDocRef,
		currentBalance,
		charge,
	) => {
		const updatedBalance = currentBalance - charge;
		await updateDoc(userDocRef, { balance: updatedBalance });
	};

	const fetchUserData = async () => {
		try {
			const userDocRef = doc(db, "users", userId);
			const userDoc = await getDoc(userDocRef);
			if (userDoc.exists()) {
				return userDoc.data();
			} else {
				throw new Error("User not found");
			}
		} catch (error) {
			console.error("Error fetching user data:", error.message);
			toast.error(error.message);
			return null;
		}
	};

	const activateSim = async (startDateZ, endDateZ) => {
		const userDocRef = doc(db, "users", userId);
		const userDoc = await getDoc(userDocRef);

		if (!userDoc.exists()) {
			toast.error("User document not found");
			throw new Error("User document not found");
		}

		const userData = userDoc.data();
		const currentBalance = userData.balance || 0;
		const charge = await calculateCharges(startDate, endDate);
		if (!hasSufficientBalance(currentBalance, charge)) {
			toast.error("Insufficient balance for SIM activation");
			handleReset();
			return;
		}

		try {
			setLoading(true);

			const response = await axios.post(
				"https://phone-line-backend.onrender.com/activate-sim",
				{
					authId,
					hash,
					authAccount,
					accountId,
					simNumber,
					packageId,
					startDate: startDateZ,
					endDate: endDateZ,
					userId,
				},
			);

			const { step1, step2, step3 } = response.data;

			if (step1.status === "Failed") {
				toast.error(`Step 1 failed: ${step1.error}`);
				setLoading(false);
				handleReset();
				return;
			}

			if (step2.status === "Failed") {
				toast.error(`Step 2 failed: ${step2.error}`);
				setLoading(false);
				handleReset();
				return;
			}

			if (step2.status === "Success") {
				try {
					await updateBalanceAfterActivation(
						userDocRef,
						currentBalance,
						charge,
					);
					toast.success("Balance updated successfully.");
				} catch (balanceError) {
					toast.error("Failed to update balance. Please try again.");
				}
			}

			if (step3.status === "Failed") {
				handleReset();
				toast.error(`Step 3 failed: ${step3.error}`);
			} else {
				toast.success("SIM activation successful and caller ID modified");
				setNumbers(step2.numbers);
				setDisplayNumbers(true);
			}

			setLoading(false);
		} catch (error) {
			console.error("Unexpected error during SIM activation:", error.message);
			toast.error("An error occurred during SIM activation. Please try again.");
			setLoading(false);
			handleReset();
		}
	};

	const [msg, setmsg] = useState();

	const handleConfirmSimNumber = (e) => {
		e.preventDefault();
		if (simNumber !== "") {
			console.log("Entered Sim Number is: ", simNumber);

			setSimNumberState(false);
			setDatePickerState(true);
		} else {
			console.log("Please Enter the Sim Number");
			toast.error("Please Enter the Sim Number");
		}
	};
	useEffect(() => {
		const fetchCharges = async () => {
			try {
				const chargeAmount = await calculateCharges(startDate, endDate);
				setCharges(chargeAmount);
			} catch (err) {
				toast.error("Failed to get Charges");
			}
		};

		fetchCharges();
	}, [startDate, endDate]);

	const handleConfirmDates = async () => {
		if (startDate && endDate) {
			// Get current time
			// const currentTime = dayjs();

			// // Add current time to startDate and endDate
			// const startDateTime = dayjs(startDate)
			// 	.hour(currentTime.hour())
			// 	.minute(currentTime.minute())
			// 	.second(currentTime.second())
			// 	.utc(); // Convert to UTC

			// const endDateTime = dayjs(endDate)
			// 	.hour(currentTime.hour())
			// 	.minute(currentTime.minute())
			// 	.second(currentTime.second())
			// 	.utc(); // Convert to UTC

			// // Format to ISO string with 'Z' suffix
			// const startDateTimeZ = startDateTime.toISOString();
			// const endDateTimeZ = endDateTime.toISOString();

			// setStartDate(startDateTimeZ);
			// setEndDate(endDateTimeZ);

			// Log the date and time
			// console.log("Start Date and Time in UTC: ", startDateTimeZ);
			// console.log("End Date and Time in UTC: ", endDateTimeZ);
			// console.log(
			// 	"Start Date and Time (formatted): ",
			// 	startDateTime.format("YYYY-MM-DD HH:mm:ss"),
			// );
			// console.log(
			// 	"End Date and Time (formatted): ",
			// 	endDateTime.format("YYYY-MM-DD HH:mm:ss"),
			// );

			const startDateTimeZ = dayjs(startDate)
				.tz("Asia/Jerusalem")
				.startOf("day") // Set to the start of the day
				.toISOString();

			const endDateTimeZ = dayjs(endDate)
				.tz("Asia/Jerusalem")
				.endOf("day") // Set to the end of the day
				.toISOString();
			setDatePickerState(false);

			const userData = await fetchUserData();

			if (userData) {
				activateSim(startDateTimeZ, endDateTimeZ);
			} else {
				console.log("Domain user ID not found");
				toast.error("Domain user ID not found");
			}
		} else {
			console.log("Please select both start and end dates");
			toast.error("Please select both start and end dates");
		}
	};

	if (loading) {
		return <Loader />;
	}

	return (
		<>
			<ToastContainer />
			<div className="w-full h-auto flex flex-col justify-start items-start gap-4 lg:px-52 px-4">
				{simNumberState && (
					<>
						<h1 className="w-full text-xl font-bold text-center text-black my-3">
							Kindly Enter Your Sim Number
						</h1>
						<h2 className="w-full text-base font-medium text-gray-500">
							Sim Number
						</h2>
						<Box
							sx={{ width: "100%" }}
							component="form"
							noValidate
							autoComplete="off"
							onSubmit={handleConfirmSimNumber}
						>
							<TextField
								id="sim-number"
								label="Sim Number"
								value={simNumber}
								onChange={(e) => setSimNumber(e.target.value)}
								fullWidth
							/>
						</Box>
						<div className="w-full flex justify-end items-center">
							<button
								type="submit"
								onClick={handleConfirmSimNumber}
								className="px-6 py-2 flex flex-row justify-center items-center gap-2 rounded-md text-white bg-[#FF6978]"
							>
								<h2 className="font-semibold">Confirm</h2>
								<EastIcon />
							</button>
						</div>
					</>
				)}
				{datePickerState && (
					<>
						<h1 className="w-full text-xl font-bold text-center text-black my-3">
							Select the dates to activate the line for
						</h1>
						<div className="w-full flex flex-row justify-start items-start gap-4">
							<h1 className="font-semibold">
								Start Date:{" "}
								{startDate
									? dayjs(startDate)

											.startOf("day") // Start of the day (00:00) in Israel timezone
											.format("YYYY-MM-DD HH:MM")
									: ""}
							</h1>
							<h1 className="font-semibold">
								End Date:{" "}
								{endDate
									? dayjs(endDate)

											.endOf("day") // End of the day (23:59) in Israel timezone
											.format("YYYY-MM-DD HH:MM")
									: ""}
							</h1>
						</div>

						<div className="w-full flex lg:flex-row flex-col justify-center items-center gap-2 border border-gray-300 pt-8">
							{/* Start Date */}
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateCalendar
									value={dayjs(startDate)}
									onChange={(newValue) => {
										if (newValue) {
											// Set the time to the start of the day in Israel timezone
											const startOfDay = dayjs(newValue);
											// .tz("Asia/Jerusalem")
											// .startOf("day");

											setStartDate(startOfDay.toDate()); // Save the date object

											// Ensure end date is not before the new start date
											// if (dayjs(endDate).isBefore(startOfDay)) {
											setEndDate(startOfDay.add(1, "day").toDate()); // Default end date to a day after the new start date
											// }
										}
									}}
									minDate={dayjs().startOf("day")}
								/>
							</LocalizationProvider>

							{/* End Date */}
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateCalendar
									value={dayjs(endDate)}
									onChange={(newValue) => {
										if (newValue) {
											const endOfDay = dayjs(newValue);
											// .tz("Asia/Jerusalem")
											// .endOf("day");

											setEndDate(endOfDay.toDate());
										}
									}}
									minDate={dayjs(startDate).add(1, "day")}
								/>
							</LocalizationProvider>
						</div>
						{/* Display the charges */}
						<div className="w-full text-center my-4">
							<h2 className="text-lg font-semibold">
								Total Charges: ${charges}
							</h2>
						</div>
						<div className="w-full flex justify-center items-center">
							<button
								type="submit"
								onClick={handleConfirmDates}
								className="w-full lg:w-[50%] px-6 py-3 font-semibold rounded-md text-lg text-white bg-[#FF6978]"
							>
								Confirm Dates
							</button>
						</div>
					</>
				)}

				{displayNumbers && (
					<>
						<h1 className="w-full text-xl font-bold text-center text-black my-3">
							Your Line has been activated and the expiration date is:{" "}
							{endDate
								? dayjs(endDate)

										.endOf("day") // Ensure the time is set to 23:59 in Israel timezone
										.format("YYYY-MM-DD HH:mm")
								: ""}
						</h1>

						<h1 className="w-full text-lg font-bold text-center text-black">
							Your New Phone Number
						</h1>
						<div className="w-full flex flex-row justify-center items-center gap-6">
							{/* Display numbers from state */}
							{/* Example: */}
							<h1 className="font-bold text-lg text-[#340068]">
								{/* {numbers[0].type}: Number: +{} */}
								{numbers[0]?.type} : {numbers[0]?.number}
							</h1>
							<h1 className="font-bold text-lg text-[#FF6978]">
								{numbers[1]?.type} : {numbers[1]?.number}
							</h1>
						</div>
					</>
				)}
				{msg && (
					<div className=" w-full text-red-700 text-2xl italic text-center flex gap-3 items-center justify-center">
						{msg}
						<button
							className=" px-3 py-1 text-base text-white bg-red-600 rounded-md"
							onClick={() => handleReset()}
						>
							Go back
						</button>
					</div>
				)}
			</div>
		</>
	);
};

export default ActivateLine;
