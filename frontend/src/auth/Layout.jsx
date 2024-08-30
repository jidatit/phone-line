import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from "../../AuthContext";

const Layout = () => {

    const { currentUser, userType } = useAuth();

    return (
        <>
            {!currentUser && (
                <>
                    <Outlet />
                </>
            )}
            {currentUser && userType === "user" && (
                <>
                    <Navigate to="user_portal" />
                </>
            )}
            {currentUser && userType === "admin" && (
                <>
                    <Navigate to="admin_portal" />
                </>
            )}
        </>
    )
}

export default Layout;