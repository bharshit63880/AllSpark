import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";


const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";




// Normal Usage Controllers
const searchProblemsController = async (req, res) => {

    try {

        const {
            name,
            slug,
            tags,
            description,
            difficulty,
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

        if (tags) {
            const tagsFilterCondition = {
                tags: { $in: tags },
            };
            data.filter.$and = [...(data.filter.$and), tagsFilterCondition];
        }

        if (description) {
            const descriptionFilterCondition = {
                description: { $regex: description, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), descriptionFilterCondition];
        }

        if (difficulty) {
            const difficultyFilterCondition = {
                difficulty: difficulty,
            };
            data.filter.$and = [...(data.filter.$and), difficultyFilterCondition];
        }




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {},
            operation: "problems.search", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Problems Search Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Searching Problems....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Searching Problems....",
            error
        });

    }

};


const getAllProblemsController = async (req, res) => {

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
            operation: "problems.getAllProblems", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Get All Problems Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting All Problems....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting All Problems....",
            error
        });

    }

};


const getSpecificProblemDetailsController = async (req, res) => {


    try {

        const { _id } = req.body || {}; // To Make req.body Optional to Send while APi Call 
        const slug = req.params.slug;

        if (!(_id || slug)) {
            return res.status(400).json({
                success: false,
                message: "_id or slug is Required to Get Details of Specific Problem....",
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
            operation: "problems.getProblem", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Get Details of Specific Problem Request is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Details of Specific Problem....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Details of Specific Problem....",
            error
        });

    }

};










// Control Panel Usage Controllers
const controlSearchProblemsController = async (req, res) => {

    try {


        const {
            name,
            slug,
            tags,
            description,
            difficulty,
            is_public,
            created_by,
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

        if (tags) {
            const tagsFilterCondition = {
                tags: { $in: tags },
            };
            data.filter.$and = [...(data.filter.$and), tagsFilterCondition];
        }

        if (description) {
            const descriptionFilterCondition = {
                description: { $regex: description, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), descriptionFilterCondition];
        }

        if (difficulty) {
            const difficultyFilterCondition = {
                difficulty: difficulty,
            };
            data.filter.$and = [...(data.filter.$and), difficultyFilterCondition];
        }

        if (typeof(is_public) === 'boolean') { // For Boolean Values Please Check Type Else in the case of value false they will not be recognized and may detect "undefined" however we should check for everyone but for now keeping it minimal if required always can be changed :)  
            const is_publicFilterCondition = {
                is_public: is_public,
            };
            data.filter.$and = [...(data.filter.$and), is_publicFilterCondition];
        }

        if (created_by) {
            const created_byFilterCondition = {
                created_by: created_by,
            };
            data.filter.$and = [...(data.filter.$and), created_byFilterCondition];
        }




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "problems.control.search", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Problems Search Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Searching Problems From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Searching Problems From Control Panel....",
            error
        });

    }

};


const controlGetSpecificProblemDetailsController = async (req, res) => {

    try {

        const { _id } = req.body;
        const slug = req.params.slug;

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
            operation: "problems.control.getProblem", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Get Specific Problem's Details Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Specific Problem's Details From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Specific Problem's Details From Control Panel....",
            error
        });

    }

};


const controlCreateNewProblemController = async (req, res) => {

    try {


        const {
            name,
            slug,
            tags,
            description,
            difficulty,
            is_public,
            test_cases,
        } = req.body;

        if (!(name && slug && tags && description && difficulty && is_public && test_cases)) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Create Problem like: name, slug, tags, description, difficulty, is_public, test_cases....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;

        const data = {
            name: name,
            slug: slug,
            tags: tags,
            description: description,
            difficulty: difficulty,
            is_public: is_public,
            test_cases: test_cases,
        };
        


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "problems.control.create", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Create Problem Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Creating Problem From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Creating Problem From Control Panel....",
            error
        });

    }

};


const controlUpdateProblemController = async (req, res) => {

    try {

        // const data = {
        //     _id: <_id>,
        //     name: <name>,
        //     slug: <slug>,
        //     tags: <tags>,
        //     description: <description>,
        //     difficulty: <difficulty>,
        //     is_public: <is_public>,
        //     test_cases: <test_cases>
        // };

        const {
            _id,
            name,
            slug,
            tags,
            description,
            difficulty,
            is_public,
            test_cases,
        } = req.body;

        if (!(_id)) {
            return res.status(400).json({
                success: false,
                message: "_id is Required to Update Problem....",
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
            tags: tags,
            description: description,
            difficulty: difficulty,
            is_public: is_public,
            test_cases: test_cases,
        };




        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "problems.control.update", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Update Problem Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Updating Problem From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Updating Problem From Control Panel....",
            error
        });

    }

};


const controlDeleteProblemController = async (req, res) => {


    try {


        const {
            _id,
        } = req.body;

        if (!(_id)) {
            return res.status(400).json({
                success: false,
                message: "_id is Required to Delete Problem....",
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
            operation: "problems.control.delete", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Delete Problem Request From Control Panel is Accepted Successfully....",
            requestId,
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Deleting Problem From Control Panel....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Deleting Problem From Control Panel....",
            error
        });

    }

};









export {
    // Normal Usage Controllers
    searchProblemsController,
    getAllProblemsController,
    getSpecificProblemDetailsController,




    // Control Panel Controllers
    controlSearchProblemsController,
    controlGetSpecificProblemDetailsController,
    controlCreateNewProblemController,
    controlUpdateProblemController,
    controlDeleteProblemController,
}
