import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import UserAvatar from '../assets/Avatar.png';

const Layout = () => {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [displayName, setDisplayName] = useState(false);
    const [showNameInMenu, setShowNameInMenu] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const handleResize = useCallback(() => {
        const isDesktop = window.innerWidth > 768;
        setDisplayName(isDesktop);
        setShowNameInMenu(!isDesktop);
    }, []);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    const toggleOpenSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
            <>
                <div className="w-full flex flex-cols relative">
                    {/* Right Navbar */}
                    <div
                        id="logo-sidebar"
                        className={`w-64 min-h-screen absolute flex flex-col left-0 top-0 bg-[#340068] transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 z-50`}
                        aria-label="Sidebar"
                    >
                        <div onClick={toggleCloseSidebar} className="w-full h-60 flex justify-center items-center text-3xl text-white font-bold border-b border-gray-500 cursor-pointer">
                            Logo
                        </div>
                        <div className="flex flex-col justify-center items-center gap-4 mt-8">
                            <h1
                                onClick={() => navigate('/user_portal')}
                                className="flex justify-start items-center w-[80%] bg-[#180926] py-2 px-4 text-white font-semibold rounded text-base gap-2 cursor-pointer">
                                Activate Line
                            </h1>
                            <h1
                                onClick={() => navigate('/user_portal/reports')}
                                className="flex justify-start items-center w-[80%] bg-[#180926] py-2 px-4 text-white font-semibold rounded text-base gap-2 cursor-pointer">
                                Reports
                            </h1>
                            <h1
                                onClick={() => navigate('/user_portal/billing')}
                                className="flex justify-start items-center w-[80%] bg-[#180926] py-2 px-4 text-white font-semibold rounded text-base gap-2 cursor-pointer">
                                Billing
                            </h1>
                            <h1
                                className="flex justify-start items-center w-[80%] bg-[#180926] py-2 px-4 text-white font-semibold rounded text-base gap-2 cursor-pointer">
                                Logout
                            </h1>
                        </div>
                    </div>

                    {/* Left Main Area */}
                    <div className="absolute flex flex-col left-0 right-0 sm:ml-64 transition-all duration-300">
                        <div className="w-full flex flex-cols justify-between items-center border-r-2 border-gray-300 py-4 px-4 sm:px-10 md:px-10 lg:px-10 xl:px-10">
                            <div className="flex items-center justify-start gap-4 rtl:justify-end">
                                <button onClick={toggleOpenSidebar} aria-controls="logo-sidebar" type="button" className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200">
                                    <span className="sr-only">Open sidebar</span>
                                    <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                                    </svg>
                                </button>
                                <div className="font-bold text-2xl">Dashboard</div>
                            </div>
                            <div className="flex flex-cols justify-center items-center gap-0 lg:gap-2">
                                <Avatar src={UserAvatar} alt="Remy Sharp" />
                                {displayName && <h1 className="text-base font-semibold pl-4"> Full Name </h1>}
                                <Button
                                    id="basic-button"
                                    aria-controls={open ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={open ? 'true' : undefined}
                                    onClick={handleClick}
                                >
                                    <KeyboardArrowDownIcon className="text-4xl text-black" />
                                </Button>
                                <Menu
                                    id="basic-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                >
                                    {showNameInMenu && <MenuItem className='gap-2' > <AccountBoxOutlinedIcon /> Full Name </MenuItem>}
                                    <MenuItem className='gap-2' > <LockResetOutlinedIcon /> Profile </MenuItem>
                                    <MenuItem className='gap-2' > <LogoutOutlinedIcon /> Logout</MenuItem>
                                </Menu>
                            </div>
                        </div>
                        <div className="w-full py-4 px-4 lg:px-10 bg-[#F9FFFC]">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </>
    )
};

export default Layout;