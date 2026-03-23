import React, { useState } from "react";
import Layout from "../../../components/layout/Layout";
import TextInput from "../../../components/input/TextInput";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import AuthPlatformScene from "../../../components/feature/AuthPlatformScene";

import axios from "axios";
import { useAuthContext } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


const LogOut = () => {

    const sleep = async (milliSeconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliSeconds));
    };

    const { token, user, setToken, setUser } = useAuthContext();

    let navigate = useNavigate();

    const navigateToPreviousPage = () => {
        navigate(-1);
    };

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

    const { isConnected, clientId } = useWebSocketContext();

    const [formData, setFormData] = useState({
        confirmationField: "",
    });


    const onInputChangeOfForm = (e) => {
        const idOfInput = e.target.id;
        const valueOfInput = e.target.value;
        console.log("Hello Brother yo change ho raha hai....", e.target.id);

        setFormData((prev) => {
            const updatedFormData = {
                ...prev,
                [idOfInput]: valueOfInput,
            };

            return updatedFormData;
        });


    };

    const isValidLogoutFormData = (loginFormData) => {
        if (formData.confirmationField === "logout") {
            return true;
        }

        return false;
    };

    const handleLogoutFormSubmitButtonClick = async (e) => {
        e.preventDefault();


        console.log("Hello Form Is Submitted....");
        console.log("WebSocket Id is: ", clientId);

        if (isValidLogoutFormData(formData) === true) {

            // Destroy User and Token From Client Side & localStorage When Logout is Clicked
            localStorage.removeItem("user");
            localStorage.removeItem("token");

            setToken(null);
            setUser(null);

            // Show toast notification that logged out Successully
            toast.success("Logged Out Successfully....");
            
            // Sleep for 1s to show notification
            await sleep(1000);
            
            // After Successful Logout Navigate to Previous Page
            navigateToPreviousPage();
        }
        else {
            // alert("Please Type 'logout' to confirm logout or else explore more....");
            toast.warning("Please Type 'logout' to confirm logout or else explore more....");
        }


    };




    return <>
        <Layout>
            <section className="premium-page premium-section">
                <div className="premium-container premium-auth-layout">
                    <div className="premium-auth-side">
                        <AuthPlatformScene />
                    </div>

                    <div className="premium-form-shell premium-auth-card">
                        <div className="flex flex-col gap-8">
                            <div className="space-y-4">
                                <span className="premium-kicker">Logout confirmation</span>
                                <div className="space-y-3">
                                    <h1 className="text-3xl lg:text-5xl poppins-semibold tracking-[-0.04em] text-[#091327]">
                                        Hi, {user?.name || "Anonymous"}.
                                        <span className="block primary-gradient-text">You are about to sign out.</span>
                                    </h1>
                                    <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                        Type <span className="rounded-full bg-[#135BEB]/10 px-2 py-1 font-semibold text-[#135BEB]">logout</span> to confirm and safely clear your local session.
                                    </p>
                                </div>
                            </div>

                            <form className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="confirmationField" className="premium-label">Confirmation</label>
                                    <TextInput
                                        id={`confirmationField`}
                                        onValueChange={onInputChangeOfForm}
                                        value={`${formData.confirmationField}`}
                                        placeholderText={`Type 'logout' to confirm`}
                                    />
                                </div>

                                <button onClick={handleLogoutFormSubmitButtonClick} className="premium-button-primary mt-4 w-full">
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    </>;
};


export default LogOut;
