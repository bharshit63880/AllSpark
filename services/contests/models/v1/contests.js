import mongoose from "mongoose";


const contestSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        created_by: {
            type: String,
            required: true,
        },
        support_team: {
            type: [
                {
                    type: String,
                },
            ],
        },
        problems: {
            type: [
                {
                    type: String,
                },
            ],
        },
        start_time: {
            type: Date,
        },
        end_time: {
            type: Date,
        },
        duration: {
            type: Number, // In Milliseconds
        },
        support_end_time: {
            type: Date,
        },
    },
    { timestamps: true },
);

const Contest = mongoose.model("CONTEST", contestSchema);

export default Contest;
