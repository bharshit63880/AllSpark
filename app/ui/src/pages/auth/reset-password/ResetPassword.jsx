import React, { useState, useEffect } from "react";
import Layout from "../../../components/layout/Layout";
import PasswordInput from "../../../components/input/PasswordInput";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import { useSocketListener } from "../../../hooks/useSocketListener";
import AuthPlatformScene from "../../../components/feature/AuthPlatformScene";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const ResetPassword = () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const navigate = useNavigate();
    const location = useLocation();

    const emailFromState = String(location.state?.email || "").trim().toLowerCase();
    const otpFromState = String(location.state?.otp || "").trim();

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
    const { clientId, isConnected } = useWebSocketContext();

    const [formData, setFormData] = useState({
        email: emailFromState,
        otp: otpFromState,
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!emailFromState || !otpFromState) {
            toast.error("Session expired. Please verify OTP again.");
            navigate("/forgot-password");
        }
    }, [emailFromState, otpFromState, navigate]);

    const onInputChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.id]: e.target.value,
        }));
    };

    const validatePassword = (password) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }
        if (!/(?=.*\d)/.test(password)) {
            return "Password must contain at least one number.";
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            return "Password must contain at least one special character.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedEmail = String(formData.email || "").trim().toLowerCase();
        const normalizedOtp = String(formData.otp || "").trim();

        if (!clientId || !isConnected) {
            toast.error("WebSocket not ready yet. Please wait a moment and retry.");
            return;
        }

        if (!normalizedEmail || !normalizedOtp) {
            toast.error("Invalid session. Please try again.");
            navigate("/forgot-password");
            return;
        }

        const passwordError = validatePassword(String(formData.newPassword || ""));
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        if (String(formData.newPassword || "") !== String(formData.confirmPassword || "")) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await axios.post(
                `${API_BASE}/auth/reset-password`,
                {
                    email: normalizedEmail,
                    otp: normalizedOtp,
                    newPassword: String(formData.newPassword || ""),
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                    },
                }
            );

            toast.success("Password reset requested...");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useSocketListener(
        (msg) =>
            msg?.type === "response" &&
            msg?.metadata?.operation === "auth.resetPassword" &&
            msg?.metadata?.success !== undefined,
        async (msg) => {
            const { metadata } = msg || {};

            if (metadata?.success) {
                toast.success(metadata?.message || "Password reset successfully.");
                await sleep(700);
                navigate("/login");
            } else {
                toast.error(metadata?.message || "Failed to reset password. Please try again.");
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
                                <span className="premium-kicker">Final recovery step</span>
                                <div className="space-y-3">
                                    <h1 className="text-3xl lg:text-5xl poppins-semibold tracking-[-0.04em] text-[#091327]">
                                        Create a new
                                        <span className="block primary-gradient-text">secure AllSpark password.</span>
                                    </h1>
                                    <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                        This completes the verified reset flow and activates your new credentials immediately.
                                    </p>
                                    {formData.email && (
                                        <p className="text-sm text-[#091327]/50">
                                            Resetting password for:{" "}
                                            {formData.email.replace(/(.{2})(.*)(?=@)/, (match, p1) => p1 + "***")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="premium-label">New Password</label>
                                    <PasswordInput
                                        id="newPassword"
                                        onValueChange={onInputChange}
                                        value={formData.newPassword}
                                        placeholderText="Create a new AllSpark password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="premium-label">Confirm Password</label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        onValueChange={onInputChange}
                                        value={formData.confirmPassword}
                                        placeholderText="Confirm your new AllSpark password"
                                    />
                                </div>

                                <button type="submit" disabled={loading} className="premium-button-primary mt-4 w-full disabled:opacity-70">
                                    {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
