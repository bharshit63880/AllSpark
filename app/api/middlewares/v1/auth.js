

const normalizeAuthorizationToken = (rawToken) => {
    let token = String(rawToken || "").trim();

    if (!token) {
        return "";
    }

    if (token.toLowerCase().startsWith("bearer ")) {
        token = token.slice(7).trim();
    }

    for (let i = 0; i < 2; i += 1) {
        const wrappedWithDoubleQuotes = token.startsWith("\"") && token.endsWith("\"");
        const wrappedWithSingleQuotes = token.startsWith("'") && token.endsWith("'");
        if (!wrappedWithDoubleQuotes && !wrappedWithSingleQuotes) {
            break;
        }
        token = token.slice(1, -1).trim();
    }

    return token;
};

const isRegisteredUserTokenIsPresentMiddleware = async (req, res, next) => {
    // console.log("Inside middleware....");
    // console.log(req.headers);
    // console.log(req.headers.authorization);
    try {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json(
                {
                    success: false,
                    message: "Authorization Token is not defined...."
                }
            );
        }

        token = normalizeAuthorizationToken(token);
        if (!token) {
            return res.status(401).json(
                {
                    success: false,
                    message: "Authorization Token is not valid...."
                }
            );
        }

        req.headers.authorization = token;

        next();
    } catch (error) {
        console.log(error);
        res.status(500).json(
            {
                success: false,
                message: "Some error occured....",
                error
            }
        );
    }
};




export { isRegisteredUserTokenIsPresentMiddleware };
