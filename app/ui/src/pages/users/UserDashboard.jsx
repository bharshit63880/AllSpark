import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Layout from "../../components/layout/Layout";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
const LOADING_TIMEOUT_MS = 15000;
const ADMIN_ROLES = ["ADMIN", "CONTEST_SCHEDULER", "SUPPORT"];
const DEFAULT_TAB = "dashboard";
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Profile" },
  { id: "problems", label: "Problems" },
  { id: "contests", label: "Contests" },
  { id: "support", label: "Support & Access" },
];

const txt = (value) => String(value || "").trim();
const fmtDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const shortDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};
const initials = (name, username) => {
  const base = txt(name) || txt(username) || "U";
  return base.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
};
const shorten = (value, max = 150) => {
  const content = txt(value);
  return content.length > max ? `${content.slice(0, max)}...` : content || "Not available";
};
const badgeClass = (value) => {
  const normalized = txt(value).toUpperCase();
  if (["ACTIVE", "APPROVED", "VERIFIED", "RESOLVED", "ACCEPTED", "SOLVED"].includes(normalized)) return "bg-[#47FF4E]/15 text-[#0a1732] border border-[#47FF4E]/40";
  if (["REJECTED", "REVOKED", "BANNED", "INACTIVE", "CLOSED"].includes(normalized)) return "bg-[#FF7A7A]/15 text-[#B42318] border border-[#FF7A7A]/40";
  if (["PENDING", "IN_REVIEW", "OPEN", "MEDIUM"].includes(normalized)) return "bg-[#F5CC37]/15 text-[#7A5A00] border border-[#F5CC37]/40";
  return "bg-[#135BEB]/10 text-[#135BEB] border border-[#135BEB]/20";
};
const diffClass = (value) => {
  const normalized = txt(value).toUpperCase();
  if (normalized === "EASY") return "bg-[#47FF4E]/15 text-[#0a1732]";
  if (normalized === "MEDIUM") return "bg-[#F5CC37]/15 text-[#7A5A00]";
  if (normalized === "HARD") return "bg-[#FF7A7A]/15 text-[#B42318]";
  return "bg-[#0a1732]/10 text-[#0a1732]";
};
const contestMeta = (contest) => {
  const now = Date.now();
  const start = contest?.start_time ? new Date(contest.start_time).getTime() : 0;
  const end = contest?.end_time ? new Date(contest.end_time).getTime() : 0;
  if (start && now < start) return { label: "Upcoming", className: "bg-[#135BEB]/10 text-[#135BEB] border border-[#135BEB]/20" };
  if (start && end && now >= start && now <= end) return { label: "Live", className: "bg-[#47FF4E]/15 text-[#0a1732] border border-[#47FF4E]/40" };
  return { label: "Completed", className: "bg-[#0a1732]/10 text-[#0a1732] border border-[#0a1732]/15" };
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { token, user, setToken, setUser } = useAuthContext();
  const { clientId } = useWebSocketContext();
  const [tab, setTab] = useState(DEFAULT_TAB);
  const [profile, setProfile] = useState(user || null);
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState({ profile: false, problems: false, contests: false, support: false });

  const headers = useMemo(() => ({ "client-id": clientId, authorization: token }), [clientId, token]);
  const me = profile || user || null;
  const setBusy = (key, value) => setLoading((prev) => ({ ...prev, [key]: value }));
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
  };
  const onError = (error, fallback) => {
    toast.error(error?.response?.data?.message || fallback);
    if ([401, 403].includes(error?.response?.status)) logout();
  };

  useEffect(() => {
    if (!token || !user) {
      toast.error("Please login to access your profile.");
      navigate("/login");
    }
  }, [navigate, token, user]);

  useEffect(() => {
    if (!clientId || !token || !user?._id) return;
    const timer = setTimeout(() => setLoading({ profile: false, problems: false, contests: false, support: false }), LOADING_TIMEOUT_MS);
    const boot = async () => {
      try {
        setBusy("profile", true);
        setBusy("problems", true);
        setBusy("contests", true);
        setBusy("support", true);
        await Promise.all([
          axios.get(`${API_BASE}/users/${user._id}`, { headers }),
          axios.get(`${API_BASE}/problems/all`, { headers }),
          axios.get(`${API_BASE}/contests/all`, { headers }),
          axios.get(`${API_BASE}/support-tickets/my`, { headers }),
          axios.get(`${API_BASE}/special-access/my`, { headers }),
        ]);
      } catch (error) {
        onError(error, "Failed to sync profile dashboard.");
      }
    };
    boot();
    return () => clearTimeout(timer);
  }, [clientId, headers, token, user?._id]);

  useSocketListener(
    (msg) => msg.type === "response" && ["users.getUser", "problems.getAllProblems", "contests.getAllContests", "supportTickets.getMyTickets", "specialAccess.getMyRequests"].includes(msg.metadata?.operation),
    (msg) => {
      const op = msg.metadata?.operation;
      if (!msg.metadata?.success) {
        if (txt(msg.metadata?.message).toLowerCase().includes("token")) logout();
        if (op === "users.getUser") setBusy("profile", false);
        if (op === "problems.getAllProblems") setBusy("problems", false);
        if (op === "contests.getAllContests") setBusy("contests", false);
        if (["supportTickets.getMyTickets", "specialAccess.getMyRequests"].includes(op)) setBusy("support", false);
        return;
      }
      if (op === "users.getUser") { setProfile(msg.data?.result || user || null); setBusy("profile", false); }
      if (op === "problems.getAllProblems") { setProblems(Array.isArray(msg.data?.result) ? msg.data.result : []); setBusy("problems", false); }
      if (op === "contests.getAllContests") { setContests(Array.isArray(msg.data?.result) ? msg.data.result : []); setBusy("contests", false); }
      if (op === "supportTickets.getMyTickets") { setTickets(Array.isArray(msg.data?.result) ? msg.data.result : []); setBusy("support", false); }
      if (op === "specialAccess.getMyRequests") { setAccessRequests(Array.isArray(msg.data?.result) ? msg.data.result : []); setBusy("support", false); }
    }
  );
  const problemMap = useMemo(() => new Map(problems.map((problem) => [String(problem?._id), problem])), [problems]);
  const contestMap = useMemo(() => new Map(contests.map((contest) => [String(contest?._id), contest])), [contests]);
  const ticketMap = useMemo(() => new Map(tickets.map((ticket) => [String(ticket?._id), ticket])), [tickets]);

  const triedProblems = useMemo(() => {
    const source = Array.isArray(me?.tried_problems) ? me.tried_problems : [];
    return source
      .map((item) => {
        const linkedProblem = problemMap.get(String(item?.problem_id));
        const status = txt(item?.status) || "ATTEMPTED";
        const submissionCount = Array.isArray(item?.submissions) ? item.submissions.length : 0;
        return { ...item, linkedProblem, status, submissionCount, solved: ["ACCEPTED", "AC", "SOLVED"].includes(status.toUpperCase()) };
      })
      .sort((a, b) => Number(b.solved) - Number(a.solved) || b.submissionCount - a.submissionCount);
  }, [me?.tried_problems, problemMap]);

  const joinedContests = useMemo(() => {
    const source = Array.isArray(me?.participated_in_contests) ? me.participated_in_contests : [];
    return source
      .map((contestId) => contestMap.get(String(contestId)) || { _id: contestId, name: "Contest record unavailable" })
      .sort((a, b) => new Date(b?.start_time || 0).getTime() - new Date(a?.start_time || 0).getTime());
  }, [contestMap, me?.participated_in_contests]);

  const supportAccess = useMemo(() => {
    return accessRequests
      .map((item) => ({ ...item, linkedTicket: ticketMap.get(String(item?.ticket_id || item?.related_ticket_id)) || null }))
      .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  }, [accessRequests, ticketMap]);

  const stats = useMemo(() => {
    const solved = triedProblems.filter((problem) => problem.solved).length;
    const activeTickets = tickets.filter((ticket) => ["OPEN", "IN_REVIEW", "VERIFIED"].includes(txt(ticket?.status).toUpperCase())).length;
    const approvedAccess = accessRequests.filter((item) => txt(item?.status).toUpperCase() === "APPROVED").length;
    return [
      { label: "Problems Tried", value: triedProblems.length, helper: `${solved} solved` },
      { label: "Contests Joined", value: joinedContests.length, helper: "All participations" },
      { label: "Support Tickets", value: tickets.length, helper: `${activeTickets} active` },
      { label: "Special Access", value: accessRequests.length, helper: `${approvedAccess} approved` },
    ];
  }, [accessRequests, joinedContests.length, tickets, triedProblems]);

  const highlights = useMemo(() => {
    const latestProblem = triedProblems[0];
    const latestContest = joinedContests[0];
    const latestTicket = tickets.slice().sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())[0];
    const latestAccess = supportAccess[0];
    return [
      {
        title: "Latest Problem Activity",
        value: latestProblem?.linkedProblem?.name || latestProblem?.problem_id || "No attempts yet",
        description: latestProblem ? `${latestProblem.status} · ${latestProblem.submissionCount} submissions tracked` : "Your solving history will start showing here automatically.",
      },
      {
        title: "Latest Contest",
        value: latestContest?.name || "No contest joined yet",
        description: latestContest ? `${contestMeta(latestContest).label} · ${shortDate(latestContest?.start_time)}` : "Contest participation will appear once you join one.",
      },
      {
        title: "Latest Support Ticket",
        value: latestTicket?.title || "No support tickets raised",
        description: latestTicket ? `${latestTicket.status} · ${shortDate(latestTicket?.createdAt)}` : "Help requests will stay visible in your profile history.",
      },
      {
        title: "Latest Access Decision",
        value: latestAccess?.status || "No special access history",
        description: latestAccess ? `${latestAccess.access_type || "ACCESS"} · expires ${shortDate(latestAccess?.expires_at)}` : "Approved or rejected contest access will show up here.",
      },
    ];
  }, [joinedContests, supportAccess, tickets, triedProblems]);

  const selectTab = (nextTab) => {
    if (nextTab === "controlPanel") {
      if (ADMIN_ROLES.includes(txt(me?.role).toUpperCase())) {
        navigate("/admins/control-panel");
      } else {
        toast.error("Sorry! You need an admin or support account for the control panel.");
      }
      return;
    }
    if (nextTab === "supportCenter") {
      navigate("/support");
      return;
    }
    setTab(nextTab);
  };

  const menuItemClass = (id) => `cursor-pointer rounded-2xl px-4 py-3 border transition-all duration-300 ${tab === id ? "bg-[#135BEB]/10 text-[#135BEB] border-[#135BEB]/30 scale-[1.02]" : "bg-white text-[#0a1732]/80 border-[#0a1732]/10 hover:border-[#135BEB]/25 hover:text-[#135BEB]"}`;
  const cardClass = "rounded-[1.8rem] border border-[#0a1732]/10 bg-white p-5 shadow-[0_18px_50px_rgba(10,23,50,0.06)]";
  const smallCardClass = "rounded-[1.4rem] border border-[#0a1732]/8 bg-[#f8fbff] p-4";
  const loadingLabel = (flag, label) => flag ? <p className="text-sm text-[#135BEB] poppins-medium">{label}</p> : null;
  return (
    <Layout>
      <section className="premium-page premium-section">
        <div className="premium-container grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="rounded-[2rem] border border-white/70 bg-white/75 backdrop-blur-2xl shadow-[0_20px_60px_rgba(10,23,50,0.08)] p-5 h-fit sticky top-6">
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,_rgba(19,91,235,0.95),_rgba(123,97,255,0.9))] text-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm poppins-medium text-white/75">Personal Hub</p>
                  <h1 className="text-2xl poppins-semibold mt-2">{me?.name || me?.user_name || "User"}</h1>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-lg poppins-semibold">{initials(me?.name, me?.user_name)}</div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs poppins-medium border border-white/20">{me?.role || "USER"}</span>
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs poppins-medium border border-white/20">{me?.activation_status || "ACTIVE"}</span>
              </div>
              <p className="text-sm poppins-regular text-white/80 mt-4 break-all">User ID: {me?._id || "Not available"}</p>
            </div>

            <ul className="flex flex-col gap-3 mt-6 poppins-medium text-[#0a1732]">
              {TABS.map((item) => <li key={item.id} className={menuItemClass(item.id)} onClick={() => selectTab(item.id)}>{item.label}</li>)}
              <li className={menuItemClass("supportCenter")} onClick={() => selectTab("supportCenter")}>Support Center</li>
              {ADMIN_ROLES.includes(txt(me?.role).toUpperCase()) ? <li className={menuItemClass("controlPanel")} onClick={() => selectTab("controlPanel")}>Control Panel</li> : null}
            </ul>
          </aside>

          <main className="rounded-[2.2rem] border border-white/80 bg-white/75 backdrop-blur-2xl shadow-[0_20px_60px_rgba(10,23,50,0.08)] p-6 lg:p-8 flex flex-col gap-6">
            {tab === "dashboard" ? <>
              <div className="rounded-[2rem] overflow-hidden border border-[#0a1732]/8 bg-[linear-gradient(135deg,_rgba(10,23,50,0.96),_rgba(19,91,235,0.9)_48%,_rgba(123,97,255,0.88))] text-white p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                  <div className="max-w-3xl">
                    <p className="text-sm uppercase tracking-[0.32em] text-white/60 poppins-medium">Profile overview</p>
                    <h2 className="text-3xl lg:text-5xl poppins-semibold mt-3">{me?.name || "Your coding identity, all in one place"}</h2>
                    <p className="text-white/75 mt-4 text-sm lg:text-base poppins-regular max-w-2xl">Account details, solved work, contest participation, support history, and access decisions now stay visible in one clean profile space.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 min-w-[250px]">
                    <div className="rounded-[1.4rem] bg-white/12 border border-white/15 p-4"><p className="text-xs text-white/65 poppins-medium">Joined</p><p className="text-base poppins-semibold mt-2">{shortDate(me?.createdAt)}</p></div>
                    <div className="rounded-[1.4rem] bg-white/12 border border-white/15 p-4"><p className="text-xs text-white/65 poppins-medium">Last Updated</p><p className="text-base poppins-semibold mt-2">{shortDate(me?.updatedAt)}</p></div>
                    <div className="rounded-[1.4rem] bg-white/12 border border-white/15 p-4 col-span-2"><p className="text-xs text-white/65 poppins-medium">Primary Identity</p><p className="text-base poppins-semibold mt-2 break-all">{me?.email || me?.user_name || "Not available"}</p></div>
                  </div>
                </div>
              </div>
              {loadingLabel(loading.profile || loading.problems || loading.contests || loading.support, "Syncing your latest activity...")}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{stats.map((item) => <div key={item.label} className="rounded-[2rem] border border-[#0a1732]/10 bg-white/80 backdrop-blur-xl p-5 shadow-[0_18px_50px_rgba(10,23,50,0.08)]"><p className="text-sm text-[#0a1732]/60 poppins-medium">{item.label}</p><h3 className="text-3xl text-[#0a1732] poppins-semibold mt-3">{item.value}</h3><p className="text-sm text-[#0a1732]/55 poppins-regular mt-2">{item.helper}</p></div>)}</div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{highlights.map((item) => <div key={item.title} className={cardClass}><p className="text-sm text-[#0a1732]/60 poppins-medium">{item.title}</p><h3 className="text-2xl text-[#0a1732] poppins-semibold mt-3">{item.value}</h3><p className="text-sm text-[#0a1732]/55 poppins-regular mt-3">{item.description}</p></div>)}</div>
              <div className="grid grid-cols-1 2xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className={cardClass}>
                  <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#0a1732]/60 poppins-medium">Recent problem journey</p><h3 className="text-2xl text-[#0a1732] poppins-semibold mt-2">What you solved and tried</h3></div><button type="button" onClick={() => selectTab("problems")} className="rounded-full bg-[#135BEB]/10 text-[#135BEB] px-4 py-2 text-sm poppins-medium">Open details</button></div>
                  <div className="mt-5 space-y-4">{triedProblems.slice(0, 4).map((problem) => <div key={String(problem?.problem_id)} className={smallCardClass}><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg poppins-semibold text-[#0a1732]">{problem?.linkedProblem?.name || `Problem ${problem?.problem_id}`}</h4><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${diffClass(problem?.linkedProblem?.difficulty)}`}>{problem?.linkedProblem?.difficulty || "Unknown"}</span><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(problem?.status)}`}>{problem?.status}</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-[#0a1732]/70 poppins-regular mt-3"><p>Submission records: {problem.submissionCount}</p><p>Problem ID: {problem?.problem_id || "Not available"}</p><p>Slug: {problem?.linkedProblem?.slug || "Not available"}</p></div></div>)}{!triedProblems.length ? <div className={`${smallCardClass} text-sm text-[#0a1732]/55 poppins-regular border-dashed`}>Your attempted problem history will show up here as soon as you start solving.</div> : null}</div>
                </div>
                <div className={cardClass}>
                  <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-[#0a1732]/60 poppins-medium">Support and trust</p><h3 className="text-2xl text-[#0a1732] poppins-semibold mt-2">Help history and access decisions</h3></div><button type="button" onClick={() => selectTab("support")} className="rounded-full bg-[#135BEB]/10 text-[#135BEB] px-4 py-2 text-sm poppins-medium">Open details</button></div>
                  <div className="mt-5 space-y-4">{tickets.slice(0, 3).map((ticket) => <div key={ticket?._id} className={smallCardClass}><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg poppins-semibold text-[#0a1732]">{ticket?.title || "Untitled ticket"}</h4><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(ticket?.status)}`}>{ticket?.status || "OPEN"}</span></div><p className="text-sm text-[#0a1732]/60 poppins-regular mt-3">{shorten(ticket?.description, 110)}</p><p className="text-xs text-[#0a1732]/45 poppins-medium mt-3">Ref: {ticket?.ticket_reference || ticket?._id} · {shortDate(ticket?.createdAt)}</p></div>)}{!tickets.length ? <div className={`${smallCardClass} text-sm text-[#0a1732]/55 poppins-regular border-dashed`}>You have not raised any support ticket yet. When you do, everything will stay tracked here.</div> : null}</div>
                </div>
              </div>
            </> : null}

            {tab === "profile" ? <>
              <div className="rounded-[2rem] border border-[#0a1732]/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(230,240,255,0.92))] p-6 shadow-[0_18px_50px_rgba(10,23,50,0.06)]"><div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between"><div className="flex items-center gap-5"><div className="w-24 h-24 rounded-[2rem] bg-[linear-gradient(135deg,_#135BEB,_#7B61FF)] text-white flex items-center justify-center text-3xl poppins-semibold shadow-[0_20px_45px_rgba(19,91,235,0.25)]">{initials(me?.name, me?.user_name)}</div><div><h2 className="text-3xl text-[#0a1732] poppins-semibold">{me?.name || "User profile"}</h2><p className="text-[#0a1732]/60 poppins-regular mt-2">@{me?.user_name || "not-available"}</p><div className="flex flex-wrap gap-2 mt-3"><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(me?.role)}`}>{me?.role || "USER"}</span><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(me?.activation_status)}`}>{me?.activation_status || "ACTIVE"}</span></div></div></div><div className="rounded-[1.6rem] border border-[#0a1732]/10 bg-white/75 p-4 min-w-[280px]"><p className="text-sm text-[#0a1732]/55 poppins-medium">Member since</p><p className="text-xl text-[#0a1732] poppins-semibold mt-2">{shortDate(me?.createdAt)}</p><p className="text-sm text-[#0a1732]/50 poppins-regular mt-2">Last profile sync: {fmtDate(me?.updatedAt)}</p></div></div></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[{ label: "User ID", value: me?._id }, { label: "Name", value: me?.name }, { label: "Username", value: me?.user_name }, { label: "Email", value: me?.email }, { label: "Mobile Number", value: me?.mobile_no }, { label: "Role", value: me?.role }, { label: "Activation Status", value: me?.activation_status }, { label: "Joined On", value: fmtDate(me?.createdAt) }, { label: "Last Updated", value: fmtDate(me?.updatedAt) }].map((item) => <div key={item.label} className={cardClass}><p className="text-sm text-[#0a1732]/55 poppins-medium">{item.label}</p><p className="text-lg text-[#0a1732] poppins-semibold mt-3 break-all">{item.value || "Not available"}</p></div>)}</div>
              <div className={cardClass}><p className="text-sm text-[#0a1732]/60 poppins-medium">Profile summary</p><h3 className="text-2xl text-[#0a1732] poppins-semibold mt-2">Everything attached to your account</h3><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">{stats.map((item) => <div key={item.label} className={smallCardClass}><p className="text-sm text-[#0a1732]/55 poppins-medium">{item.label}</p><p className="text-2xl text-[#0a1732] poppins-semibold mt-2">{item.value}</p><p className="text-xs text-[#0a1732]/45 poppins-regular mt-2">{item.helper}</p></div>)}</div></div>
              <div className="flex flex-wrap gap-4"><Link to="/logout" className="inline-flex items-center justify-center rounded-full bg-[#ff2929] text-white px-8 py-4 text-lg poppins-semibold shadow-[0_18px_45px_rgba(255,41,41,0.22)]">Logout</Link><button type="button" onClick={() => selectTab("supportCenter")} className="inline-flex items-center justify-center rounded-full bg-[#135BEB]/10 text-[#135BEB] px-8 py-4 text-lg poppins-semibold">Need Help</button></div>
            </> : null}

            {tab === "problems" ? <><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-sm text-[#0a1732]/60 poppins-medium">Problem history</p><h2 className="text-3xl text-[#0a1732] poppins-semibold mt-2">Everything you have worked on</h2></div>{loadingLabel(loading.problems, "Loading attempted problems...")}</div><div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{triedProblems.map((problem) => <div key={String(problem?.problem_id)} className={cardClass}><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl text-[#0a1732] poppins-semibold">{problem?.linkedProblem?.name || `Problem ${problem?.problem_id}`}</h3><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${diffClass(problem?.linkedProblem?.difficulty)}`}>{problem?.linkedProblem?.difficulty || "Unknown"}</span><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(problem?.status)}`}>{problem?.status}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 text-sm text-[#0a1732]/68 poppins-regular"><p>Problem ID: {problem?.problem_id || "Not available"}</p><p>Slug: {problem?.linkedProblem?.slug || "Not available"}</p><p>Submission records: {problem.submissionCount}</p><p>Tags: {problem?.linkedProblem?.tags?.join(", ") || "Not tagged"}</p></div><p className="text-sm text-[#0a1732]/58 poppins-regular mt-5">{shorten(problem?.linkedProblem?.description, 180)}</p>{problem?.linkedProblem?.slug ? <Link to={`/problems/${problem.linkedProblem.slug}`} className="inline-flex mt-5 rounded-full bg-[#135BEB]/10 text-[#135BEB] px-4 py-2 text-sm poppins-medium">Open Problem</Link> : null}</div>)}</div>{!triedProblems.length ? <div className={`${cardClass} border-dashed text-[#0a1732]/55 poppins-regular`}>No attempted problems tracked yet. Start from the problem list and your full history will appear here automatically.</div> : null}</> : null}

            {tab === "contests" ? <><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-sm text-[#0a1732]/60 poppins-medium">Contest participation</p><h2 className="text-3xl text-[#0a1732] poppins-semibold mt-2">Contests you have taken part in</h2></div>{loadingLabel(loading.contests, "Loading contest history...")}</div><div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{joinedContests.map((contest) => { const meta = contestMeta(contest); return <div key={String(contest?._id)} className={cardClass}><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl text-[#0a1732] poppins-semibold">{contest?.name || "Contest unavailable"}</h3><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${meta.className}`}>{meta.label}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 text-sm text-[#0a1732]/68 poppins-regular"><p>Contest ID: {contest?._id || "Not available"}</p><p>Slug: {contest?.slug || "Not available"}</p><p>Starts: {fmtDate(contest?.start_time)}</p><p>Ends: {fmtDate(contest?.end_time)}</p></div><p className="text-sm text-[#0a1732]/58 poppins-regular mt-5">{shorten(contest?.description, 180)}</p>{contest?.slug ? <Link to={`/contests/${contest.slug}`} className="inline-flex mt-5 rounded-full bg-[#135BEB]/10 text-[#135BEB] px-4 py-2 text-sm poppins-medium">Open Contest</Link> : null}</div>; })}</div>{!joinedContests.length ? <div className={`${cardClass} border-dashed text-[#0a1732]/55 poppins-regular`}>No contest participation tracked yet. Join a contest and your timeline will appear here.</div> : null}</> : null}

            {tab === "support" ? <><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-sm text-[#0a1732]/60 poppins-medium">Support and access history</p><h2 className="text-3xl text-[#0a1732] poppins-semibold mt-2">Tickets, verification, and contest access</h2></div>{loadingLabel(loading.support, "Loading support history...")}</div><div className={cardClass}><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-sm text-[#0a1732]/60 poppins-medium">Support tickets</p><h3 className="text-2xl text-[#0a1732] poppins-semibold mt-2">Every help request you raised</h3></div><button type="button" onClick={() => selectTab("supportCenter")} className="rounded-full bg-[#135BEB]/10 text-[#135BEB] px-4 py-2 text-sm poppins-medium">Open Support Center</button></div><div className="mt-5 space-y-4">{tickets.map((ticket) => <div key={ticket?._id} className={smallCardClass}><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg text-[#0a1732] poppins-semibold">{ticket?.title || "Untitled ticket"}</h4><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(ticket?.status)}`}>{ticket?.status || "OPEN"}</span>{ticket?.issue_type ? <span className="px-3 py-1 rounded-full text-xs poppins-medium bg-[#0a1732]/8 text-[#0a1732]">{ticket.issue_type}</span> : null}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4 text-sm text-[#0a1732]/68 poppins-regular"><p>Ticket Ref: {ticket?.ticket_reference || ticket?._id}</p><p>Created: {fmtDate(ticket?.createdAt)}</p><p>Contest ID: {ticket?.contest_id || "Not linked"}</p><p>Problem ID: {ticket?.problem_id || "Not linked"}</p></div><p className="text-sm text-[#0a1732]/60 poppins-regular mt-4">{ticket?.description || "No description provided."}</p>{ticket?.resolution_notes ? <div className="rounded-[1.2rem] bg-white border border-[#0a1732]/8 p-4 mt-4"><p className="text-xs text-[#0a1732]/45 poppins-medium uppercase tracking-[0.24em]">Resolution</p><p className="text-sm text-[#0a1732]/65 poppins-regular mt-2">{ticket.resolution_notes}</p></div> : null}</div>)}{!tickets.length ? <div className={`${smallCardClass} border-dashed text-sm text-[#0a1732]/55 poppins-regular`}>No support tickets yet. If anything breaks, raise it once and the full history will stay mapped here.</div> : null}</div></div><div className={cardClass}><p className="text-sm text-[#0a1732]/60 poppins-medium">Special access timeline</p><h3 className="text-2xl text-[#0a1732] poppins-semibold mt-2">Contest access granted or denied for your account</h3><div className="mt-5 space-y-4">{supportAccess.map((item) => <div key={item?._id} className={smallCardClass}><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg text-[#0a1732] poppins-semibold">{item?.access_type || "Special access request"}</h4><span className={`px-3 py-1 rounded-full text-xs poppins-medium ${badgeClass(item?.status)}`}>{item?.status || "PENDING"}</span></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4 text-sm text-[#0a1732]/68 poppins-regular"><p>Access ID: {item?._id || "Not available"}</p><p>Contest ID: {item?.contest_id || "Not linked"}</p><p>Starts: {fmtDate(item?.starts_at)}</p><p>Expires: {fmtDate(item?.expires_at)}</p></div><p className="text-sm text-[#0a1732]/60 poppins-regular mt-4">{item?.reason || "No reason recorded."}</p>{item?.linkedTicket?.title ? <p className="text-xs text-[#0a1732]/50 poppins-medium mt-4">Linked ticket: {item.linkedTicket.title}</p> : null}</div>)}{!supportAccess.length ? <div className={`${smallCardClass} border-dashed text-sm text-[#0a1732]/55 poppins-regular`}>No special access history yet. If support verifies a platform-side contest issue, the access decision will show here.</div> : null}</div></div></> : null}
          </main>
        </div>
      </section>
    </Layout>
  );
};

export default UserDashboard;
