

const clientConnectedOrNotMiddleware = async (req, res, next) => {
    // console.log("Inside middleware....");
    // console.log(req.headers);
    // console.log(req.headers.authorization);
    try {
        const clientId = req.get("client-id");

        if (!clientId) {
            return res.status(400).json(
                {
                    success: false,
                    message: "Websocket Client Id is not defined...."
                }
            );
        }

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




export { clientConnectedOrNotMiddleware };
