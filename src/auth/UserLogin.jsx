import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserLogin = () => {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('User Successfully Logged In');
        } catch (error) {
            console.error('Error Logging In User : ', error.message);
        }
    };

    const routeToSignup = () => {
        navigate('/signup')
    }

    return (
        <div className='w-full min-h-screen flex flex-col justify-center items-center bg-[#340068]'>
            <ToastContainer />
            <div className='w-[90%] md:w-[70%] bg-[#FFFFFF] pt-[50px] pb-[60px] rounded-[10px] flex flex-col justify-center items-center gap-2'>
                <h2 className='text-center font-bold lg:text-[30px] md:text-[25px] text-[20px] mb-4'>Login</h2>
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
                    <h3 className='my-1 text-end w-full text-[#2F3061] font-medium cursor-pointer'>Forget Password?</h3>
                    <button
                        type='submit'
                        className='bg-[#340068] hover:bg-white text-white hover:text-[#340068] text-lg font-semibold py-2 px-4 w-[100%] border-2 border-[#340068] rounded shadow'>
                            Login
                    </button>
                    <h3 className='text-end w-full text-[#2F3061] font-medium cursor-pointer'>Not a Member?</h3>
                </form>
                <button
                    onClick={routeToSignup}
                    className='bg-[#FF6978] hover:bg-white text-white hover:text-[#FF6978] text-lg font-semibold py-2 px-4 w-[90%] md:w-[60%] border-2 border-[#FF6978] rounded shadow'>
                        Signup
                </button>
            </div>
        </div>
    );
};

export default UserLogin;