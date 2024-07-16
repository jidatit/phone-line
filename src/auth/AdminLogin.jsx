import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserLogin = () => {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            console.log('Admin Successfully Logged In');
            toast.success('Admin Successfully Logged In');
        } catch (error) {
            console.error('Error Logging In Admin : ', error.message);
            toast.success('Error Logging In Admin');
        }
    };

    return (
        <div className='w-full min-h-screen flex flex-col justify-center items-center bg-[#340068]'>
            <ToastContainer />
            <div className='w-[90%] relative md:w-[70%] bg-[#FFFFFF] pt-[60px] pb-[60px] rounded-[10px] flex flex-col justify-center items-center gap-5'>
                <h2 className='text-center font-bold lg:text-[30px] md:text-[25px] text-[20px]'>Admin Login</h2>
                <form className='w-[90%] md:w-[60%] flex gap-2 flex-col justify-center items-center' onSubmit={handleLogin}>
                    <TextField
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='Email'
                        className='w-full outline-none'
                        type='email'
                        required
                    />
                    <TextField
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='Password'
                        className='w-full outline-none'
                        type='password'
                        required
                    />
                    <div className='my-3' ><h3>Forget Password?</h3></div>
                    <button
                        type='submit'
                        className='bg-[#340068] hover:bg-white text-white hover:text-[#340068] text-lg font-semibold py-2 px-4 w-[100%] border-2 border-[#340068] rounded shadow'>
                            Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserLogin;
