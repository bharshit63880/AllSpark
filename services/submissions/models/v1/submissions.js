import mongoose from "mongoose";


const submissionSchema = mongoose.Schema(
    {
        contest_id: {
            type: String,
            required: false, // only set for contest submissions
        },
        problem_id: {
            type: String,
            required: true,
        },
        is_for_public_test_cases: {
            type: Boolean,
            required: true,
        },
        is_cpu_executed: {
            type: Boolean,
            required: true,
        },
        test_cases: {
            type: [
                {
                    type: {
                        // These Will Be Required At the Time Of Creation of Submission
                        stdin: {
                            type: String,
                            required: true,
                        },
                        expected_output: {
                            type: String,
                            required: true,
                        },

                        // These Are Optional Parameters and if not Given They will be Considered to take from Default Configurations of the JUDGING SERVICE
                        cpu_time_limit: {
                            type: Number,
                        },
                        memory_limit: {
                            type: Number,
                        },
                        stack_limit: {
                            type: Number,
                        },

                        // These Will Be Required to Update Status of Each Test Case at Time Of Updation of Submission When Judged
                        stdout: {
                            type: String,
                        },
                        status: {
                            type: {
                                id: {
                                    type: Number,
                                },
                                description: {
                                    type: String,
                                },
                            },
                        },
                        token: {
                            type: String,
                        },
                        stderr: {
                            type: String,
                        },
                    },
                },
            ],
        },
        created_by: {
            type: String,
            required: true,
        },
        source_code: {
            type: String,
            required: true,
        },
        language_id: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);

const Submission = mongoose.model("SUBMISSION", submissionSchema);

export default Submission;
