import React from "react";

const AuthPlatformScene = () => {
    return (
        <div className="auth-platform-scene" aria-hidden="true">
            <div className="auth-platform-scene__ambient auth-platform-scene__ambient--left" />
            <div className="auth-platform-scene__ambient auth-platform-scene__ambient--right" />

            <div className="auth-platform-scene__intro">
                <div className="auth-platform-scene__hud">
                    <span className="auth-platform-scene__kicker">
                        <span className="auth-platform-scene__dot auth-platform-scene__dot--green" />
                        Platform active
                    </span>
                    <div className="auth-platform-scene__pulse">
                        <span />
                        Secure auth mesh
                    </div>
                </div>

                <h3 className="auth-platform-scene__hero-title">
                    Fast, secure access to your coding workspace.
                </h3>
                <p className="auth-platform-scene__hero-copy">
                    Login, verify OTP, recover password, and get back to practice without a noisy layout.
                </p>
            </div>
        </div>
    );
};

export default AuthPlatformScene;
