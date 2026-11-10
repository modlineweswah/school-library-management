import React from 'react';
import { protectedRouteStyles as s} from '../assets/dummyStyles';
import { useAuth } from './AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';


const ProtectedRoute = ({allowedRole}) => {

    const {currentUser, ready} = useAuth();
    const location = useLocation();
    if (!ready) {
        console.log("Protected Route: Auth not Ready");
        return(
            <div className={s.loadingContainer}>
                <div className={s.loadingCard}>
                    Loading Your Library Workspace
                </div>
            </div>
        )    
    } 

    if (!currentUser) {
        const hasToken = localStorage.getItem("library-auth-token");
        console.log("Protected Route: No current User.HasToken",
            !!hasToken,
            "AllowedRole:",
            allowedRole
        )

        if (hasToken) {
            return(
                <div className={s.loadingContainer}>
                    <div className={s.loadingCard}>
                        Synching Your Workspace...
                    </div>
                </div>
            )
            
        }

        return (
            <Navigate to="/login" replace state={ { from:location.pathname } } />
        )
        
    }

    console.log("Protected Route: currentUser:",
        currentUser.role,
        "AllowedRole:",
        allowedRole
    );

    if (currentUser.role !==allowedRole) {
        console.warn("Protected Route: Role mismatch! Redirecting to Login page...");

        return (
            <Navigate to="/login" replace state={ { from:location.pathname } } />
        )
        
    }

    console.log("Protected Route: Access Granted")
  return (
    <Outlet/>
  )
}

export default ProtectedRoute