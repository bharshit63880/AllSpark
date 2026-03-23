import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import Heading from "../../components/heading/Heading";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener";

const ContestDetails = () => {
    const sleep = async (milliSeconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliSeconds));
    };

    const { token, user, setUser } = useAuthContext();
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
    const { clientId } = useWebSocketContext();
    const { slug } = useParams();

    const [contestDetails, setContestDetails] = useState({
        _id: "",
        name: "Contest",
        slug: "",
        description: "Loading contest details...",
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration: 0,
        problems: [],
    });

    const [problemNameMap, setProblemNameMap] = useState({});
    const [userJourneyInContest, setUserJourneyInContest] = useState("unregistered");
    const [contestClockText, setContestClockText] = useState("Loading timer...");

    const contestProblemIds = Array.isArray(contestDetails?.problems) ? contestDetails.problems : [];

    const formatDateTime = (isoString) => {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return "-";
        return d.toLocaleString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getContestStatus = () => {
        const now = Date.now();
        const startMs = new Date(contestDetails.start_time).getTime();
        const endMs = new Date(contestDetails.end_time).getTime();
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "unknown";
        if (now < startMs) return "upcoming";
        if (now <= endMs) return "live";
        return "ended";
    };

    const contestStatus = getContestStatus();

    const contestProblems = useMemo(() => {
        return contestProblemIds.map((id, idx) => {
            const normalizedId = typeof id === "object" ? String(id?._id || "") : String(id);
            return {
                id: normalizedId || `idx-${idx}`,
                title: problemNameMap[normalizedId] || `Problem ${idx + 1}`,
                order: idx + 1,
            };
        });
    }, [contestProblemIds, problemNameMap]);

    const registeredContestIds = useMemo(() => {
        return Array.isArray(user?.participated_in_contests)
            ? user.participated_in_contests.map((id) => String(id))
            : [];
    }, [user?.participated_in_contests]);

    const updateContestClock = () => {
        const now = Date.now();
        const startMs = new Date(contestDetails.start_time).getTime();
        const endMs = new Date(contestDetails.end_time).getTime();

        if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
            setContestClockText("Timer unavailable");
            return;
        }

        const target = now < startMs ? startMs : endMs;
        const diff = target - now;

        if (diff <= 0) {
            setContestClockText(now < startMs ? "Starting now" : "Contest ended");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const prefix = now < startMs ? "Starts in" : "Ends in";
        const dayPart = days > 0 ? `${days}d ` : "";
        setContestClockText(`${prefix} ${dayPart}${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`);
    };

    const handleClickOnRegisterForContestButton = async () => {
        if (!token) {
            toast.error("Login required to register.");
            await sleep(800);
            navigate("/login");
            return;
        }

        try {
            const payload = {
                _id: contestDetails._id,
            };

            const response = await axios.post(`${API_BASE}/contests/register`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "client-id": clientId,
                    "authorization": token,
                }
            });

            toast.success(response.data.message);
        } catch (error) {
            toast.error("Unable to register right now.");
        }
    };

    const handleContinueContest = async () => {
        if (!token) {
            toast.error("Login required.");
            await sleep(800);
            navigate("/login");
            return;
        }

        if (!registeredContestIds.includes(String(contestDetails._id))) {
            toast.error("Please register first.");
            return;
        }
        navigate(`/contests/start/${slug}`);
    };

    const handlePrimaryAction = async () => {
        if (contestStatus === "ended") return;

        if (userJourneyInContest === "registered") {
            if (contestStatus !== "live") {
                toast.info("You are registered. Contest will unlock at start time.");
                return;
            }
            await handleContinueContest();
            return;
        }

        await handleClickOnRegisterForContestButton();
    };

    const getPrimaryActionLabel = () => {
        if (contestStatus === "ended") return "Contest Ended";
        if (userJourneyInContest === "registered" && contestStatus === "live") return "Open Workspace";
        if (userJourneyInContest === "registered") return "Registered";
        return contestStatus === "live" ? "Register & Open Workspace" : "Register";
    };

    useEffect(() => {
        if (!clientId) return;

        const fetchContestDetails = async () => {
            try {
                const response = await axios.get(`${API_BASE}/contests/${slug}`, {
                    headers: {
                        "client-id": clientId
                    }
                });

                if (response?.data?.message) {
                    toast.success(response.data.message);
                }
            } catch (error) {
                toast.error("Unable to load contest details.");
            }
        };

        fetchContestDetails();
    }, [API_BASE, clientId, slug]);

    useEffect(() => {
        if (!clientId || contestProblemIds.length === 0) return;

        const fetchProblems = async () => {
            try {
                await axios.get(`${API_BASE}/problems/all`, {
                    headers: {
                        "client-id": clientId
                    }
                });
            } catch (error) {
                // Non-blocking for contest page rendering
            }
        };

        fetchProblems();
    }, [API_BASE, clientId, contestProblemIds.length]);

    useEffect(() => {
        const isRegistered = registeredContestIds.includes(String(contestDetails._id));
        setUserJourneyInContest(isRegistered ? "registered" : "unregistered");
    }, [registeredContestIds, contestDetails._id]);

    useEffect(() => {
        updateContestClock();
        const intervalId = setInterval(updateContestClock, 1000);
        return () => clearInterval(intervalId);
    }, [contestDetails.start_time, contestDetails.end_time]);

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata.operation?.includes("contests.getContest"),
        async (msg) => {
            const { data, metadata } = msg;

            if (metadata?.success === true) {
                const contestDetailsFromEventData = data.result;
                setContestDetails(contestDetailsFromEventData);
            } else {
                toast.error(metadata.message || "Contest details not found.");
                await sleep(500);
            }
        }
    );

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata.operation?.includes("contests.register"),
        async (msg) => {
            const { data, metadata } = msg;

            if (metadata?.success === true) {
                const participantDetailsFromEventData = data.result;

                setUser((prev) => {
                    if (!prev) return prev;
                    const updatedUser = {
                        ...prev,
                        participated_in_contests: [
                            ...(prev.participated_in_contests || []),
                            participantDetailsFromEventData.contest_id,
                        ],
                    };

                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    return updatedUser;
                });

                toast.success(metadata.message || "Registered successfully.");
                if (contestStatus === "live") {
                    navigate(`/contests/start/${slug}`);
                }
            } else {
                const message = metadata?.message || "Contest registration failed.";
                const isAlreadyRegistered = message.toLowerCase().includes("already registered");
                if (isAlreadyRegistered) {
                    setUser((prev) => {
                        if (!prev) return prev;
                        const current = Array.isArray(prev.participated_in_contests) ? prev.participated_in_contests.map((id) => String(id)) : [];
                        const contestId = String(data?.result?.contest_id || contestDetails._id || "");
                        if (!contestId || current.includes(contestId)) {
                            return prev;
                        }
                        const updatedUser = {
                            ...prev,
                            participated_in_contests: [...(prev.participated_in_contests || []), contestId],
                        };
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                        return updatedUser;
                    });
                    toast.info("Already registered. Opening contest workspace...");
                    if (contestStatus === "live") {
                        navigate(`/contests/start/${slug}`);
                    }
                    return;
                }

                toast.error(message);
                await sleep(500);
            }
        }
    );

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata.operation?.includes("problems.getAllProblems"),
        async (msg) => {
            const { data, metadata } = msg;

            if (metadata?.success === true && Array.isArray(data.result)) {
                const mapped = {};
                data.result.forEach((problem) => {
                    mapped[String(problem._id)] = problem.name;
                });
                setProblemNameMap(mapped);
            }
        }
    );

    const primaryActionLabel = getPrimaryActionLabel();
    const isPrimaryActionDisabled = contestStatus === "ended";

    return <>
        <Layout>
            <section className="premium-page premium-section relative overflow-hidden">
                <div className="premium-container relative">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-[#0a173288]">
                                {formatDateTime(contestDetails.start_time)}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                                <Heading text={contestDetails.name || "Contest"} />
                                <span className="rounded-full bg-violet-500/12 px-3 py-1 text-sm poppins-semibold text-violet-600">
                                    {contestStatus === "ended" ? "Virtual" : "Live"}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-emerald-500">{contestClockText}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                disabled={isPrimaryActionDisabled}
                                onClick={handlePrimaryAction}
                                className="rounded-full bg-gradient-to-r from-[#8e2de2] to-[#4a00e0] px-6 py-3 text-sm poppins-semibold text-white disabled:opacity-40"
                            >
                                {primaryActionLabel}
                            </button>
                            <Link
                                to={`/contests/leaderboard/${contestDetails._id}`}
                                state={{ contestName: contestDetails.name }}
                                className="rounded-full border border-[#0a173218] bg-white/75 px-6 py-3 text-sm poppins-semibold text-[#0a1732]"
                            >
                                Ranking
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <article className="premium-panel p-5 lg:p-6">
                                <h3 className="text-xl poppins-semibold text-[#0a1732]">Welcome</h3>
                                <p className="mt-3 whitespace-pre-line text-[#0a1732cc]">
                                    {contestDetails.description}
                                </p>
                            </article>

                            <article className="premium-panel p-5 lg:p-6">
                                <h3 className="text-xl poppins-semibold text-[#0a1732]">Important Notes</h3>
                                <ol className="mt-3 list-decimal space-y-2 ps-5 text-[#0a1732cc]">
                                    <li>Register once before contest start time for a smooth experience.</li>
                                    <li>Use one unified workspace to move across problems with next and previous controls.</li>
                                    <li>Run is available per problem during the contest; final private judging starts when you submit the full contest.</li>
                                    <li>Each accepted problem earns 10 stars and leaderboard ranking updates in real time.</li>
                                    <li>Use your own code only. Plagiarism can disqualify participation.</li>
                                    <li>Final leaderboard can change until all pending final submissions are judged.</li>
                                </ol>
                            </article>

                            <article className="premium-panel p-5 lg:p-6">
                                <h3 className="text-xl poppins-semibold text-[#0a1732]">Announcements</h3>
                                <p className="mt-3 text-[#0a1732cc]">
                                    Please complete registration before participating. Best of luck and enjoy the contest.
                                </p>
                            </article>

                            <article className="premium-panel p-5 lg:p-6">
                                <h3 className="text-xl poppins-semibold text-[#0a1732]">Prizes (Sample)</h3>
                                <div className="mt-4 overflow-hidden rounded-xl border border-[#0a173214]">
                                    <table className="w-full text-left text-sm text-[#0a1732]">
                                        <tbody>
                                            <tr className="border-b border-[#0a173212]">
                                                <td className="px-4 py-3">1st Place</td>
                                                <td className="px-4 py-3 text-amber-300">5000 Coins</td>
                                            </tr>
                                            <tr className="border-b border-[#0a173212]">
                                                <td className="px-4 py-3">2nd Place</td>
                                                <td className="px-4 py-3 text-amber-300">2500 Coins</td>
                                            </tr>
                                            <tr className="border-b border-[#0a173212]">
                                                <td className="px-4 py-3">3rd Place</td>
                                                <td className="px-4 py-3 text-amber-300">1000 Coins</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3">Participation</td>
                                                <td className="px-4 py-3 text-amber-300">50 Coins</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        </div>

                        <aside className="space-y-4 lg:sticky lg:top-8 h-fit">
                            <div className="premium-panel-soft border-orange-400/20 bg-orange-50/80 p-4">
                                <h3 className="text-lg poppins-semibold text-orange-200">Problem List</h3>
                                <p className="mt-1 text-xs text-orange-500/80">Total: {contestProblems.length}</p>
                            </div>

                            <div className="premium-panel p-2">
                                {contestProblems.length > 0 ? (
                                    contestProblems.map((problem) => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center justify-between border-b border-[#0a173212] px-3 py-3 last:border-b-0"
                                        >
                                            <div>
                                                <p className="text-sm text-[#0a173288]">Q{problem.order}</p>
                                                <p className="text-sm poppins-medium text-[#0a1732]">{problem.title}</p>
                                            </div>
                                            <span className="rounded-full bg-[#0a173208] px-2 py-1 text-xs text-[#0a1732b3]">#{problem.order}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="px-3 py-4 text-sm text-[#0a173288]">No contest problems found.</p>
                                )}
                            </div>

                            <button
                                disabled={isPrimaryActionDisabled}
                                onClick={handlePrimaryAction}
                                className="w-full rounded-xl bg-[#135BEB] px-4 py-3 text-sm poppins-semibold text-white disabled:opacity-40"
                            >
                                {primaryActionLabel}
                            </button>
                        </aside>
                    </div>
                </div>
            </section>
        </Layout>
    </>;
};

export default ContestDetails;
