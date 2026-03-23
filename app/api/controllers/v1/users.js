import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";


const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";



const searchUsersController = async (req, res) => {

    try {

        const { name, user_name, email, password, mobile_no } = req.body;

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

        if (user_name) {
            const userNameFilterCondition = {
                user_name: { $regex: user_name, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), userNameFilterCondition];
        }

        if (email) {
            const emailFilterCondition = {
                email: { $regex: email, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), emailFilterCondition];
        }

        if (password) {
            const passwordFilterCondition = {
                password: { $regex: password, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), passwordFilterCondition];
        }

        if (mobile_no) {
            const mobileNoFilterCondition = {
                mobile_no: { $regex: mobile_no, $options: 'i' },
            };
            data.filter.$or = [...(data.filter.$or), mobileNoFilterCondition];
        }


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "users.control.search", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Users Search Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Searching Users....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Searching Users....",
            error
        });

    }

};


const getSpecificUserDetailsController = async (req, res) => {


    try {

        let { _id } = req.body || {};
        _id = _id || req.params.slug; // There should be slug like for user with user_name "harshKu007" there should be something like "harshKu007" but it is ok can be updated later if required


        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "_id is Required to Get Details of Specific User....",
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
            operation: "users.getUser", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Get Specific User's Details Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Specific User's Details....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Specific User's Details....",
            error
        });

    }


};


const createNewUserController = async (req, res) => {

    try {

        const { name, user_name, email, password, mobile_no } = req.body;



        if (!name || !user_name || !email || !password || !mobile_no) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Create User like: name, user_name, email, password, mobile_no....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            name: name,
            user_name: user_name,
            email: email,
            password: password,
            mobile_no: mobile_no,
        };


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "users.control.create", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Create New User Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Creating User....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Creating User....",
            error
        });

    }

};


const updateUserController = async (req, res) => {

    try {

        const { _id, name, user_name, email, password, mobile_no, role, activation_status } = req.body;

        const data = {
            _id: _id,
        };

        if (name) {
            data.name = name;
        }

        if (user_name) {
            data.user_name = user_name;
        }

        if (email) {
            data.email = email;
        }

        if (password) {
            data.password = password;
        }

        if (mobile_no) {
            data.mobile_no = mobile_no;
        }

        if (role) {
            data.role = role;
        }

        if (activation_status) {
            data.activation_status = activation_status;
        }


        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Update User like: _id....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;



        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "users.control.update", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Update User Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Updating User....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Updating User....",
            error
        });

    }

};


const deleteUserController = async (req, res) => {

    try {

        const { _id, } = req.body;



        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Delete User like: _id....",
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
            operation: "users.control.delete", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Delete User Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Deleting User....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Deleting User....",
            error
        });

    }
};




export { searchUsersController, getSpecificUserDetailsController, createNewUserController, updateUserController, deleteUserController, };
