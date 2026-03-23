import React, { useState } from "react";
import Layout from "../../../components/layout/Layout";
import EmailInput from "../../../components/input/EmailInput";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import { useSocketListener } from "../../../hooks/useSocketListener";
import AuthPlatformScene from "../../../components/feature/AuthPlatformScene";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ForgotPassword = () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

    const { clientId, isConnected } = useWebSocketContext();

    const [formData, setFormData] = useState({ email: "" });
    const [loading, setLoading] = useState(false);

    const onInputChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const isEmail = (text) =>
        /^[a-zA-Z0-9_.+\-]+[\x40][a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(String(text || "").trim());

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedEmail = String(formData.email || "").trim().toLowerCase();

        if (!clientId || !isConnected) {
            toast.error("WebSocket not ready yet. Please wait a moment and retry.");
            return;
        }

        if (!isEmail(normalizedEmail)) {
            toast.error("Please enter a valid email.");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(
                `${API_BASE}/auth/forgot-password`,
                { email: normalizedEmail },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                    },
                }
            );

            toast.success(res?.data?.message || "OTP request accepted.");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useSocketListener(
        (msg) =>
            msg?.type === "response" &&
            msg?.metadata?.operation === "auth.forgotPassword" &&
            msg?.metadata?.success !== undefined,
        async (msg) => {
            const { data, metadata } = msg || {};

            if (metadata?.success) {
                toast.success(metadata?.message || "OTP sent successfully");
                if (import.meta.env.DEV) {
                    toast.info("Dev mode: OTP email arrives in MailHog at http://localhost:8025");
                }
                await sleep(700);

                const debugOtp = import.meta.env.DEV ? (data?.result?.debugOtp || "") : "";
                const normalizedEmail = String(formData.email || "").trim().toLowerCase();

                navigate("/verify-forgot-password-otp", {
                    state: {
                        email: data?.result?.email || normalizedEmail,
                        debugOtp,
                    },
                });
            } else {
                toast.error(metadata?.message || "Failed to send OTP. Please try again.");
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
                                <span className="premium-kicker">Account recovery</span>
                                <div className="space-y-3">
                                    <h1 className="text-3xl lg:text-5xl poppins-semibold tracking-[-0.04em] text-[#091327]">
                                        Reset access with a
                                        <span className="block primary-gradient-text">secure email OTP.</span>
                                    </h1>
                                    <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                        Enter your registered email and we will trigger the existing OTP flow for password recovery.
                                    </p>
                                </div>
                            </div>

                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="premium-label">Email Address</label>
                                    <EmailInput
                                        id="email"
                                        onValueChange={onInputChange}
                                        value={formData.email}
                                        placeholderText="Enter your AllSpark account email"
                                    />
                                </div>

                                <button type="submit" disabled={loading} className="premium-button-primary mt-4 w-full disabled:opacity-70">
                                    {loading ? "Sending..." : "Send OTP"}
                                </button>
                            </form>

                            <div className="rounded-[1.4rem] border border-[#0a173210] bg-white/65 p-4 text-sm text-[#091327]/62">
                                <p className="text-center poppins-medium">
                                    Remember your password?{" "}
                                    <Link to="/login" className="poppins-semibold primary-gradient-text">
                                        Login
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

export default ForgotPassword;
