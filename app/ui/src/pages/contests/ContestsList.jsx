import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import Heading from "../../components/heading/Heading";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener";

const ContestsList = () => {
    const { token, user } = useAuthContext();

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
    const { clientId } = useWebSocketContext();

    const [loadingContests, setLoadingContests] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const [contestsData, setContestsData] = useState([]);

    const getContestStatus = (contest) => {
        const now = Date.now();
        const startMs = new Date(contest.start_time).getTime();
        const endMs = new Date(contest.end_time).getTime();
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "unknown";
        if (now < startMs) return "upcoming";
        if (now <= endMs) return "live";
        return "past";
    };

    const formatDateTime = (iso) => {
        const parsed = new Date(iso);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDuration = (durationMs) => {
        const totalMins = Math.max(0, Math.floor((durationMs || 0) / 60000));
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const getCountdown = (iso) => {
        const diff = new Date(iso).getTime() - Date.now();
        if (diff <= 0 || Number.isNaN(diff)) return "Live now";
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (d > 0) return `${d}d ${h}h left`;
        return `${h}h ${m}m left`;
    };

    const sortedContests = useMemo(() => {
        return [...contestsData].sort((a, b) => {
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });
    }, [contestsData]);

    const featuredContests = useMemo(() => {
        const featured = sortedContests.filter((contest) => {
            const status = getContestStatus(contest);
            return status === "live" || status === "upcoming";
        });
        return featured.slice(0, 2);
    }, [sortedContests]);

    const filteredContests = useMemo(() => {
        if (activeTab === "all") return sortedContests;
        if (activeTab === "past") {
            return [...sortedContests]
                .filter((contest) => getContestStatus(contest) === "past")
                .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());
        }
        return sortedContests.filter((contest) => getContestStatus(contest) === activeTab);
    }, [sortedContests, activeTab]);

    useEffect(() => {
        const fetchAllContests = async () => {
            try {
                setLoadingContests(true);
                const response = await axios.get(`${API_BASE}/contests/all`, {
                    headers: {
                        "client-id": clientId
                    }
                });
                if (response?.data?.message) {
                    toast.success(response.data.message);
                }


            } catch (error) {
                toast.error("Something went Wrong....");
            } finally {
                setLoadingContests(false);
            }
        };

        if (clientId) {
            fetchAllContests();
        }

    }, [token, user, clientId]);




    // Websocket Event Listening Logic - Starts Here
    // Listener 1: Handle Valid Get All Contests Response
    useSocketListener(
        // Selector: "Is this message for me?"
        (msg) => msg.type?.includes('response') && msg.metadata.operation?.includes("contests.getAllContests"),

        // Handler: "What do I do with it?"
        async (msg) => {
            const { data, metadata } = msg;

            // If Get All Contests is Success then Save The Contests For further Accesses 
            if (metadata?.success === true) {
                const allContestsFromEventData = data.result;

                setContestsData(Array.isArray(allContestsFromEventData) ? allContestsFromEventData : []);
                setLoadingContests(false);
            }
            // Else Request is not done then Tell User What May Went Wrong
            else {
                toast.error(metadata.message);
                setLoadingContests(false);

            }
        }
    );


    return <>
        <Layout>
            <section className="premium-page premium-section relative overflow-hidden">
                <div className="premium-container relative">
                    <Heading
                        text="Contest Arena"
                        kicker="Realtime Competition"
                        description="Join live contests, schedule upcoming rounds, and replay past contests like a real coding platform."
                    />

                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {featuredContests.map((contest, idx) => {
                            const status = getContestStatus(contest);
                            const statusColor = status === "live" ? "text-emerald-300" : "text-amber-200";
                            const cardGradient = idx % 2 === 0
                                ? "from-[#f39b2f] via-[#cf6e18] to-[#6f3311]"
                                : "from-[#3f4de0] via-[#5532cf] to-[#29146a]";

                            return (
                                <Link
                                    key={contest._id || contest.slug}
                                    to={`/contests/${contest.slug}`}
                                    className={`group rounded-3xl border border-white/15 bg-gradient-to-br ${cardGradient} p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.01]`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${statusColor}`}>
                                            {status}
                                        </p>
                                        <p className="rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs">
                                            {status === "upcoming" ? getCountdown(contest.start_time) : formatDuration(contest.duration)}
                                        </p>
                                    </div>
                                    <h3 className="mt-6 text-2xl poppins-semibold">{contest.name}</h3>
                                    <p className="mt-2 text-sm text-white/85">{formatDateTime(contest.start_time)}</p>
                                </Link>
                            );
                        })}

                        {featuredContests.length === 0 && (
                            <div className="premium-panel-soft p-6 text-[#0a173288]">
                                No live/upcoming contests right now.
                            </div>
                        )}
                    </div>

                    <div className="premium-panel mt-10 p-4 lg:p-6">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: "all", label: "All Contests" },
                                { id: "live", label: "Live" },
                                { id: "upcoming", label: "Upcoming" },
                                { id: "past", label: "Past Contests" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`rounded-full px-4 py-2 text-sm transition ${activeTab === tab.id ? "bg-[#0a1732] text-white poppins-semibold" : "bg-[#0a173208] text-[#0a1732cc] hover:bg-[#135BEB12]"}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className={`mt-6 space-y-3 ${loadingContests ? "opacity-60 animate-pulse" : ""}`}>
                            {filteredContests.length > 0 ? filteredContests.map((contest) => {
                                const status = getContestStatus(contest);
                                const isPast = status === "past";
                                return (
                                    <div
                                        key={contest._id || contest.slug}
                                        className="flex flex-col gap-3 rounded-2xl border border-[#0a173214] bg-white/70 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                                    >
                                        <div>
                                            <h4 className="text-lg poppins-semibold text-[#0a1732]">{contest.name}</h4>
                                            <p className="text-sm text-[#0a173288]">{formatDateTime(contest.start_time)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${status === "live" ? "bg-emerald-500/20 text-emerald-300" : status === "upcoming" ? "bg-amber-500/20 text-amber-200" : "bg-white/15 text-white/70"}`}>
                                                {status}
                                            </span>
                                            <Link
                                                to={`/contests/${contest.slug}`}
                                                className={`rounded-full px-4 py-2 text-sm poppins-semibold ${isPast ? "bg-violet-500/16 text-violet-600" : "bg-[#135BEB] text-white"}`}
                                            >
                                                {isPast ? "Virtual" : "Open"}
                                            </Link>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="py-6 text-center text-[#0a173288]">
                                    No contests found in this section.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

        </Layout>
    </>;
};

export default ContestsList;
