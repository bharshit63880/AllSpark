import React, { useState } from "react";
import Layout from "../../../components/layout/Layout";
import TextInput from "../../../components/input/TextInput";
import EmailInput from "../../../components/input/EmailInput";
import MobileNumberInput from "../../../components/input/MobileNumberInput";
import PasswordInput from "../../../components/input/PasswordInput";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import { useSocketListener } from "../../../hooks/useSocketListener";
import AuthPlatformScene from "../../../components/feature/AuthPlatformScene";

import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";


const SignUp = () => {

    const sleep = async (milliSeconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliSeconds));
    };

    let navigate = useNavigate();

    // console.log("Bhai Ye lo Auth Token: ", token);

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

    const { isConnected, clientId } = useWebSocketContext();

    const [formData, setFormData] = useState({
        name: "",
        userName: "",
        email: "",
        mobileNo: "",
        password: "",
        confirmPassword: "",
    });


    const onInputChangeOfForm = (e) => {
        const idOfInput = e.target.id;
        const valueOfInput = e.target.value;
        // console.log("Hello Brother yo change ho raha hai....", e.target.id);

        setFormData((prev) => {
            const updatedFormData = {
                ...prev,
                [idOfInput]: valueOfInput,
            };

            return updatedFormData;
        });


    };


    const isEmail = (identificationFieldText) => {
        const regex = /^[a-zA-Z0-9_.+\-]+[\x40][a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        const isValid = regex.test(identificationFieldText);
        return isValid;
    };


    const isValidMobileNo = (identificationFieldText) => {
        console.log("Inside Check Valid Phone No. :");
        console.log(identificationFieldText);
        console.log(identificationFieldText.length);
        const isValid = identificationFieldText.length === 10;
        return isValid;
    };


    const isValidSignUpFormData = (signupFormData) => {
        // console.log("Bhai Ye lo Form ka Data Validity Check karne ke liye: ");
        // console.log(signupFormData);

        const { name, userName, email, mobileNo, password, confirmPassword } = signupFormData;

        if (isEmail(email) === false) {
            toast.error("Please Enter Correct Email....");
            return false;
        }

        if(password.length <= 7) {
            toast.error("Password minimum length should be 8....");
            return false;
        }


        if (password !== confirmPassword) {
            toast.error("Password and Confirm Password Doesn't Match....");
            return false;
        }

        if (isValidMobileNo(mobileNo) === false) {
            toast.error("Please Enter a Valid 10 Digit Mobile No....");
            return false;
        }


        return true;
    };

    const handleSignUpFormSubmitButtonClick = async (e) => {
        e.preventDefault();

        // console.log("Hello Form Is Submitted....");
        // console.log("WebSocket Id is: ", clientId);

        const payload = {
            name: formData.name,
            user_name: (formData.userName).toLowerCase(),
            email: (formData.email).toLowerCase(),
            password: formData.password,
            mobile_no: formData.mobileNo,
        };


        // Make Signup Request to API 
        try {

            if (isValidSignUpFormData(formData) === true) {
                console.log("Signup API Call is Being Made....");

                const res = await axios.post(`${API_BASE}/auth/signup`, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId
                    }
                });

                // console.log("Response From the AUTH API Call: ");
                // console.log(res);
                toast.success(res.data.message);


            }
            else {
                // alert("Sorry Form Data Is Not Valid....");
                toast.warning("Sorry Form Data Is Not Valid....");
            }


        } catch (error) {
            console.log(error);
            console.log("Something Went Wrong While Making the AUTH API Call....", error);
            toast.error("Something went Wrong....");
        }


        console.log(formData);
    };





    // Websocket Event Listening Logic - Starts Here
    // Listener 1: Handle Valid Signup Response
    useSocketListener(
        // Selector: "Is this message for me?"
        (msg) => 
            msg.type === "response" && 
            msg.metadata?.operation === "signup" &&
            msg.metadata?.success !== undefined,

        // Handler: "What do I do with it?"
        async (msg) => {
            const { data, metadata } = msg;

            if (metadata?.success === true) {
                console.log("Signup successful:", data);

                // Show Toast Notification that Successfully Signed Up
                toast.success(metadata.message || "Account created successfully");

                // Sleep for 1s to show Toast Notification
                await sleep(1000);

                navigate("/verify-signup-otp", {
                    state: {
                        email: String(formData.email || "").trim().toLowerCase(),
                        mode: "signup",
                    },
                });
            }
            // Else Signup failed - tell user what went wrong
            else {
                console.log("Signup failed:", metadata.message);
                toast.error(metadata?.message || "Signup failed");
                
                // Provide helpful error messages for common issues
                const message = metadata?.message?.toLowerCase() || "";
                if (message.includes("email") || message.includes("username") || message.includes("duplicate")) {
                    await sleep(500);
                    toast.error("This email or username might already be in use. Please try different credentials.");
                }
            }
        }
    );

    // Websocket Event Listening Logic - Ends Here

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
                                <span className="premium-kicker">Create your account</span>
                                <div className="space-y-3">
                                    <h1 className="text-3xl lg:text-5xl poppins-semibold tracking-[-0.04em] text-[#091327]">
                                        Join AllSpark and unlock
                                        <span className="block primary-gradient-text">your full coding workspace.</span>
                                    </h1>
                                    <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                        Sign up once, verify your email, and move straight into problems, contests, support, and admin-ready workflows.
                                    </p>
                                </div>
                            </div>

                            <form className="flex flex-col gap-4">
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-2 lg:col-span-2">
                                        <label htmlFor="name" className="premium-label">Full Name</label>
                                        <TextInput
                                            id={`name`}
                                            onValueChange={onInputChangeOfForm}
                                            value={`${formData.name}`}
                                            placeholderText={`Enter your full name for AllSpark`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="userName" className="premium-label">Username</label>
                                        <TextInput
                                            id={`userName`}
                                            onValueChange={onInputChangeOfForm}
                                            value={`${formData.userName}`}
                                            placeholderText={`Choose your AllSpark username`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="mobileNo" className="premium-label">Mobile Number</label>
                                        <MobileNumberInput
                                            id={`mobileNo`}
                                            onValueChange={onInputChangeOfForm}
                                            value={`${formData.mobileNo}`}
                                            placeholderText={`Enter your 10-digit mobile number`}
                                        />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <label htmlFor="email" className="premium-label">Email Address</label>
                                        <EmailInput
                                            id={`email`}
                                            onValueChange={onInputChangeOfForm}
                                            value={`${formData.email}`}
                                            placeholderText={`Enter your AllSpark email address`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="premium-label">Password</label>
                                        <PasswordInput
                                            id={`password`}
                                            onValueChange={onInputChangeOfForm}
                                            value={`${formData.password}`}
                                            placeholderText={`Create your AllSpark password`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="premium-label">Confirm Password</label>
                                        <PasswordInput
                                            id={`confirmPassword`}
                                            onValueChange={onInputChangeOfForm}
                                            value={`${formData.confirmPassword}`}
                                            placeholderText={`Confirm your AllSpark password`}
                                        />
                                    </div>
                                </div>

                                <button onClick={handleSignUpFormSubmitButtonClick} className="premium-button-primary mt-4 w-full">
                                    Sign Up
                                </button>
                            </form>

                            <div className="rounded-[1.4rem] border border-[#0a173210] bg-white/65 p-4 text-sm text-[#091327]/62">
                                <p className="text-center poppins-medium">
                                    Already have an account?
                                    <Link
                                        to={"/login"}
                                        className="ms-2 poppins-semibold primary-gradient-text"
                                    >
                                        Login Here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    </>;
};


export default SignUp;
