import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import EastIcon from '@mui/icons-material/East';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

const ActivateLine = () => {
    const [simNumber, setSimNumber] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [simNumberState, setSimNumberState] = useState(true);
    const [datePickerState, setDatePickerState] = useState(false);
    const [displayNumbers, setDisplayNumbers] = useState(false);

    const handleConfirmSimNumber = (e) => {
        e.preventDefault();
        if (simNumber !== '') {
            console.log("Entered Sim Number is : ", simNumber);
            setSimNumberState(false);
            setDatePickerState(true);
        } else {
            console.log("Please Enter the Sim Number");
        }
    }

    const handleConfirmDates = () => {
        if (startDate && endDate) {
            console.log("Start Date: ", startDate.format('YYYY-MM-DD'));
            console.log("End Date: ", endDate.format('YYYY-MM-DD'));
            setDatePickerState(false);
            setDisplayNumbers(true);
        } else {
            console.log("Please select both start and end dates");
        }
    }

    return (
        <>
            <div className='w-full h-auto flex flex-col justify-start items-start gap-4 lg:px-52 px-4'>
                {simNumberState === true && (
                    <>
                        <h1 className='w-full text-xl font-bold text-center text-black my-3' > Kindly Enter Your Sim Number </h1>
                        <h2 className='w-full text-base font-medium text-gray-500'> Sim Number </h2>
                        <Box
                            sx={{ width: '100%' }}
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
                        <div className='w-full flex justify-end items-center'>
                            <button
                                onClick={handleConfirmSimNumber}
                                className='px-6 py-2 flex flex-row justify-center items-center gap-2 rounded-md text-white bg-[#FF6978]' >
                                <h2 className='font-semibold' >Confirm</h2>
                                <EastIcon />
                            </button>
                        </div>
                    </>
                )}

                {datePickerState === true && (
                    <>
                        <h1 className='w-full text-xl font-bold text-center text-black my-3' > Select the dates to activate the line for </h1>
                        <div className='w-full flex flex-row justify-start items-start gap-4'>
                            <h1 className='font-semibold' > Start Date: {startDate ? startDate.format('YYYY-MM-DD') : ''}</h1>
                            <h1 className='font-semibold' > End Date: {endDate ? endDate.format('YYYY-MM-DD') : ''}</h1>
                        </div>
                        <div className='w-full flex lg:flex-row flex-col justify-center items-center gap-2 border border-gray-300 pt-8'>
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
                        <div className='w-full flex justify-center items-center'>
                            <button
                                onClick={handleConfirmDates}
                                className='w-full lg:w-[50%] px-6 py-3 font-semibold rounded-md text-lg text-white bg-[#FF6978]' >
                                Confirm Dates
                            </button>
                        </div>
                    </>
                )}

                {displayNumbers === true && (
                    <>
                        <h1 className='w-full text-xl font-bold text-center text-black my-3'>
                            Your Line has been activated and the expiration date is: {endDate ? endDate.format('YYYY-MM-DD') : ''}
                        </h1>
                        <h1 className='w-full text-lg font-bold text-center text-black'>
                            Your New Phone Number
                        </h1>
                        <div className='w-full flex flex-row justify-center items-center gap-6'>
                            <h1 className='font-bold text-lg text-[#340068]'> LS Number: +1735823586 </h1>
                            <h1 className='font-bold text-lg text-[#FF6978]'> US Number: +1735823586 </h1>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default ActivateLine;
