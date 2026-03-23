import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import Heading from "../../components/heading/Heading";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "contests", label: "Contests", icon: "🏆" },
  { id: "problems", label: "Problems", icon: "📝" },
  { id: "submissions", label: "Submissions", icon: "📤" },
  { id: "leaderboard", label: "Leaderboard", icon: "🥇" },
  { id: "support", label: "Support Tickets", icon: "🎫" },
  { id: "specialAccess", label: "Special Access", icon: "🛡️" },
  { id: "permissions", label: "Permissions", icon: "🔐" },
  { id: "logs", label: "Logs", icon: "📋" },
];
const SUPPORT_VISIBLE_TAB_IDS = new Set(["dashboard", "support", "specialAccess"]);

const defaultContestForm = {
  name: "",
  slug: "",
  description: "",
  start_time: "",
  end_time: "",
  duration: "",
  support_team: "",
  problems: "",
};
const defaultProblemForm = {
  name: "",
  slug: "",
  description: "",
  difficulty: "EASY",
  is_public: true,
  tags: "",
  test_cases_json: "",
};
const defaultSupportUpdateForm = {
  _id: "",
  status: "OPEN",
  assigned_to: "",
  verified_by: "",
  eligible_for_special_access: false,
  resolution_notes: "",
};
const defaultSpecialAccessUpdateForm = {
  _id: "",
  status: "PENDING",
  access_type: "",
  starts_at: "",
  expires_at: "",
  reason: "",
  decision_note: "",
  access_scope: "",
  requested_duration: "",
  approver_team: "",
  audit_note: "",
  access_expires_at: "",
};

const ControlPanel = () => {
  const { token, user, setToken, setUser } = useAuthContext();
  const navigate = useNavigate();
  const { clientId } = useWebSocketContext();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState({
    users: 0,
    contests: 0,
    problems: 0,
    submissions: 0,
    supportTickets: 0,
    supportOpen: 0,
    supportInReview: 0,
    supportResolved: 0,
    supportEligible: 0,
    lastUpdatedAt: null,
  });
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Contests
  const [contests, setContests] = useState([]);
  const [loadingContests, setLoadingContests] = useState(false);
  const [contestForm, setContestForm] = useState(defaultContestForm);
  const [showContestForm, setShowContestForm] = useState(false);
  const [editingContestId, setEditingContestId] = useState(null);
  const [pendingEditContestId, setPendingEditContestId] = useState(null);

  // Problems
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemForm, setProblemForm] = useState(defaultProblemForm);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [viewProblem, setViewProblem] = useState(null);
  const [loadingViewProblem, setLoadingViewProblem] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    user_name: "",
    email: "",
    password: "",
    mobile_no: "",
    role: "USER",
    activation_status: "active",
  });

  // Submissions
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Support tickets
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingSupportTickets, setLoadingSupportTickets] = useState(false);
  const [showSupportUpdateForm, setShowSupportUpdateForm] = useState(false);
  const [supportUpdateForm, setSupportUpdateForm] = useState(defaultSupportUpdateForm);

  // Special access
  const [specialAccessRequests, setSpecialAccessRequests] = useState([]);
  const [loadingSpecialAccessRequests, setLoadingSpecialAccessRequests] = useState(false);
  const [showSpecialAccessUpdateForm, setShowSpecialAccessUpdateForm] = useState(false);
  const [specialAccessUpdateForm, setSpecialAccessUpdateForm] = useState(defaultSpecialAccessUpdateForm);
  const visibleTabs = (user?.role === "SUPPORT")
    ? TABS.filter((tab) => SUPPORT_VISIBLE_TAB_IDS.has(tab.id))
    : TABS;
  const isSupportUser = user?.role === "SUPPORT";

  const headers = () => ({
    "client-id": clientId,
    authorization: token,
  });

  const handleAdminRequestError = (error, fallbackMessage) => {
    const message = error?.response?.data?.message || fallbackMessage;
    toast.error(message);

    if (error?.response?.status === 401 || error?.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!token || !user) {
      toast.error("Please log in to access Control Panel.");
      navigate("/login");
      return;
    }
    if (user?.role !== "ADMIN" && user?.role !== "CONTEST_SCHEDULER" && user?.role !== "SUPPORT") {
      toast.error("Access denied. Admin role required.");
      navigate("/");
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("dashboard");
    }
  }, [activeTab, visibleTabs]);

  const LOADING_TIMEOUT_MS = 15000;

  useEffect(() => {
    if (activeTab !== "dashboard" || !clientId || !token) return;
    setLoadingDashboard(true);
    const t = setTimeout(() => {
      setLoadingDashboard((prev) => (prev ? false : prev));
    }, LOADING_TIMEOUT_MS);
    const fetchDashboard = async () => {
      try {
        await axios.get(`${API_BASE}/admin/dashboard`, { headers: headers() });
      } catch (err) {
        handleAdminRequestError(err, "Failed to request dashboard.");
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useEffect(() => {
    if (activeTab !== "contests" || !clientId || !token) return;
    setLoadingContests(true);
    const t = setTimeout(() => setLoadingContests((prev) => (prev ? false : prev)), LOADING_TIMEOUT_MS);
    axios.get(`${API_BASE}/admin/contests`, { headers: headers() }).catch((err) => {
      setLoadingContests(false);
      handleAdminRequestError(err, "Failed to load contests.");
    });
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useEffect(() => {
    if (activeTab !== "problems" || !clientId || !token) return;
    setLoadingProblems(true);
    const t = setTimeout(() => setLoadingProblems((prev) => (prev ? false : prev)), LOADING_TIMEOUT_MS);
    axios.get(`${API_BASE}/admin/problems`, { headers: headers() }).catch((err) => {
      setLoadingProblems(false);
      handleAdminRequestError(err, "Failed to load problems.");
    });
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useEffect(() => {
    if (activeTab !== "users" || !clientId || !token) return;
    setLoadingUsers(true);
    const t = setTimeout(() => setLoadingUsers((prev) => (prev ? false : prev)), LOADING_TIMEOUT_MS);
    axios.get(`${API_BASE}/admin/users`, { headers: headers() }).catch((err) => {
      setLoadingUsers(false);
      handleAdminRequestError(err, "Failed to load users.");
    });
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useEffect(() => {
    if (activeTab !== "submissions" || !clientId || !token) return;
    setLoadingSubmissions(true);
    const t = setTimeout(() => setLoadingSubmissions((prev) => (prev ? false : prev)), LOADING_TIMEOUT_MS);
    axios.get(`${API_BASE}/admin/submissions`, { headers: headers() }).catch((err) => {
      setLoadingSubmissions(false);
      handleAdminRequestError(err, "Failed to load submissions.");
    });
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useEffect(() => {
    if (activeTab !== "support" || !clientId || !token) return;
    setLoadingSupportTickets(true);
    const t = setTimeout(() => setLoadingSupportTickets((prev) => (prev ? false : prev)), LOADING_TIMEOUT_MS);
    axios.get(`${API_BASE}/admin/support-tickets`, { headers: headers() }).catch((err) => {
      setLoadingSupportTickets(false);
      handleAdminRequestError(err, "Failed to load support tickets.");
    });
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useEffect(() => {
    if (activeTab !== "specialAccess" || !clientId || !token) return;
    setLoadingSpecialAccessRequests(true);
    const t = setTimeout(() => setLoadingSpecialAccessRequests((prev) => (prev ? false : prev)), LOADING_TIMEOUT_MS);
    axios.get(`${API_BASE}/admin/special-access`, { headers: headers() }).catch((err) => {
      setLoadingSpecialAccessRequests(false);
      handleAdminRequestError(err, "Failed to load special access requests.");
    });
    return () => clearTimeout(t);
  }, [activeTab, clientId, token]);

  useSocketListener(
    (msg) =>
      (msg.type === "response" && (msg.metadata?.operation === "admin.dashboard" || msg.metadata?.operation?.includes("admin.dashboard"))) ||
      msg.type === "admin.dashboard.update",
    (msg) => {
      const data = msg.data || msg;
      const metadata = msg.metadata || {};
      setLoadingDashboard(false);
      if (msg.type === "response" && !metadata?.success) {
        toast.error(metadata?.message || "Dashboard request failed.");
        return;
      }
      const result = data?.result || data;
      const totals = result?.totals || result || {};
      setDashboardStats({
        users: totals.totalUsers ?? totals.users ?? 0,
        contests: totals.totalContests ?? totals.contests ?? 0,
        problems: totals.totalProblems ?? totals.problems ?? 0,
        submissions: totals.totalSubmissions ?? totals.submissions ?? 0,
        supportTickets: totals.supportTickets ?? 0,
        supportOpen: totals.supportOpen ?? 0,
        supportInReview: totals.supportInReview ?? 0,
        supportResolved: totals.supportResolved ?? 0,
        supportEligible: totals.supportEligible ?? 0,
        lastUpdatedAt: result?.lastUpdatedAt || new Date().toISOString(),
      });
      // Only show error toasts for dashboard; success updates stats silently
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.contests.list",
    (msg) => {
      setLoadingContests(false);
      if (msg.metadata?.success && msg.data?.result) {
        setContests(Array.isArray(msg.data.result) ? msg.data.result : []);
      } else if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to load contests.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.contests.get",
    (msg) => {
      if (!msg.metadata?.success || !msg.data?.result) return;
      const c = msg.data.result;
      if (pendingEditContestId && c._id === pendingEditContestId) {
        setContestForm({
          ...defaultContestForm,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          start_time: c.start_time ? new Date(c.start_time).toISOString().slice(0, 16) : "",
          end_time: c.end_time ? new Date(c.end_time).toISOString().slice(0, 16) : "",
          duration: c.duration || "",
          support_team: Array.isArray(c.support_team) ? c.support_team.join(", ") : (c.support_team || ""),
          problems: Array.isArray(c.problems) ? c.problems.join(", ") : "",
        });
        setEditingContestId(c._id);
        setShowContestForm(true);
        setPendingEditContestId(null);
      }
    }
  );

  useSocketListener(
    (msg) =>
      msg.type === "response" &&
      (msg.metadata?.operation === "admin.contests.create" ||
        msg.metadata?.operation === "admin.contests.update" ||
        msg.metadata?.operation === "admin.contests.delete"),
    (msg) => {
      const op = msg.metadata?.operation;
      if (msg.metadata?.success) {
        toast.success(msg.metadata?.message || "Done.");
        setShowContestForm(false);
        setEditingContestId(null);
        setContestForm(defaultContestForm);
        if (activeTab === "contests" && clientId && token) {
          setLoadingContests(true);
          axios.get(`${API_BASE}/admin/contests`, { headers: headers() }).catch(() => setLoadingContests(false));
        }
      } else {
        toast.error(msg.metadata?.message || "Request failed.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.problems.list",
    (msg) => {
      setLoadingProblems(false);
      if (msg.metadata?.success && msg.data?.result) {
        setProblems(Array.isArray(msg.data.result) ? msg.data.result : []);
      } else if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to load problems.");
      }
    }
  );

  useSocketListener(
    (msg) =>
      msg.type === "response" &&
      (msg.metadata?.operation === "admin.problems.create" ||
        msg.metadata?.operation === "admin.problems.update" ||
        msg.metadata?.operation === "admin.problems.delete"),
    (msg) => {
      if (msg.metadata?.success) {
        toast.success(msg.metadata?.message || "Done.");
        setShowProblemForm(false);
        setEditingProblemId(null);
        setProblemForm(defaultProblemForm);
        if (activeTab === "problems" && clientId && token) {
          setLoadingProblems(true);
          axios.get(`${API_BASE}/admin/problems`, { headers: headers() }).catch(() => setLoadingProblems(false));
        }
      } else {
        toast.error(msg.metadata?.message || "Request failed.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.problems.get",
    (msg) => {
      setLoadingViewProblem(false);
      if (msg.metadata?.success && msg.data?.result) {
        setViewProblem(msg.data.result);
      } else {
        toast.error(msg.metadata?.message || "Failed to load problem.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.users.getAll",
    (msg) => {
      setLoadingUsers(false);
      if (msg.metadata?.success && msg.data?.result) {
        setUsers(Array.isArray(msg.data.result) ? msg.data.result : []);
      } else if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to load users.");
      }
    }
  );

  useSocketListener(
    (msg) =>
      msg.type === "response" &&
      (msg.metadata?.operation === "admin.users.create" ||
        msg.metadata?.operation === "admin.users.update" ||
        msg.metadata?.operation === "admin.users.delete" ||
        msg.metadata?.operation === "admin.users.ban" ||
        msg.metadata?.operation === "admin.users.unban"),
    (msg) => {
      if (msg.metadata?.success) {
        toast.success(msg.metadata?.message || "Done.");
        setShowUserForm(false);
        setEditingUserId(null);
        setUserForm({
          name: "",
          user_name: "",
          email: "",
          password: "",
          mobile_no: "",
          role: "USER",
          activation_status: "active",
        });
        if (activeTab === "users" && clientId && token) {
          setLoadingUsers(true);
          axios.get(`${API_BASE}/admin/users`, { headers: headers() }).catch(() => setLoadingUsers(false));
        }
      } else {
        toast.error(msg.metadata?.message || "Request failed.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.submissions.getAll",
    (msg) => {
      setLoadingSubmissions(false);
      if (msg.metadata?.success && msg.data?.result) {
        setSubmissions(Array.isArray(msg.data.result) ? msg.data.result : []);
      } else if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to load submissions.");
      }
    }
  );

  useSocketListener(
    (msg) =>
      msg.type === "response" &&
      (msg.metadata?.operation === "admin.submissions.delete" || msg.metadata?.operation === "admin.submissions.get"),
    (msg) => {
      if (msg.metadata?.success) {
        toast.success(msg.metadata?.message || "Done.");
        if (msg.metadata?.operation === "admin.submissions.delete" && activeTab === "submissions" && clientId && token) {
          setLoadingSubmissions(true);
          axios.get(`${API_BASE}/admin/submissions`, { headers: headers() }).catch(() => setLoadingSubmissions(false));
        }
      } else {
        toast.error(msg.metadata?.message || "Request failed.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.supportTickets.getAll",
    (msg) => {
      setLoadingSupportTickets(false);
      if (msg.metadata?.success && msg.data?.result) {
        setSupportTickets(Array.isArray(msg.data.result) ? msg.data.result : []);
      } else if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to load support tickets.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.supportTickets.update",
    (msg) => {
      if (msg.metadata?.success) {
        toast.success(msg.metadata?.message || "Support ticket updated.");
        setShowSupportUpdateForm(false);
        setSupportUpdateForm(defaultSupportUpdateForm);
        if (clientId && token) {
          setLoadingDashboard(true);
          axios.get(`${API_BASE}/admin/dashboard`, { headers: headers() }).catch(() => setLoadingDashboard(false));
        }
        if (activeTab === "support" && clientId && token) {
          setLoadingSupportTickets(true);
          axios.get(`${API_BASE}/admin/support-tickets`, { headers: headers() }).catch(() => setLoadingSupportTickets(false));
        }
      } else {
        toast.error(msg.metadata?.message || "Failed to update support ticket.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.specialAccess.getAll",
    (msg) => {
      setLoadingSpecialAccessRequests(false);
      if (msg.metadata?.success && msg.data?.result) {
        setSpecialAccessRequests(Array.isArray(msg.data.result) ? msg.data.result : []);
      } else if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to load special access requests.");
      }
    }
  );

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "admin.specialAccess.update",
    (msg) => {
      if (msg.metadata?.success) {
        toast.success(msg.metadata?.message || "Special access request updated.");
        setShowSpecialAccessUpdateForm(false);
        setSpecialAccessUpdateForm(defaultSpecialAccessUpdateForm);
        if (activeTab === "specialAccess" && clientId && token) {
          setLoadingSpecialAccessRequests(true);
          axios.get(`${API_BASE}/admin/special-access`, { headers: headers() }).catch(() => setLoadingSpecialAccessRequests(false));
        }
      } else {
        toast.error(msg.metadata?.message || "Failed to update special access request.");
      }
    }
  );

  const handleCreateContest = async (e) => {
    e.preventDefault();
    const payload = {
      name: contestForm.name,
      slug: contestForm.slug,
      description: contestForm.description || "",
      start_time: contestForm.start_time || undefined,
      end_time: contestForm.end_time || undefined,
      duration: contestForm.duration ? Number(contestForm.duration) : undefined,
      support_team: contestForm.support_team ? contestForm.support_team.split(",").map((s) => s.trim()).filter(Boolean) : [],
      problems: contestForm.problems ? contestForm.problems.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    if (!payload.name || !payload.slug) {
      toast.error("Name and slug are required.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/admin/contests/create`, payload, { headers: headers() });
      toast.info("Create request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create contest.");
    }
  };

  const handleUpdateContest = async (e) => {
    e.preventDefault();
    if (!editingContestId) return;
    const payload = {
      _id: editingContestId,
      name: contestForm.name,
      slug: contestForm.slug,
      description: contestForm.description || "",
      start_time: contestForm.start_time || undefined,
      end_time: contestForm.end_time || undefined,
      duration: contestForm.duration ? Number(contestForm.duration) : undefined,
      support_team: contestForm.support_team ? contestForm.support_team.split(",").map((s) => s.trim()).filter(Boolean) : [],
      problems: contestForm.problems ? contestForm.problems.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      await axios.put(`${API_BASE}/admin/contests/update`, payload, { headers: headers() });
      toast.info("Update request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update contest.");
    }
  };

  const handleDeleteContest = async (id) => {
    if (!window.confirm("Delete this contest?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/contests/delete`, { data: { _id: id }, headers: headers() });
      toast.info("Delete request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete contest.");
    }
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    let test_cases = [];
    if (problemForm.test_cases_json?.trim()) {
      try {
        test_cases = JSON.parse(problemForm.test_cases_json);
        if (!Array.isArray(test_cases)) test_cases = [];
      } catch {
        toast.error("Test cases must be valid JSON array.");
        return;
      }
    }
    const payload = {
      name: problemForm.name,
      slug: problemForm.slug,
      description: problemForm.description || "",
      difficulty: problemForm.difficulty,
      is_public: problemForm.is_public,
      tags: problemForm.tags ? problemForm.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      test_cases,
    };
    if (!payload.name || !payload.slug) {
      toast.error("Name and slug are required.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/admin/problems/create`, payload, { headers: headers() });
      toast.info("Create request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create problem.");
    }
  };

  const handleViewProblem = async (id) => {
    setViewProblem(null);
    setLoadingViewProblem(true);
    try {
      await axios.get(`${API_BASE}/admin/problems/${id}`, { headers: headers() });
    } catch (err) {
      setLoadingViewProblem(false);
      toast.error(err.response?.data?.message || "Failed to fetch problem.");
    }
  };

  const handleUpdateProblem = async (e) => {
    e.preventDefault();
    if (!editingProblemId) return;
    const payload = {
      _id: editingProblemId,
      name: problemForm.name,
      slug: problemForm.slug,
      description: problemForm.description || "",
      difficulty: problemForm.difficulty,
      is_public: problemForm.is_public,
      tags: problemForm.tags ? problemForm.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    if (problemForm.test_cases_json?.trim()) {
      try {
        payload.test_cases = JSON.parse(problemForm.test_cases_json);
        if (!Array.isArray(payload.test_cases)) payload.test_cases = [];
      } catch {
        toast.error("Test cases must be valid JSON array.");
        return;
      }
    }
    try {
      await axios.put(`${API_BASE}/admin/problems/update`, payload, { headers: headers() });
      toast.info("Update request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update problem.");
    }
  };

  const handleDeleteProblem = async (id) => {
    if (!window.confirm("Delete this problem?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/problems/delete`, { data: { _id: id }, headers: headers() });
      toast.info("Delete request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete problem.");
    }
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.user_name || !userForm.email || !userForm.mobile_no || (!editingUserId && !userForm.password)) {
      toast.error("Please fill required fields (password required only for create).");
      return;
    }
    try {
      if (editingUserId) {
        const payload = { _id: editingUserId, ...userForm };
        if (!payload.password) delete payload.password;
        await axios.put(`${API_BASE}/admin/users/update`, payload, { headers: headers() });
      } else {
        await axios.post(`${API_BASE}/admin/users/create`, userForm, { headers: headers() });
      }
      toast.info("Request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit user request.");
    }
  };

  const handleBanUser = async (id, isBanned) => {
    try {
      await axios.post(`${API_BASE}/admin/users/${isBanned ? "unban" : "ban"}`, { _id: id }, { headers: headers() });
      toast.info("Request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/users/delete`, { data: { _id: id }, headers: headers() });
      toast.info("Request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/submissions/delete`, { data: { _id: id }, headers: headers() });
      toast.info("Request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete submission.");
    }
  };

  const handleUpdateSupportTicket = async (e) => {
    e.preventDefault();
    if (!supportUpdateForm._id) {
      toast.error("Select a support ticket first.");
      return;
    }
    try {
      await axios.put(`${API_BASE}/admin/support-tickets/update`, supportUpdateForm, {
        headers: headers(),
      });
      toast.info("Support ticket update request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update support ticket.");
    }
  };

  const handleUpdateSpecialAccess = async (e) => {
    e.preventDefault();
    if (!specialAccessUpdateForm._id) {
      toast.error("Select a special access request first.");
      return;
    }
    try {
      await axios.put(`${API_BASE}/admin/special-access/update`, specialAccessUpdateForm, {
        headers: headers(),
      });
      toast.info("Special access update request sent. Response via WebSocket.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update special access request.");
    }
  };

  const statCards = [
    { label: "Users", value: dashboardStats.users, color: "bg-[#135BEB]/10 text-[#135BEB]" },
    { label: "Contests", value: dashboardStats.contests, color: "bg-[#9D29FF]/10 text-[#9D29FF]" },
    { label: "Problems", value: dashboardStats.problems, color: "bg-[#344FF0]/10 text-[#344FF0]" },
    { label: "Submissions", value: dashboardStats.submissions, color: "bg-[#47FF4E]/20 text-[#0a1732]" },
    { label: "Support Tickets", value: dashboardStats.supportTickets, color: "bg-[#F5CC37]/20 text-[#0a1732]" },
  ];

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [users]);

  const activeUsers = useMemo(
    () => sortedUsers.filter((user) => String(user?.activation_status || "active").toLowerCase() !== "banned"),
    [sortedUsers]
  );

  const bannedUsers = useMemo(
    () => sortedUsers.filter((user) => String(user?.activation_status || "").toLowerCase() === "banned"),
    [sortedUsers]
  );

  const staffUsers = useMemo(
    () => sortedUsers.filter((user) => ["ADMIN", "SUPPORT", "CONTEST_SCHEDULER"].includes(user?.role)),
    [sortedUsers]
  );

  const getUserRoleBadgeClassName = (role) => {
    if (role === "ADMIN") return "bg-[#9D29FF]/10 text-[#9D29FF]";
    if (role === "SUPPORT") return "bg-[#F5CC37]/20 text-[#7A5A00]";
    if (role === "CONTEST_SCHEDULER") return "bg-[#135BEB]/10 text-[#135BEB]";
    return "bg-[#47FF4E]/20 text-[#0a1732]";
  };

  const getUserStatusBadgeClassName = (status) => {
    return String(status || "active").toLowerCase() === "banned"
      ? "bg-[#FF7A7A]/20 text-[#B42318]"
      : "bg-[#47FF4E]/20 text-[#0a1732]";
  };

  const renderUserSection = (title, sectionUsers, emptyMessage) => (
    <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1732]">{title}</h3>
          <p className="text-sm text-[#0a1732]/55">{sectionUsers.length} records</p>
        </div>
      </div>

      {sectionUsers.length === 0 ? (
        <p className="text-[#0a1732]/50">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectionUsers.map((user) => {
            const isBanned = String(user?.activation_status || "").toLowerCase() === "banned";
            return (
              <div
                key={user._id}
                className="rounded-xl border border-[#0a173218] bg-[#0a173205] p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getUserRoleBadgeClassName(user?.role)}`}>
                      {user?.role || "USER"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getUserStatusBadgeClassName(user?.activation_status)}`}>
                      {user?.activation_status || "active"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-[#0a1732]">{user?.name || "Unnamed user"}</h4>
                    <p className="text-sm text-[#0a1732]/60">@{user?.user_name || "no-username"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">User ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{user?._id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Email</p>
                      <p className="text-[#0a1732] break-all">{user?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Mobile</p>
                      <p className="text-[#0a1732]">{user?.mobile_no || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Created</p>
                      <p className="text-[#0a1732]">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#0a173218] gap-3">
                    <p className="text-xs text-[#0a1732]/55">
                      {user?.updatedAt ? `Updated ${new Date(user.updatedAt).toLocaleString()}` : "No update timestamp"}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(user._id);
                          setShowUserForm(true);
                          setUserForm({
                            name: user.name || "",
                            user_name: user.user_name || "",
                            email: user.email || "",
                            password: "",
                            mobile_no: user.mobile_no || "",
                            role: user.role || "USER",
                            activation_status: user.activation_status || "active",
                          });
                        }}
                        className="text-[#344FF0] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBanUser(user._id, isBanned)}
                        className="text-[#0a1732] hover:underline font-medium"
                      >
                        {isBanned ? "Unban" : "Ban"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [submissions]);

  const contestSubmissions = useMemo(
    () => sortedSubmissions.filter((submission) => Boolean(submission?.contest_id)),
    [sortedSubmissions]
  );

  const practiceSubmissions = useMemo(
    () => sortedSubmissions.filter((submission) => !submission?.contest_id),
    [sortedSubmissions]
  );

  const sortedContests = useMemo(() => {
    return [...contests].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [contests]);

  const sortedProblems = useMemo(() => {
    return [...problems].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [problems]);

  const sortedSupportTickets = useMemo(() => {
    return [...supportTickets].sort((a, b) => {
      const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [supportTickets]);

  const sortedSpecialAccessRequests = useMemo(() => {
    return [...specialAccessRequests].sort((a, b) => {
      const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [specialAccessRequests]);

  const liveContests = useMemo(() => {
    const now = Date.now();
    return sortedContests.filter((contest) => {
      const start = contest?.start_time ? new Date(contest.start_time).getTime() : 0;
      const end = contest?.end_time ? new Date(contest.end_time).getTime() : 0;
      return start && end && start <= now && end >= now;
    });
  }, [sortedContests]);

  const publicProblems = useMemo(
    () => sortedProblems.filter((problem) => problem?.is_public !== false),
    [sortedProblems]
  );

  const eligibleSupportTickets = useMemo(
    () => sortedSupportTickets.filter((ticket) => Boolean(ticket?.eligible_for_special_access)),
    [sortedSupportTickets]
  );

  const approvedSpecialAccessRequests = useMemo(
    () => sortedSpecialAccessRequests.filter((request) => String(request?.status || "").toUpperCase() === "APPROVED"),
    [sortedSpecialAccessRequests]
  );

  const getSubmissionModeLabel = (submission) => {
    if (submission?.contest_id) {
      return submission?.is_for_public_test_cases ? "Contest Run" : "Contest Final";
    }
    return submission?.is_for_public_test_cases ? "Practice Run" : "Practice Submit";
  };

  const getSubmissionVerdict = (submission) => {
    const testCases = Array.isArray(submission?.test_cases) ? submission.test_cases : [];
    if (!submission?.is_cpu_executed && testCases.length === 0) return "Pending";
    if (testCases.length === 0) return submission?.is_cpu_executed ? "No Testcases" : "Pending";

    const normalizedStatuses = testCases
      .map((testCase) => testCase?.status?.description || "")
      .filter(Boolean);

    if (normalizedStatuses.length === 0) {
      return submission?.is_cpu_executed ? "Processed" : "Pending";
    }

    const firstNonAccepted = normalizedStatuses.find((status) => status.toLowerCase() !== "accepted");
    return firstNonAccepted || "Accepted";
  };

  const getVerdictBadgeClassName = (submission) => {
    const verdict = getSubmissionVerdict(submission).toLowerCase();
    if (verdict === "accepted") return "bg-[#47FF4E]/20 text-[#0a1732]";
    if (verdict.includes("wrong")) return "bg-[#FF7A7A]/20 text-[#B42318]";
    if (verdict.includes("pending")) return "bg-[#F5CC37]/20 text-[#7A5A00]";
    return "bg-[#344FF0]/10 text-[#344FF0]";
  };

  const getSubmissionCaseSummary = (submission) => {
    const testCases = Array.isArray(submission?.test_cases) ? submission.test_cases : [];
    const acceptedCases = testCases.filter((testCase) => testCase?.status?.id === 3).length;
    return {
      total: testCases.length,
      accepted: acceptedCases,
    };
  };

  const renderSubmissionSection = (title, sectionSubmissions, emptyMessage) => (
    <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1732]">{title}</h3>
          <p className="text-sm text-[#0a1732]/55">{sectionSubmissions.length} records</p>
        </div>
      </div>

      {sectionSubmissions.length === 0 ? (
        <p className="text-[#0a1732]/50">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectionSubmissions.map((submission) => {
            const verdict = getSubmissionVerdict(submission);
            const caseSummary = getSubmissionCaseSummary(submission);
            return (
              <div
                key={submission._id}
                className="rounded-xl border border-[#0a173218] bg-[#0a173205] p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getVerdictBadgeClassName(submission)}`}>
                      {verdict}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#9D29FF]/10 text-[#9D29FF]">
                      {getSubmissionModeLabel(submission)}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#135BEB]/10 text-[#135BEB]">
                      Lang {submission?.language_id ?? "—"}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#0a1732]/8 text-[#0a1732]">
                      CPU {submission?.is_cpu_executed ? "Done" : "Queued"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Submission ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{submission?._id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Created</p>
                      <p className="text-[#0a1732]">{submission?.createdAt ? new Date(submission.createdAt).toLocaleString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Problem ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{submission?.problem_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">User ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{submission?.created_by || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Contest ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{submission?.contest_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Test Cases</p>
                      <p className="text-[#0a1732]">
                        {caseSummary.accepted}/{caseSummary.total} accepted
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#0a173218]">
                    <p className="text-xs text-[#0a1732]/55">
                      {submission?.updatedAt ? `Updated ${new Date(submission.updatedAt).toLocaleString()}` : "No update timestamp"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubmission(submission._id)}
                      className="text-red-600 hover:underline text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderOverviewCards = (cards) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-[#0a173218] bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">{card.label}</p>
          <p className="text-2xl font-semibold text-[#0a1732]">{card.value}</p>
          {card.note && <p className="mt-1 text-xs text-[#0a1732]/55">{card.note}</p>}
        </div>
      ))}
    </div>
  );

  const getContestStatusMeta = (contest) => {
    const now = Date.now();
    const start = contest?.start_time ? new Date(contest.start_time).getTime() : 0;
    const end = contest?.end_time ? new Date(contest.end_time).getTime() : 0;

    if (start && now < start) {
      return { label: "Upcoming", className: "bg-[#135BEB]/10 text-[#135BEB]" };
    }
    if (end && now > end) {
      return { label: "Ended", className: "bg-[#0a1732]/8 text-[#0a1732]" };
    }
    return { label: "Live", className: "bg-[#47FF4E]/20 text-[#0a1732]" };
  };

  const getProblemDifficultyBadgeClassName = (difficulty) => {
    const normalized = String(difficulty || "").toUpperCase();
    if (normalized === "EASY") return "bg-[#47FF4E]/20 text-[#0a1732]";
    if (normalized === "MEDIUM") return "bg-[#F5CC37]/20 text-[#7A5A00]";
    if (normalized === "HARD") return "bg-[#FF7A7A]/20 text-[#B42318]";
    return "bg-[#0a1732]/8 text-[#0a1732]";
  };

  const getSupportTicketStatusBadgeClassName = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "OPEN":
        return "bg-[#135BEB]/10 text-[#135BEB]";
      case "IN_REVIEW":
      case "IN_PROGRESS":
        return "bg-[#F5CC37]/20 text-[#7A5A00]";
      case "VERIFIED":
        return "bg-[#47FF4E]/20 text-[#0a1732]";
      case "RESOLVED":
      case "CLOSED":
        return "bg-[#0a1732]/8 text-[#0a1732]";
      default:
        return "bg-[#0a1732]/8 text-[#0a1732]";
    }
  };

  const getUrgencyBadgeClassName = (urgency) => {
    switch (String(urgency || "").toUpperCase()) {
      case "HIGH":
        return "bg-[#FF7A7A]/20 text-[#B42318]";
      case "MEDIUM":
        return "bg-[#F5CC37]/20 text-[#7A5A00]";
      case "LOW":
        return "bg-[#135BEB]/10 text-[#135BEB]";
      default:
        return "bg-[#0a1732]/8 text-[#0a1732]";
    }
  };

  const getSpecialAccessStatusBadgeClassName = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "APPROVED":
        return "bg-[#47FF4E]/20 text-[#0a1732]";
      case "PENDING":
        return "bg-[#F5CC37]/20 text-[#7A5A00]";
      case "REJECTED":
      case "REVOKED":
      case "EXPIRED":
        return "bg-[#FF7A7A]/20 text-[#B42318]";
      default:
        return "bg-[#0a1732]/8 text-[#0a1732]";
    }
  };

  const getSpecialAccessTypeBadgeClassName = (accessType) => {
    switch (String(accessType || "").toUpperCase()) {
      case "CONTEST_REOPEN":
        return "bg-[#9D29FF]/10 text-[#9D29FF]";
      case "SUBMISSION_ONLY":
        return "bg-[#135BEB]/10 text-[#135BEB]";
      case "TIME_EXTENSION":
        return "bg-[#F5CC37]/20 text-[#7A5A00]";
      case "PROBLEM_ACCESS":
        return "bg-[#344FF0]/10 text-[#344FF0]";
      default:
        return "bg-[#0a1732]/8 text-[#0a1732]";
    }
  };

  const renderContestSection = (title, sectionContests, emptyMessage) => (
    <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1732]">{title}</h3>
          <p className="text-sm text-[#0a1732]/55">{sectionContests.length} records</p>
        </div>
      </div>

      {sectionContests.length === 0 ? (
        <p className="text-[#0a1732]/50">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectionContests.map((contest) => {
            const statusMeta = getContestStatusMeta(contest);
            const linkedProblems = Array.isArray(contest?.problems) ? contest.problems.length : 0;

            return (
              <div key={contest._id} className="rounded-xl border border-[#0a173218] bg-[#0a173205] p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#9D29FF]/10 text-[#9D29FF]">
                      {linkedProblems} problems
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-[#0a1732]">{contest?.name || "Untitled contest"}</h4>
                    <p className="text-sm text-[#0a1732]/60">/{contest?.slug || "no-slug"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Contest ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{contest?._id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Created By</p>
                      <p className="font-mono text-[#0a1732] break-all">{contest?.created_by || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Start</p>
                      <p className="text-[#0a1732]">{contest?.start_time ? new Date(contest.start_time).toLocaleString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">End</p>
                      <p className="text-[#0a1732]">{contest?.end_time ? new Date(contest.end_time).toLocaleString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Duration</p>
                      <p className="text-[#0a1732]">{contest?.duration ? `${Math.round(Number(contest.duration) / 60000)} min` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Support Team</p>
                      <p className="text-[#0a1732] break-words">
                        {Array.isArray(contest?.support_team) ? contest.support_team.join(", ") || "—" : contest?.support_team || "—"}
                      </p>
                    </div>
                  </div>

                  {contest?.description && (
                    <div className="rounded-lg bg-white/70 p-3 text-sm text-[#0a1732]/80">
                      {contest.description}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#0a173218] gap-3">
                    <p className="text-xs text-[#0a1732]/55">
                      {contest?.updatedAt ? `Updated ${new Date(contest.updatedAt).toLocaleString()}` : "No update timestamp"}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingEditContestId(contest._id);
                          axios.get(`${API_BASE}/admin/contests/${contest._id}`, { headers: headers() }).catch(() => {
                            setPendingEditContestId(null);
                            toast.error("Failed to fetch contest details.");
                          });
                        }}
                        className="text-[#344FF0] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContest(contest._id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderProblemSection = (title, sectionProblems, emptyMessage) => (
    <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1732]">{title}</h3>
          <p className="text-sm text-[#0a1732]/55">{sectionProblems.length} records</p>
        </div>
      </div>

      {sectionProblems.length === 0 ? (
        <p className="text-[#0a1732]/50">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectionProblems.map((problem) => {
            const tags = Array.isArray(problem?.tags) ? problem.tags : [];
            const testcaseCount = Array.isArray(problem?.test_cases) ? problem.test_cases.length : 0;
            return (
              <div key={problem._id} className="rounded-xl border border-[#0a173218] bg-[#0a173205] p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getProblemDifficultyBadgeClassName(problem?.difficulty)}`}>
                      {problem?.difficulty || "UNKNOWN"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${problem?.is_public !== false ? "bg-[#47FF4E]/20 text-[#0a1732]" : "bg-[#0a1732]/8 text-[#0a1732]"}`}>
                      {problem?.is_public !== false ? "Public" : "Private"}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#135BEB]/10 text-[#135BEB]">
                      {testcaseCount} testcases
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-[#0a1732]">{problem?.name || "Untitled problem"}</h4>
                    <p className="text-sm text-[#0a1732]/60">/{problem?.slug || "no-slug"}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Problem ID</p>
                      <p className="font-mono text-[#0a1732] break-all">{problem?._id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Created By</p>
                      <p className="font-mono text-[#0a1732] break-all">{problem?.created_by || "—"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Tags</p>
                      <p className="text-[#0a1732] break-words">{tags.length ? tags.join(", ") : "—"}</p>
                    </div>
                  </div>

                  {problem?.description && (
                    <div className="rounded-lg bg-white/70 p-3 text-sm text-[#0a1732]/80 line-clamp-4">
                      {problem.description}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#0a173218] gap-3">
                    <p className="text-xs text-[#0a1732]/55">
                      {problem?.updatedAt ? `Updated ${new Date(problem.updatedAt).toLocaleString()}` : "No update timestamp"}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleViewProblem(problem._id)}
                        className="text-[#0a1732] hover:underline font-medium"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProblemId(problem._id);
                          setShowProblemForm(true);
                          setProblemForm({
                            ...defaultProblemForm,
                            name: problem.name,
                            slug: problem.slug,
                            description: problem.description || "",
                            difficulty: problem.difficulty || "EASY",
                            is_public: problem.is_public !== false,
                            tags: Array.isArray(problem.tags) ? problem.tags.join(", ") : "",
                            test_cases_json: Array.isArray(problem.test_cases) ? JSON.stringify(problem.test_cases, null, 2) : "",
                          });
                        }}
                        className="text-[#344FF0] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProblem(problem._id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSupportTicketSection = (title, sectionTickets, emptyMessage) => (
    <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1732]">{title}</h3>
          <p className="text-sm text-[#0a1732]/55">{sectionTickets.length} records</p>
        </div>
      </div>

      {sectionTickets.length === 0 ? (
        <p className="text-[#0a1732]/50">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectionTickets.map((ticket) => (
            <div key={ticket._id} className="rounded-xl border border-[#0a173218] bg-[#0a173205] p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getSupportTicketStatusBadgeClassName(ticket?.status)}`}>
                    {ticket?.status || "OPEN"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getUrgencyBadgeClassName(ticket?.urgency)}`}>
                    {ticket?.urgency || "MEDIUM"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ticket?.eligible_for_special_access ? "bg-[#47FF4E]/20 text-[#0a1732]" : "bg-[#0a1732]/8 text-[#0a1732]"}`}>
                    {ticket?.eligible_for_special_access ? "Access Eligible" : "No Access"}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#0a1732]">{ticket?.title || ticket?.issue_title || "Untitled ticket"}</h4>
                  <p className="text-sm text-[#0a1732]/60">{ticket?.ticket_reference || "No reference"} • {ticket?.issue_type || "GENERAL"}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Ticket ID</p>
                    <p className="font-mono text-[#0a1732] break-all">{ticket?._id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">User ID</p>
                    <p className="font-mono text-[#0a1732] break-all">{ticket?.user_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Contest ID</p>
                    <p className="font-mono text-[#0a1732] break-all">{ticket?.contest_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Assigned / Verified</p>
                    <p className="text-[#0a1732] break-words">{ticket?.assigned_to || "—"} / {ticket?.verified_by || "—"}</p>
                  </div>
                </div>

                {(ticket?.description || ticket?.resolution_notes) && (
                  <div className="grid grid-cols-1 gap-3">
                    {ticket?.description && (
                      <div className="rounded-lg bg-white/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Description</p>
                        <p className="mt-1 text-sm text-[#0a1732]/80">{ticket.description}</p>
                      </div>
                    )}
                    {ticket?.resolution_notes && (
                      <div className="rounded-lg border border-[#47FF4E]/25 bg-[#47FF4E]/10 p-3">
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Resolution Notes</p>
                        <p className="mt-1 text-sm text-[#0a1732]">{ticket.resolution_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#0a173218] gap-3">
                  <p className="text-xs text-[#0a1732]/55">
                    {ticket?.updatedAt ? `Updated ${new Date(ticket.updatedAt).toLocaleString()}` : "No update timestamp"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupportUpdateForm(true);
                      setSupportUpdateForm({
                        _id: ticket._id,
                        status: ticket.status || "OPEN",
                        assigned_to: ticket.assigned_to || "",
                        verified_by: ticket.verified_by || "",
                        eligible_for_special_access: Boolean(ticket.eligible_for_special_access),
                        resolution_notes: ticket.resolution_notes || "",
                      });
                    }}
                    className="text-[#344FF0] hover:underline text-sm font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSpecialAccessSection = (title, sectionRequests, emptyMessage) => (
    <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1732]">{title}</h3>
          <p className="text-sm text-[#0a1732]/55">{sectionRequests.length} records</p>
        </div>
      </div>

      {sectionRequests.length === 0 ? (
        <p className="text-[#0a1732]/50">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sectionRequests.map((request) => (
            <div key={request._id} className="rounded-xl border border-[#0a173218] bg-[#0a173205] p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getSpecialAccessStatusBadgeClassName(request?.status)}`}>
                    {request?.status || "PENDING"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getSpecialAccessTypeBadgeClassName(request?.access_type || request?.requested_access_type)}`}>
                    {request?.access_type || request?.requested_access_type || "ACCESS"}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-[#0a1732]">{request?.request_reference || "No reference"}</h4>
                  <p className="text-sm text-[#0a1732]/60">{request?.contest_or_platform || request?.contest_id || "No scope provided"}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Request ID</p>
                    <p className="font-mono text-[#0a1732] break-all">{request?._id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">User ID</p>
                    <p className="font-mono text-[#0a1732] break-all">{request?.user_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Ticket ID</p>
                    <p className="font-mono text-[#0a1732] break-all">{request?.ticket_id || request?.related_ticket_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Contest / Problem Scope</p>
                    <p className="font-mono text-[#0a1732] break-all">{request?.access_scope || request?.contest_id || request?.problem_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Window Start</p>
                    <p className="text-[#0a1732]">{request?.starts_at ? new Date(request.starts_at).toLocaleString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Window End</p>
                    <p className="text-[#0a1732]">{request?.expires_at ? new Date(request.expires_at).toLocaleString() : "—"}</p>
                  </div>
                </div>

                {(request?.reason || request?.decision_note) && (
                  <div className="grid grid-cols-1 gap-3">
                    {request?.reason && (
                      <div className="rounded-lg bg-white/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Reason</p>
                        <p className="mt-1 text-sm text-[#0a1732]/80">{request.reason}</p>
                      </div>
                    )}
                    {request?.decision_note && (
                      <div className="rounded-lg border border-[#135BEB]/20 bg-[#135BEB]/8 p-3">
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Decision Note</p>
                        <p className="mt-1 text-sm text-[#0a1732]">{request.decision_note}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#0a173218] gap-3">
                  <p className="text-xs text-[#0a1732]/55">
                    {request?.updatedAt ? `Updated ${new Date(request.updatedAt).toLocaleString()}` : "No update timestamp"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpecialAccessUpdateForm(true);
                      setSpecialAccessUpdateForm({
                        _id: request._id,
                        status: request.status || "PENDING",
                        access_type: request.access_type || request.requested_access_type || "",
                        starts_at: request.starts_at
                          ? new Date(request.starts_at).toISOString().slice(0, 16)
                          : "",
                        expires_at: request.expires_at
                          ? new Date(request.expires_at).toISOString().slice(0, 16)
                          : "",
                        reason: request.reason || request.justification || "",
                        decision_note: request.decision_note || "",
                        access_scope: request.access_scope || "",
                        requested_duration: request.requested_duration || "",
                        approver_team: request.approver_team || "",
                        audit_note: request.audit_note || "",
                        access_expires_at: request.access_expires_at
                          ? new Date(request.access_expires_at).toISOString().slice(0, 16)
                          : "",
                      });
                    }}
                    className="text-[#344FF0] hover:underline text-sm font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <section className="premium-page premium-section">
      <div className="premium-container min-h-[80vh] flex flex-col gap-8 lg:flex-row">
        <aside className="premium-panel-soft h-fit w-full flex-shrink-0 p-4 lg:sticky lg:top-28 lg:w-56">
          <h3 className="text-lg font-semibold text-[#0a1732] mb-4 pb-2 border-b border-[#0a173233]">Control Panel</h3>
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-left font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id ? "bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white shadow" : "text-[#0a1732]/80 hover:bg-[#0a173208] border border-[#0a173218]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          {activeTab === "dashboard" && (
            <>
              <Heading text="Admin Dashboard" />
              {loadingDashboard && !dashboardStats.lastUpdatedAt && (
                <p className="text-center text-[#0a1732]/60 py-8">Loading stats…</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
                {statCards.map((card) => (
                  <div key={card.label} className={`rounded-xl border border-[#0a173218] p-6 ${card.color} shadow hover:scale-[1.02] transition-transform`}>
                    <p className="text-3xl lg:text-4xl font-bold">{card.value}</p>
                    <p className="text-sm lg:text-base font-medium text-[#0a1732]/80 mt-1">{card.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#0a173218] bg-white/70 p-4">
                  <p className="text-sm text-[#0a1732]/55">Open Tickets</p>
                  <p className="text-2xl font-semibold text-[#0a1732]">{dashboardStats.supportOpen}</p>
                </div>
                <div className="rounded-xl border border-[#0a173218] bg-white/70 p-4">
                  <p className="text-sm text-[#0a1732]/55">In Review</p>
                  <p className="text-2xl font-semibold text-[#0a1732]">{dashboardStats.supportInReview}</p>
                </div>
                <div className="rounded-xl border border-[#0a173218] bg-white/70 p-4">
                  <p className="text-sm text-[#0a1732]/55">Resolved</p>
                  <p className="text-2xl font-semibold text-[#0a1732]">{dashboardStats.supportResolved}</p>
                </div>
                <div className="rounded-xl border border-[#0a173218] bg-white/70 p-4">
                  <p className="text-sm text-[#0a1732]/55">Access Eligible</p>
                  <p className="text-2xl font-semibold text-[#0a1732]">{dashboardStats.supportEligible}</p>
                </div>
              </div>
              {dashboardStats.lastUpdatedAt && (
                <p className="mt-6 text-sm text-[#0a1732]/50">Last updated: {new Date(dashboardStats.lastUpdatedAt).toLocaleString()}</p>
              )}
            </>
          )}

          {activeTab === "leaderboard" && (
            <>
              <Heading text="Leaderboard" />
              <div className="rounded-xl border border-[#0a173233] p-8 bg-[#0a173205]">
                <p className="text-[#0a1732]/80 mb-4">View leaderboard for a contest from the contest page or use the link below.</p>
                <Link to="/contests" className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white font-semibold shadow hover:scale-[1.02] transition-transform">
                  Go to Contests →
                </Link>
              </div>
            </>
          )}

          {activeTab === "contests" && (
            <>
              <Heading text="Contests" />
              <div className="rounded-xl border border-[#0a173233] p-6 bg-[#0a173205]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <p className="text-[#0a1732]/80">Create, edit, delete contests (full CRUD). If you see &quot;Operation Not Exists&quot;, run the permissions seed script (see README).</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowContestForm(!showContestForm);
                      setEditingContestId(null);
                      setContestForm(defaultContestForm);
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white font-medium shadow"
                  >
                    {showContestForm ? "Cancel" : "Create contest"}
                  </button>
                </div>
                {!loadingContests && sortedContests.length > 0 && (
                  <div className="mb-6 space-y-5">
                    {renderOverviewCards([
                      { label: "Total", value: sortedContests.length },
                      { label: "Live", value: liveContests.length },
                      { label: "Upcoming", value: sortedContests.filter((contest) => getContestStatusMeta(contest).label === "Upcoming").length },
                      { label: "Ended", value: sortedContests.filter((contest) => getContestStatusMeta(contest).label === "Ended").length },
                    ])}
                  </div>
                )}
                {showContestForm && (
                  <form onSubmit={editingContestId ? handleUpdateContest : handleCreateContest} className="mb-6 p-4 border border-[#0a173218] rounded-2xl bg-white/70 space-y-3">
                    <input placeholder="Name" value={contestForm.name} onChange={(e) => setContestForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                    <input placeholder="Slug" value={contestForm.slug} onChange={(e) => setContestForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                    <textarea placeholder="Description" value={contestForm.description} onChange={(e) => setContestForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" rows={2} />
                    <input type="datetime-local" placeholder="Start time" value={contestForm.start_time} onChange={(e) => setContestForm((f) => ({ ...f, start_time: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" />
                    <input type="datetime-local" placeholder="End time" value={contestForm.end_time} onChange={(e) => setContestForm((f) => ({ ...f, end_time: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" />
                    <input type="number" placeholder="Duration (ms)" value={contestForm.duration} onChange={(e) => setContestForm((f) => ({ ...f, duration: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" />
                    <input placeholder="Support team (comma-separated)" value={contestForm.support_team} onChange={(e) => setContestForm((f) => ({ ...f, support_team: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" />
                    <input placeholder="Problem IDs (comma-separated)" value={contestForm.problems} onChange={(e) => setContestForm((f) => ({ ...f, problems: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" />
                    <button type="submit" className="px-4 py-2 rounded bg-[#0a1732] text-white font-medium">{editingContestId ? "Update" : "Create"}</button>
                  </form>
                )}
                {loadingContests && <p className="text-[#0a1732]/60">Loading contests…</p>}
                {!loadingContests && sortedContests.length > 0 && (
                  <div className="space-y-5">
                    {renderContestSection("All Contests", sortedContests, "No contests found.")}
                  </div>
                )}
                {!loadingContests && sortedContests.length === 0 && !showContestForm && <p className="text-[#0a1732]/50">No contests yet. Add one above or configure permissions for listing.</p>}
              </div>
            </>
          )}

          {activeTab === "problems" && (
            <>
              <Heading text="Problems" />
              <div className="rounded-xl border border-[#0a173233] p-6 bg-[#0a173205]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <p className="text-[#0a1732]/80">Create and manage problems (full CRUD). Run the seed script to add permissions if you see &quot;Operation Not Exists&quot;.</p>
                  <button
                    type="button"
                    onClick={() => { setShowProblemForm(!showProblemForm); setEditingProblemId(null); setProblemForm(defaultProblemForm); }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white font-medium shadow"
                  >
                    {showProblemForm ? "Cancel" : "Create problem"}
                  </button>
                </div>
                {!loadingProblems && sortedProblems.length > 0 && (
                  <div className="mb-6 space-y-5">
                    {renderOverviewCards([
                      { label: "Total", value: sortedProblems.length },
                      { label: "Public", value: publicProblems.length },
                      { label: "Private", value: sortedProblems.length - publicProblems.length },
                      { label: "Hard", value: sortedProblems.filter((problem) => String(problem?.difficulty || "").toUpperCase() === "HARD").length },
                    ])}
                  </div>
                )}
                {showProblemForm && (
                  <form onSubmit={editingProblemId ? handleUpdateProblem : handleCreateProblem} className="mb-6 p-4 border border-[#0a173218] rounded-2xl bg-white/70 space-y-3">
                    <input placeholder="Name" value={problemForm.name} onChange={(e) => setProblemForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                    <input placeholder="Slug" value={problemForm.slug} onChange={(e) => setProblemForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                    <textarea placeholder="Description" value={problemForm.description} onChange={(e) => setProblemForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" rows={2} />
                    <select value={problemForm.difficulty} onChange={(e) => setProblemForm((f) => ({ ...f, difficulty: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]">
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                    <label className="flex items-center gap-2 text-[#0a1732]">
                      <input type="checkbox" checked={problemForm.is_public} onChange={(e) => setProblemForm((f) => ({ ...f, is_public: e.target.checked }))} />
                      Public
                    </label>
                    <input placeholder="Tags (comma-separated)" value={problemForm.tags} onChange={(e) => setProblemForm((f) => ({ ...f, tags: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" />
                    <textarea placeholder="Test cases (optional JSON array)" value={problemForm.test_cases_json} onChange={(e) => setProblemForm((f) => ({ ...f, test_cases_json: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732] font-mono text-xs" rows={3} />
                    <button type="submit" className="px-4 py-2 rounded bg-[#0a1732] text-white font-medium">{editingProblemId ? "Update" : "Create"}</button>
                  </form>
                )}
                {loadingProblems && <p className="text-[#0a1732]/60">Loading problems…</p>}
                {!loadingProblems && sortedProblems.length > 0 && (
                  <div className="space-y-5">
                    {renderProblemSection("All Problems", sortedProblems, "No problems found.")}
                  </div>
                )}
                {viewProblem !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewProblem(null)}>
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-[#0a1732]">Problem details</h3>
                        <button type="button" onClick={() => setViewProblem(null)} className="text-[#0a1732]/70 hover:text-[#0a1732]">✕</button>
                      </div>
                      {loadingViewProblem && <p className="text-[#0a1732]/60">Loading…</p>}
                      {!loadingViewProblem && viewProblem && (
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-[#0a1732]">Problem ID:</span> <span className="font-mono text-xs">{viewProblem._id}</span></p>
                          <p><span className="font-medium text-[#0a1732]">Name:</span> {viewProblem.name}</p>
                          <p><span className="font-medium text-[#0a1732]">Slug:</span> {viewProblem.slug}</p>
                          <p><span className="font-medium text-[#0a1732]">Tags:</span> {Array.isArray(viewProblem.tags) ? viewProblem.tags.join(", ") : "—"}</p>
                          <p><span className="font-medium text-[#0a1732]">Difficulty:</span> {viewProblem.difficulty || "—"}</p>
                          <p><span className="font-medium text-[#0a1732]">Public:</span> {viewProblem.is_public ? "Yes" : "No"}</p>
                          <p><span className="font-medium text-[#0a1732]">Test cases:</span> {Array.isArray(viewProblem.test_cases) ? viewProblem.test_cases.length : 0}</p>
                          {viewProblem.description && <p><span className="font-medium text-[#0a1732]">Description:</span> <span className="block mt-1 p-2 bg-[#0a173205] rounded">{viewProblem.description}</span></p>}
                          {viewProblem.createdAt && <p><span className="font-medium text-[#0a1732]">Created at:</span> {new Date(viewProblem.createdAt).toLocaleString()}</p>}
                          {viewProblem.updatedAt && <p><span className="font-medium text-[#0a1732]">Updated at:</span> {new Date(viewProblem.updatedAt).toLocaleString()}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!loadingProblems && sortedProblems.length === 0 && !showProblemForm && <p className="text-[#0a1732]/50">No problems yet. Add one above or run the seed script for permissions.</p>}
              </div>
            </>
          )}

          {["users", "submissions", "support", "specialAccess", "permissions", "logs"].includes(activeTab) && (
            <>
              <Heading text={visibleTabs.find((t) => t.id === activeTab)?.label || activeTab} />
              {activeTab === "users" && (
                <div className="rounded-xl border border-[#0a173233] p-6 bg-[#0a173205]">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[#0a1732]/80">Manage users (CRUD + ban/unban via activation_status).</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserForm(!showUserForm);
                        setEditingUserId(null);
                        setUserForm({
                          name: "",
                          user_name: "",
                          email: "",
                          password: "",
                          mobile_no: "",
                          role: "USER",
                          activation_status: "active",
                        });
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white font-medium shadow"
                    >
                      {showUserForm ? "Cancel" : "Create user"}
                    </button>
                  </div>

                  {showUserForm && (
                    <form onSubmit={handleCreateOrUpdateUser} className="mb-6 p-4 border border-[#0a173218] rounded-lg space-y-3">
                      <input placeholder="Name" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                      <input placeholder="Username" value={userForm.user_name} onChange={(e) => setUserForm((f) => ({ ...f, user_name: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                      <input placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                      <input placeholder={editingUserId ? "Password (leave blank to keep)" : "Password"} value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" type="password" />
                      <input placeholder="Mobile" value={userForm.mobile_no} onChange={(e) => setUserForm((f) => ({ ...f, mobile_no: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]" required />
                      <select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="CONTEST_SCHEDULER">CONTEST_SCHEDULER</option>
                        <option value="SUPPORT">SUPPORT</option>
                      </select>
                      <select value={userForm.activation_status} onChange={(e) => setUserForm((f) => ({ ...f, activation_status: e.target.value }))} className="w-full px-3 py-2 border rounded text-[#0a1732]">
                        <option value="active">active</option>
                        <option value="banned">banned</option>
                      </select>
                      <button type="submit" className="px-4 py-2 rounded bg-[#0a1732] text-white font-medium">
                        {editingUserId ? "Update" : "Create"}
                      </button>
                    </form>
                  )}

                  {loadingUsers && <p className="text-[#0a1732]/60">Loading users…</p>}
                  {!loadingUsers && users.length > 0 && (
                    <div className="space-y-6">
                      <p className="text-sm text-[#0a1732]/65">
                        Users are grouped below so staff accounts, active members and banned accounts are easier to review quickly.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-4">
                          <p className="text-sm text-[#0a1732]/55">Total users</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{users.length}</p>
                        </div>
                        <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-4">
                          <p className="text-sm text-[#0a1732]/55">Staff accounts</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{staffUsers.length}</p>
                        </div>
                        <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-4">
                          <p className="text-sm text-[#0a1732]/55">Active users</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{activeUsers.length}</p>
                        </div>
                        <div className="rounded-2xl border border-[#0a173218] bg-white/70 p-4">
                          <p className="text-sm text-[#0a1732]/55">Banned users</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{bannedUsers.length}</p>
                        </div>
                      </div>

                      {renderUserSection("Staff & Moderation Accounts", staffUsers, "No staff or support accounts found.")}
                      {renderUserSection("Active Users", activeUsers, "No active users found.")}
                      {renderUserSection("Banned Users", bannedUsers, "No banned users found.")}
                    </div>
                  )}
                  {!loadingUsers && users.length === 0 && !showUserForm && <p className="text-[#0a1732]/50">No users found (or permissions missing).</p>}
                </div>
              )}

              {activeTab === "submissions" && (
                <div className="rounded-xl border border-[#0a173233] p-6 bg-[#0a173205]">
                  <p className="text-[#0a1732]/80 mb-4">
                    Practice and contest submissions are separated below so you can inspect them more cleanly. Each card shows mode, verdict, testcase summary, user, problem, contest linkage and timestamps.
                  </p>
                  {loadingSubmissions && <p className="text-[#0a1732]/60">Loading submissions…</p>}
                  {!loadingSubmissions && submissions.length > 0 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-[#0a173218] bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Total</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{submissions.length}</p>
                        </div>
                        <div className="rounded-xl border border-[#0a173218] bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Contest</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{contestSubmissions.length}</p>
                        </div>
                        <div className="rounded-xl border border-[#0a173218] bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Practice</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">{practiceSubmissions.length}</p>
                        </div>
                        <div className="rounded-xl border border-[#0a173218] bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Accepted</p>
                          <p className="text-2xl font-semibold text-[#0a1732]">
                            {submissions.filter((submission) => getSubmissionVerdict(submission) === "Accepted").length}
                          </p>
                        </div>
                      </div>

                      {renderSubmissionSection(
                        "Contest Submissions",
                        contestSubmissions,
                        "No contest submissions found."
                      )}

                      {renderSubmissionSection(
                        "Practice Submissions",
                        practiceSubmissions,
                        "No practice submissions found."
                      )}
                    </div>
                  )}
                  {!loadingSubmissions && submissions.length === 0 && <p className="text-[#0a1732]/50">No submissions found (or permissions missing).</p>}
                </div>
              )}

              {activeTab === "support" && (
                <div className="rounded-xl border border-[#0a173233] p-6 bg-[#0a173205]">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <p className="text-[#0a1732]/80">View and update support tickets.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSupportUpdateForm(!showSupportUpdateForm);
                        if (!showSupportUpdateForm) return;
                        setSupportUpdateForm(defaultSupportUpdateForm);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white font-medium shadow"
                    >
                      {showSupportUpdateForm ? "Cancel" : "Update ticket"}
                    </button>
                  </div>
                  {!loadingSupportTickets && sortedSupportTickets.length > 0 && (
                    <div className="mb-6 space-y-5">
                      {renderOverviewCards([
                        { label: "Total", value: sortedSupportTickets.length },
                        { label: "Verified", value: sortedSupportTickets.filter((ticket) => String(ticket?.status || "").toUpperCase() === "VERIFIED").length },
                        { label: "Resolved", value: sortedSupportTickets.filter((ticket) => String(ticket?.status || "").toUpperCase() === "RESOLVED").length },
                        { label: "Access Eligible", value: eligibleSupportTickets.length },
                      ])}
                    </div>
                  )}

                  {showSupportUpdateForm && (
                    <form onSubmit={handleUpdateSupportTicket} className="mb-6 p-4 border border-[#0a173218] rounded-2xl bg-white/70 space-y-3">
                      <input
                        placeholder="Ticket _id"
                        value={supportUpdateForm._id}
                        onChange={(e) => setSupportUpdateForm((prev) => ({ ...prev, _id: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                        required
                      />
                      <select
                        value={supportUpdateForm.status}
                        onChange={(e) => setSupportUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_REVIEW">IN_REVIEW</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                      <input
                        placeholder="Assigned to (user id / team)"
                        value={supportUpdateForm.assigned_to}
                        onChange={(e) => setSupportUpdateForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        placeholder="Verified by (user id, optional)"
                        value={supportUpdateForm.verified_by}
                        onChange={(e) => setSupportUpdateForm((prev) => ({ ...prev, verified_by: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <select
                        value={String(supportUpdateForm.eligible_for_special_access)}
                        onChange={(e) =>
                          setSupportUpdateForm((prev) => ({
                            ...prev,
                            eligible_for_special_access: e.target.value === "true",
                          }))
                        }
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      >
                        <option value="false">eligible_for_special_access: false</option>
                        <option value="true">eligible_for_special_access: true</option>
                      </select>
                      <textarea
                        placeholder="Resolution notes"
                        value={supportUpdateForm.resolution_notes}
                        onChange={(e) => setSupportUpdateForm((prev) => ({ ...prev, resolution_notes: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                        rows={3}
                      />
                      <button type="submit" className="px-4 py-2 rounded bg-[#0a1732] text-white font-medium">
                        Save update
                      </button>
                    </form>
                  )}

                  {loadingSupportTickets && <p className="text-[#0a1732]/60">Loading support tickets...</p>}
                  {!loadingSupportTickets && sortedSupportTickets.length > 0 && (
                    <div className="space-y-5">
                      {renderSupportTicketSection("All Support Tickets", sortedSupportTickets, "No support tickets found.")}
                    </div>
                  )}
                  {!loadingSupportTickets && sortedSupportTickets.length === 0 && (
                    <p className="text-[#0a1732]/50">No support tickets found.</p>
                  )}
                </div>
              )}

              {activeTab === "specialAccess" && (
                <div className="rounded-xl border border-[#0a173233] p-6 bg-[#0a173205]">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <p className="text-[#0a1732]/80">View and update special access requests.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSpecialAccessUpdateForm(!showSpecialAccessUpdateForm);
                        if (!showSpecialAccessUpdateForm) return;
                        setSpecialAccessUpdateForm(defaultSpecialAccessUpdateForm);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#9D29FF] to-[#344FF0] text-white font-medium shadow"
                    >
                      {showSpecialAccessUpdateForm ? "Cancel" : "Update request"}
                    </button>
                  </div>
                  {!loadingSpecialAccessRequests && sortedSpecialAccessRequests.length > 0 && (
                    <div className="mb-6 space-y-5">
                      {renderOverviewCards([
                        { label: "Total", value: sortedSpecialAccessRequests.length },
                        { label: "Approved", value: approvedSpecialAccessRequests.length },
                        { label: "Pending", value: sortedSpecialAccessRequests.filter((request) => String(request?.status || "").toUpperCase() === "PENDING").length },
                        { label: "Rejected / Revoked", value: sortedSpecialAccessRequests.filter((request) => ["REJECTED", "REVOKED", "EXPIRED"].includes(String(request?.status || "").toUpperCase())).length },
                      ])}
                    </div>
                  )}

                  {showSpecialAccessUpdateForm && (
                    <form onSubmit={handleUpdateSpecialAccess} className="mb-6 p-4 border border-[#0a173218] rounded-2xl bg-white/70 space-y-3">
                      <input
                        placeholder="Request _id"
                        value={specialAccessUpdateForm._id}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, _id: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                        required
                      />
                      <select
                        value={specialAccessUpdateForm.status}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      >
                        <option value="PENDING">PENDING</option>
                        {!isSupportUser && <option value="APPROVED">APPROVED</option>}
                        {!isSupportUser && <option value="REJECTED">REJECTED</option>}
                        {!isSupportUser && <option value="REVOKED">REVOKED</option>}
                        {!isSupportUser && <option value="EXPIRED">EXPIRED</option>}
                      </select>
                      <select
                        value={specialAccessUpdateForm.access_type}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, access_type: e.target.value }))}
                        disabled={isSupportUser}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      >
                        <option value="">Access type (optional update)</option>
                        <option value="CONTEST_REOPEN">CONTEST_REOPEN</option>
                        <option value="SUBMISSION_ONLY">SUBMISSION_ONLY</option>
                        <option value="TIME_EXTENSION">TIME_EXTENSION</option>
                        <option value="PROBLEM_ACCESS">PROBLEM_ACCESS</option>
                      </select>
                      <textarea
                        placeholder="Reason"
                        value={specialAccessUpdateForm.reason}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, reason: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                        rows={2}
                      />
                      <textarea
                        placeholder="Decision note"
                        value={specialAccessUpdateForm.decision_note}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, decision_note: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                        rows={2}
                      />
                      <input
                        placeholder="Access scope"
                        value={specialAccessUpdateForm.access_scope}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, access_scope: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        type="datetime-local"
                        value={specialAccessUpdateForm.starts_at}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        type="datetime-local"
                        value={specialAccessUpdateForm.expires_at}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        placeholder="Requested duration"
                        value={specialAccessUpdateForm.requested_duration}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, requested_duration: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        type="datetime-local"
                        value={specialAccessUpdateForm.access_expires_at}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, access_expires_at: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        placeholder="Approver team"
                        value={specialAccessUpdateForm.approver_team}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, approver_team: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <input
                        placeholder="Audit note"
                        value={specialAccessUpdateForm.audit_note}
                        onChange={(e) => setSpecialAccessUpdateForm((prev) => ({ ...prev, audit_note: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-[#0a1732]"
                      />
                      <button type="submit" className="px-4 py-2 rounded bg-[#0a1732] text-white font-medium">
                        Save update
                      </button>
                    </form>
                  )}

                  {loadingSpecialAccessRequests && <p className="text-[#0a1732]/60">Loading special access requests...</p>}
                  {!loadingSpecialAccessRequests && sortedSpecialAccessRequests.length > 0 && (
                    <div className="space-y-5">
                      {renderSpecialAccessSection("All Special Access Requests", sortedSpecialAccessRequests, "No special access requests found.")}
                    </div>
                  )}
                  {!loadingSpecialAccessRequests && sortedSpecialAccessRequests.length === 0 && (
                    <p className="text-[#0a1732]/50">No special access requests found.</p>
                  )}
                </div>
              )}

              {["permissions", "logs"].includes(activeTab) && (
                <div className="rounded-xl border border-[#0a173233] p-8 lg:p-12 bg-[#0a173205] text-center">
                  <p className="text-[#0a1732]/80 max-w-lg mx-auto">
                    This section uses event-driven APIs. Configure permissions for <code className="px-2 py-1 bg-[#0a173210] rounded text-sm">admin.*</code> operations in the Permissions collection to enable management here.
                  </p>
                  <p className="mt-4 text-sm text-[#0a1732]/50">Full CRUD UI for this section coming soon.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      </section>
    </Layout>
  );
};

export default ControlPanel;
