import React, { useEffect, useState, useRef } from "react";
import Layout from "../../components/layout/Layout";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener";
import { useAuthContext } from "../../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const Leaderboard = () => {
  const { contestId } = useParams();
  const location = useLocation();
  const { clientId } = useWebSocketContext();
  const { token } = useAuthContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userNamesById, setUserNamesById] = useState({});
  const [loading, setLoading] = useState(true);
  const contestName = location.state?.contestName || "Contest";
  const initialFetchDone = useRef(false);
  const pendingUserLookupIds = useRef(new Set());

  useEffect(() => {
    if (!contestId || !clientId) return;
    setLoading(true);
    initialFetchDone.current = false;
    const fetchLeaderboard = async () => {
      try {
        await axios.get(`${API_BASE}/contests/${contestId}/leaderboard`, {
          headers: { "client-id": clientId },
        });
      } catch (err) {
        toast.error("Failed to request leaderboard.");
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [contestId, clientId]);

  useSocketListener(
    (msg) =>
      msg.type === "leaderboard:live" &&
      (msg.data?.contestId === contestId || msg.data?.contestId === undefined),
    (msg) => {
      if (msg.data?.contestId && msg.data.contestId !== contestId) return;
      if (msg.data?.leaderboard && Array.isArray(msg.data.leaderboard)) {
        setLeaderboard(msg.data.leaderboard);
        setLoading(false);
      }
    }
  );

  useSocketListener(
    (msg) => {
      if (msg.type !== "response" || !msg.metadata) return false;
      const op = msg.metadata.operation;
      if (op !== "leaderboard.getByContest" && op !== "admin.leaderboard.get") return false;
      const respContestId = msg.data?.contestId ?? msg.data?.contest_id;
      return !respContestId || respContestId === contestId;
    },
    (msg) => {
      const { data, metadata } = msg;
      if (metadata?.success && data?.result != null) {
        setLeaderboard(Array.isArray(data.result) ? data.result : []);
        if (!initialFetchDone.current) {
          toast.success(metadata.message || "Leaderboard loaded.");
          initialFetchDone.current = true;
        }
      } else if (!metadata?.success) {
        toast.error(metadata?.message || "Could not load leaderboard.");
      }
      setLoading(false);
    }
  );

  useSocketListener(
    (msg) =>
      msg?.type === "response" &&
      msg?.metadata?.operation === "users.getUser" &&
      msg?.metadata?.success === true &&
      msg?.data?.result?._id,
    (msg) => {
      const user = msg?.data?.result;
      const resolvedUserId = String(user?._id || "");
      if (!resolvedUserId) return;

      pendingUserLookupIds.current.delete(resolvedUserId);
      setUserNamesById((prev) => ({
        ...prev,
        [resolvedUserId]: user?.user_name || user?.name || user?.email || resolvedUserId,
      }));
    }
  );

  useEffect(() => {
    if (!clientId || !token || !Array.isArray(leaderboard) || leaderboard.length === 0) return;

    const unresolvedUserIds = leaderboard
      .map((row) => String(row?.userId || ""))
      .filter(Boolean)
      .filter((userId) => !userNamesById[userId])
      .filter((userId) => !pendingUserLookupIds.current.has(userId));

    if (unresolvedUserIds.length === 0) return;

    unresolvedUserIds.forEach(async (userId) => {
      pendingUserLookupIds.current.add(userId);
      try {
        await axios.get(`${API_BASE}/users/${userId}`, {
          headers: {
            "client-id": clientId,
            authorization: token,
          },
        });
      } catch (error) {
        pendingUserLookupIds.current.delete(userId);
      }
    });
  }, [leaderboard, clientId, token, userNamesById]);

  return (
    <Layout>
      <section className="premium-page premium-section">
      <div className="premium-container min-h-[70vh]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl poppins-bold primary-gradient-text">
              {contestName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#47FF4E]/20 text-[#0a1732] text-sm poppins-medium">
              <span className="w-2 h-2 rounded-full bg-[#47FF4E] animate-pulse" />
              Live
            </span>
          </div>
          <Link
            to="/contests"
            className="text-base poppins-medium text-[#135BEB] hover:underline"
          >
            ← Back to Contests
          </Link>
        </div>

        <p className="text-sm black-60-text poppins-regular mb-6">
          Rank by accepted problems, then finish timing and penalty. Each accepted problem earns 10 stars and updates live as judging completes.
        </p>

        {loading && leaderboard.length === 0 ? (
          <div className="premium-panel-soft p-12 text-center">
            <div className="inline-block w-10 h-10 border-2 border-[#135BEB] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="black-80-text poppins-medium">Loading leaderboard…</p>
            <p className="text-sm black-40-text mt-2">Updates appear in real time.</p>
          </div>
        ) : (
          <div className="premium-table-wrap overflow-hidden bg-white custom-smooth-drop-shadow">
            <div className="premium-table-scroll">
              <table className="premium-table min-w-[720px]">
                <thead>
                  <tr className="primary-gradient-bg text-white">
                    <th className="text-left py-4 px-4 lg:px-6 poppins-semibold rounded-tl-xl">#</th>
                    <th className="text-left py-4 px-4 lg:px-6 poppins-semibold">Participant</th>
                    <th className="text-center py-4 px-4 lg:px-6 poppins-semibold">Stars</th>
                    <th className="text-center py-4 px-4 lg:px-6 poppins-semibold">Solved</th>
                    <th className="text-right py-4 px-4 lg:px-6 poppins-semibold">Finish</th>
                    <th className="text-right py-4 px-4 lg:px-6 poppins-semibold rounded-tr-xl">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center black-60-text poppins-regular">
                        No entries yet. Submit solutions during the contest to appear here.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row, index) => (
                      <tr
                        key={row.userId || index}
                        className={`border-t border-[#0a173218] transition-colors ${
                          index === 0
                            ? "bg-[#F5CC37]/15"
                            : index === 1
                            ? "bg-[#E5E5E5]/60"
                            : index === 2
                            ? "bg-[#CD7F32]/10"
                            : "hover:bg-[#0a173208]"
                        }`}
                      >
                        <td className="py-4 px-4 lg:px-6">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg poppins-bold ${
                              index === 0
                                ? "text-2xl"
                                : index === 1
                                ? "text-xl"
                                : index === 2
                                ? "text-lg"
                                : "text-[#0a1732]"
                            }`}
                          >
                            {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                          </span>
                        </td>
                        <td className="py-4 px-4 lg:px-6">
                          <span className="poppins-medium black-80-text font-mono text-sm">
                            {userNamesById[String(row.userId)] || row.userName || row.userId || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4 lg:px-6 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3.2rem] py-1 px-2 rounded-lg bg-amber-400/15 text-amber-500 poppins-semibold">
                            {row.starsEarned ?? 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 lg:px-6 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] py-1 px-2 rounded-lg bg-[#135BEB]/15 text-[#135BEB] poppins-semibold">
                            {row.solvedCount ?? 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 lg:px-6 text-right poppins-regular black-80-text">
                          {row.completionMinutes ?? 0} min
                        </td>
                        <td className="py-4 px-4 lg:px-6 text-right poppins-regular black-80-text">
                          {row.totalPenaltyMinutes ?? 0} min
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </section>
    </Layout>
  );
};

export default Leaderboard;
