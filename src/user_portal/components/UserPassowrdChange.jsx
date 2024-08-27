import React, { useState, useEffect } from "react";
import { TextField } from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../Firebase";
import {
	getAuth,
	EmailAuthProvider,
	reauthenticateWithCredential,
	updatePassword,
} from "firebase/auth";
import bcrypt from "bcryptjs";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserPasswordChange = () => {
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [isUpdating, setIsUpdating] = useState(false);

	const handlePasswordReset = async (e) => {
		e.preventDefault();

		if (oldPassword === "" || newPassword === "" || confirmPassword === "") {
			toast.error("Please fill all the fields");
			return;
		}

		if (oldPassword === newPassword) {
			toast.error("New Password should be different from the Old Password");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("New Password & Confirm Password don't match");
			return;
		}

		try {
			setIsUpdating(true);

			const auth = getAuth();
			const user = auth.currentUser;

			// Re-authenticate the user with the old password
			const credential = EmailAuthProvider.credential(user.email, oldPassword);
			await reauthenticateWithCredential(user, credential);

			// Update the password in Firebase Authentication
			await updatePassword(user, newPassword);

			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");

			toast.success("Password Updated Successfully");
		} catch (error) {
			console.error("Error updating password: ", error.message);

			if (error.code == "auth/invalid-credential") {
				toast.error("Old password is incorrect");
			} else if (error.code == "auth/requires-recent-login") {
				toast.error("Please re-login and try again.");
			} else {
				toast.error("Error updating password. Please try again.");
			}
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<>
			<div className="w-full h-auto flex flex-col justify-center items-center">
				<ToastContainer />
				<div className="w-full h-12 rounded-t-lg text-white font-semibold text-base pt-3 pl-3 bg-[#340068]">
					Change Password
				</div>

				<form
					onSubmit={handlePasswordReset}
					className="w-[95%] h-auto my-5 rounded-xl flex flex-col justify-around items-start gap-3"
				>
					<div className="w-full pt-4 pb-6 px-6 bg-[#f7f7f7] flex flex-col gap-2 rounded-lg shadow-sm">
						<h1 className="font-semibold text-lg text-[#340068]">
							Old Password
						</h1>
						<TextField
							fullWidth
							name="oldPassword"
							type="password"
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
							variant="outlined"
							inputProps={{ style: { fontFamily: "inherit" } }}
						/>
					</div>

					<div className="w-full pt-4 pb-6 px-6 bg-[#f7f7f7] flex flex-col gap-2 rounded-lg shadow-sm">
						<h1 className="font-semibold text-lg text-[#340068]">
							New Password
						</h1>
						<TextField
							fullWidth
							name="newPassword"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							variant="outlined"
							inputProps={{ style: { fontFamily: "inherit" } }}
						/>
					</div>

					<div className="w-full pt-4 pb-6 px-6 bg-[#f7f7f7] flex flex-col gap-2 rounded-lg shadow-sm">
						<h1 className="font-semibold text-lg text-[#340068]">
							Confirm Password
						</h1>
						<TextField
							fullWidth
							name="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							variant="outlined"
							inputProps={{ style: { fontFamily: "inherit" } }}
						/>
					</div>

					<div className="w-full py-4 px-6 flex flex-col justify-center lg:justify-end items-center lg:items-end">
						<button
							type="submit"
							className="w-auto text-white bg-[#340068] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-[#e6be00] font-medium rounded-xl text-sm px-5 py-3 text-center"
							disabled={isUpdating}
						>
							{isUpdating ? "Updating..." : "Update Password"}
						</button>
					</div>
				</form>
			</div>
		</>
	);
};

export default UserPasswordChange;
