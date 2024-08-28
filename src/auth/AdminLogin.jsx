import React, { useState } from 'react';
import { TextField } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserLogin = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            //console.log('Admin Successfully Logged In');
        } catch (error) {
            console.error('Error Logging In Admin : ', error.message);
        }
    };


    return (
        <div className='w-full min-h-screen flex flex-col justify-center items-center bg-[#340068]'>
            <ToastContainer />
            <div className='w-[90%] relative md:w-[70%] max-w-[600px] bg-[#FFFFFF] pt-[60px] pb-[60px] rounded-[10px] flex flex-col justify-center items-center gap-5'>
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
