import React, { useEffect, useMemo, useState } from "react";

const scenes = [
    {
        tag: "Practice Workspace",
        title: "Solve problems inside a polished coding workspace.",
        blurb:
            "Run sample cases, inspect submissions, and move through editor-driven workflows without leaving the page.",
        code: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int need = target - nums[i];\n            if (seen.count(need)) return {seen[need], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
        metrics: [
            { label: "Live Runs", value: "Run + Submit" },
            { label: "Judge Pipeline", value: "Async" },
            { label: "Sample Cases", value: "Inline" },
        ],
        pills: ["Code editor", "Public testcases", "Submission history"],
    },
    {
        tag: "Contest Flow",
        title: "Compete in timed contests with a single workspace experience.",
        blurb:
            "Switch between problems, run code per question, and finish the whole contest with a final submission flow.",
        code: `Contest: March Challenge Live 2026\n\nQ1  Accepted   +10 stars\nQ2  Accepted   +10 stars\nQ3  Pending    judging...\nQ4  Open       next problem\n\nFinal submit updates leaderboard in real time.`,
        metrics: [
            { label: "Contest Mode", value: "Single Workspace" },
            { label: "Leaderboard", value: "Live" },
            { label: "Scoring", value: "Stars + Time" },
        ],
        pills: ["Next / Previous", "Final contest submit", "Realtime rank"],
    },
    {
        tag: "Platform Control",
        title: "Manage problems, contests, tickets, and access in one control panel.",
        blurb:
            "Admins and support teams can review submissions, approve special access, and monitor platform activity cleanly.",
        code: `Support Ticket  VERIFIED\nSpecial Access APPROVED\nProblem Draft   UPDATED\nContest Status  LIVE\nDashboard       synced via websocket`,
        metrics: [
            { label: "Admin Views", value: "Clean Cards" },
            { label: "Support Flow", value: "Verified" },
            { label: "Auth", value: "OTP Ready" },
        ],
        pills: ["Support tickets", "Special access", "Dashboard metrics"],
    },
];

const sizeVariants = {
    medium: {
        shellWidth: "max-w-[640px]",
        outerShell: "rounded-[1.75rem] p-3 shadow-[0_28px_84px_rgba(19,91,235,0.15)]",
        innerShell: "rounded-[1.45rem] p-3 lg:p-4",
        headerBar: "mb-3 rounded-[1.1rem] px-3 py-2.5",
        videoHeight: "h-[360px]",
        contentGrid: "gap-4 lg:grid-cols-[1.3fr_0.8fr]",
        primaryCard: "rounded-[1.35rem] p-5",
        title: "text-[1.75rem] lg:text-[1.9rem]",
        blurb: "mb-4 text-sm lg:text-[0.95rem] leading-7",
        metricsWrap: "mb-4 gap-3",
        metricCard: "rounded-[1rem] px-3 py-3",
        codeCard: "rounded-[1.1rem] p-3.5",
        codeText: "text-[11px] lg:text-[12px] leading-5",
        sideCard: "rounded-[1.35rem] p-4",
        sideStack: "mt-3 space-y-2.5",
        sidePill: "rounded-[0.95rem] px-3 py-2.5",
        architectureStack: "mt-3 gap-2.5",
    },
    small: {
        shellWidth: "max-w-[560px]",
        outerShell: "rounded-[1.55rem] p-2.5 shadow-[0_24px_72px_rgba(19,91,235,0.14)]",
        innerShell: "rounded-[1.3rem] p-2.5 lg:p-3.5",
        headerBar: "mb-3 rounded-[1rem] px-3 py-2",
        videoHeight: "h-[320px]",
        contentGrid: "gap-3 lg:grid-cols-[1.2fr_0.78fr]",
        primaryCard: "rounded-[1.2rem] p-4",
        title: "text-[1.45rem] lg:text-[1.65rem]",
        blurb: "mb-3.5 text-[13px] lg:text-[0.88rem] leading-6",
        metricsWrap: "mb-3.5 gap-2.5",
        metricCard: "rounded-[0.95rem] px-3 py-2.5",
        codeCard: "rounded-[1rem] p-3",
        codeText: "text-[10px] lg:text-[11px] leading-5",
        sideCard: "rounded-[1.2rem] p-3.5",
        sideStack: "mt-3 space-y-2",
        sidePill: "rounded-[0.9rem] px-3 py-2",
        architectureStack: "mt-3 gap-2",
    },
    compact: {
        shellWidth: "max-w-[500px]",
        outerShell: "rounded-[1.35rem] p-2 shadow-[0_20px_58px_rgba(19,91,235,0.13)]",
        innerShell: "rounded-[1.1rem] p-2.5 lg:p-3",
        headerBar: "mb-2.5 rounded-[0.95rem] px-3 py-2",
        videoHeight: "h-[280px]",
        contentGrid: "gap-3 lg:grid-cols-[1fr]",
        primaryCard: "rounded-[1.05rem] p-4",
        title: "text-[1.28rem] lg:text-[1.42rem]",
        blurb: "mb-3 text-[13px] leading-6",
        metricsWrap: "mb-3 gap-2",
        metricCard: "rounded-[0.9rem] px-3 py-2.5",
        codeCard: "rounded-[0.95rem] p-3",
        codeText: "text-[10px] leading-5",
        sideCard: "rounded-[1.05rem] p-3",
        sideStack: "mt-2.5 space-y-2",
        sidePill: "rounded-[0.85rem] px-3 py-2",
        architectureStack: "mt-2.5 gap-2",
    },
};

const HeroFeatureReel = ({ videoSrc = "", variant = "medium" }) => {
    const [activeScene, setActiveScene] = useState(0);
    const scene = useMemo(() => scenes[activeScene], [activeScene]);
    const currentVariant = sizeVariants[variant] || sizeVariants.medium;

    useEffect(() => {
        if (videoSrc) return undefined;

        const interval = setInterval(() => {
            setActiveScene((prev) => (prev + 1) % scenes.length);
        }, 3400);

        return () => clearInterval(interval);
    }, [videoSrc]);

    return (
        <div className={`relative w-full ${currentVariant.shellWidth}`}>
            <div className="hero-reel-orb hero-reel-orb-one" />
            <div className="hero-reel-orb hero-reel-orb-two" />

            <div className={`hero-reel-shell relative overflow-hidden border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,249,255,0.82))] backdrop-blur-2xl ${currentVariant.outerShell}`}>
                <div className={`border border-[#0a17321a] bg-[#f9fbff]/90 ${currentVariant.innerShell}`}>
                    <div className={`flex items-center justify-between gap-4 border border-[#0a173214] bg-white/90 ${currentVariant.headerBar}`}>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
                            <span className="h-3 w-3 rounded-full bg-[#f5cc37]" />
                            <span className="h-3 w-3 rounded-full bg-[#47d16c]" />
                        </div>

                        <div className="rounded-full border border-[#135BEB22] bg-[#135BEB10] px-3 py-1 text-xs poppins-semibold uppercase tracking-[0.22em] text-[#135BEB]">
                            AllSpark Feature Reel
                        </div>
                    </div>

                    {videoSrc ? (
                        <div className="overflow-hidden rounded-[1.5rem] border border-[#0a173214] bg-[#08111f]">
                            <video
                                className={`${currentVariant.videoHeight} w-full object-cover`}
                                src={videoSrc}
                                autoPlay
                                muted
                                loop
                                playsInline
                                controls
                            />
                        </div>
                    ) : (
                        <div className={`grid ${currentVariant.contentGrid}`}>
                            <div className={`relative overflow-hidden border border-[#0a173214] bg-[linear-gradient(160deg,#0a1732,#121f4a_52%,#1f2d64)] text-white ${currentVariant.primaryCard}`}>
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-white/60 poppins-semibold">
                                            {scene.tag}
                                        </p>
                                        <h3 className={`mt-2 leading-tight poppins-semibold ${currentVariant.title}`}>
                                            {scene.title}
                                        </h3>
                                    </div>
                                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs poppins-medium text-white/80">
                                        Autoplay
                                    </div>
                                </div>

                                <p className={`max-w-xl text-white/72 poppins-regular ${currentVariant.blurb}`}>
                                    {scene.blurb}
                                </p>

                                <div className={`grid sm:grid-cols-3 ${currentVariant.metricsWrap}`}>
                                    {scene.metrics.map((metric) => (
                                        <div
                                            key={`${scene.tag}-${metric.label}`}
                                            className={`border border-white/12 bg-white/8 ${currentVariant.metricCard}`}
                                        >
                                            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45 poppins-semibold">
                                                {metric.label}
                                            </p>
                                            <p className="mt-2 text-sm lg:text-base text-white poppins-semibold">
                                                {metric.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className={`border border-white/10 bg-[#060d1e]/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${currentVariant.codeCard}`}>
                                    <pre className={`overflow-x-auto text-[#dbe5ff] poppins-regular whitespace-pre-wrap ${currentVariant.codeText}`}>
                                        {scene.code}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className={`border border-[#0a173214] bg-white/90 shadow-[0_18px_45px_rgba(10,23,50,0.08)] ${currentVariant.sideCard}`}>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[#0a173266] poppins-semibold">
                                        What is live now
                                    </p>
                                    <div className={currentVariant.sideStack}>
                                        {scene.pills.map((pill, index) => (
                                            <div
                                                key={`${scene.tag}-${pill}`}
                                                className={`flex items-center justify-between border border-[#0a173210] bg-[#f8faff] ${currentVariant.sidePill}`}
                                            >
                                                <span className="text-sm text-[#0a1732cc] poppins-medium">
                                                    {pill}
                                                </span>
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#135BEB] text-xs text-white poppins-semibold">
                                                    {index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={`border border-[#135BEB18] bg-[linear-gradient(140deg,rgba(19,91,235,0.12),rgba(157,41,255,0.08))] shadow-[0_18px_45px_rgba(19,91,235,0.08)] ${currentVariant.sideCard}`}>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[#135BEB] poppins-semibold">
                                        Architecture
                                    </p>
                                    <div className={`grid ${currentVariant.architectureStack}`}>
                                        <div className={`border border-white/60 bg-white/70 ${currentVariant.sidePill}`}>
                                            <p className="text-sm text-[#0a1732cc] poppins-semibold">
                                                Kafka + Redis request-response
                                            </p>
                                        </div>
                                        <div className={`border border-white/60 bg-white/70 ${currentVariant.sidePill}`}>
                                            <p className="text-sm text-[#0a1732cc] poppins-semibold">
                                                Judge0-backed execution pipeline
                                            </p>
                                        </div>
                                        <div className={`border border-white/60 bg-white/70 ${currentVariant.sidePill}`}>
                                            <p className="text-sm text-[#0a1732cc] poppins-semibold">
                                                OTP auth, support, and access workflows
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!videoSrc && (
                        <div className="mt-4 flex items-center gap-3">
                            {scenes.map((item, index) => (
                                <button
                                    key={item.tag}
                                    type="button"
                                    onClick={() => setActiveScene(index)}
                                    className={`hero-reel-progress ${index === activeScene ? "hero-reel-progress-active" : ""}`}
                                    aria-label={`Show ${item.tag}`}
                                >
                                    <span className="sr-only">{item.tag}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroFeatureReel;
