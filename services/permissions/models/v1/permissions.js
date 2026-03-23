import mongoose from "mongoose";


const permissionSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        nextTopicToPublish: {
            type: String,
            required: true,
        },
        roles: {
            type: [
                {
                    type: String,
                },
            ]
        },
        created_by: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const Permission = mongoose.model("PERMISSION", permissionSchema);

export default Permission;
