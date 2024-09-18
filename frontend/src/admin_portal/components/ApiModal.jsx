import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Modal } from "@mui/material";
import {
	getApiKeyFromFirestore,
	setApiKeyInFirestore,
} from "../../../utils/getApi"; // Adjust the import path as needed

const ApiKeyModal = ({ open, handleClose }) => {
	const [apiKey, setApiKey] = useState("");
	const [newApiKey, setNewApiKey] = useState("");

	useEffect(() => {
		const fetchApiKey = async () => {
			const fetchedApiKey = await getApiKeyFromFirestore();
			if (fetchedApiKey) {
				setApiKey(fetchedApiKey);
			}
		};

		fetchApiKey();
	}, [open]);

	const handleSave = async () => {
		if (newApiKey) {
			await setApiKeyInFirestore(newApiKey);
			setApiKey(newApiKey);
			setNewApiKey("");
		}
	};

	return (
		<Modal open={open} onClose={handleClose} aria-describedby="api-key-modal">
			<Box sx={{ ...style, width: "500px" }}>
				<div
					id="api-key-modal"
					className="w-full h-full flex flex-col justify-start items-center gap-3"
				>
					<h2 className="text-xl font-bold">API Key Management</h2>

					<div className="w-full flex flex-col justify-start items-center gap-3">
						<TextField
							label="Current API Key"
							value={apiKey}
							fullWidth
							InputProps={{
								readOnly: true,
							}}
						/>
						<TextField
							label="New API Key"
							placeholder="Enter new API key"
							value={newApiKey}
							onChange={(e) => setNewApiKey(e.target.value)}
							fullWidth
						/>
						<Button
							variant="contained"
							color="primary"
							onClick={handleSave}
							className="w-full"
							sx={{ backgroundColor: "#FF6D6D", color: "#FFFFFF" }}
						>
							Save API Key
						</Button>
					</div>
				</div>
			</Box>
		</Modal>
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

export default ApiKeyModal;
