import { useState, useEffect } from "react";

const Loader = () => {
	const [message, setMessage] = useState("Activating SIM...");

	useEffect(() => {
		const timer1 = setTimeout(() => {
			setMessage("Activating SIM can take some time...");
		}, 3000);

		const timer2 = setTimeout(() => {
			setMessage("Still working on it, please be patient...");
		}, 8000);

		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
		};
	}, []);

	return (
		<>
			<div className="flex justify-center items-center">
				<div className="w-full gap-x-2 flex justify-center items-center">
					<div className="w-5 bg-[#d991c2] animate-pulse h-5 rounded-full animate-bounce"></div>
					<div className="w-5 animate-pulse h-5 bg-[#9869b8] rounded-full animate-bounce"></div>
					<div className="w-5 h-5 animate-pulse bg-[#6756cc] rounded-full animate-bounce"></div>
					<p className="text-blue-400 text-2xl mt-4 ">{message}</p>
				</div>
			</div>
		</>
	);
};

export default Loader;
