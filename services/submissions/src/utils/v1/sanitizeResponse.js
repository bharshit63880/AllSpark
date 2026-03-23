/**
 * Sanitize response data by removing internal system properties
 * @param {Object} data - The data object to sanitize
 * @returns {Object} - The sanitized data object without _system property
 */
const sanitizeResponse = async (data) => {
  try {
    // Create a deep copy to avoid mutating original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove internal system properties
    if (sanitized._system) {
      delete sanitized._system;
    }
    
    return sanitized;
  } catch (error) {
    console.error("Error sanitizing response:", error);
    // Return original data if sanitization fails
    return data;
  }
};

export default sanitizeResponse;
