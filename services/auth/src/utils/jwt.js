import JWT from "jsonwebtoken";

const SECRET = process.env.JSON_WEB_TOKEN_SECRET;

const verifyToken = (token) => {
    let valid = false;
    let payload = {};

    if(!token) {
        return { valid, payload };
    }

    const decodeToken = JWT.verify(token, SECRET);

    if (decodeToken) {
        valid = true;
        payload = decodeToken;
    }

    const result  = {
        isTokenVerified: valid,
        userData: payload,
    };

    return result;
};


const signToken = (payload) => {
    const signedToken = JWT.sign(payload, process.env.JSON_WEB_TOKEN_SECRET, { expiresIn: "7d" });
    return signedToken;
};

export { verifyToken, signToken };
