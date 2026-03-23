import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Layout from "../../components/layout/Layout";
import Heading from "../../components/heading/Heading";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
const LOADING_TIMEOUT_MS = 15000;

const defaultSupportForm = {
  issue_type: "GENERAL",
  contest_id: "",
  problem_id: "",
  title: "",
  description: "",
  issue_started_at: "",
  error_details: "",
  steps_tried: "",
  user_impact: "",
  operational_impact: "",
  urgency: "MEDIUM",
};

const defaultSpecialAccessForm = {
  ticket_id: "",
  contest_id: "",
  problem_id: "",
  access_type: "CONTEST_REOPEN",
  starts_at: "",
  expires_at: "",
  reason: "",
  requested_duration: "60m",
  user_impact: "",
  approver_team: "contest-ops",
  audit_note: "",
};

const accessStatusClassName = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "bg-[#47FF4E]/20 text-[#0a1732]";
  if (["REJECTED", "REVOKED"].includes(normalized)) return "bg-[#FF7A7A]/20 text-[#B42318]";
  if (normalized === "PENDING") return "bg-[#F5CC37]/20 text-[#7A5A00]";
  return "bg-[#135BEB]/10 text-[#135BEB]";
};

const ticketStatusClassName = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (["RESOLVED", "CLOSED", "VERIFIED"].includes(normalized)) return "bg-[#47FF4E]/20 text-[#0a1732]";
  if (normalized === "IN_REVIEW") return "bg-[#F5CC37]/20 text-[#7A5A00]";
  return "bg-[#135BEB]/10 text-[#135BEB]";
};

const SupportCenter = () => {
  const navigate = useNavigate();
  const { token, user, setToken, setUser } = useAuthContext();
  const { clientId } = useWebSocketContext();

  const [supportForm, setSupportForm] = useState(defaultSupportForm);
  const [specialAccessForm, setSpecialAccessForm] = useState(defaultSpecialAccessForm);
  const [myTickets, setMyTickets] = useState([]);
  const [mySpecialRequests, setMySpecialRequests] = useState([]);
  const [supportFaqs, setSupportFaqs] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [expandedFaqId, setExpandedFaqId] = useState("");

  const headers = useMemo(
    () => ({
      "client-id": clientId,
      authorization: token,
    }),
    [clientId, token]
  );

  const handleRequestError = (error, fallbackMessage) => {
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
      toast.error("Please login to access support center.");
      navigate("/login");
    }
  }, [token, user, navigate]);

  const fetchMyTickets = async () => {
    if (!clientId || !token) return;
    setLoadingTickets(true);
    try {
      await axios.get(`${API_BASE}/support-tickets/my`, { headers });
    } catch (error) {
      setLoadingTickets(false);
      handleRequestError(error, "Failed to fetch support tickets.");
    }
  };

  const fetchMySpecialRequests = async () => {
    if (!clientId || !token) return;
    try {
      await axios.get(`${API_BASE}/special-access/my`, { headers });
    } catch (error) {
      handleRequestError(error, "Failed to fetch linked access states.");
    }
  };

  const fetchSupportFaqs = async () => {
    if (!clientId || !token) return;
    setLoadingFaqs(true);
    try {
      await axios.get(`${API_BASE}/support-tickets/faqs`, { headers });
    } catch (error) {
      setLoadingFaqs(false);
      handleRequestError(error, "Failed to fetch support FAQs.");
    }
  };

  useEffect(() => {
    if (!clientId || !token) return;
    const timer = setTimeout(() => {
      setLoadingTickets(false);
      setLoadingFaqs(false);
    }, LOADING_TIMEOUT_MS);
    fetchMyTickets();
    fetchMySpecialRequests();
    fetchSupportFaqs();
    return () => clearTimeout(timer);
  }, [clientId, token]);

  const specialRequestsByTicketId = useMemo(() => {
    const map = new Map();
    for (const request of mySpecialRequests) {
      const key = String(request?.ticket_id || request?.related_ticket_id || "").trim();
      if (!key) continue;
      const existing = map.get(key);
      const existingTime = existing?.createdAt ? new Date(existing.createdAt).getTime() : 0;
      const currentTime = request?.createdAt ? new Date(request.createdAt).getTime() : 0;
      if (!existing || currentTime >= existingTime) {
        map.set(key, request);
      }
    }
    return map;
  }, [mySpecialRequests]);

  const selectedTicketAccessRequest = useMemo(() => {
    if (!selectedTicket?._id) return null;
    return specialRequestsByTicketId.get(String(selectedTicket._id)) || null;
  }, [selectedTicket, specialRequestsByTicketId]);

  useEffect(() => {
    if (!selectedTicket?._id || !selectedTicket?.eligible_for_special_access || selectedTicketAccessRequest) return;
    startSpecialAccessRequest(selectedTicket);
  }, [selectedTicket, selectedTicketAccessRequest]);

  useSocketListener(
    (msg) =>
      msg.type === "response" &&
      ["supportTickets.getMyTickets", "supportTickets.getResolvedFaqs", "supportTickets.create", "supportTickets.getTicket"].includes(msg.metadata?.operation),
    (msg) => {
      const operation = msg.metadata?.operation;
      if (!msg.metadata?.success) {
        if (!["supportTickets.getMyTickets", "supportTickets.getResolvedFaqs"].includes(operation)) {
          toast.error(msg.metadata?.message || "Support ticket request failed.");
        }
        setLoadingTickets(false);
        if (operation === "supportTickets.getResolvedFaqs") setLoadingFaqs(false);
        return;
      }

      if (operation === "supportTickets.getMyTickets") {
        const tickets = Array.isArray(msg.data?.result) ? msg.data.result : [];
        setMyTickets(tickets);
        setLoadingTickets(false);
        setSelectedTicket((current) => {
          if (current?._id) {
            return tickets.find((ticket) => ticket._id === current._id) || current;
          }
          return tickets[0] || null;
        });
        return;
      }

      if (operation === "supportTickets.getResolvedFaqs") {
        setSupportFaqs(Array.isArray(msg.data?.result) ? msg.data.result : []);
        setLoadingFaqs(false);
        return;
      }

      if (operation === "supportTickets.create") {
        const createdTicket = msg.data?.result || null;
        toast.success(msg.metadata?.message || "Support ticket created successfully.");
        setSupportForm(defaultSupportForm);
        if (createdTicket?._id) {
          setSelectedTicket(createdTicket);
        }
        fetchMyTickets();
        fetchSupportFaqs();
        return;
      }

      if (operation === "supportTickets.getTicket") {
        setSelectedTicket(msg.data?.result || null);
      }
    }
  );

  useSocketListener(
    (msg) =>
      msg.type === "response" &&
      ["specialAccess.getMyRequests", "specialAccess.create"].includes(msg.metadata?.operation),
    (msg) => {
      const operation = msg.metadata?.operation;
      if (!msg.metadata?.success) {
        if (operation !== "specialAccess.getMyRequests") {
          toast.error(msg.metadata?.message || "Special access request failed.");
        }
        return;
      }

      if (operation === "specialAccess.getMyRequests") {
        setMySpecialRequests(Array.isArray(msg.data?.result) ? msg.data.result : []);
        return;
      }

      if (operation === "specialAccess.create") {
        toast.success(msg.metadata?.message || "Contest access request submitted successfully.");
        setSpecialAccessForm(defaultSpecialAccessForm);
        fetchMySpecialRequests();
      }
    }
  );

  const submitSupportTicket = async (e) => {
    e.preventDefault();
    if (!(supportForm.title && supportForm.description)) {
      toast.error("title and description are required.");
      return;
    }

    if (supportForm.issue_type === "CONTEST_RELATED" && !supportForm.contest_id) {
      toast.error("contest_id is required for contest-related issues.");
      return;
    }

    if (supportForm.issue_type === "PROBLEM_RELATED" && !supportForm.problem_id) {
      toast.error("problem_id is required for problem-related issues.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/support-tickets/create`, supportForm, { headers });
      toast.info("Support ticket request accepted. Final response via websocket.");
    } catch (error) {
      handleRequestError(error, "Failed to submit support ticket.");
    }
  };
  const startSpecialAccessRequest = (ticket) => {
    const startsAt = new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16);
    const expiresAt = new Date(Date.now() + 61 * 60 * 1000).toISOString().slice(0, 16);
    setSpecialAccessForm({
      ticket_id: ticket?._id || "",
      contest_id: ticket?.contest_id || "",
      problem_id: ticket?.problem_id || "",
      access_type: "CONTEST_REOPEN",
      starts_at: startsAt,
      expires_at: expiresAt,
      reason: `Requesting recovery access for ticket ${ticket?.ticket_reference || ticket?._id || ""}.`,
      requested_duration: "60m",
      user_impact: ticket?.user_impact || "",
      approver_team: "contest-ops",
      audit_note: `Requested from support ticket ${ticket?.ticket_reference || ticket?._id || ""}`,
    });
  };

  const submitSpecialAccess = async (e) => {
    e.preventDefault();
    if (!(specialAccessForm.ticket_id && specialAccessForm.contest_id && specialAccessForm.access_type && specialAccessForm.reason)) {
      toast.error("ticket_id, contest_id, access_type and reason are required.");
      return;
    }
    if (!(specialAccessForm.expires_at || specialAccessForm.requested_duration)) {
      toast.error("Provide expires_at or requested_duration.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/special-access/create`, specialAccessForm, { headers });
      toast.info("Contest access request accepted. Final response via websocket.");
    } catch (error) {
      handleRequestError(error, "Failed to submit contest access request.");
    }
  };

  const fetchTicketDetails = async (id) => {
    try {
      await axios.get(`${API_BASE}/support-tickets/${id}`, { headers });
    } catch (error) {
      handleRequestError(error, "Failed to fetch support ticket details.");
    }
  };

  return (
    <Layout>
      <section className="premium-page premium-section">
      <div className="premium-container min-h-[80vh]">
        <Heading
          text="Support Center"
          kicker="Resolution Desk"
          description="Raise an issue, track verification, and follow linked contest recovery access from one place."
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.35fr] gap-6">
          <div className="space-y-6">
            <div className="premium-panel-soft p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#0a1732]">Raise a Support Ticket</h3>
                <p className="text-sm text-[#0a1732]/65 mt-1">
                  Yahin se issue raise karo. Agar support team verify karti hai ki problem platform-side thi, to contest access bhi isi ticket ke through handle ho jayega.
                </p>
              </div>

              <form className="space-y-3" onSubmit={submitSupportTicket}>
                <select
                  value={supportForm.issue_type}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, issue_type: e.target.value }))}
                  className="premium-select"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="CONTEST_RELATED">CONTEST_RELATED</option>
                  <option value="PROBLEM_RELATED">PROBLEM_RELATED</option>
                  <option value="SERVER_DOWN">SERVER_DOWN</option>
                  <option value="PLATFORM_BUG">PLATFORM_BUG</option>
                </select>
                <input
                  placeholder="Contest ID (required for contest issues)"
                  value={supportForm.contest_id}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, contest_id: e.target.value }))}
                  className="premium-input"
                />
                <input
                  placeholder="Problem ID (required for problem issues)"
                  value={supportForm.problem_id}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, problem_id: e.target.value }))}
                  className="premium-input"
                />
                <input
                  placeholder="Issue title *"
                  value={supportForm.title}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="premium-input"
                />
                <textarea
                  placeholder="Issue description *"
                  value={supportForm.description}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="premium-textarea"
                  rows={3}
                />
                <input
                  type="datetime-local"
                  value={supportForm.issue_started_at}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, issue_started_at: e.target.value }))}
                  className="premium-input"
                />
                <input
                  placeholder="Error details"
                  value={supportForm.error_details}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, error_details: e.target.value }))}
                  className="premium-input"
                />
                <input
                  placeholder="Steps tried"
                  value={supportForm.steps_tried}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, steps_tried: e.target.value }))}
                  className="premium-input"
                />
                <input
                  placeholder="User impact"
                  value={supportForm.user_impact}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, user_impact: e.target.value }))}
                  className="premium-input"
                />
                <input
                  placeholder="Operational impact"
                  value={supportForm.operational_impact}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, operational_impact: e.target.value }))}
                  className="premium-select"
                />
                <select
                  value={supportForm.urgency}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, urgency: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-[#0a1732]"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
                <button type="submit" className="premium-button-primary w-full sm:w-auto">
                  Submit Ticket
                </button>
              </form>
            </div>

            <div className="premium-panel-soft p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#0a1732]">My Tickets</h3>
                <p className="text-sm text-[#0a1732]/65 mt-1">
                  Har ticket ke saath support response, verification state, aur linked contest access status yahin dikh raha hai.
                </p>
              </div>
              {loadingTickets && <p className="text-[#0a1732]/60">Loading tickets...</p>}
              {!loadingTickets && myTickets.length === 0 && <p className="text-[#0a1732]/60">No support tickets found.</p>}
              {!loadingTickets && myTickets.length > 0 && (
                <div className="space-y-3">
                  {myTickets.map((ticket) => {
                    const linkedRequest = specialRequestsByTicketId.get(String(ticket._id));
                    return (
                      <button
                        key={ticket._id}
                        type="button"
                        onClick={() => fetchTicketDetails(ticket._id)}
                        className={`w-full text-left border rounded-xl p-4 transition ${
                          selectedTicket?._id === ticket._id
                            ? "border-[#344FF0] bg-white shadow-[0_18px_40px_rgba(19,91,235,0.08)]"
                            : "border-[#0a173218] bg-white/70 hover:bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-[#0a1732]">{ticket.title || ticket.issue_title}</span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ticketStatusClassName(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#0a1732]/60">
                          <span>{ticket.ticket_reference}</span>
                          {ticket.issue_type && <span>{ticket.issue_type}</span>}
                          {linkedRequest && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${accessStatusClassName(linkedRequest.status)}`}>
                              Access {linkedRequest.status}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="premium-panel-soft min-h-[320px] p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#0a1732]">Ticket Details</h3>
                <p className="text-sm text-[#0a1732]/65 mt-1">
                  Support team ka response, verification decision, aur special access approval yahin track hoga.
                </p>
              </div>

              {!selectedTicket && <p className="text-[#0a1732]/60">Select a ticket to see detailed updates.</p>}
              {selectedTicket && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ticketStatusClassName(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#135BEB]/10 text-[#135BEB]">
                      {selectedTicket.issue_type || "GENERAL"}
                    </span>
                    {selectedTicket.eligible_for_special_access && (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#47FF4E]/20 text-[#0a1732]">
                        Eligible for contest access review
                      </span>
                    )}
                  </div>

                  <div className="rounded-[1.4rem] border border-[#0a173218] bg-white/80 p-4">
                    <h4 className="text-lg font-semibold text-[#0a1732]">{selectedTicket.title || selectedTicket.issue_title}</h4>
                    <p className="mt-2 text-sm text-[#0a1732]/80">{selectedTicket.description || selectedTicket.issue_description}</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Ticket Reference</p>
                        <p className="text-[#0a1732] font-mono">{selectedTicket.ticket_reference}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Contest ID</p>
                        <p className="text-[#0a1732] font-mono break-all">{selectedTicket.contest_id || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Problem ID</p>
                        <p className="text-[#0a1732] font-mono break-all">{selectedTicket.problem_id || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Updated</p>
                        <p className="text-[#0a1732]">{selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleString() : "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-[#0a173218] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Support Resolution</p>
                    <p className="mt-1 text-sm text-[#0a1732]">
                      {selectedTicket.resolution_notes || "Support team has not posted a resolution yet."}
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Assigned To</p>
                        <p className="text-[#0a1732]">{selectedTicket.assigned_to || "Pending"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Verified By</p>
                        <p className="text-[#0a1732]">{selectedTicket.verified_by || "Pending"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-[#0a173218] bg-white/80 p-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Contest Access Decision</p>
                      {selectedTicketAccessRequest ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${accessStatusClassName(selectedTicketAccessRequest.status)}`}>
                              {selectedTicketAccessRequest.status}
                            </span>
                            <span className="text-xs text-[#0a1732]/60 font-mono">
                              {selectedTicketAccessRequest.request_reference || selectedTicketAccessRequest._id}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#0a1732]">
                            {selectedTicketAccessRequest.decision_note ||
                              selectedTicketAccessRequest.reason ||
                              "Your access request is being reviewed."}
                          </p>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Window</p>
                              <p className="text-[#0a1732]">
                                {selectedTicketAccessRequest.starts_at
                                  ? new Date(selectedTicketAccessRequest.starts_at).toLocaleString()
                                  : "Pending"}{" "}
                                to{" "}
                                {selectedTicketAccessRequest.expires_at
                                  ? new Date(selectedTicketAccessRequest.expires_at).toLocaleString()
                                  : "Pending"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Scope</p>
                              <p className="text-[#0a1732]">{selectedTicketAccessRequest.access_scope || selectedTicketAccessRequest.contest_id || "Pending"}</p>
                            </div>
                          </div>
                        </>
                      ) : selectedTicket.eligible_for_special_access ? (
                        <>
                          <p className="mt-1 text-sm text-[#0a1732]">
                            Support team ne ticket ko platform-side issue maana hai. Agar tumhe ended contest ke liye recovery access chahiye, to yahin se request bhejo.
                          </p>
                          <form className="mt-4 space-y-3" onSubmit={submitSpecialAccess}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                value={specialAccessForm.ticket_id}
                                onChange={(e) => setSpecialAccessForm((prev) => ({ ...prev, ticket_id: e.target.value }))}
                                className="premium-input"
                                placeholder="Ticket ID"
                                readOnly
                              />
                              <input
                                value={specialAccessForm.contest_id}
                                onChange={(e) => setSpecialAccessForm((prev) => ({ ...prev, contest_id: e.target.value }))}
                                className="premium-input"
                                placeholder="Contest ID"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <select
                                value={specialAccessForm.access_type}
                                onChange={(e) => setSpecialAccessForm((prev) => ({ ...prev, access_type: e.target.value }))}
                                className="premium-select"
                              >
                                <option value="CONTEST_REOPEN">CONTEST_REOPEN</option>
                                <option value="SUBMISSION_ONLY">SUBMISSION_ONLY</option>
                                <option value="TIME_EXTENSION">TIME_EXTENSION</option>
                                <option value="PROBLEM_ACCESS">PROBLEM_ACCESS</option>
                              </select>
                              <input
                                type="datetime-local"
                                value={specialAccessForm.starts_at}
                                onChange={(e) => setSpecialAccessForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                                className="premium-input"
                              />
                              <input
                                type="datetime-local"
                                value={specialAccessForm.expires_at}
                                onChange={(e) => setSpecialAccessForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                                className="premium-input"
                              />
                            </div>
                            <textarea
                              value={specialAccessForm.reason}
                              onChange={(e) => setSpecialAccessForm((prev) => ({ ...prev, reason: e.target.value }))}
                              className="premium-textarea"
                              rows={3}
                              placeholder="Why do you need recovery access?"
                            />
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => startSpecialAccessRequest(selectedTicket)}
                                className="premium-button-secondary"
                              >
                                Prefill from Ticket
                              </button>
                              <button type="submit" className="premium-button-primary">
                                Request Contest Access
                              </button>
                            </div>
                          </form>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-[#0a1732]">
                          Abhi is ticket ke liye special access allowed nahi hai. Agar issue system-side verify hota hai to support/admin yahin se access status update karenge.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="premium-panel-soft p-6">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-lg font-semibold text-[#0a1732]">FAQ / Previous Resolutions</h3>
                <p className="text-sm text-[#0a1732]/65">
                  Agar same issue pehle resolve ho chuka hai, to yahan answer mil jayega aur shayad naya ticket raise karne ki zarurat na pade.
                </p>
              </div>
              {loadingFaqs && <p className="text-[#0a1732]/60">Loading FAQs...</p>}
              {!loadingFaqs && supportFaqs.length === 0 && (
                <p className="text-[#0a1732]/60">No resolved FAQs available yet.</p>
              )}
              {!loadingFaqs && supportFaqs.length > 0 && (
                <div className="support-faq-scroll space-y-3">
                  {supportFaqs.map((faq) => {
                    const expanded = expandedFaqId === faq._id;
                    return (
                      <div key={faq._id} className="rounded-[1.4rem] border border-[#0a173218] bg-white/80">
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId((current) => (current === faq._id ? "" : faq._id))}
                          className="w-full text-left p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#135BEB]/10 text-[#135BEB]">
                              {faq.issue_type || "GENERAL"}
                            </span>
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#47FF4E]/20 text-[#0a1732]">
                              {faq.status}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-[#0a1732]">{faq.question}</h4>
                          <p className="mt-1 text-sm text-[#0a1732]/65">
                            {expanded ? "Hide details" : "View resolved answer"}
                          </p>
                        </button>
                        {expanded && (
                          <div className="px-4 pb-4">
                            {faq.description && <p className="text-sm text-[#0a1732]/80">{faq.description}</p>}
                            {(faq.error_details || faq.steps_tried) && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {faq.error_details && (
                                  <div className="rounded-lg bg-[#0a173205] p-3">
                                    <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Observed Error</p>
                                    <p className="mt-1 text-[#0a1732]">{faq.error_details}</p>
                                  </div>
                                )}
                                {faq.steps_tried && (
                                  <div className="rounded-lg bg-[#0a173205] p-3">
                                    <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Earlier Checks</p>
                                    <p className="mt-1 text-[#0a1732]">{faq.steps_tried}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-3 rounded-lg border border-[#47FF4E]/25 bg-[#47FF4E]/10 p-3">
                              <p className="text-xs uppercase tracking-wide text-[#0a1732]/45">Resolution / Answer</p>
                              <p className="mt-1 text-sm text-[#0a1732]">{faq.answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </section>
    </Layout>
  );
};

export default SupportCenter;
