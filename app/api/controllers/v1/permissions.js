import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { sendEvent } from "../../utils/v1/kafkaProducer.js";
import getPartition from "../../utils/v1/getPartition.js";


const CURR_SERVICE_NAME = "api";
const DEFAULT_TOPIC_TO_PUBLISH = process.env.DEFAULT_TOPIC_TO_PUBLISH || "request";


const searchPermissionsController = async (req, res) => {

    try {

        const { name, created_by, roles, description } = req.body;

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

        if (roles) {
            const rolesFilterCondition = {
                roles: { $in: roles },
            };
            data.filter.$and = [...(data.filter.$and), rolesFilterCondition];
        }

        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "permissions.search", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Permissions Search Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Searching Permissions....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Searching Permissions....",
            error
        });

    }

};


const getSpecificPermissionDetailsController = async (req, res) => {

    try {

        let { _id } = req.body;
        _id = _id || req.params.slug; // There should be slug like for permission "users.create" there should be something like "users-create" but it is ok can be updated later if required

        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "_id is Required to Get Details of Specific Permission....",
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
            operation: "permissions.control.getPermission", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Get Specific Permission's Details Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Getting Specific Permission's Details....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Getting Specific Permission's Details....",
            error
        });

    }


};


const createNewPermissionController = async (req, res) => {

    try {

        const { name, description, nextTopicToPublish, roles } = req.body;



        if (!name || !description || !nextTopicToPublish || !roles) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Create Permission like: name, description, nextTopicToPublish, roles....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            name: name,
            description: description,
            nextTopicToPublish: nextTopicToPublish,
            roles: roles,
        };


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "permissions.control.create", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Create New Permission Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Creating Permission....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Creating Permission....",
            error
        });

    }

};


const updatePermissionController = async (req, res) => {

    try {

        const { _id, name, description, nextTopicToPublish, roles } = req.body;



        if (!_id || !name || !description || !nextTopicToPublish || !roles) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Update Permission like: _id, name, description, nextTopicToPublish, roles....",
            });
        }

        const clientId = req.get("client-id");
        const requestId = uuidv4();
        const createdAt = (new Date()).toISOString();

        const userToken = req.headers.authorization;


        const data = {
            _id: _id,
            name: name,
            description: description,
            nextTopicToPublish: nextTopicToPublish,
            roles: roles,
        };


        const metadata = {
            // Not To Be Changed Fields

            clientId: clientId, // This is Websocket Id Which will be used for sending back the data to the client
            requestId: requestId, // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
            actor: {
                token: userToken,
            },
            operation: "permissions.control.update", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Update Permission Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Updating Permission....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Updating Permission....",
            error
        });

    }

};


const deletePermissionController = async (req, res) => {

    try {

        const { _id, } = req.body;



        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Please Provide Required details to Delete Permission like: _id....",
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
            operation: "permissions.control.delete", // This will tell about what initial request was and processing will be done as per this 
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
            message: "Delete Permission Request is Accepted Successfully....",
        });

    } catch (error) {

        console.log(error);
        console.log("Something went wrong while handling in API while Deleting Permission....");

        return res.status(500).json({
            success: false,
            message: "Something went wrong while Deleting Permission....",
            error
        });

    }

};




export { searchPermissionsController, getSpecificPermissionDetailsController, createNewPermissionController, updatePermissionController, deletePermissionController, };