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
import { hash, authAccount, authId, packageId } from "../../../utils/auth";

const Loader = () => {
	return (
		<div className="flex justify-center items-center">
			<div className="flex-col gap-4 w-full flex items-center justify-center">
				<div className="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full">
					<div className="w-16 h-16 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"></div>
				</div>
			</div>
		</div>
	);
};
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

	const handleReset = ()=>{
		setSimNumberState(true);
		setDatePickerState(false);
		setDisplayNumbers(false);
		setmsg('');
	}

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
	fetchUserData();

	const activateSim = async (domainUserId) => {
		try {
			setLoading(true);
			const apiResponse = await axios.post(
				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
				{
					auth: {
						auth_id: authId,
						hash: hash,
						auth: authAccount,
					},
					func_name: "prov_create_mobile",
					data: {
						domain_user_id: domainUserId,
						iccid: simNumber,
						service_id: packageId,
						dids: [
							{ purchase_type: "new", type: "mobile", country: "IL" },
							{ purchase_type: "new", type: "mobile", country: "US" },
						],
					},
				},
			);

			if (apiResponse.data.status === "OK") {
				const notes = apiResponse.data.data.notes;
				const msisdn = apiResponse.data.data.msisdn;
				const endpointId = apiResponse.data.data.endpoint_id;

				// Convert dayjs objects to JavaScript Date objects
				const convertedStartDate = startDate ? startDate.toDate() : null;
				const convertedEndDate = endDate ? endDate.toDate() : null;

				const newNumbers = notes.map((note) => {
					const [country, number] = note.split(" הופעל הוא ");
					const type = country.includes("IL") ? "IL" : "US";
					return {
						number: number.trim(),
						type,
						endpointId,
						msisdn,
						modify: false,
						startDate: convertedStartDate,
						endDate: convertedEndDate,
					};
				});
				setNumbers(newNumbers);
				console.log("new nu", newNumbers);
				const groupedNumbers = newNumbers.reduce((acc, num) => {
					if (!acc[num.type]) {
						acc[num.type] = [];
					}
					acc[num.type].push(num);
					return acc;
				}, {});

				console.log("Grouped Numbers:", groupedNumbers);

				const usNumber = newNumbers.find((num) => num.type === "US");
				if (usNumber) {
					const modifyResponse = await axios.post(
						"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
						{
							auth: {
								auth_id: authId,
								hash: hash,
								auth: authAccount,
							},
							func_name: "modify_caller_ids",
							data: {
								domain_user_id: domainUserId,
								caller_ids_to_update: [
									{
										id: -1,
										owner_id: null,
										status: "on",
										cid_name: "1",
										number: usNumber.number,
										to_remove: false,
									},
								],
							},
						},
					);

					if (modifyResponse.data.status === "OK") {
						groupedNumbers["US"] = groupedNumbers["US"].map((num) =>
							num.number === usNumber.number ? { ...num, modify: true } : num,
						);
					} else {
						console.log("Failed to modify caller ID");
						toast.error("Failed to modify caller ID");
					}
				} else {
					console.log("US number not found in the response");
					toast.error("US number not found in the response");
				}

				// Get current data from Firestore
				const userDocRef = doc(db, "users", userId);
				const userDoc = await getDoc(userDocRef);
				let existingData = userDoc.exists()
					? userDoc.data().activatedNumbers || {}
					: {};

				// Merge new data with existing data
				const updatedNumbers = { ...existingData };
				for (const [type, nums] of Object.entries(groupedNumbers)) {
					if (!updatedNumbers[type]) {
						updatedNumbers[type] = [];
					}
					updatedNumbers[type] = [...updatedNumbers[type], ...nums];
				}

				// Update Firestore with the merged data
				await updateDoc(userDocRef, {
					activatedNumbers: updatedNumbers,
				});
				setLoading(false);
				setDisplayNumbers(true);
			} else {
				console.log("Failed to activate SIM");
				toast.error("Failed to activate SIM");
				setmsg("Failed   to Activate")
				setLoading(false);
			}
		} catch (error) {
			console.error("Error activating SIM:", error.message);
			toast.error(error.message);
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
			if (userData && userData.domain_user_id) {
				activateSim(userData.domain_user_id);
			} else {
				console.log("Domain user ID not found");
				toast.error("Domain user ID not found");
			}
		} else {
			console.log("Please select both start and end dates");
			toast.error("Please select both start and end dates");
		}
	};
	if(loading)
	{
		return <Loader/>
	}
	return (
		<div className="w-full h-auto flex flex-col justify-start items-start gap-4 lg:px-52 px-4">
			<ToastContainer />
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
					<button className=" px-3 py-1 text-base text-white bg-red-600 rounded-md" onClick={()=> handleReset()}>Go back</button>
				</div>
			)}
		</div>
	);
};

export default ActivateLine;
