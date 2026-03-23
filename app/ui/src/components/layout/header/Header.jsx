import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../../../contexts/AuthContext";
import allsparkHeaderLogo from "../../../assets/branding/allspark-header-logo.svg";

const Header = () => {
    const { token, user } = useAuthContext();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setIsLoggedIn(Boolean(token && user));
    }, [token, user]);

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 18);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    const isAdminRole = useMemo(
        () => (user?.role === "ADMIN" || user?.role === "CONTEST_SCHEDULER" || user?.role === "SUPPORT"),
        [user]
    );

    const isAdminWorkspace = isAdminRole && location.pathname.startsWith("/admins");

    const primaryNavItems = isAdminWorkspace
        ? []
        : [
            { label: "Home", to: "/" },
            { label: "About", to: "/about" },
            { label: "Careers", to: "/careers" },
            { label: "Problems", to: "/problems" },
            { label: "Contests", to: "/contests" },
        ];

    const navItemClass = (path) => {
        const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
        return `header-capsule-link ${active
            ? "header-capsule-link-active"
            : "header-capsule-link-idle"
        }`;
    };

    return (
        <header className="header-premium-wrap sticky top-0 z-50 px-3 pt-3 pb-2 lg:px-5 lg:pt-4 lg:pb-3">
            <div className={`header-capsule-shell mx-auto max-w-[1460px]${isScrolled ? " header-capsule-shell-scrolled" : ""}`}>
                <span className="header-capsule-sweep" />
                <span className="header-capsule-glow header-capsule-glow-left" />
                <span className="header-capsule-glow header-capsule-glow-right" />
                <span className="header-capsule-orb header-capsule-orb-left" />
                <span className="header-capsule-orb header-capsule-orb-right" />

                <div className="header-capsule-inner">
                    <div className="flex shrink-0 min-w-0 items-center gap-3">
                        <Link to="/" className="header-capsule-brand inline-flex items-center gap-3">
                            <img
                                src={allsparkHeaderLogo}
                                alt="AllSpark"
                                className="header-capsule-logo-image"
                            />
                        </Link>
                    </div>

                    <div className="header-capsule-desktop">
                        <nav className="header-capsule-nav header-capsule-nav-centered">
                            {primaryNavItems.map((item) => (
                                <Link key={item.to} to={item.to} className={navItemClass(item.to)}>
                                    {item.label}
                                </Link>
                            ))}

                            {isLoggedIn && !isAdminWorkspace && (
                                <Link to="/support" className={navItemClass("/support")}>
                                    Support
                                </Link>
                            )}

                            {isLoggedIn && isAdminRole && (
                                <Link to="/admins/control-panel" className={navItemClass("/admins/control-panel")}>
                                    Control Panel
                                </Link>
                            )}
                        </nav>

                        <div className="header-capsule-desktop-actions">
                        {isAdminWorkspace ? (
                            <span className="header-capsule-badge">
                                Admin Workspace
                            </span>
                        ) : null}

                        {isLoggedIn ? (
                            <Link
                                to="/users/dashboard"
                                className="header-capsule-avatar"
                            >
                                {user?.name ? String(user.name).substring(0, 1).toUpperCase() : "?"}
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/signup" className="premium-button-secondary min-h-[3rem] bg-white/92 px-5 py-2 text-sm">
                                    Sign Up
                                </Link>
                                <Link to="/login" className="premium-button-primary min-h-[3rem] px-5 py-2 text-sm">
                                    Login
                                </Link>
                            </div>
                        )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="header-capsule-menu-button"
                        onClick={() => setShowMobileMenu((prev) => !prev)}
                        aria-label="Toggle navigation"
                    >
                        <span className="header-capsule-menu-icon">{showMobileMenu ? "✕" : "☰"}</span>
                    </button>
                </div>
            </div>

            {showMobileMenu ? (
                <div className="header-capsule-mobile mx-auto mt-3 max-w-[1520px]">
                    <div className="flex flex-col gap-2">
                        {primaryNavItems.map((item) => (
                            <Link key={item.to} to={item.to} className={navItemClass(item.to)} onClick={() => setShowMobileMenu(false)}>
                                {item.label}
                            </Link>
                        ))}

                        {isLoggedIn && !isAdminWorkspace ? (
                            <Link to="/support" className={navItemClass("/support")} onClick={() => setShowMobileMenu(false)}>
                                Support
                            </Link>
                        ) : null}

                        {isLoggedIn && isAdminRole ? (
                            <Link to="/admins/control-panel" className={navItemClass("/admins/control-panel")} onClick={() => setShowMobileMenu(false)}>
                                Control Panel
                            </Link>
                        ) : null}

                        {isAdminWorkspace ? <span className="header-capsule-badge mt-2 w-fit">Admin Workspace</span> : null}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                        {isLoggedIn ? (
                            <Link to="/users/dashboard" className="premium-button-primary w-full" onClick={() => setShowMobileMenu(false)}>
                                Open Dashboard
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link to="/signup" className="premium-button-secondary w-full bg-white/92" onClick={() => setShowMobileMenu(false)}>
                                    Sign Up
                                </Link>
                                <Link to="/login" className="premium-button-primary w-full" onClick={() => setShowMobileMenu(false)}>
                                    Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </header>
    );
};

export default Header;
