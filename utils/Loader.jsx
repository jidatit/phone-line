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
		<div className="flex justify-center items-center">
			<div className="flex-col gap-4 w-full flex items-center justify-center">
				<div className="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full">
					<div className="w-16 h-16 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"></div>
				</div>
				<p className="text-blue-400 text-2xl mt-4 ">{message}</p>
			</div>
		</div>
	);
};

export default Loader;
