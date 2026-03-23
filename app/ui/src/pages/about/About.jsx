import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HeroFeatureReel from "../../components/feature/HeroFeatureReel";

const pillars = [
    {
        title: "Open Source by Design",
        body:
            "AllSpark is built for builders. The platform is meant to be inspected, extended, self-hosted, and improved collaboratively.",
    },
    {
        title: "Async and Event-Driven",
        body:
            "Requests move through Kafka and Redis-backed workflows so services stay independent, observable, and easier to scale over time.",
    },
    {
        title: "Contest + Practice Ready",
        body:
            "The same platform supports problem solving, contest play, live leaderboards, support workflows, and admin control in one system.",
    },
];

const highlights = [
    {
        label: "Architecture",
        value: "Microservices + Event-Driven",
    },
    {
        label: "Execution",
        value: "Judge0 Integrated",
    },
    {
        label: "Operations",
        value: "Admin + Support Ready",
    },
    {
        label: "Ownership",
        value: "Self Hostable",
    },
];

const sections = [
    {
        eyebrow: "Why AllSpark",
        title: "A coding platform that feels modern from infra to experience.",
        body:
            "AllSpark is designed for teams who want more than a toy practice site. It combines problem solving, contest workflows, async judging, leaderboard updates, OTP-based auth, and admin/support operations into one cohesive platform.",
    },
    {
        eyebrow: "Open Source",
        title: "Built in the open so teams can adapt it to real use cases.",
        body:
            "The codebase is open for contributors, learners, and teams who want to host and evolve the platform on their own infrastructure. That means easier customization, clearer ownership, and a faster path from idea to deployment.",
    },
    {
        eyebrow: "Self Hostable",
        title: "Run it on your infra without turning setup into a project of its own.",
        body:
            "The stack is structured to be practical for local development and realistic for deployment. Services, queues, Redis, MongoDB, Judge0, and the UI can be orchestrated cleanly with the existing project setup.",
    },
    {
        eyebrow: "Distributed System",
        title: "Service boundaries stay intact so the platform can keep growing.",
        body:
            "Problems, submissions, contests, leaderboard, support, auth, and special-access workflows remain separate concerns. That makes the platform easier to reason about, test, and extend without collapsing everything into a monolith.",
    },
    {
        eyebrow: "Execution Platform",
        title: "From practice problems to live contests, the product stays focused on solving.",
        body:
            "Users can browse problems, open workspaces, run code, submit answers, compete in contests, and track outcomes through a UI that feels closer to a real coding platform than a rough prototype.",
    },
];

const principles = [
    "Clear service ownership instead of mixed responsibilities",
    "Realtime and async flows where the platform actually benefits",
    "Operational support paths for tickets, approvals, and recovery access",
    "A UI language that can grow into a polished production product",
];

const About = () => {
    return (
        <Layout>
            <div className="relative overflow-hidden premium-showcase">
                <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(19,91,235,0.12),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(157,41,255,0.12),_transparent_34%)] pointer-events-none" />

                <section className="relative px-8 lg:px-16 py-16 lg:py-20">
                    <div className="mx-auto max-w-[1440px] grid gap-14 lg:grid-cols-[1.05fr_0.95fr] items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 rounded-full border border-[#135BEB1f] bg-[linear-gradient(135deg,rgba(19,91,235,0.08),rgba(157,41,255,0.08))] px-5 py-2 text-sm poppins-medium text-[#135BEB]">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#47d16c] shadow-[0_0_14px_rgba(71,209,108,0.55)]" />
                                About the platform
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl lg:text-6xl leading-[1.08] poppins-semibold text-[#0a1732]">
                                    ALLSPARK a coding platform that is
                                    <span className="primary-gradient-text"> open, scalable, and usable.</span>
                                </h1>
                                <p className="max-w-2xl text-base lg:text-lg leading-8 text-[#0a1732b3] poppins-regular">
                                    AllSpark brings together practice problems, contest workflows, code execution,
                                    leaderboard updates, support operations, and production-oriented service boundaries
                                    into one unified product.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {highlights.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-[1.4rem] border border-[#0a173214] bg-white/80 p-5 shadow-[0_18px_45px_rgba(10,23,50,0.06)]"
                                    >
                                        <p className="text-xs uppercase tracking-[0.22em] text-[#0a173266] poppins-semibold">
                                            {item.label}
                                        </p>
                                        <p className="mt-3 text-lg text-[#0a1732] poppins-semibold">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="https://github.com/harshkumar123456/all-spark"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition-all duration-[0.4s] ease-in-out hover:scale-[1.02] active:scale-[0.96] bg-[#135BEB] text-white px-8 py-4 rounded-full poppins-semibold custom-smooth-drop-shadow"
                                >
                                    Explore Repository
                                </a>
                                <Link
                                    to="/problems"
                                    className="transition-all duration-[0.4s] ease-in-out hover:scale-[1.02] active:scale-[0.96] border border-[#0a17321a] bg-white/80 text-[#0a1732] px-8 py-4 rounded-full poppins-semibold custom-smooth-drop-shadow"
                                >
                                    Explore Problems
                                </Link>
                            </div>
                        </div>

                        <div className="w-full flex justify-center lg:justify-end">
                            <HeroFeatureReel variant="small" />
                        </div>
                    </div>
                </section>

                <section className="px-8 lg:px-16 py-8 lg:py-12">
                    <div className="mx-auto max-w-[1440px] grid gap-6 lg:grid-cols-3">
                        {pillars.map((pillar) => (
                            <div
                                key={pillar.title}
                                className="rounded-[1.8rem] border border-[#0a173214] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,255,0.86))] p-7 shadow-[0_20px_55px_rgba(10,23,50,0.06)]"
                            >
                                <p className="text-xl lg:text-2xl text-[#0a1732] poppins-semibold">
                                    {pillar.title}
                                </p>
                                <p className="mt-4 text-sm lg:text-base leading-7 text-[#0a1732b3] poppins-regular">
                                    {pillar.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="px-8 lg:px-16 py-16">
                    <div className="mx-auto max-w-[1440px] grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
                        <div className="rounded-[2rem] border border-[#0a173214] bg-[#0a1732] p-8 lg:p-10 text-white shadow-[0_28px_80px_rgba(10,23,50,0.18)]">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/55 poppins-semibold">
                                Platform Principles
                            </p>
                            <h2 className="mt-4 text-3xl lg:text-4xl leading-tight poppins-semibold">
                                The product is built to stay understandable while it grows.
                            </h2>
                            <p className="mt-4 text-sm lg:text-base leading-7 text-white/72 poppins-regular">
                                We want the system to be practical for real use, but also approachable enough for
                                contributors and teams who want to learn from it or adapt it.
                            </p>

                            <div className="mt-8 space-y-3">
                                {principles.map((principle) => (
                                    <div
                                        key={principle}
                                        className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-4 text-sm lg:text-base text-white/88 poppins-medium"
                                    >
                                        {principle}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5">
                            {sections.map((section, index) => (
                                <div
                                    key={section.title}
                                    className="rounded-[1.8rem] border border-[#0a173214] bg-white/88 p-6 lg:p-7 shadow-[0_18px_45px_rgba(10,23,50,0.05)]"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#135BEB,#9D29FF)] text-white text-sm poppins-semibold shadow-[0_14px_32px_rgba(19,91,235,0.25)]">
                                            0{index + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.22em] text-[#135BEB] poppins-semibold">
                                                {section.eyebrow}
                                            </p>
                                            <h3 className="mt-2 text-2xl lg:text-3xl leading-tight text-[#0a1732] poppins-semibold">
                                                {section.title}
                                            </h3>
                                            <p className="mt-4 text-sm lg:text-base leading-7 text-[#0a1732b3] poppins-regular">
                                                {section.body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-8 lg:px-16 pb-20">
                    <div className="mx-auto max-w-[1440px] rounded-[2.2rem] border border-[#0a173214] bg-[linear-gradient(135deg,rgba(19,91,235,0.08),rgba(157,41,255,0.08),rgba(255,255,255,0.9))] p-8 lg:p-12 shadow-[0_24px_65px_rgba(10,23,50,0.08)]">
                        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[#135BEB] poppins-semibold">
                                    Build with AllSpark
                                </p>
                                <h2 className="mt-3 text-3xl lg:text-5xl leading-[1.12] text-[#0a1732] poppins-semibold">
                                    Want a platform that supports practice, contests, judging, and operations together?
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-8 text-[#0a1732b3] poppins-regular">
                                    Use the project as a base, contribute to it, or self-host it for your own coding
                                    community. The foundation is already structured for real product iteration.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 lg:justify-end">
                                <Link
                                    to="/signup"
                                    className="transition-all duration-[0.4s] ease-in-out hover:scale-[1.02] active:scale-[0.96] bg-[#0a1732] text-white px-8 py-4 rounded-full poppins-semibold custom-smooth-drop-shadow"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    to="/contests"
                                    className="transition-all duration-[0.4s] ease-in-out hover:scale-[1.02] active:scale-[0.96] border border-[#0a17321a] bg-white/80 text-[#0a1732] px-8 py-4 rounded-full poppins-semibold custom-smooth-drop-shadow"
                                >
                                    View Contest Flow
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default About;
