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
import {
	hash,
	authAccount,
	authId,
	packageId,
	accountId,
} from "../../../utils/auth";
import Loader from "../../../utils/Loader";
const ActivateLine = () => {
	const [simNumber, setSimNumber] = useState("");
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [simNumberState, setSimNumberState] = useState(true);
	const [datePickerState, setDatePickerState] = useState(false);
	const [displayNumbers, setDisplayNumbers] = useState(false);
	const { currentUser } = useAuth();
	const [loading, setLoading] = useState(false);
	const userId = currentUser.uid;
	const [numbers, setNumbers] = useState("");

	const handleReset = () => {
		setSimNumberState(true);
		setDatePickerState(false);
		setDisplayNumbers(false);
		setmsg("");
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

	// const activateSim = async () => {
	// 	try {
	// 		setLoading(true);

	// 		// Step 1: Create a user via the API before activating the SIM
	// 		let userCreationResponse;
	// 		try {
	// 			userCreationResponse = await axios.post(
	// 				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
	// 				{
	// 					auth: {
	// 						auth_id: authId,
	// 						hash: hash,
	// 						auth: authAccount,
	// 					},
	// 					func_name: "prov_create_user",
	// 					data: {
	// 						account_id: accountId,
	// 						name: simNumber, // Use simNumber as the name for the API request
	// 					},
	// 				},
	// 			);
	// 		} catch (error) {
	// 			handleReset();
	// 			if (axios.isAxiosError(error)) {
	// 				console.error("API request failed:", error.message);
	// 				toast.error(error.message);
	// 			} else {
	// 				console.error("Unexpected error:", error.message);
	// 				toast.error(error.message);
	// 			}
	// 			toast.error(
	// 				"Failed to create user via API due to network or server issue",
	// 			);
	// 			setLoading(false);
	// 			return;
	// 		}

	// 		if (userCreationResponse.data.status !== "OK") {
	// 			toast.error("Failed to create user via API");
	// 			setLoading(false);
	// 			return;
	// 		}
	// 		const domainUserId = userCreationResponse.data.data.id;

	// 		// Step 2: Proceed to activate the SIM
	// 		let apiResponse;
	// 		try {
	// 			apiResponse = await axios.post(
	// 				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
	// 				{
	// 					auth: {
	// 						auth_id: authId,
	// 						hash: hash,
	// 						auth: authAccount,
	// 					},
	// 					func_name: "prov_create_mobile",
	// 					data: {
	// 						domain_user_id: domainUserId,
	// 						iccid: simNumber, // Include the SIM number in the API request
	// 						service_id: packageId,
	// 						dids: [
	// 							{ purchase_type: "new", type: "mobile", country: "IL" },
	// 							{ purchase_type: "new", type: "mobile", country: "US" },
	// 						],
	// 					},
	// 				},
	// 			);
	// 			toast.success("Line is Activated Successfully");
	// 		} catch (error) {
	// 			handleReset();
	// 			if (axios.isAxiosError(error)) {
	// 				console.error("API request failed:", error.message);
	// 				toast.error(error.message);
	// 			} else {
	// 				console.error("Unexpected error:", error.message);
	// 				toast.error(error.message);
	// 			}
	// 			toast.error("Failed to activate SIM due to network or server issue");
	// 			setLoading(false);
	// 			return;
	// 		}

	// 		if (apiResponse.data.status === "OK") {
	// 			const notes = apiResponse.data.data.notes;
	// 			const msisdn = apiResponse.data.data.msisdn;
	// 			const endpointId = apiResponse.data.data.endpoint_id;

	// 			// Convert dayjs objects to JavaScript Date objects
	// 			const convertedStartDate = startDate ? startDate.toDate() : null;
	// 			const convertedEndDate = endDate ? endDate.toDate() : null;

	// 			const newNumbers = notes.map((note) => {
	// 				const [country, number] = note.split(" הופעל הוא ");
	// 				const type = country.includes("IL") ? "IL" : "US";
	// 				return {
	// 					number: number.trim(),
	// 					type,
	// 					endpointId,
	// 					msisdn,
	// 					modify: false,
	// 					startDate: convertedStartDate,
	// 					endDate: convertedEndDate,
	// 					simNumber, // Store the entered SIM number with each number entry
	// 					Activated: "Activated",
	// 					domainUserId: domainUserId,
	// 				};
	// 			});
	// 			setNumbers(newNumbers);

	// 			// Step 3: Modify caller ID for US numbers
	// 			const usNumber = newNumbers.find((num) => num.type === "US");
	// 			if (usNumber) {
	// 				let modifyResponse;
	// 				try {
	// 					modifyResponse = await axios.post(
	// 						"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
	// 						{
	// 							auth: {
	// 								auth_id: authId,
	// 								hash: hash,
	// 								auth: authAccount,
	// 							},
	// 							func_name: "modify_caller_ids",
	// 							data: {
	// 								domain_user_id: domainUserId,
	// 								caller_ids_to_update: [
	// 									{
	// 										id: -1,
	// 										owner_id: null,
	// 										status: "on",
	// 										cid_name: "1",
	// 										number: usNumber.number,
	// 										to_remove: false,
	// 									},
	// 								],
	// 							},
	// 						},
	// 					);
	// 				} catch (error) {
	// 					if (axios.isAxiosError(error)) {
	// 						handleReset();
	// 						console.error("API request failed:", error.message);
	// 						toast.error(error.message);
	// 					} else {
	// 						handleReset();
	// 						console.error("Unexpected error:", error.message);
	// 						toast.error(error.message);
	// 					}
	// 					toast.error(
	// 						"Failed to modify caller ID due to network or server issue",
	// 					);
	// 					setLoading(false);
	// 					return;
	// 				}

	// 				if (modifyResponse.data.status === "OK") {
	// 					newNumbers.forEach((num) => {
	// 						if (num.type === "US" && num.number === usNumber.number) {
	// 							num.modify = true;
	// 						}
	// 					});
	// 				} else {
	// 					handleReset();
	// 					console.log("Failed to modify caller ID");
	// 					toast.error("Failed to modify caller ID");
	// 				}
	// 			} else {
	// 				handleReset();
	// 				console.log("US number not found in the response");
	// 				toast.error("US number not found in the response");
	// 			}

	// 			// Step 4: Store the activated numbers in Firestore, organized by simNumber
	// 			const userDocRef = doc(db, "users", userId);
	// 			const userDoc = await getDoc(userDocRef);
	// 			let existingData = userDoc.exists()
	// 				? userDoc.data().activatedNumbers || {}
	// 				: {};

	// 			// Group numbers by IL and US
	// 			const groupedNumbers = newNumbers.reduce((acc, num) => {
	// 				if (!acc[num.type]) {
	// 					acc[num.type] = [];
	// 				}
	// 				acc[num.type].push(num);
	// 				return acc;
	// 			}, {});

	// 			// Merge new data with existing data, keyed by simNumber
	// 			const updatedNumbers = {
	// 				...existingData,
	// 				[simNumber]: {
	// 					IL: groupedNumbers.IL || [],
	// 					US: groupedNumbers.US || [],
	// 				},
	// 			};

	// 			// Update Firestore with the merged data
	// 			await updateDoc(userDocRef, {
	// 				activatedNumbers: updatedNumbers,
	// 			});

	// 			setLoading(false);
	// 			setDisplayNumbers(true);
	// 		} else {
	// 			handleReset();
	// 			console.log("Failed to activate SIM");
	// 			toast.error("Failed to activate SIM");
	// 			setmsg("Failed to Activate");
	// 			setLoading(false);
	// 		}
	// 	} catch (error) {
	// 		handleReset();
	// 		console.error("Unexpected error during SIM activation:", error.message);
	// 		toast.error("Unexpected error occurred during SIM activation");
	// 		setLoading(false);
	// 	}
	// };

	const activateSim = async () => {
		try {
			setLoading(true);
	
			const response = await axios.post("http://localhost:3000/activate-sim", {
				authId,
				hash,
				authAccount,
				accountId,
				simNumber,
				packageId,
				startDate,
				endDate,
			});
	
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
	
			if (step3.status === "Failed") {
				handleReset();
				toast.error(`Step 3 failed: ${step3.error}`);
			} else {
				toast.success("SIM activation successful and caller ID modified");
			}
			
			// Show the numbers obtained from the API
			setNumbers(step2.numbers);
			setDisplayNumbers(true);
	
			setLoading(false);
		} catch (error) {
			console.error("Unexpected error during SIM activation:", error.message);
			toast.error("Unexpected error occurred during SIM activation");
			setLoading(false);
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

	const handleConfirmDates = async () => {
		if (startDate && endDate) {
			console.log("Start Date: ", startDate.format("YYYY-MM-DD"));
			console.log("End Date: ", endDate.format("YYYY-MM-DD"));
			setDatePickerState(false);

			const userData = await fetchUserData();

			if (userData) {
				activateSim();
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
								Start Date: {startDate ? startDate.format("YYYY-MM-DD") : ""}
							</h1>
							<h1 className="font-semibold">
								End Date: {endDate ? endDate.format("YYYY-MM-DD") : ""}
							</h1>
						</div>
						<div className="w-full flex lg:flex-row flex-col justify-center items-center gap-2 border border-gray-300 pt-8">
							{/* Start Date */}
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateCalendar
									value={startDate}
									onChange={(newValue) => setStartDate(newValue)}
								/>
							</LocalizationProvider>
							{/* End Date */}
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateCalendar
									value={endDate}
									onChange={(newValue) => setEndDate(newValue)}
								/>
							</LocalizationProvider>
						</div>
						<div className="w-full flex justify-center items-center">
							<button
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
							{endDate ? endDate.format("YYYY-MM-DD") : ""}
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
