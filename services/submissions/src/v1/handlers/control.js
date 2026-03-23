import Submission from "../../../models/v1/submissions.js";
import { deleteFromCache } from "../../utils/redisCacheManager.js";
import { publishToRedisPubSub } from "../../utils/v1/redisPublisher.js";

const CURR_SERVICE_NAME = "submission-service";

const searchSubmissionsForAdmin = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;
    metadata.source = CURR_SERVICE_NAME;

    const filter =
      data && typeof data.filter === "object" && data.filter ? data.filter : {};
    const limit = Number.isFinite(Number(data?.limit))
      ? Math.min(200, Math.max(1, Number(data.limit)))
      : 100;
    const skip = Number.isFinite(Number(data?.skip))
      ? Math.max(0, Number(data.skip))
      : 0;

    const results = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    metadata.updatedAt = new Date().toISOString();
    metadata.success = true;
    metadata.message = "Submissions fetched successfully.";
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: results }, metadata })
    );
  } catch (error) {
    console.log("searchSubmissionsForAdmin error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    metadata.success = false;
    metadata.message = "Something went wrong while fetching submissions.";
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data, metadata })
    );
  }
};

const deleteSubmissionForAdmin = async (data, metadata) => {
  try {
    if (metadata.source !== "permission-service") return;
    metadata.source = CURR_SERVICE_NAME;

    const _id = data?._id;
    if (!_id) {
      metadata.updatedAt = new Date().toISOString();
      metadata.success = false;
      metadata.message = "_id is required to delete submission.";
      await publishToRedisPubSub(
        "response",
        JSON.stringify({ data, metadata })
      );
      return;
    }

    const deleted = await Submission.findByIdAndDelete(_id).lean();
    await deleteFromCache(`submissions:v1:_id:${_id}`);

    metadata.updatedAt = new Date().toISOString();
    if (!deleted) {
      metadata.success = false;
      metadata.message = "Submission not found.";
      await publishToRedisPubSub(
        "response",
        JSON.stringify({ data, metadata })
      );
      return;
    }

    metadata.success = true;
    metadata.message = "Submission deleted successfully.";
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data: { ...data, result: deleted }, metadata })
    );
  } catch (error) {
    console.log("deleteSubmissionForAdmin error:", error);
    metadata.source = CURR_SERVICE_NAME;
    metadata.updatedAt = new Date().toISOString();
    metadata.success = false;
    metadata.message = "Something went wrong while deleting submission.";
    await publishToRedisPubSub(
      "response",
      JSON.stringify({ data, metadata })
    );
  }
};

export { searchSubmissionsForAdmin, deleteSubmissionForAdmin };

