import mongoose from "mongoose";


const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
        user_name: {
            type: String,
            required: true,
            unique: true,
        },
        activation_status: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        mobile_no: {
            type: String,
            required: true,
        },
        tried_problems: {
            type: [
                {
                    problem_id: {
                        type: String,
                    },
                    status: {
                        type: String,
                    },
                    submissions: {
                        type: [
                            {
                                type: String,
                            },
                        ]
                    },
                }
            ]
        },
        participated_in_contests: {
            type: [
                {
                    type: String,
                },
            ]
        },

    },
    { timestamps: true },
);

const User = mongoose.model("USER", userSchema);

export default User;
