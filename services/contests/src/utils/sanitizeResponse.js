const sanitizeResponse = async (data) => {
    if (data && typeof (data) === "object") {
        delete data._system;
    }
    return data;
};


export default sanitizeResponse;
