import React, { useState, useEffect } from "react";
import Layout from "../../../components/layout/Layout";
import TextInput from "../../../components/input/TextInput";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import { useSocketListener } from "../../../hooks/useSocketListener";
import { useAuthContext } from "../../../contexts/AuthContext";
import AuthPlatformScene from "../../../components/feature/AuthPlatformScene";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const VerifyOtp = () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const navigate = useNavigate();
    const location = useLocation();
    const { setToken, setUser } = useAuthContext();

    const emailFromState = String(location.state?.email || "").trim().toLowerCase();
    const debugOtpFromState = String(location.state?.debugOtp || "").trim();
    const mode = location.state?.mode === "signup" || location.pathname.includes("verify-signup-otp")
        ? "signup"
        : "forgot-password";
    const isSignupMode = mode === "signup";

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
    const { clientId, isConnected } = useWebSocketContext();

    const [formData, setFormData] = useState({
        email: emailFromState,
        otp: debugOtpFromState,
    });

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (!emailFromState) {
            toast.error(`Session expired. Please restart the ${isSignupMode ? "signup" : "forgot-password"} flow.`);
            navigate(isSignupMode ? "/signup" : "/forgot-password");
        }
    }, [emailFromState, isSignupMode, navigate]);

    const onInputChange = (e) => {
        let nextValue = e.target.value;

        if (e.target.id === "otp") {
            nextValue = String(nextValue || "").replace(/\D/g, "").slice(0, 6);
        }

        setFormData((prev) => ({
            ...prev,
            [e.target.id]: nextValue,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedEmail = String(formData.email || "").trim().toLowerCase();
        const normalizedOtp = String(formData.otp || "").trim();

        if (!clientId || !isConnected) {
            toast.error("WebSocket not ready yet. Please wait a moment and retry.");
            return;
        }

        if (!normalizedEmail) {
            toast.error("Email is required.");
            return;
        }

        if (!normalizedOtp || normalizedOtp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {
            await axios.post(
                `${API_BASE}/auth/${isSignupMode ? "verify-signup-otp" : "verify-otp"}`,
                {
                    email: normalizedEmail,
                    otp: normalizedOtp,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                    },
                }
            );

            toast.success("OTP verification requested...");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        const normalizedEmail = String(formData.email || "").trim().toLowerCase();

        if (!clientId || !isConnected) {
            toast.error("WebSocket not ready yet. Please wait a moment and retry.");
            return;
        }

        if (!normalizedEmail) {
            toast.error("Email is required.");
            navigate("/forgot-password");
            return;
        }

        if (countdown > 0) {
            toast.error(`Please wait ${countdown} seconds before resending.`);
            return;
        }

        setResendLoading(true);

        try {
            await axios.post(
                `${API_BASE}/auth/${isSignupMode ? "resend-signup-otp" : "forgot-password"}`,
                {
                    email: normalizedEmail,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                    },
                }
            );

            toast.success("OTP resend requested...");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to resend OTP.");
        } finally {
            setResendLoading(false);
        }
    };

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    useSocketListener(
        (msg) =>
            msg?.type === "response" &&
            msg?.metadata?.operation === (isSignupMode ? "auth.verifySignupOtp" : "auth.verifyOtp") &&
            msg?.metadata?.success !== undefined,
        async (msg) => {
            const { data, metadata } = msg || {};

            if (metadata?.success) {
                toast.success(metadata?.message || "OTP verified successfully.");
                await sleep(700);

                if (isSignupMode) {
                    const tokenFromEventData = data?.token || data?.result?.token;
                    const userFromEventData = data?.result?.user || data?.result || data?.user;

                    if (!tokenFromEventData || !userFromEventData) {
                        toast.error("Email verified, but sign-in response was incomplete. Please login once.");
                        navigate("/login");
                        return;
                    }

                    localStorage.setItem("token", JSON.stringify(tokenFromEventData));
                    localStorage.setItem("user", JSON.stringify(userFromEventData));
                    setToken(tokenFromEventData);
                    setUser(userFromEventData);
                    navigate("/users/dashboard");
                } else {
                    navigate("/reset-password", {
                        state: {
                            email: String(formData.email || "").trim().toLowerCase(),
                            otp: String(formData.otp || "").trim(),
                        },
                    });
                }
            } else {
                toast.error(metadata?.message || "Failed to verify OTP. Please try again.");
            }
        }
    );

    useSocketListener(
        (msg) =>
            msg?.type === "response" &&
            msg?.metadata?.operation === (isSignupMode ? "auth.resendSignupOtp" : "auth.forgotPassword") &&
            msg?.metadata?.success !== undefined,
        async (msg) => {
            const { data, metadata } = msg || {};

            if (metadata?.success) {
                if (data?.result?.debugOtp && import.meta.env.DEV) {
                    setFormData((prev) => ({
                        ...prev,
                        otp: String(data.result.debugOtp).trim(),
                    }));

                    toast.info(`Debug OTP: ${data.result.debugOtp}`, { duration: 5000 });
                }

                toast.success(metadata?.message || "OTP resent successfully.");
                if (import.meta.env.DEV) {
                    toast.info("Dev mode: OTP email arrives in MailHog at http://localhost:8025");
                }
                setCountdown(60);
            } else {
                toast.error(metadata?.message || "Failed to resend OTP. Please try again.");
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
                                <span className="premium-kicker">{isSignupMode ? "Email activation" : "OTP verification"}</span>
                                <div className="space-y-3">
                                    <h1 className="text-3xl lg:text-5xl poppins-semibold tracking-[-0.04em] text-[#091327]">
                                        {isSignupMode ? "Verify your email" : "Confirm your recovery OTP"}
                                        <span className="block primary-gradient-text">in one secure step.</span>
                                    </h1>
                                    <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                        {isSignupMode
                                            ? "Enter the 6-digit OTP sent to your email to activate your account."
                                            : "Enter the 6-digit OTP sent to your email to reset your password."}
                                    </p>
                                    {formData.email && (
                                        <p className="text-sm text-[#091327]/50">
                                            OTP sent to:{" "}
                                            {formData.email.replace(/(.{2})(.*)(?=@)/, (match, p1) => p1 + "***")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label htmlFor="otp" className="premium-label">6-Digit OTP</label>
                                    <TextInput
                                        id="otp"
                                        onValueChange={onInputChange}
                                        value={formData.otp}
                                        placeholderText="Enter 6-digit OTP"
                                        maxLength={6}
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                    />
                                </div>

                                <button type="submit" disabled={loading} className="premium-button-primary mt-4 w-full disabled:opacity-70">
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading || countdown > 0}
                                className="premium-button-secondary w-full disabled:opacity-70"
                            >
                                {resendLoading
                                    ? "Sending..."
                                    : countdown > 0
                                        ? `Resend OTP (${countdown}s)`
                                        : "Resend OTP"}
                            </button>

                            <div className="rounded-[1.4rem] border border-[#0a173210] bg-white/65 p-4 text-sm text-[#091327]/62">
                                <p className="text-center poppins-medium">
                                    {isSignupMode ? "Need to restart signup?" : "Remember your password?"}{" "}
                                    <Link to={isSignupMode ? "/signup" : "/login"} className="poppins-semibold primary-gradient-text">
                                        {isSignupMode ? "Sign Up" : "Login"}
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

export default VerifyOtp;
