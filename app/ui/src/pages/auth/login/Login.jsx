import React, { useState } from "react";
import Layout from "../../../components/layout/Layout";
import TextInput from "../../../components/input/TextInput";
import PasswordInput from "../../../components/input/PasswordInput";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import { useSocketListener } from "../../../hooks/useSocketListener";
import AuthPlatformScene from "../../../components/feature/AuthPlatformScene";

import axios from "axios";
import { useAuthContext } from "../../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";

const Login = () => {
    const sleep = async (milliSeconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliSeconds));
    };

    const { setToken, setUser } = useAuthContext();
    const navigate = useNavigate();

    const navigateToPreviousPage = () => {
        navigate(-1);
    };

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

    const { clientId, isConnected } = useWebSocketContext();

    const [formData, setFormData] = useState({
        identificationField: "",
        password: "",
    });

    const onInputChangeOfForm = (e) => {
        const idOfInput = e.target.id;
        const valueOfInput = e.target.value;

        setFormData((prev) => ({
            ...prev,
            [idOfInput]: valueOfInput,
        }));
    };

    const isValidLoginFormData = (loginFormData) => {
        const identificationField = String(loginFormData.identificationField || "").trim();
        const password = String(loginFormData.password || "").trim();

        if (!identificationField || !password) {
            toast.error("Email/username and password are required.");
            return false;
        }

        return true;
    };

    const isEmail = (identificationFieldText) => {
        const regex = /^[a-zA-Z0-9_.+\-]+[\x40][a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        return regex.test(String(identificationFieldText || "").trim());
    };

    const handleLoginFormSubmit = async (e) => {
        e.preventDefault();

        if (!clientId || !isConnected) {
            toast.error("WebSocket not ready yet. Please wait a moment and retry.");
            return;
        }

        const valueAfterFormCheck = isValidLoginFormData(formData);
        if (valueAfterFormCheck !== true) {
            toast.warning("Sorry Form Data Is Not Valid....");
            await sleep(1000);
            return;
        }

        const identificationField = String(formData.identificationField || "").trim().toLowerCase();
        const password = String(formData.password || "");

        const payload = {
            password,
        };

        if (isEmail(identificationField) === true) {
            payload.email = identificationField;
        } else {
            payload.user_name = identificationField;
        }

        try {
            const res = await axios.post(`${API_BASE}/auth/login`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "client-id": clientId,
                },
            });

            toast.success(res?.data?.message || "Login request accepted.");
            await sleep(500);
        } catch (error) {
            console.log("Something Went Wrong While Making the AUTH API Call....", error);
            toast.error(error?.response?.data?.message || "Something Went Wrong....");
            await sleep(1000);
        }
    };

    useSocketListener(
        (msg) =>
            msg?.type === "response" &&
            (
                msg?.metadata?.operation === "auth.login" ||
                msg?.metadata?.operation === "auth.issueJWT" ||
                msg?.metadata?.operation === "login"
            ) &&
            msg?.metadata?.success !== undefined,
        async (msg) => {
            const { data, metadata } = msg || {};

            if (metadata?.success === true) {
                const tokenFromEventData = data?.token || data?.result?.token;
                const userFromEventData = data?.result?.user || data?.result || data?.user;

                if (!tokenFromEventData || !userFromEventData) {
                    console.log("Unexpected login socket payload:", msg);
                    toast.error("Login failed: Invalid response from server");
                    return;
                }

                localStorage.setItem("token", JSON.stringify(tokenFromEventData));
                localStorage.setItem("user", JSON.stringify(userFromEventData));

                setToken(tokenFromEventData);
                setUser(userFromEventData);

                toast.success(metadata?.message || "Login successful");
                await sleep(700);
                navigateToPreviousPage();
            } else {
                toast.error(metadata?.message || "Login failed. Please check your credentials.");
                await sleep(700);
            }
        }
    );

    return (
        <Layout>
            <section className="premium-page premium-section">
                <div className="premium-container premium-auth-layout">
                    <div className="premium-auth-side">
                        <AuthPlatformScene />
                    </div>

                    <div className="premium-form-shell premium-auth-card">
                        <div className="flex flex-col gap-8">
                            <div className="space-y-4">
                                <span className="premium-kicker">Welcome back</span>
                                <div className="space-y-3">
                                    <h1 className="text-3xl lg:text-5xl poppins-semibold tracking-[-0.04em] text-[#091327]">
                                        Continue inside your
                                        <span className="block primary-gradient-text">AllSpark workspace.</span>
                                    </h1>
                                    <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                        Log in to practice problems, join contests, track submissions, and manage your full coding journey.
                                    </p>
                                </div>
                            </div>

                            <form className="flex flex-col gap-4" onSubmit={handleLoginFormSubmit}>
                                <div className="space-y-2">
                                    <label htmlFor="identificationField" className="premium-label">Email or Username</label>
                                    <TextInput
                                        id="identificationField"
                                        onValueChange={onInputChangeOfForm}
                                        value={formData.identificationField}
                                        placeholderText="Enter your AllSpark email or username"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="premium-label">Password</label>
                                    <PasswordInput
                                        id="password"
                                        onValueChange={onInputChangeOfForm}
                                        value={formData.password}
                                        placeholderText="Enter your AllSpark password"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm poppins-medium text-[#135BEB] hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <button type="submit" className="premium-button-primary mt-4 w-full">
                                    Login
                                </button>
                            </form>

                            <div className="rounded-[1.4rem] border border-[#0a173210] bg-white/65 p-4 text-sm text-[#091327]/62">
                                <p className="text-center poppins-medium">
                                    New User?
                                    <Link
                                        to="/signup"
                                        className="ms-2 poppins-semibold primary-gradient-text"
                                    >
                                        Sign Up Here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Login;
