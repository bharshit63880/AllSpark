import { connectProducer, sendEvent } from "./kafkaProducer.js";

// PERMISSION WORKING CORRECTLY 
const init = async () => {
    await connectProducer();
    const topic = "permissions.control.create";

    // const data = {
    //     name: <name>,
    //     nextTopicToPublish: <nextTopicToPublish>,
    //     roles: <roles>,
    //     created_by: <created_by>,
    // };
    const partition = 1;
    const data = {
        // _id: "696dd11b4512195712d3e739",
        name: "permissions.getPermission",
        description: "This Permission Allows Users with Role: ADMIN, SUPPORT, CONTEST_SCHEDULER to Get Details of Specific Existing Permission",
        nextTopicToPublish: "permissions.control.getPermission",
        roles: ["ADMIN", "SUPPORT", "CONTEST_SCHEDULER"],
        created_by: "SUPER",
    };

    const metadata = {
        // Not To Be Changed Fields

        clientId: "649d53b8-f60d-407c-8e99-63df20090abc", // This is Websocket Id Which will be used for sending back the data to the client
        requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
        actor: {
            userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
            role: "<role>", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
            token: "<userToken>", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
        },
        operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
        createdAt: "<Date in ISO String Format>", // Time when this request was created

        // To be Changed Fields

        source: "permission-service",
        updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
    };


    await sendEvent(topic, partition, data, metadata);
    return;
};



// AUTH SERVICE 
// Handle Signup Working Correctly 
// Issue JWT Working Correctly
// Handle Login Working Successfully
// const init = async () => {
//     await connectProducer();
//     const topic = "request";
//     const partition = 1;
//     const data = {
//         // name: "naya-10",
//         // user_name: "007",
//         email: "email",
//         password: "password",
//         // mobile_no: "mobile_no",
//     };

//     const metadata = {
//         // Not To Be Changed Fields

//         clientId: "b8251443-a234-454e-a0cb-2646ee26de81", // This is Websocket Id Which will be used for sending back the data to the client
//         requestId: "<requestId>", // This will be request id generated randomly but uniquely to traverse the path through which our request has been processed around in the system
//         actor: {
//             userId: "<userId>", // This will be used to fetch details of the user from the DB if Required
//             role: "USER", // Role of user will be only one of these: ADMIN , CONTEST_SCHEDULER , SUPPORT , USER , PUBLIC
//             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVtYWlsIiwicGFzc3dvcmQiOiJwYXNzd29yZCIsImlhdCI6MTc2ODgwNjkwNywiZXhwIjoxNzY5NDExNzA3fQ.B4GkR5wpUnsjvMvFmuoqQ4R1evV7y6K5ALWafnddsDI", // This is JWT Token of the User by which we will validate the aunthenticity of User and check if he or she is allowed to have the desired operation performed
//         },
//         operation: "<Any Operation Name Which is To be searched onto the Permission's Table>", // This will tell about what initial request was and processing will be done as per this 
//         createdAt: "<Date in ISO String Format>", // Time when this request was created

//         // To be Changed Fields

//         source: "permission-service",
//         updatedAt: "<Date in ISO String Format>", // Every other function will update this after its processing so that it can be tracked how much time that function took to execute
//     };


//     await sendEvent(topic, partition, data, metadata);
//     return ;
// };

init();