import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import { auth, db } from "../../Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { hash, authAccount, authId, accountId } from "../../utils/auth";

const UserSignup = () => {
	const navigate = useNavigate();
	const [userData, setUserData] = useState({
		name: "",
		email: "",
		phoneNumber: "",
		password: "",
		confirmPassword: "",
		userType: "user",
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setUserData({ ...userData, [name]: value });
	};

	const handleSignup = async (e) => {
		e.preventDefault();
		try {
			const { confirmPassword, password, name, ...userDataWithoutPasswords } =
				userData;

			if (confirmPassword !== password) {
				toast.error("Passwords don't match");
				return;
			}
			console.log("atuh", authId, authAccount, hash);
			// API request to create a user
			const apiResponse = await axios.post(
				"https://widelyapp-api-02.widelymobile.com:3001/api/v2/temp_prev/",
				{
					auth: {
						auth_id: authId,
						hash: hash,
						auth: authAccount,
					},
					func_name: "prov_create_user",
					data: {
						account_id: accountId,
						name: name,
					},
				},
			);
			console.log("resp", apiResponse);

			// Check API response status
			if (apiResponse.data.status === "OK") {
				const domainUserId = apiResponse.data.data.id;

				// Proceed with Firebase registration
				const { user } = await createUserWithEmailAndPassword(
					auth,
					userData.email,
					password,
				);

				await setDoc(doc(db, "users", user.uid), {
					...userDataWithoutPasswords,
					domain_user_id: domainUserId, // Storing domain_user_id
					status: "Pending",
				});

				toast.success("User Registered");
				setUserData({
					name: "",
					email: "",
					phoneNumber: "",
					password: "",
					confirmPassword: "",
				});

				navigate("/user_portal");
			} else {
				toast.error("Failed to create user via API");
			}
		} catch (error) {
			toast.error(error.message);
		}
	};

	const routeToLogin = () => {
		navigate("/");
	};

	return (
		<>
			<div className="w-full min-h-screen flex flex-col justify-center items-center bg-[#340068]">
				<ToastContainer />
				<div className="w-[90%] relative md:w-[70%] bg-[#F1F1F1] pt-[30px] pb-[40px] rounded-[10px] flex flex-col justify-center items-center gap-2">
					<h2 className="text-center font-bold lg:text-[30px] md:text-[25px] text-[20px] mb-4">
						Sign up
					</h2>
					<form
						onSubmit={handleSignup}
						className="w-[90%] md:w-[60%] flex gap-2 flex-col justify-center items-center"
					>
						<TextField
							name="name"
							onChange={handleInputChange}
							value={userData.name}
							placeholder="Name"
							className="w-full outline-none"
							type="text"
							required
						/>
						<TextField
							name="email"
							onChange={handleInputChange}
							value={userData.email}
							placeholder="Email"
							className="w-full outline-none"
							type="email"
							required
						/>
						<TextField
							name="phoneNumber"
							onChange={handleInputChange}
							value={userData.phoneNumber}
							placeholder="Phone Number"
							className="w-full outline-none"
							type="number"
							required
						/>
						<TextField
							name="password"
							onChange={handleInputChange}
							value={userData.password}
							placeholder="Password"
							className="w-full outline-none"
							type="password"
							required
						/>
						<TextField
							name="confirmPassword"
							onChange={handleInputChange}
							value={userData.confirmPassword}
							placeholder="Confirm Password"
							className="w-full outline-none"
							type="password"
							required
						/>
						<button
							type="submit"
							className="bg-[#340068] hover:bg-white text-white hover:text-[#340068] text-lg font-semibold my-4 py-2 px-4 w-[100%] border-2 border-[#340068] rounded shadow"
						>
							Register
						</button>
						<h3 className="my-1 text-end w-full text-[#2F3061] font-medium cursor-pointer">
							{" "}
							Already Member?
						</h3>
					</form>
					<button
						type="button"
						onClick={routeToLogin}
						className="bg-[#FF6978] hover:bg-white text-white hover:text-[#FF6978] text-lg font-semibold py-2 px-4 w-[90%] md:w-[60%] border-2 border-[#FF6978] rounded shadow"
					>
						Login
					</button>
				</div>
			</div>
		</>
	);
};

export default UserSignup;
