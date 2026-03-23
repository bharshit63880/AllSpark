import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";


const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";

const parseOptionalJson = (rawValue, fallback = {}) => {
  if (!rawValue) return fallback;
  if (typeof rawValue === "object") return rawValue;
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return fallback;
  }
};


// Dashboard
const getAdminDashboardController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();

    const userToken = req.headers.authorization;

    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.dashboard",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Admin dashboard request accepted.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching dashboard.", error });
  }
};


// Users
const getAllUsersForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.getAll",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Get all users request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while getting all users.", error });
  }
};

const banUserController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) {
      return res.status(400).json({ success: false, message: "_id is Required to Ban User." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { _id, activation_status: "banned" };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.ban",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Ban user request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while banning user.", error });
  }
};

const unbanUserController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) {
      return res.status(400).json({ success: false, message: "_id is Required to Unban User." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { _id, activation_status: "active" };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.unban",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Unban user request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while unbanning user.", error });
  }
};

const deleteUserForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) {
      return res.status(400).json({ success: false, message: "_id is Required to Delete User." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { _id };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.delete",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Delete user request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while deleting user.", error });
  }
};


const getUserByIdForAdminController = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "User ID required." });

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;

    const data = { _id: id };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.get",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "User details request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching user.", error });
  }
};

const createUserForAdminController = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, user_name, email, password, mobile_no } = body;
    if (!(name && user_name && email && password && mobile_no)) {
      return res.status(400).json({ success: false, message: "name, user_name, email, password, mobile_no are required." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;

    const data = {
      name,
      user_name,
      email,
      password,
      mobile_no,
      role: body.role || "USER",
      activation_status: body.activation_status || "active",
    };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.create",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Create user request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while creating user.", error });
  }
};

const updateUserForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, message: "_id is required to update user." });

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;

    const data = { ...req.body };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.users.update",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Update user request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while updating user.", error });
  }
};

// Problems (control style)
const createProblemForAdminController = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, slug } = body;
    if (!(name && slug)) {
      return res.status(400).json({ success: false, message: "name and slug are required to create problem." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {
      name: body.name,
      slug: body.slug,
      tags: body.tags || [],
      description: body.description || "",
      difficulty: body.difficulty || "EASY",
      is_public: typeof body.is_public === "boolean" ? body.is_public : true,
      test_cases: body.test_cases || [],
    };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.problems.create",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Create problem request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while creating problem.", error });
  }
};

const editProblemForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!(_id)) {
      return res.status(400).json({ success: false, message: "_id is Required to Update Problem." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { ...req.body };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.problems.update",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Update problem request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while updating problem.", error });
  }
};

const deleteProblemForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!(_id)) {
      return res.status(400).json({ success: false, message: "_id is Required to Delete Problem." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { _id };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.problems.delete",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Delete problem request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while deleting problem.", error });
  }
};


// Get single contest by ID (for View/Edit full details)
const getContestByIdForAdminController = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Contest ID required." });
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { _id: id };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.contests.get",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };
    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Contest details request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching contest.", error });
  }
};

// Contests list (for control panel)
const getContestsForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { filter: req.query.filter ? JSON.parse(req.query.filter) : {} };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.contests.list",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };
    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Contests list request accepted. Response via WebSocket.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching contests.", error });
  }
};

// Problems list (for control panel)
const getProblemsForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { filter: req.query.filter ? JSON.parse(req.query.filter) : {} };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.problems.list",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };
    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Problems list request accepted. Response via WebSocket.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching problems.", error });
  }
};

// Get single problem by ID (for View/Read)
const getProblemByIdForAdminController = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Problem ID required." });
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { _id: id };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.problems.get",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };
    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Problem details request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching problem.", error });
  }
};

// Contests
const createContestForAdminController = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, slug } = body;
    if (!(name && slug)) {
      return res.status(400).json({ success: false, message: "name and slug are required to create contest." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {
      name: body.name,
      slug: body.slug,
      description: body.description || "",
      support_team: body.support_team || [],
      problems: body.problems || [],
      start_time: body.start_time,
      end_time: body.end_time,
      duration: body.duration,
      support_end_time: body.support_end_time,
    };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.contests.create",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Create contest request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while creating contest.", error });
  }
};

const editContestForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!(_id)) {
      return res.status(400).json({ success: false, message: "_id is Required to Update Contest." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { ...req.body };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.contests.update",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Update contest request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while updating contest.", error });
  }
};

const deleteContestForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!(_id)) {
      return res.status(400).json({ success: false, message: "_id is Required to Delete Contest." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { _id };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.contests.delete",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Delete contest request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while deleting contest.", error });
  }
};


// Submissions & Logs & Leaderboard & Support Tickets
const getAllSubmissionsForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.submissions.getAll",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Get all submissions request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while getting submissions.", error });
  }
};

const getSubmissionByIdForAdminController = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Submission ID required." });

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { _id: id };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.submissions.get",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };
    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Submission details request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching submission.", error });
  }
};

const deleteSubmissionForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, message: "_id is required to delete submission." });

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const userToken = req.headers.authorization;
    const data = { _id };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.submissions.delete",
      createdAt: new Date().toISOString(),
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };
    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Delete submission request accepted. Response via WebSocket." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while deleting submission.", error });
  }
};

const getLogsForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {};

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.logs.get",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Get logs request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while getting logs.", error });
  }
};

const getLeaderboardForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;
    const contestId = req.query.contestId || req.query.contest_id;

    const data = { contestId: contestId || undefined };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.leaderboard.get",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Get leaderboard request accepted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while getting leaderboard.", error });
  }
};

const getSupportTicketsForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {
      filter: parseOptionalJson(req.query.filter, {}),
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      skip: req.query.skip ? Number(req.query.skip) : undefined,
    };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.supportTickets.getAll",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    const topic = DEFAULT_TOPIC_TO_PUBLISH;
    const partition = getPartition();

    await sendEvent(topic, partition, data, metadata);
    return res.status(202).json({ success: true, message: "Get support tickets request accepted.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while getting support tickets.", error });
  }
};

const updateSupportTicketForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) {
      return res.status(400).json({ success: false, message: "_id is required to update support ticket." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { ...req.body };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.supportTickets.update",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Update support ticket request accepted.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while updating support ticket.", error });
  }
};

const getSpecialAccessRequestsForAdminController = async (req, res) => {
  try {
    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = {
      filter: parseOptionalJson(req.query.filter, {}),
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      skip: req.query.skip ? Number(req.query.skip) : undefined,
    };

    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.specialAccess.getAll",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Get special access requests accepted.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while getting special access requests.", error });
  }
};

const updateSpecialAccessRequestForAdminController = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) {
      return res.status(400).json({ success: false, message: "_id is required to update special access request." });
    }

    const clientId = req.get("client-id");
    const requestId = uuidv4();
    const createdAt = new Date().toISOString();
    const userToken = req.headers.authorization;

    const data = { ...req.body };
    const metadata = {
      clientId,
      requestId,
      actor: { token: userToken },
      operation: "admin.specialAccess.update",
      createdAt,
      source: CURR_SERVICE_NAME,
      updatedAt: new Date().toISOString(),
    };

    await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
    return res.status(202).json({ success: true, message: "Update special access request accepted.", requestId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Something went wrong while updating special access request.", error });
  }
};


export {
  getAdminDashboardController,
  getAllUsersForAdminController,
  getUserByIdForAdminController,
  createUserForAdminController,
  updateUserForAdminController,
  banUserController,
  unbanUserController,
  deleteUserForAdminController,
  getContestsForAdminController,
  getContestByIdForAdminController,
  getProblemsForAdminController,
  getProblemByIdForAdminController,
  createProblemForAdminController,
  editProblemForAdminController,
  deleteProblemForAdminController,
  createContestForAdminController,
  editContestForAdminController,
  deleteContestForAdminController,
  getAllSubmissionsForAdminController,
  getSubmissionByIdForAdminController,
  deleteSubmissionForAdminController,
  getLogsForAdminController,
  getLeaderboardForAdminController,
  getSupportTicketsForAdminController,
  updateSupportTicketForAdminController,
  getSpecialAccessRequestsForAdminController,
  updateSpecialAccessRequestForAdminController,
};
