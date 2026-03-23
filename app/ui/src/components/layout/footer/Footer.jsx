import React from "react";
import { Link } from "react-router-dom";

const footerSections = [
    {
        title: "Platform",
        links: [
            { label: "Problems", to: "/problems" },
            { label: "Contests", to: "/contests" },
            { label: "Support", to: "/support" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", to: "/about" },
            { label: "Careers", to: "/careers" },
            { label: "Home", to: "/" },
        ],
    },
    {
        title: "Experience",
        links: [
            { label: "Sign Up", to: "/signup" },
            { label: "Login", to: "/login" },
            { label: "Dashboard", to: "/users/dashboard" },
        ],
    },
];

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-16 overflow-hidden border-t border-white/10 bg-[linear-gradient(180deg,#07101f_0%,#0a1427_100%)] text-white">
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top_left,rgba(19,91,235,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(157,41,255,0.18),transparent_26%)]" />
            <div className="relative mx-auto max-w-[1500px] px-6 py-14 lg:px-10 lg:py-18">
                <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
                    <div className="space-y-6">
                        <span className="premium-chip-dark">
                            Built for async judging and real contests
                        </span>

                        <Link to="/" className="inline-flex items-center gap-3">
                            <span className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] border border-white/12 bg-[linear-gradient(135deg,rgba(19,91,235,0.28),rgba(157,41,255,0.28))] text-xl poppins-semibold shadow-[0_20px_50px_rgba(19,91,235,0.22)]">
                                A
                            </span>
                            <div>
                                <div className="text-4xl lg:text-5xl poppins-bold primary-gradient-text">AllSpark</div>
                                <p className="mt-1 text-xs uppercase tracking-[0.32em] text-white/40">Next-gen coding workspace</p>
                            </div>
                        </Link>

                        <p className="max-w-xl text-sm leading-7 text-white/68 lg:text-base">
                            A premium open-source coding platform for practice, contests, Judge0 execution,
                            support workflows, and reliable event-driven orchestration.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <span className="premium-chip-dark">Live leaderboards</span>
                            <span className="premium-chip-dark">Support + recovery access</span>
                            <span className="premium-chip-dark">Admin control center</span>
                        </div>
                    </div>

                    {footerSections.map((section) => (
                        <div key={section.title} className="space-y-4">
                            <h3 className="text-lg poppins-semibold text-white">
                                {section.title}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {section.links.map((link) => (
                                    <Link
                                        key={`${section.title}-${link.label}`}
                                        to={link.to}
                                        className="text-sm text-white/68 transition-colors hover:text-white lg:text-base"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm text-white/58 lg:text-base">
                        Copyright © {currentYear} AllSpark Org. Crafted for scalable coding practice,
                        fair contests, and resilient platform operations.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/58">
                        <span className="premium-chip-dark text-white/70">Open Source Ready</span>
                        <span className="premium-chip-dark text-white/70">Judge0 Integrated</span>
                        <span className="premium-chip-dark text-white/70">Realtime Leaderboards</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
