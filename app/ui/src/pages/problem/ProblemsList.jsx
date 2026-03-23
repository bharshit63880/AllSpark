import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener";
import { toast } from "sonner";
import axios from "axios";
import Heading from "../../components/heading/Heading";

const ProblemsList = () => {
    const { token, user } = useAuthContext();

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
    const { clientId } = useWebSocketContext();

    const [loadingProblems, setLoadingProblems] = useState(false);
    const [problemsData, setProblemsData] = useState([]);

    const [searchText, setSearchText] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [activeTopic, setActiveTopic] = useState("All Topics");
    const [favoriteProblemIds, setFavoriteProblemIds] = useState([]);

    const favoriteStorageKey = useMemo(() => {
        const userKey = user?._id || user?.email || user?.user_name || "guest";
        return `favoriteProblems:${userKey}`;
    }, [user]);

    const normalizeProblems = (problems) => {
        if (!Array.isArray(problems)) return [];
        return problems.map((problem, index) => ({
            id: index + 1,
            _id: problem._id,
            name: problem.name,
            slug: problem.slug,
            difficulty: (problem.difficulty || "easy").toLowerCase(),
            tags: Array.isArray(problem.tags) ? problem.tags : [],
            acceptance: `${Math.max(28, 74 - index * 3)}.${index % 10}%`,
        }));
    };

    const fetchAllProblems = async () => {
        try {
            setLoadingProblems(true);
            const response = await axios.get(`${API_BASE}/problems/all`, {
                headers: {
                    "client-id": clientId,
                },
            });

            if (response?.data?.message) {
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error("Something went wrong while loading problems.");
        } finally {
            setLoadingProblems(false);
        }
    };

    const handleSearch = async () => {
        const trimmedSearch = searchText.trim();
        const topicTag = activeTopic !== "All Topics" ? activeTopic.toLowerCase() : null;

        if (!trimmedSearch && difficultyFilter === "all" && !topicTag) {
            fetchAllProblems();
            return;
        }

        try {
            setLoadingProblems(true);
            await axios.post(`${API_BASE}/problems/search`, {
                name: trimmedSearch || null,
                slug: trimmedSearch || null,
                description: trimmedSearch || null,
                difficulty: difficultyFilter === "all" ? null : difficultyFilter,
                tags: topicTag ? [topicTag] : null,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "client-id": clientId,
                },
            });
        } catch (error) {
            setLoadingProblems(false);
            toast.error("Search failed. Please try again.");
        }
    };

    const allTopics = useMemo(() => {
        const frequency = {};
        problemsData.forEach((problem) => {
            (problem.tags || []).forEach((tag) => {
                const key = tag?.toString().trim();
                if (!key) return;
                frequency[key] = (frequency[key] || 0) + 1;
            });
        });

        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, count]) => ({ name, count }));

        return [{ name: "All Topics", count: problemsData.length }, ...sorted];
    }, [problemsData]);

    const visibleProblems = useMemo(() => {
        return problemsData.filter((problem) => {
            const matchesDifficulty = difficultyFilter === "all" || problem.difficulty === difficultyFilter;
            const matchesTopic = activeTopic === "All Topics" || (problem.tags || []).some((tag) => tag?.toLowerCase() === activeTopic.toLowerCase());
            return matchesDifficulty && matchesTopic;
        });
    }, [problemsData, difficultyFilter, activeTopic]);

    const favoriteProblems = useMemo(() => {
        const favoritesSet = new Set(favoriteProblemIds.map((id) => String(id)));
        return problemsData.filter((problem) => favoritesSet.has(String(problem._id)));
    }, [favoriteProblemIds, problemsData]);

    const isFavorite = (problemId) => {
        return favoriteProblemIds.includes(String(problemId));
    };

    const handleToggleFavorite = (problemId) => {
        if (!token) {
            toast.info("Favorite save karne ke liye login karein.");
            return;
        }

        const normalizedProblemId = String(problemId);
        setFavoriteProblemIds((prev) => {
            const exists = prev.includes(normalizedProblemId);
            if (exists) {
                return prev.filter((id) => id !== normalizedProblemId);
            }
            return [...prev, normalizedProblemId];
        });
    };

    useEffect(() => {
        if (!clientId) return;
        fetchAllProblems();
    }, [token, user, clientId]);

    useEffect(() => {
        try {
            const storedFavorites = localStorage.getItem(favoriteStorageKey);
            if (!storedFavorites) {
                setFavoriteProblemIds([]);
                return;
            }
            const parsedFavorites = JSON.parse(storedFavorites);
            setFavoriteProblemIds(Array.isArray(parsedFavorites) ? parsedFavorites.map((id) => String(id)) : []);
        } catch (error) {
            setFavoriteProblemIds([]);
        }
    }, [favoriteStorageKey]);

    useEffect(() => {
        localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteProblemIds));
    }, [favoriteProblemIds, favoriteStorageKey]);

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata.operation?.includes("problems.getAllProblems"),
        async (msg) => {
            const { data, metadata } = msg;
            if (metadata?.success === true) {
                setProblemsData(normalizeProblems(data.result));
                setLoadingProblems(false);
            } else {
                setLoadingProblems(false);
                toast.error(metadata?.message || "Unable to fetch problems.");
            }
        }
    );

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata.operation?.includes("problems.search"),
        async (msg) => {
            const { data, metadata } = msg;
            if (metadata?.success === true) {
                setProblemsData(normalizeProblems(data.result));
                setLoadingProblems(false);
            } else {
                setLoadingProblems(false);
                toast.error(metadata?.message || "No problems found.");
            }
        }
    );

    return <>
        <Layout>
            <section className="premium-page premium-section">
                <div className="premium-container">
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">

                        <aside className="premium-panel h-fit p-5">
                            <h3 className="text-lg poppins-semibold text-[#0a1732]">Library</h3>
                            <ul className="mt-4 space-y-2 text-sm text-[#0a1732cc]">
                                <li className="rounded-lg bg-[#0a173208] px-3 py-2">Library</li>
                            </ul>
                            <div className="mt-6 border-t border-[#0a173212] pt-4">
                                <p className="text-xs text-[#0a173266]">My Lists</p>
                                <p className="mt-2 text-sm text-[#0a1732]">Favorite ({favoriteProblemIds.length})</p>
                                {favoriteProblems.length > 0 ? (
                                    <div className="mt-2 space-y-1">
                                        {favoriteProblems.slice(0, 5).map((problem) => (
                                            <p key={`favorite-${problem._id}`} className="text-xs text-[#0a1732b3] truncate">
                                                {problem.name}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-xs text-[#0a173288]">Star button se add karein.</p>
                                )}
                            </div>
                        </aside>

                        <main className="premium-panel p-5 lg:p-6">
                            <Heading
                                text="Problems"
                                kicker="Problem Library"
                                description="Browse curated questions, filter by topic, and jump into the workspace quickly."
                            />

                            <div className="mt-5 flex flex-wrap gap-2">
                                {allTopics.map((topic) => (
                                    <button
                                        key={topic.name}
                                        onClick={() => setActiveTopic(topic.name)}
                                        className={`rounded-full px-3 py-2 text-xs transition ${activeTopic === topic.name ? "bg-[#0a1732] text-white shadow-[0_12px_28px_rgba(10,23,50,0.14)]" : "bg-[#0a173208] text-[#0a1732cc] hover:bg-[#135BEB12]"}`}
                                    >
                                        {topic.name} {topic.count !== undefined ? `(${topic.count})` : ""}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-5 flex flex-col gap-3 lg:flex-row">
                                <input
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                    placeholder="Search questions"
                                    className="premium-input w-full"
                                />
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="premium-select lg:max-w-[10rem]"
                                >
                                    <option value="all">All</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <button
                                    onClick={handleSearch}
                                    className="premium-button-primary"
                                >
                                    Search
                                </button>
                            </div>

                            <div className={`premium-table-wrap mt-5 ${loadingProblems ? "animate-pulse opacity-70" : ""}`}>
                                <div className="premium-table-scroll">
                                <table className="premium-table min-w-full text-left text-sm">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">Title</th>
                                            <th className="px-4 py-3">Acceptance</th>
                                            <th className="px-4 py-3">Difficulty</th>
                                            <th className="px-4 py-3">Favorite</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleProblems.length > 0 ? visibleProblems.map((problem) => (
                                            <tr key={problem._id || problem.slug} className="border-t border-[#0a173210] hover:bg-[#135BEB08]">
                                                <td className="px-4 py-3">{problem.id}</td>
                                                <td className="px-4 py-3">
                                                    <Link to={`/problems/${problem.slug}`} className="text-[#0a1732] hover:text-[#135BEB]">
                                                        {problem.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-[#0a1732a8]">{problem.acceptance}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2 py-1 text-xs ${problem.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-300" : problem.difficulty === "medium" ? "bg-amber-500/20 text-amber-200" : "bg-rose-500/20 text-rose-300"}`}>
                                                        {problem.difficulty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleFavorite(problem._id)}
                                                        className={`rounded-md border px-2 py-1 text-xs ${isFavorite(problem._id) ? "border-amber-400 bg-amber-50 text-amber-500" : "border-[#0a173220] text-[#0a1732aa] hover:border-[#135BEB55]"}`}
                                                        title={isFavorite(problem._id) ? "Unfavorite" : "Add to Favorite"}
                                                    >
                                                        {isFavorite(problem._id) ? "★" : "☆"}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-[#0a173288]">No problems found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </main>

                        <aside className="premium-panel h-fit p-5">
                            <h3 className="text-sm text-[#0a173288]">Solved</h3>
                            <p className="mt-2 text-3xl poppins-semibold">{problemsData.length > 0 ? Math.min(2, problemsData.length) : 0}/{problemsData.length}</p>
                            <p className="mt-3 text-sm text-[#0a173288]">Browse curated questions, keep favorites, and jump straight into the editor.</p>
                        </aside>
                    </div>
                </div>
            </section>
        </Layout>
    </>;
};

export default ProblemsList;
