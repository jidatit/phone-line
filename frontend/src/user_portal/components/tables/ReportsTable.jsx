import React, { useState, useMemo, useEffect } from "react";
import TuneIcon from "@mui/icons-material/Tune";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StaticDateTimePicker } from "@mui/x-date-pickers/StaticDateTimePicker";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { InputLabel, TextField } from "@mui/material";
import { Link, Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../Firebase";
import { useAuth } from "../../../../AuthContext";
import { toast, ToastContainer } from "react-toastify";
import { hash, authAccount, authId } from "../../../../utils/auth";
import { Timestamp } from "firebase/firestore";
import axios from "axios";
const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
	overflow: "auto",
	maxHeight: "100vh",
};

const ReportsTable = () => {
	const [numbersData, setNumbersData] = useState([]);
	const [filteredNumbersData, setFilteredNumbersData] = useState([]);
	const [showOrHideFilters, setShowOrHideFilters] = useState(false);
	const [rowPerPage, setRowPerPage] = useState(10);
	const [rowsToShow, setRowsToShow] = useState([]);
	const [currentPage, setCurrentPage] = useState(0);
	const { currentUser } = useAuth();
	const userId = currentUser?.uid;
	const [loading, setLoading] = useState(false);
	const [loadingStates, setLoadingStates] = useState({});

	const [openExtendExpirationDate, setOpenExtendExpirationDate] =
		useState(false);
	const handleOpenExtendExpirationDate = () =>
		setOpenExtendExpirationDate(true);
	const handleCloseExtendExpirationDate = () =>
		setOpenExtendExpirationDate(false);

	const showFilters = () => {
		if (showOrHideFilters === false) {
			setShowOrHideFilters(true);
		} else {
			setShowOrHideFilters(false);
		}
	};

	const handleRowPerPageChange = (event) => {
		setRowPerPage(event.target.value);
	};

	useEffect(() => {
		getNumbersData();
	}, [userId]);

	useEffect(() => {
		setRowsToShow(filteredNumbersData.slice(0, rowPerPage));
	}, [filteredNumbersData, rowPerPage]);

	const totalPage = useMemo(
		() => Math.ceil(filteredNumbersData.length / rowPerPage),
		[filteredNumbersData.length, rowPerPage],
	);

	const generatePaginationLinks = () => {
		const paginationLinks = [];
		const ellipsis = "...";

		if (totalPage <= 7) {
			for (let i = 1; i <= totalPage; i++) {
				paginationLinks.push(i);
			}
		} else {
			if (currentPage <= 4) {
				for (let i = 1; i <= 5; i++) {
					paginationLinks.push(i);
				}
				paginationLinks.push(ellipsis);
				paginationLinks.push(totalPage);
			} else if (currentPage >= totalPage - 3) {
				paginationLinks.push(1);
				paginationLinks.push(ellipsis);
				for (let i = totalPage - 4; i <= totalPage; i++) {
					paginationLinks.push(i);
				}
			} else {
				paginationLinks.push(1);
				paginationLinks.push(ellipsis);

				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					paginationLinks.push(i);
				}

				paginationLinks.push(ellipsis);
				paginationLinks.push(totalPage);
			}
		}

		return paginationLinks;
	};

	const getNumbersData = async () => {
		try {
			setLoading(true);
			// Fetch user document from Firestore
			const userDocRef = doc(db, "users", userId);
			const userDoc = await getDoc(userDocRef);

			if (userDoc.exists()) {
				// Get the activatedNumbers from the document
				const activatedNumbers = userDoc.data().activatedNumbers || {};

				// Transform the data to match the structure of numbersData
				const numbersData = [];

				// Iterate over each simNumber key in activatedNumbers
				for (const [simNumber, numbersByType] of Object.entries(
					activatedNumbers,
				)) {
					// Prepare an object to hold both IL and US numbers
					let rowData = {
						simNumber: simNumber,
						ilNumber: null,
						usNumber: null,
						startDate: null,
						endDate: null,
						status: null,
					};

					// Iterate over each country (IL, US) and its numbers
					for (const [country, numbers] of Object.entries(numbersByType)) {
						// Ensure numbers is an array before using forEach
						if (Array.isArray(numbers)) {
							// biome-ignore lint/complexity/noForEach: <explanation>
							numbers.forEach((num) => {
								// Check if num.startDate and num.endDate are Firestore Timestamps
								const purchaseDate =
									num.startDate instanceof Timestamp
										? num.startDate.toDate().toLocaleDateString()
										: new Date(num.startDate).toLocaleDateString();

								const expireDate =
									num.endDate instanceof Timestamp
										? num.endDate.toDate().toLocaleDateString()
										: new Date(num.endDate).toLocaleDateString();

								// Add the number data to rowData
								if (country === "IL") {
									rowData.ilNumber = num.number;
								} else if (country === "US") {
									rowData.usNumber = num.number;
								}

								// Update other common fields
								rowData.startDate = purchaseDate;
								rowData.endDate = expireDate;
								rowData.status = num.Activated;
							});
						}
					}

					// Push the combined row data for this simNumber
					numbersData.push(rowData);
				}

				setLoading(false);
				// Set the transformed data to state
				setNumbersData(numbersData);
			} else {
				setLoading(false);
				console.log("No such document!");
				setNumbersData([]); // Set empty data if no document found
			}
		} catch (error) {
			setLoading(false);
			console.error("Error fetching activated numbers: ", error);
			setNumbersData([]); // Set empty data in case of error
		}
	};

	const nextPage = () => {
		const startIndex = rowPerPage * (currentPage + 1);
		const endIndex = startIndex + rowPerPage;
		const newArray = filteredNumbersData.slice(startIndex, endIndex);
		setRowsToShow(newArray);
		setCurrentPage(currentPage + 1);
	};

	const changePage = (value) => {
		const startIndex = value * rowPerPage;
		const endIndex = startIndex + rowPerPage;
		const newArray = filteredNumbersData.slice(startIndex, endIndex);
		setRowsToShow(newArray);
		setCurrentPage(value);
	};

	const previousPage = () => {
		const startIndex = (currentPage - 1) * rowPerPage;
		const endIndex = startIndex + rowPerPage;
		const newArray = filteredNumbersData.slice(startIndex, endIndex);
		setRowsToShow(newArray);
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		} else {
			setCurrentPage(0);
		}
	};

	const [filters, setFilters] = useState({
		simNumber: "",
		number: "",
		sortOrder: "asc",
	});
	const resetFilterData = () => {
		setFilters({
			simNumber: "",
			number: "",
			sortOrder: "asc",
		});
	};

	const applyFilters = () => {
		let filtered = numbersData;

		// Filter by simNumber
		if (filters.simNumber) {
			filtered = filtered.filter((item) =>
				item.simNumber.toLowerCase().includes(filters.simNumber.toLowerCase()),
			);
		}

		// Filter by Numbers (IL or US)
		if (filters.number) {
			filtered = filtered.filter(
				(item) =>
					item.ilNumber?.toLowerCase().includes(filters.number.toLowerCase()) ||
					item.usNumber?.toLowerCase().includes(filters.number.toLowerCase()),
			);
		}

		// Sort by Created Time
		filtered.sort((a, b) => {
			const dateA = new Date(a.Created_Time);
			const dateB = new Date(b.Created_Time);
			return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
		});

		setFilteredNumbersData(filtered);
	};

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setFilters((prevFilters) => ({
			...prevFilters,
			[name]: value,
		}));
	};

	const handleSortOrderChange = (event) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			sortOrder: event.target.value,
		}));
	};

	const terminateUser = async (domainUserId, userId, index, activated) => {
		if (activated === "Deactivated") {
			toast.error("User is Already terminated");
			return;
		}
		try {
			setLoadingStates((prevState) => ({
				...prevState,
				[index]: true,
			}));

			// Make the API request to the backend endpoint
			const response = await axios.post(
				"https://phone-line-backend.onrender.com/terminate-user",
				{
					domainUserId,
					userId,
					authId,
					hash,
					authAccount,
				},
			);

			if (response.data.status === "Success") {
				setLoadingStates((prevState) => ({
					...prevState,
					[index]: false,
				}));
				toast.success(response.data.message);
				getNumbersData();
			} else {
				setLoadingStates((prevState) => ({
					...prevState,
					[index]: false,
				}));
				console.error("API response error:", response.data);
				toast.error(response.data.message);
			}
		} catch (error) {
			setLoadingStates((prevState) => ({
				...prevState,
				[index]: false,
			}));
			console.error("Error terminating user:", error.message);
			toast.error(error.message);
		}
	};

	useEffect(() => {
		applyFilters();
	}, [filters, numbersData]);

	return (
		<>
			<div className="w-full h-16 flex flex-row justify-between items-center mb-3">
				<h1 className="text-black text-xl font-bold">All Numbers Made</h1>
				<Link
					to="/user_portal"
					className="flex justify-center items-center gap-2 px-8 py-3 bg-[#340068] text-white rounded-md text-base font-medium"
				>
					Activate a New Number
					<AddOutlinedIcon />
				</Link>
			</div>

			<div className="w-full flex flex-col justify-center items-center">
				<div className="w-full h-16 flex flex-row justify-end items-center rounded-t-lg pr-10 bg-[#340068]">
					<div
						onClick={showFilters}
						className="flex flex-row justify-end items-center gap-3 font-semibold text-base text-white cursor-pointer"
					>
						<button> Filter </button>
						<TuneIcon />
					</div>
				</div>
			</div>

			{showOrHideFilters === true ? (
				<>
					<div className="w-full flex flex-col lg:flex-row justify-evenly items-center px-4 pt-4 gap-2">
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<TextField
								label="SIM Number"
								variant="outlined"
								size="large"
								name="simNumber"
								value={filters.simNumber}
								onChange={handleFilterChange}
							/>
							<TextField
								label="Number"
								variant="outlined"
								size="large"
								name="number"
								value={filters.number}
								onChange={handleFilterChange}
							/>
							<FormControl size="small" variant="outlined">
								<InputLabel>Sort Order</InputLabel>
								<Select
									value={filters.sortOrder}
									size="large"
									name="sortOrder"
									onChange={handleSortOrderChange}
									label="Sort Order"
								>
									<MenuItem value="asc">Ascending</MenuItem>
									<MenuItem value="desc">Descending</MenuItem>
								</Select>
							</FormControl>
							<div
								onClick={resetFilterData}
								className="flex flex-row justify-end items-center gap-3 text-base text-gray-900 cursor-pointer border border-gray-300 rounded-lg py-4 px-4"
							>
								<button> Reset </button>
								<TuneIcon />
							</div>
						</LocalizationProvider>
					</div>
				</>
			) : (
				<></>
			)}

			<div className="h-full bg-white flex items-center justify-center py-4">
				<div className="w-full px-2">
					<div className="w-full overflow-x-scroll md:overflow-auto max-w-7xl 2xl:max-w-none mt-2 ">
						<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border">
							<thead className="rounded-lg text-base text-white font-semibold w-full border-t-2 border-gray-300 pt-6 pb-6">
								<tr>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										SIM Number
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										IL Number
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										US Number
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Purchase Date
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Expiration Date
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Status
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Extend
									</th>
								</tr>
							</thead>

							<tbody>
								{rowsToShow?.map((data, index) => (
									<tr
										className={`${index % 2 === 0 ? "bg-white" : "bg-[#222E3A]/[6%]"}`}
										key={index}
									>
										<td className="py-2 px-3 font-normal text-base border-t-2 border-gray-300 whitespace-nowrap">
											{data.simNumber || "-"}
										</td>
										<td className="py-2 px-3 font-normal text-base border-t-2 border-gray-300 whitespace-nowrap">
											{data.ilNumber || "-"}
										</td>
										<td className="py-2 px-3 font-normal text-base border-t-2 border-gray-300 whitespace-nowrap">
											{data.usNumber || "-"}
										</td>
										<td className="py-2 px-3 font-normal text-base border-t-2 border-gray-300 whitespace-nowrap">
											{data.startDate || "-"}
										</td>
										<td className="py-2 px-3 font-normal text-base border-t-2 border-gray-300 whitespace-nowrap">
											{data.endDate || "-"}
										</td>
										<td className="py-2 px-3 text-base font-normal border-t-2 border-gray-300 whitespace-nowrap">
											{data.status === "Activated" ? (
												<div className="flex items-center gap-2">
													<FiberManualRecordIcon
														sx={{ color: "#4CE13F", fontSize: 16 }}
													/>
													<h1>{data.status}</h1>
												</div>
											) : (
												<div className="flex items-center gap-2">
													<FiberManualRecordIcon
														sx={{ color: "#C70000", fontSize: 16 }}
													/>
													<h1>{data.status}</h1>
												</div>
											)}
										</td>
										<td className="py-2 px-3 text-base font-normal border-t-2 border-gray-300 whitespace-nowrap">
											<button
												onClick={handleOpenExtendExpirationDate}
												className="bg-[#FF6978] rounded-3xl text-white py-1 px-4"
											>
												Extend Expiration Date
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="w-full flex justify-center sm:justify-between xl:flex-row flex-col gap-10 mt-12 lg:mt-8 px-0 lg:px-4 xl:px-4 items-center">
						<div className="text-base text-center">
							Showing
							<span className="font-bold bg-[#FF6978] text-white mx-2 p-2 text-center rounded-lg">
								{currentPage === 0 ? 1 : currentPage * rowPerPage + 1}
							</span>
							to{" "}
							<span className="font-bold bg-[#FF6978] text-white mx-2 py-2 px-3 text-center rounded-lg">
								{currentPage === totalPage - 1
									? numbersData?.length
									: (currentPage + 1) * rowPerPage}
							</span>{" "}
							of{" "}
							<span className="font-bold bg-[#FF6978] text-white mx-2 py-2 px-3 text-center rounded-lg">
								{numbersData?.length}
							</span>{" "}
							entries
						</div>

						<div className="flex flex-row justify-center items-center gap-4">
							<div> Rows Per Page </div>
							<Box sx={{ width: 200 }}>
								<FormControl fullWidth>
									<Select
										id="rows-per-page"
										value={rowPerPage}
										onChange={handleRowPerPageChange}
										sx={{
											height: 40,
											backgroundColor: "#FF6978",
											color: "white",
											borderRadius: "8px",
											".MuiOutlinedInput-notchedOutline": {
												borderColor: "transparent",
											},
											"&:hover .MuiOutlinedInput-notchedOutline": {
												borderColor: "transparent",
											},
											"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
												borderColor: "transparent",
											},
											".MuiSelect-icon": {
												color: "white",
											},
											"& .MuiSelect-select": {
												borderRadius: "8px",
											},
											"& .MuiListItem-root": {
												"&:hover": {
													backgroundColor: "white",
													color: "black",
												},
											},
											"& .Mui-selected": {
												backgroundColor: "white",
												color: "black",
											},
										}}
									>
										<MenuItem value={5}>5</MenuItem>
										<MenuItem value={10}>10</MenuItem>
										<MenuItem value={15}>15</MenuItem>
										<MenuItem value={20}>20</MenuItem>
									</Select>
								</FormControl>
							</Box>
						</div>

						<div className="flex">
							<ul
								className="flex justify-center items-center gap-x-[10px] z-30"
								role="navigation"
								aria-label="Pagination"
							>
								<li
									className={` prev-btn flex items-center justify-center w-[36px] rounded-[6px] h-[36px] border-[1px] border-solid border-[#E4E4EB] disabled] ${
										currentPage == 0
											? "bg-[#cccccc] pointer-events-none"
											: " cursor-pointer"
									}`}
									onClick={previousPage}
								>
									<img src="https://www.tailwindtap.com/assets/travelagency-admin/leftarrow.svg" />
								</li>

								{generatePaginationLinks().map((item, index) => (
									<li
										key={index}
										onClick={() => changePage(item - 1)}
										className={`flex items-center justify-center w-[36px] rounded-[6px] h-[34px] border-solid border-[2px] cursor-pointer ${
											currentPage === item - 1
												? "text-white bg-[#FF6978]"
												: "border-[#E4E4EB]"
										}`}
									>
										<span aria-hidden="true">{item}</span>
									</li>
								))}

								<li
									className={`flex items-center justify-center w-[36px] rounded-[6px] h-[36px] border-[1px] border-solid border-[#E4E4EB] ${
										currentPage == totalPage - 1
											? "bg-[#cccccc] pointer-events-none"
											: " cursor-pointer"
									}`}
									onClick={nextPage}
								>
									<img src="https://www.tailwindtap.com/assets/travelagency-admin/rightarrow.svg" />
								</li>
							</ul>
						</div>
					</div>

					<Modal
						open={openExtendExpirationDate}
						onClose={handleCloseExtendExpirationDate}
						aria-describedby="modal-data"
					>
						<Box sx={style}>
							<div
								id="modal-data"
								className="w-full h-full flex flex-col justify-start items-center gap-3"
							>
								<div className="w-full h-full flex flex-col lg:flex-row xl:flex-row justify-center items-center gap-5">
									<h2 className="text-xl font-bold">
										{" "}
										Extend Expiration Date{" "}
									</h2>
								</div>

								<div className="w-full h-full flex flex-col lg:flex-row xl:flex-row justify-center items-center gap-5">
									<div className="flex flex-col justify-start items-start gap-2">
										<LocalizationProvider dateAdapter={AdapterDayjs}>
											<StaticDateTimePicker orientation="landscape" />
										</LocalizationProvider>
									</div>
								</div>
							</div>
						</Box>
					</Modal>
				</div>
			</div>
		</>
	);
};

export default ReportsTable;
