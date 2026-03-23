import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";


const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";




// Normal Usage Controllers
const searchContestsController = async (req, res) => {

    try {


        const {
            name,
            slug,
            description,
            start_time,
            end_time,
            duration,
        } = req.body;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();


        const data = {
            filter: {
                $or: [],
                $and: [],
            },
        };

        if (name) {
            const nameFilterCondition = {
                name: { $regex: name, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), nameFilterCondition];
        }

        if (slug) {
            const slugFilterCondition = {
                slug: { $regex: slug, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), slugFilterCondition];
        }

        if (description) {
            const descriptionFilterCondition = {
                description: { $regex: description, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), descriptionFilterCondition];
        }

        if (start_time) {
            const start_timeFilterCondition = {
                start_time: { $gte: start_time },
            };
            data.filter.$and = [...(data.filter.$and), start_timeFilterCondition];
        }

        if (end_time) {
            const end_timeFilterCondition = {
                end_time: { $lte: end_time },
            };
            data.filter.$and = [...(data.filter.$and), end_timeFilterCondition];
        }

        if (duration) {
            const durationFilterCondition = {
                duration: { $lte: duration },
            };
            data.filter.$and = [...(data.filter.$and), durationFilterCondition];
        }


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {},
            operation: "contests.search", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Contests Search Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Searching Contests....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Searching Contests....",
            error
        });

    }

};


const getAllContestsController = async (req, res) => {

    try {

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();


        const data = {};


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {},
            operation: "contests.getAllContests", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Get All Contests Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting All Contests....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting All Contests....",
            error
        });

    }

};


const getSpecificContestDetailsController = async (req, res) => {


    try {

        const { _id } = req.body || {}; // Make req.body as optional
        const slug = req.params.slug;

        if (!(_id || slug)) {
            return res.status(400).json({
                success: false,
                message: "_id or slug is Required to Get Details of Specific Contest....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const data = {
            _id: _id,
            slug: slug,
        };


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {},
            operation: "contests.getContest", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Get Details of Specific Contest Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Details of Specific Contest....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Details of Specific Contest....",
            error
        });

    }

};


const registerLoggedInUserInSpecificContestController = async (req, res) => {


    try {

        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "_id Of Contest is Required to Register Specific Contest....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;

        const data = {
            contest_id: _id,
        };


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.register", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Register for Specific Contest Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Registering for Specific Contest....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Registering for Specific Contest....",
            error
        });

    }

};


const startSpecificContestForLoggedInUserController = async (req, res) => {

    try {

        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "_id Of Contest is Required to Start Specific Contest....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;

        const data = {
            contest_id: _id,
        };


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.startContest", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Start Specific Contest Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Starting Specific Contest....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Starting Specific Contest....",
            error
        });

    }

};








// Control Panel Usage Controllers
const controlSearchContestsController = async (req, res) => {

    try {

        const {
            name,
            slug,
            description,
            created_by,
            support_team,
            problems,
            start_time,
            end_time,
            duration,
            support_end_time,
        } = req.body;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            filter: {
                $or: [],
                $and: [],
            },
        };

        if (name) {
            const nameFilterCondition = {
                name: { $regex: name, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), nameFilterCondition];
        }

        if (slug) {
            const slugFilterCondition = {
                slug: { $regex: slug, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), slugFilterCondition];
        }

        if (description) {
            const descriptionFilterCondition = {
                description: { $regex: description, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), descriptionFilterCondition];
        }

        if (created_by) {
            const created_byFilterCondition = {
                created_by: created_by,
            };
            data.filter.$and = [...(data.filter.$and), created_byFilterCondition];
        }

        if (support_team) {
            const support_teamFilterCondition = {
                support_team: { $in: support_team },
            };
            data.filter.$and = [...(data.filter.$and), support_teamFilterCondition];
        }

        if (problems) {
            const problemsFilterCondition = {
                problems: { $in: problems },
            };
            data.filter.$and = [...(data.filter.$and), problemsFilterCondition];
        }

        if (start_time) {
            const start_timeFilterCondition = {
                start_time: { $gte: start_time },
            };
            data.filter.$and = [...(data.filter.$and), start_timeFilterCondition];
        }

        if (end_time) {
            const end_timeFilterCondition = {
                end_time: { $lte: end_time },
            };
            data.filter.$and = [...(data.filter.$and), end_timeFilterCondition];
        }

        if (duration) {
            const durationFilterCondition = {
                duration: { $lte: duration },
            };
            data.filter.$and = [...(data.filter.$and), durationFilterCondition];
        }


        if (support_end_time) {
            const support_end_timeFilterCondition = {
                support_end_time: { $lte: support_end_time },
            };
            data.filter.$and = [...(data.filter.$and), support_end_timeFilterCondition];
        }



        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.control.search", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Search Contests Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Searching Contests From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Searching Contests From Control Panel....",
            error
        });

    }

};


const controlGetSpecificContestDetailsController = async (req, res) => {

    try {

        const { _id } = req.body;
        const { slug } = req.params.slug;

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            _id: _id,
            slug: slug,
        };




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.control.getContest", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Get Specific Contest's Details Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Specific Contest's Details From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Specific Contest's Details From Control Panel....",
            error
        });

    }

};


const controlCreateNewContestController = async (req, res) => {

    try {


        const {
            name,
            slug,
            description,
            support_team,
            problems,
            start_time,
            end_time,
            duration,
            support_end_time,
        } = req.body;

        if (!(name && slug && description && support_team && problems && start_time && end_time && duration && support_end_time)) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Create Contest like: name, slug, description, support_team, problems, start_time, end_time, duration, support_end_time....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            name: name,
            slug: slug,
            description: description,
            support_team: support_team,
            problems: problems,
            start_time: start_time,
            end_time: end_time,
            duration: duration,
            support_end_time: support_end_time,
        };




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.control.create", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Create Contest Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Creating Contest From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Creating Contest From Control Panel....",
            error
        });

    }

};


const controlUpdateContestController = async (req, res) => {

    try {


        const {
            _id,
            name,
            slug,
            description,
            support_team,
            problems,
            start_time,
            end_time,
            duration,
            support_end_time,
        } = req.body;

        if (!(_id)) {
            return res.status(400).json({
                success: false,
                message: "_id is Required to Update Contest....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            _id: _id,
            name: name,
            slug: slug,
            description: description,
            support_team: support_team,
            problems: problems,
            start_time: start_time,
            end_time: end_time,
            duration: duration,
            support_end_time: support_end_time,
        };




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.control.update", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Update Contest Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Updating Contest From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Updating Contest From Control Panel....",
            error
        });

    }

};


const controlDeleteContestController = async (req, res) => {


    try {


        const {
            _id,
        } = req.body;

        if (!(_id)) {
            return res.status(400).json({
                success: false,
                message: "_id is Required to Delete Contest....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            _id: _id,
        };




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "contests.control.delete", // This will tell about what initial request was and processing will be done as per this 
            createdAt: createdAt, // Time when this request was created

            // To be Changed Fields

            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(), // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
        };

        const topic = DEFAULT_TOPIC_TO_PUBLISH;
        const partition = getPartition();

        await sendEvent(topic, partition, data, metadata);
        return res.status(202).json({
            success: true,
            message: "Delete Contest Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Deleting Contest From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Deleting Contest From Control Panel....",
            error
        });

    }

};

// Leaderboard by contestId (response via WebSocket using client-id)
const getLeaderboardByContestIdController = async (req, res) => {
    try {
        const contestId = req.params.contestId;
        if (!contestId) {
            return res.status(400).json({ success: false, message: "contestId is required." });
        }
        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const userToken = req.headers.authorization;
        const data = { contestId };
        const metadata = {
            clientId,
            requestId,
            actor: { token: userToken },
            operation: "leaderboard.getByContest",
            createdAt: (new Date()).toISOString(),
            source: CURR_SERVICE_NAME,
            updatedAt: (new Date()).toISOString(),
        };
        await sendEvent(DEFAULT_TOPIC_TO_PUBLISH, getPartition(), data, metadata);
        return res.status(202).json({ success: true, message: "Leaderboard request accepted. Response via WebSocket.", requestId });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Something went wrong while fetching leaderboard.", error });
    }
};


export {
    // Normal Usage Controllers
    searchContestsController,
    getAllContestsController,
    getSpecificContestDetailsController,
    registerLoggedInUserInSpecificContestController,
    startSpecificContestForLoggedInUserController,
    getLeaderboardByContestIdController,




    // Control Panel Controllers
    controlSearchContestsController,
    controlGetSpecificContestDetailsController,
    controlCreateNewContestController,
    controlUpdateContestController,
    controlDeleteContestController,
}
