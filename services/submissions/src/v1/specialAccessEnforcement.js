import SpecialAccessRequest from "../../models/v1/specialAccessRequests.js";

const normalizeText = (value) => String(value || "").trim();

const markExpiredSpecialAccess = async () => {
  await SpecialAccessRequest.updateMany(
    {
      status: "APPROVED",
      expires_at: { $lte: new Date() },
    },
    { $set: { status: "EXPIRED", updated_by: "SYSTEM" } }
  );
};

const getActiveSpecialAccessForContest = async ({
  user_id,
  contest_id,
  problem_id = "",
  allowed_access_types = [],
}) => {
  await markExpiredSpecialAccess();

  const now = new Date();
  const filter = {
    user_id: normalizeText(user_id),
    contest_id: normalizeText(contest_id),
    status: "APPROVED",
    starts_at: { $lte: now },
    expires_at: { $gte: now },
  };

  if (Array.isArray(allowed_access_types) && allowed_access_types.length > 0) {
    filter.access_type = { $in: allowed_access_types };
  }

  const candidates = await SpecialAccessRequest.find(filter).sort({ expires_at: 1 }).lean();
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const normalizedProblemId = normalizeText(problem_id);
  const matched = candidates.find((request) => {
    const requestProblemId = normalizeText(request.problem_id);
    if (!requestProblemId || !normalizedProblemId) return true;
    return requestProblemId === normalizedProblemId;
  });

  return matched || null;
};

export { getActiveSpecialAccessForContest };
