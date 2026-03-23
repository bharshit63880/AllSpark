import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import CodeEditor from "../../components/editor/CodeEditor";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const languageIdToStringMap = {
    52: "cpp",
    62: "java",
    63: "javascript",
    71: "python",
};

const boilerPlateByLanguageId = {
    52: "// Start coding in C++\n",
    62: "// Start coding in Java\n",
    63: "// Start coding in JavaScript\n",
    71: "# Start coding in Python\n",
};

const getDefaultDraft = (problemId) => ({
    problem_id: problemId,
    language_id: 52,
    source_code: boilerPlateByLanguageId[52],
    touched: false,
});

const getVerdictFromSubmission = (submission) => {
    const testCases = Array.isArray(submission?.test_cases) ? submission.test_cases : [];
    if (!submission?.is_cpu_executed || testCases.length === 0) {
        return "Pending";
    }

    const failed = testCases.find((testCase) => testCase?.status?.id !== 3);
    return failed?.status?.description || "Accepted";
};

const ContestStart = () => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { token, user } = useAuthContext();
    const { clientId } = useWebSocketContext();

    const [contestDetails, setContestDetails] = useState({
        _id: "",
        name: "Contest Workspace",
        slug: "",
        description: "Loading contest workspace...",
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        problems: [],
    });
    const [contestProblems, setContestProblems] = useState([]);
    const [participantDetails, setParticipantDetails] = useState(null);
    const [draftsByProblemId, setDraftsByProblemId] = useState({});
    const [problemStatuses, setProblemStatuses] = useState({});
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [contestClockText, setContestClockText] = useState("Loading timer...");
    const [isStartingContest, setIsStartingContest] = useState(false);
    const [isSubmittingContest, setIsSubmittingContest] = useState(false);
    const autoStartAttemptedRef = useRef(false);

    const workspaceDraftKey = `contest-workspace:${slug}:drafts`;
    const requestedProblemIndex = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const value = Number(params.get("problem"));
        return Number.isInteger(value) && value >= 0 ? value : 0;
    }, [location.search]);

    const currentProblem = contestProblems[currentProblemIndex] || null;
    const currentDraft = currentProblem ? (draftsByProblemId[currentProblem._id] || getDefaultDraft(currentProblem._id)) : null;
    const solvedCount = Object.values(problemStatuses).filter((entry) => entry?.finalVerdict === "Accepted").length;
    const totalStarsEarned = solvedCount * 10;

    const updateContestClock = () => {
        const now = Date.now();
        const endMs = new Date(participantDetails?.end_time || contestDetails.end_time).getTime();
        const startMs = new Date(contestDetails.start_time).getTime();

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

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const prefix = now < startMs ? "Starts in" : "Ends in";
        setContestClockText(`${prefix} ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`);
    };

    const hydrateDrafts = (problems) => {
        let storedDrafts = {};
        try {
            storedDrafts = JSON.parse(localStorage.getItem(workspaceDraftKey) || "{}");
        } catch {
            storedDrafts = {};
        }

        const hydrated = {};
        problems.forEach((problem) => {
            const existing = storedDrafts?.[problem._id];
            hydrated[problem._id] = {
                ...getDefaultDraft(problem._id),
                ...(existing || {}),
            };
        });
        setDraftsByProblemId(hydrated);
    };

    const fetchContestDetails = async () => {
        if (!clientId) return;

        try {
            await axios.get(`${API_BASE}/contests/${slug}`, {
                headers: { "client-id": clientId },
            });
        } catch {
            toast.error("Unable to load contest workspace.");
        }
    };

    const handleStartContestButton = async () => {
        if (isStartingContest) return;

        if (!token) {
            toast.error("Login required to start contest.");
            navigate("/login");
            return;
        }

        setIsStartingContest(true);
        try {
            await axios.post(
                `${API_BASE}/contests/start`,
                { _id: contestDetails._id },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                        "authorization": token,
                    },
                }
            );
            toast.success("Contest start requested.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Unable to start contest.");
            setIsStartingContest(false);
        }
    };

    const updateCurrentDraft = (updates) => {
        if (!currentProblem) return;
        setDraftsByProblemId((prev) => ({
            ...prev,
            [currentProblem._id]: {
                ...(prev[currentProblem._id] || getDefaultDraft(currentProblem._id)),
                ...updates,
                touched: true,
            },
        }));
    };

    const handleRunCurrentProblem = async () => {
        if (!token) {
            toast.error("Login required to run code.");
            navigate("/login");
            return;
        }

        if (!currentProblem || !currentDraft) {
            toast.error("Problem draft is not ready yet.");
            return;
        }

        setProblemStatuses((prev) => ({
            ...prev,
            [currentProblem._id]: {
                ...(prev[currentProblem._id] || {}),
                runVerdict: "Pending",
            },
        }));

        try {
            await axios.post(
                `${API_BASE}/submissions/contest/create`,
                {
                    contest_id: contestDetails._id,
                    problem_id: currentProblem._id,
                    language_id: currentDraft.language_id,
                    source_code: currentDraft.source_code,
                    is_for_public_test_cases: true,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                        "authorization": token,
                    },
                }
            );
            toast.success(`Run queued for ${currentProblem.name}.`);
        } catch (error) {
            setProblemStatuses((prev) => ({
                ...prev,
                [currentProblem._id]: {
                    ...(prev[currentProblem._id] || {}),
                    runVerdict: "Run failed",
                },
            }));
            toast.error(error.response?.data?.message || "Unable to run this problem.");
        }
    };
    const handleSubmitContest = async () => {
        if (!token) {
            toast.error("Login required to submit contest.");
            navigate("/login");
            return;
        }

        if (!contestProblems.length) {
            toast.error("Contest problems are not loaded yet.");
            return;
        }

        const preparedSubmissions = contestProblems
            .map((problem) => ({
                problem,
                draft: draftsByProblemId[problem._id] || getDefaultDraft(problem._id),
            }))
            .filter(({ draft }) => draft?.touched && String(draft?.source_code || "").trim());

        if (!preparedSubmissions.length) {
            toast.error("At least one solved or edited problem is needed before final contest submission.");
            return;
        }

        setIsSubmittingContest(true);
        try {
            for (const { problem, draft } of preparedSubmissions) {
                setProblemStatuses((prev) => ({
                    ...prev,
                    [problem._id]: {
                        ...(prev[problem._id] || {}),
                        finalVerdict: "Pending",
                    },
                }));

                await axios.post(
                    `${API_BASE}/submissions/contest/create`,
                    {
                        contest_id: contestDetails._id,
                        problem_id: problem._id,
                        language_id: draft.language_id,
                        source_code: draft.source_code,
                        is_for_public_test_cases: false,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "client-id": clientId,
                            "authorization": token,
                        },
                    }
                );
            }

            const skippedCount = contestProblems.length - preparedSubmissions.length;
            toast.success(
                skippedCount > 0
                    ? `Contest submitted for ${preparedSubmissions.length} problem(s). ${skippedCount} untouched problem(s) skipped.`
                    : `Contest submitted for all ${preparedSubmissions.length} prepared problem(s).`
            );
        } catch (error) {
            toast.error(error.response?.data?.message || "Unable to submit contest right now.");
        } finally {
            setIsSubmittingContest(false);
        }
    };

    const handlePrevProblem = () => {
        if (!contestProblems.length) return;
        setCurrentProblemIndex((prev) => (prev === 0 ? contestProblems.length - 1 : prev - 1));
    };

    const handleNextProblem = () => {
        if (!contestProblems.length) return;
        setCurrentProblemIndex((prev) => (prev === contestProblems.length - 1 ? 0 : prev + 1));
    };

    useEffect(() => {
        fetchContestDetails();
    }, [clientId, slug]);

    useEffect(() => {
        updateContestClock();
        const intervalId = setInterval(updateContestClock, 1000);
        return () => clearInterval(intervalId);
    }, [contestDetails.start_time, contestDetails.end_time, participantDetails?.end_time]);

    useEffect(() => {
        if (!contestProblems.length) return;
        hydrateDrafts(contestProblems);
        setCurrentProblemIndex(Math.min(requestedProblemIndex, contestProblems.length - 1));
    }, [contestProblems, requestedProblemIndex]);

    useEffect(() => {
        if (!Object.keys(draftsByProblemId).length) return;
        localStorage.setItem(workspaceDraftKey, JSON.stringify(draftsByProblemId));
    }, [draftsByProblemId, workspaceDraftKey]);

    useEffect(() => {
        if (autoStartAttemptedRef.current) return;
        if (!contestDetails?._id || !token || !clientId) return;
        if (participantDetails || contestProblems.length > 0) {
            autoStartAttemptedRef.current = true;
            return;
        }

        const userContestIds = Array.isArray(user?.participated_in_contests)
            ? user.participated_in_contests.map((id) => String(id))
            : [];
        const isRegistered = userContestIds.includes(String(contestDetails._id));
        const now = Date.now();
        const startMs = new Date(contestDetails.start_time).getTime();
        const endMs = new Date(contestDetails.end_time).getTime();
        const isLive = Number.isFinite(startMs) && Number.isFinite(endMs) && startMs <= now && now <= endMs;

        if (isRegistered && isLive) {
            autoStartAttemptedRef.current = true;
            handleStartContestButton();
        }
    }, [contestDetails, token, clientId, user, participantDetails, contestProblems.length]);

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata?.operation?.includes("contests.getContest"),
        (msg) => {
            if (!msg.metadata?.success) {
                toast.error(msg.metadata?.message || "Contest not found.");
                return;
            }
            setContestDetails(msg.data?.result || {});
        }
    );

    useSocketListener(
        (msg) => msg.type?.includes("response") && msg.metadata?.operation?.includes("contests.startContest"),
        (msg) => {
            if (!msg.metadata?.success) {
                setIsStartingContest(false);
                toast.error(msg.metadata?.message || "Unable to start contest.");
                return;
            }

            const participant = msg.data?.result || {};
            const problems = Array.isArray(participant?.problems) ? participant.problems : [];
            setParticipantDetails(participant);
            setContestProblems(problems);
            setIsStartingContest(false);
            toast.success(msg.metadata?.message || "Contest workspace ready.");
        }
    );

    useSocketListener(
        (msg) =>
            msg.type?.includes("response") &&
            msg.metadata?.operation?.includes("submissions.contest.create") &&
            msg.data?.result?.contest_id === contestDetails._id,
        (msg) => {
            const submission = msg.data?.result;
            const problemId = submission?.problem_id;
            if (!problemId) return;

            if (!msg.metadata?.success) {
                setProblemStatuses((prev) => ({
                    ...prev,
                    [problemId]: {
                        ...(prev[problemId] || {}),
                        [submission?.is_for_public_test_cases ? "runVerdict" : "finalVerdict"]: "Submission failed",
                    },
                }));
                toast.error(msg.metadata?.message || "Submission failed.");
                return;
            }

            const verdict = getVerdictFromSubmission(submission);
            setProblemStatuses((prev) => ({
                ...prev,
                [problemId]: {
                    ...(prev[problemId] || {}),
                    [submission?.is_for_public_test_cases ? "runVerdict" : "finalVerdict"]: verdict,
                    starsEarned:
                        !submission?.is_for_public_test_cases && verdict === "Accepted"
                            ? 10
                            : (prev[problemId]?.starsEarned || 0),
                    updatedAt: submission?.updatedAt || new Date().toISOString(),
                },
            }));
        }
    );
    const currentProblemStatus = currentProblem ? (problemStatuses[currentProblem._id] || {}) : {};
    const totalQueuedFinals = Object.values(problemStatuses).filter((entry) => entry?.finalVerdict).length;
    const workspaceReady = participantDetails && contestProblems.length > 0;

    return (
        <div className="premium-page min-h-screen text-[#10203a]">
            <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/82 px-4 py-3 backdrop-blur-xl lg:px-8">
                <div className="premium-container flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/contests" className="text-sm text-slate-500 hover:text-slate-900">
                            Problem List
                        </Link>
                        <span className="text-slate-300">/</span>
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-600/70">Contest Workspace</p>
                            <h1 className="text-xl text-slate-950 poppins-semibold">{contestDetails.name}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-700">
                            {contestClockText}
                        </div>
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                            Stars {totalStarsEarned}/{contestProblems.length * 10 || 0}
                        </div>
                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                            Solved {solvedCount}/{contestProblems.length || 0}
                        </div>
                        <Link
                            to={`/contests/leaderboard/${contestDetails._id}`}
                            state={{ contestName: contestDetails.name }}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm poppins-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Leaderboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
                {!workspaceReady ? (
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                        <section className="premium-panel p-6">
                            <h2 className="text-3xl text-slate-950 poppins-semibold">{contestDetails.name}</h2>
                            <p className="mt-4 whitespace-pre-line text-slate-700">{contestDetails.description}</p>
                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Flow</p>
                                    <p className="mt-2 text-sm text-slate-700">One workspace, next and previous navigation, run per problem, final contest submit at the end.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scoring</p>
                                    <p className="mt-2 text-sm text-slate-700">Each accepted problem earns 10 stars. Rank updates by solved count, stars, and finish timing.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leaderboard</p>
                                    <p className="mt-2 text-sm text-slate-700">Real-time updates continue through the existing event-driven submission pipeline.</p>
                                </div>
                            </div>
                        </section>

                        <aside className="premium-panel-soft p-6">
                            <h3 className="text-lg text-slate-950 poppins-semibold">Contest Problems</h3>
                            <div className="mt-4 space-y-3">
                                {(contestDetails.problems || []).length > 0 ? (
                                    contestDetails.problems.map((problemId, index) => (
                                        <div key={`${problemId}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                            <p className="text-xs text-slate-400">Q{index + 1}</p>
                                            <p className="mt-1 text-sm text-slate-900">Problem {index + 1}</p>
                                            <p className="mt-1 text-xs text-amber-600">10 stars</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">Problems will appear once contest workspace starts.</p>
                                )}
                            </div>

                            <button
                                onClick={handleStartContestButton}
                                disabled={isStartingContest || !token}
                                className="mt-6 w-full rounded-2xl bg-[#135BEB] px-4 py-3 text-sm poppins-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isStartingContest ? "Starting Workspace..." : "Open Contest Workspace"}
                            </button>
                            {!token && <p className="mt-3 text-xs text-rose-500">Login required before opening contest workspace.</p>}
                        </aside>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1.05fr)_minmax(0,1fr)]">
                        <aside className="premium-panel p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Problems</p>
                                    <h3 className="mt-1 text-lg text-slate-950 poppins-semibold">{contestProblems.length} Questions</h3>
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                                    10 stars each
                                </span>
                            </div>

                            <div className="mt-4 space-y-3">
                                {contestProblems.map((problem, index) => {
                                    const status = problemStatuses[problem._id] || {};
                                    const isActive = index === currentProblemIndex;
                                    return (
                                        <button
                                            key={problem._id}
                                            type="button"
                                            onClick={() => setCurrentProblemIndex(index)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                                isActive
                                                    ? "border-cyan-300/50 bg-cyan-400/10 shadow-[0_10px_30px_rgba(34,211,238,0.12)]"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs text-slate-400">Q{index + 1}</p>
                                                    <p className="mt-1 text-sm poppins-medium text-slate-900">{problem.name}</p>
                                                </div>
                                                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                                                    {status?.starsEarned || 0}/10
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                                <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500">
                                                    Run: {status?.runVerdict || "Not run"}
                                                </span>
                                                <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500">
                                                    Final: {status?.finalVerdict || "Pending final submit"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmitContest}
                                disabled={isSubmittingContest}
                                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm poppins-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmittingContest ? "Submitting Contest..." : "Submit Contest"}
                            </button>
                            <p className="mt-3 text-xs text-slate-500">
                                Per problem only run is available here. Final private judging happens when you submit the full contest.
                            </p>
                        </aside>
                        <section className="premium-panel p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Problem</p>
                                    <h2 className="mt-1 text-2xl poppins-semibold text-slate-950">
                                        {currentProblem ? `Q${currentProblemIndex + 1}. ${currentProblem.name}` : "Loading problem..."}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePrevProblem}
                                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextProblem}
                                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                                        Run status: {currentProblemStatus?.runVerdict || "Not run"}
                                    </span>
                                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">
                                        Final status: {currentProblemStatus?.finalVerdict || "Pending final submit"}
                                    </span>
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                                        Stars: {currentProblemStatus?.starsEarned || 0}/10
                                    </span>
                                </div>
                                <div className="mt-5 max-h-[72vh] overflow-y-auto pe-2">
                                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                                        {currentProblem?.description || "Problem description is loading..."}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="premium-panel p-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Editor</p>
                                    <p className="text-sm text-slate-600">
                                        {languageIdToStringMap[currentDraft?.language_id] || "cpp"} draft for {currentProblem?.name || "problem"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleRunCurrentProblem}
                                        className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm poppins-medium text-cyan-700 hover:bg-cyan-100"
                                    >
                                        Run
                                    </button>
                                </div>
                            </div>

                            {currentProblem && (
                                <CodeEditor
                                    key={`${currentProblem._id}-${currentDraft?.language_id}`}
                                    initialLanguageId={currentDraft?.language_id}
                                    initialCode={currentDraft?.source_code}
                                    emitInitialState={false}
                                    editorHeight="72vh"
                                    onCodeLanguageChange={(languageId) => updateCurrentDraft({ language_id: languageId, source_code: boilerPlateByLanguageId[languageId] || boilerPlateByLanguageId[52] })}
                                    onCodeStringChange={(sourceCode) => updateCurrentDraft({ source_code: sourceCode })}
                                />
                            )}

                            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                <p>Final submissions queued: {totalQueuedFinals}</p>
                                <p className="mt-1">After full contest submit, leaderboard updates in real time as private judging completes.</p>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContestStart;
