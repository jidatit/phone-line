import React, { useState, useMemo, useEffect } from "react";
import TuneIcon from "@mui/icons-material/Tune";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import {
	collection,
	doc,
	getDocs,
	getDoc,
	updateDoc,
} from "firebase/firestore";
import { db } from "../../../../Firebase";
import dayjs from "dayjs"; // Import dayjs or any other date formatting library
import { toast } from "react-toastify";
import axios from "axios";
import { hash, authAccount, authId } from "../../../../utils/auth";
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
const styleLogout = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	overflow: "auto",
	maxHeight: "100vh",
};

const AllUsersTable = () => {
	const [allUsersData, setAllUsersData] = useState([]);
	const [filteredallUsersData, setFilteredallUsersData] = useState([]);
	const [showOrHideFilters, setShowOrHideFilters] = useState(false);
	const [rowPerPage, setRowPerPage] = useState(10);
	const [rowsToShow, setRowsToShow] = useState([]);
	const [currentPage, setCurrentPage] = useState(0);
	const [openMobile, setOpenMobile] = useState(false);
	const handleOpenMobile = () => setOpenMobile(true);
	const handleCloseMobile = () => setOpenMobile(false);
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
		getallUsersData();
	}, []);

	useEffect(() => {
		setRowsToShow(filteredallUsersData.slice(0, rowPerPage));
	}, [filteredallUsersData, rowPerPage]);

	const totalPage = useMemo(
		() => Math.ceil(filteredallUsersData.length / rowPerPage),
		[filteredallUsersData.length, rowPerPage],
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

	const getallUsersData = async () => {
		try {
			// Fetching all users from Firestore
			const usersCollectionRef = collection(db, "users");
			const querySnapshot = await getDocs(usersCollectionRef);

			// Mapping Firestore data to match data structure
			const usersData = querySnapshot.docs
				.map((doc) => {
					const data = doc.data();
					const userData = data.activatedNumbers || {}; // Assuming activatedNumbers is the key storing the numbers
					const uid = doc.id; // Use the document ID as the user ID

					console.log("data", data);

					return Object.keys(userData).flatMap((type) =>
						userData[type].map((numberInfo) => {
							const purchaseDate = numberInfo.startDate
								? dayjs(numberInfo.startDate.toDate()).format("DD/MM/YYYY")
								: "N/A";
							const expireDate = numberInfo.endDate
								? dayjs(numberInfo.endDate.toDate()).format("DD/MM/YYYY")
								: "N/A";

							return {
								name: data.name || "Unknown Name", // Replace with actual name field if exists
								number: numberInfo.number,
								purchaseDate,
								expireDate,
								currentBalance: data.currentBalance || 0, // Replace with actual balance field if exists
								status: numberInfo.modify ? "Activated" : "Pending",
								endpointId: numberInfo?.endpointId || 0,
								userId: uid, // Use the document ID as the user ID
								simNumber: numberInfo?.simNumber,
								activated: numberInfo?.Activated,
							};
						}),
					);
				})
				.flat();

			setAllUsersData(usersData);
			console.log("all user", usersData); // Ensure to log the updated `usersData`
		} catch (error) {
			console.error("Error fetching users data: ", error);
			toast.error("Error fetching users data");
		}
	};

	const nextPage = () => {
		const startIndex = rowPerPage * (currentPage + 1);
		const endIndex = startIndex + rowPerPage;
		const newArray = filteredallUsersData.slice(startIndex, endIndex);
		setRowsToShow(newArray);
		setCurrentPage(currentPage + 1);
	};

	const changePage = (value) => {
		const startIndex = value * rowPerPage;
		const endIndex = startIndex + rowPerPage;
		const newArray = filteredallUsersData.slice(startIndex, endIndex);
		setRowsToShow(newArray);
		setCurrentPage(value);
	};

	const previousPage = () => {
		const startIndex = (currentPage - 1) * rowPerPage;
		const endIndex = startIndex + rowPerPage;
		const newArray = filteredallUsersData.slice(startIndex, endIndex);
		setRowsToShow(newArray);
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		} else {
			setCurrentPage(0);
		}
	};

	const [filters, setFilters] = useState({
		fullName: "",
		createdTimeFrom: null,
		createdTimeTo: null,
		sortOrder: "asc",
	});

	const resetFilterData = () => {
		setFilters({
			fullName: "",
			createdTimeFrom: null,
			createdTimeTo: null,
			sortOrder: "asc",
		});
	};

	const applyFilters = () => {
		let filtered = allUsersData;

		if (filters.fullName) {
			filtered = filtered.filter((item) =>
				item.Full_Name.toLowerCase().includes(filters.fullName.toLowerCase()),
			);
		}

		if (filters.createdTimeFrom) {
			filtered = filtered.filter(
				(item) =>
					new Date(item.Created_Time) >= new Date(filters.createdTimeFrom),
			);
		}

		if (filters.createdTimeTo) {
			filtered = filtered.filter(
				(item) =>
					new Date(item.Created_Time) <= new Date(filters.createdTimeTo),
			);
		}

		filtered.sort((a, b) => {
			const dateA = new Date(a.Created_Time);
			const dateB = new Date(b.Created_Time);
			return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
		});

		setFilteredallUsersData(filtered);
	};

	const handleFilterChange = (event) => {
		const { name, value } = event.target;
		setFilters((prevFilters) => ({
			...prevFilters,
			[name]: value,
		}));
	};

	const handleDateChange = (name, date) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			[name]: date,
		}));
	};

	const handleSortOrderChange = (event) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			sortOrder: event.target.value,
		}));
	};
	const handleDeactivateNumber = async (number, uid) => {
		console.log("number", number);
		console.log("uid", uid);
		try {
			// Make the API request to deactivate the number
			const apiResponse = await axios.post(
				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
				{
					auth: {
						auth_id: authId,
						hash: hash,
						auth: authAccount,
					},
					func_name: "prov_terminate_did",
					data: {
						number,
					},
				},
			);

			// Check if the deactivation was successful
			if (apiResponse.data.status === "OK") {
				// Get the current data from Firestore
				const userDocRef = doc(db, "users", uid);
				const userDoc = await getDoc(userDocRef);
				if (userDoc.exists()) {
					const data = userDoc.data();
					const activatedNumbers = data.activatedNumbers || {};

					// Remove the deactivated number from the user's data
					for (const type in activatedNumbers) {
						activatedNumbers[type] = activatedNumbers[type].filter(
							(num) => num.number !== number,
						);
					}

					// Update Firestore with the modified data
					await updateDoc(userDocRef, {
						activatedNumbers,
					});
					getallUsersData();

					console.log(
						"Number deactivated and removed from Firestore successfully",
					);
				} else {
					console.error("User document not found");
				}
			} else {
				console.error("Failed to deactivate the number");
				toast.error("Failed to deactivate the number");
			}
		} catch (error) {
			console.error("Error handling number deactivation:", error.message);
			toast.error(error.message);
		}
	};
	const deactivateByICCID = async (iccid, endpointId, userId) => {
		try {
			// Make the API request to deactivate the mobile number using the endpoint ID
			const apiResponse = await axios.post(
				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
				{
					auth: {
						auth_id: authId,
						hash: hash,
						auth: authAccount,
					},
					func_name: "prov_terminate_mobile",
					data: { endpoint_id: endpointId },
				},
			);

			// If the API response indicates success
			if (apiResponse.data.status === "OK") {
				const userDocRef = doc(db, "users", userId);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const activatedNumbers = userDoc.data().activatedNumbers;

					// Update the status of the numbers associated with the ICCID to "Pending"
					const updatedNumbers = {};
					for (let type in activatedNumbers) {
						updatedNumbers[type] = activatedNumbers[type].map((num) => {
							if (num.simNumber === iccid) {
								return { ...num, Activated: "Deactivated" };
							}
							return num;
						});
					}

					// Update the Firestore document with the new status
					await updateDoc(userDocRef, { activatedNumbers: updatedNumbers });

					// Optionally, refresh the UI or data
					getallUsersData();
				}
			}
		} catch (error) {
			console.error("Error deactivating ICCID:", error.message);
			toast.error(error.message);
		}
	};

	useEffect(() => {
		applyFilters();
	}, [filters, allUsersData]);

	return (
		<>
			<div className="w-full flex flex-row justify-between items-center mb-8">
				<h1 className="text-black text-xl font-bold">All Numbers</h1>
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
					{/* <div className='w-full flex flex-col lg:flex-row justify-evenly items-center px-4 pt-4 gap-2'>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TextField
                                label="Full Name"
                                variant="outlined"
                                size="large"
                                name="fullName"
                                value={filters.fullName}
                                onChange={handleFilterChange}
                            />
                            <DatePicker
                                label="Created Time From"
                                value={filters.createdTimeFrom}
                                onChange={(date) => handleDateChange("createdTimeFrom", date)}
                                renderInput={(params) => <TextField {...params} size="small" />}
                            />
                            <DatePicker
                                label="Created Time To"
                                value={filters.createdTimeTo}
                                onChange={(date) => handleDateChange("createdTimeTo", date)}
                                renderInput={(params) => <TextField {...params} size="small" />}
                            />
                            <FormControl size="small" variant="outlined">
                                <InputLabel>Sort Order</InputLabel>
                                <Select
                                    value={filters.sortOrder}
                                    size="large"
                                    name="sortOrder"
                                    onChange={handleSortOrderChange}
                                    label="Sort Created Time"
                                >
                                    <MenuItem value="asc">Ascending</MenuItem>
                                    <MenuItem value="desc">Descending</MenuItem>
                                </Select>
                            </FormControl>
                            <div onClick={resetFilterData} className="flex flex-row justify-end items-center gap-3 text-base text-gray-900 cursor-pointer border border-gray-300 rounded-lg py-4 px-4" >
                                <button> Reset </button>
                                <TuneIcon />
                            </div>
                        </LocalizationProvider>
                    </div> */}
				</>
			) : (
				<></>
			)}

			<div className="h-full bg-white flex items-center justify-center py-4">
				<div className="w-full px-2">
					<div className="w-full overflow-x-scroll md:overflow-auto max-w-7xl 2xl:max-w-none mt-2 ">
						<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border ">
							<thead className="rounded-lg text-base text-white font-semibold w-full border-t-2 border-gray-300 pt-6 pb-6">
								<tr>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Name
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Number
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Purchase Date
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Expiration Date
									</th>
									{/* <th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Current Balance
									</th> */}
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Status
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Mobile Number
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Add Funds
									</th>
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Remove Funds
									</th>
									{/* <th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Deactivate Number
									</th> */}
									<th className="py-3 px-3 text-[#340068] sm:text-base font-bold whitespace-nowrap">
										Deactivate Mobile
									</th>
								</tr>
							</thead>

							<tbody>
								{rowsToShow?.map((data, index) => (
									<tr
										className={`${
											index % 2 == 0 ? "bg-white" : "bg-[#222E3A]/[6%]"
										}`}
										key={index}
									>
										<td
											className={`py-2 px-3 font-normal text-base ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											{!data?.name ? <div> - </div> : <div>{data.name}</div>}
										</td>
										<td
											className={`py-2 px-3 font-normal text-base ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											{!data?.number ? (
												<div> - </div>
											) : (
												<div>{data.number}</div>
											)}
										</td>
										<td
											className={`py-2 px-3 font-normal text-base ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											{!data?.purchaseDate ? (
												<div> - </div>
											) : (
												<div>{data.purchaseDate}</div>
											)}
										</td>
										<td
											className={`py-2 px-3 font-normal text-base ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											{!data?.expireDate ? (
												<div> - </div>
											) : (
												<div>{data.expireDate}</div>
											)}
										</td>
										{/* <td
												className={`py-2 px-3 font-normal text-base ${
													index == 0
														? "border-t-2 border-gray-300"
														: index == rowsToShow?.length
															? "border-y"
															: "border-t"
												} whitespace-nowrap`}
											>
												{!data?.currentBalance ? (
													<div> - </div>
												) : (
													<div> ${data.currentBalance}</div>
												)}
											</td> */}
										<td
											className={`py-2 px-3 text-base  font-normal ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											{data?.activated && data?.activated === "Activated" && (
												<div className="w-full flex flex-row justify-start items-center gap-2">
													<FiberManualRecordIcon
														sx={{ color: "#4CE13F", fontSize: 16 }}
													/>
													<h1> {data.activated} </h1>
												</div>
											)}
											{data?.activated && data?.activated === "Deactivated" && (
												<div className="w-full flex flex-row justify-start items-center gap-2">
													<FiberManualRecordIcon
														sx={{ color: "#C70000", fontSize: 16 }}
													/>
													<h1 className="pr-4"> {data.activated} </h1>
													<DoneIcon
														sx={{
															color: "#4CE13F",
															fontSize: 28,
															fontWeight: "bold",
															cursor: "pointer",
														}}
													/>
													<div className="font-medium text-lg text-gray-800">
														{" "}
														|{" "}
													</div>
													<CloseIcon
														sx={{
															color: "#C70000",
															fontSize: 28,
															fontWeight: "bold",
															cursor: "pointer",
														}}
													/>
												</div>
											)}
										</td>
										<td
											className={`py-2 px-3 font-normal text-base ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											{!data?.simNumber ? (
												<div> - </div>
											) : (
												<div>{data.simNumber}</div>
											)}
										</td>
										<td
											className={`py-2 px-3 text-base  font-normal ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											<button
												onClick={handleOpenExtendExpirationDate}
												className="bg-[#FF6978] rounded-3xl text-white py-1 px-4"
											>
												Add Funds
											</button>
										</td>
										<td
											className={`py-2 px-3 text-base  font-normal ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											<button
												onClick={handleOpenExtendExpirationDate}
												className="bg-[#B40000] rounded-3xl text-white py-1 px-4"
											>
												Remove Funds
											</button>
										</td>

										{/* <td
											className={`py-2 px-3 text-base  font-normal ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											<button
												onClick={() => {
													handleDeactivateNumber(data?.number, data?.userId);
												}}
												className="bg-[#B40000] rounded-3xl text-white py-1 px-4"
											>
												Deactivate Line
											</button>
										</td> */}
										<td
											className={`py-2 px-3 text-base  font-normal ${
												index == 0
													? "border-t-2 border-gray-300"
													: index == rowsToShow?.length
														? "border-y"
														: "border-t"
											} whitespace-nowrap`}
										>
											<button
												onClick={() => {
													deactivateByICCID(
														data?.simNumber,
														data?.endpointId,
														data?.userId,
													);
												}}
												className="bg-[#B40000] rounded-3xl text-white py-1 px-4"
											>
												Deactivate Mobile
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
									? allUsersData?.length
									: (currentPage + 1) * rowPerPage}
							</span>{" "}
							of{" "}
							<span className="font-bold bg-[#FF6978] text-white mx-2 py-2 px-3 text-center rounded-lg">
								{allUsersData?.length}
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
									<h2 className="text-xl font-bold"> Add or Remove Funds </h2>
								</div>

								<div className="w-full h-full flex flex-col lg:flex-row xl:flex-row justify-center items-center gap-5">
									<div className="flex flex-col justify-start items-start gap-2"></div>
								</div>
							</div>
						</Box>
					</Modal>
					<Modal
						open={openMobile}
						onClose={handleCloseMobile}
						aria-describedby="modal-data"
					>
						<Box sx={styleLogout}>
							<div
								id="modal-data"
								className="w-full h-full flex flex-col justify-start items-center gap-3 px-16 py-16 text-white bg-[#340068]"
							>
								<div className="w-full h-full flex flex-col lg:flex-row xl:flex-row justify-center items-center gap-5">
									<h2 className="text-2xl font-bold">
										{" "}
										Are you sure you want to delete Mobile Number?{" "}
									</h2>
								</div>
								<div className="w-full h-full flex flex-col lg:flex-row xl:flex-row justify-center items-center mt-4 gap-5">
									<div className="flex flex-row justify-center items-start gap-4">
										<button
											onClick={handleCloseMobile}
											className="px-12 py-3 bg-[#B40000] font-semibold rounded-md"
										>
											{" "}
											Cancel{" "}
										</button>
										<button className="px-12 py-3 bg-[#0EB400] font-semibold rounded-md">
											{" "}
											Confirm{" "}
										</button>
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

export default AllUsersTable;
