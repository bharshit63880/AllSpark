/**
 * Sanitize response by removing internal/system fields
 * Removes _system field that contains internal processing metadata
 */
const sanitizeResponse = async (data) => {
  if (data && typeof data === "object") {
    delete data._system;
  }
  return data;
};

export default sanitizeResponse;
