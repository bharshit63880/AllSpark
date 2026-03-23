import mongoose from "mongoose";

const problemSchema = mongoose.Schema(
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
        tags: {
            type: [
                {
                    type: String,
                },
            ],
        },
        description: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            required: true,
        },
        is_public: {
            type: Boolean,
            required: true,
        },
        created_by: {
            type: String,
            required: true,
        },
        test_cases: {
            type: [
                {
                    type: {
                        language_id: {
                            type: Number,
                        },
                        public_test_cases: {
                            type: [
                                {
                                    type: {
                                        id: {
                                            type: String,
                                        },
                                        stdin: {
                                            type: String,
                                        },
                                        expected_output: {
                                            type: String,
                                        },
                                        cpu_time_limit: {
                                            type: Number,
                                        },
                                        memory_limit: {
                                            type: Number,
                                        },
                                        stack_limit: {
                                            type: Number,
                                        }
                                    },
                                },
                            ]
                        },
                        private_test_cases: {
                            type: [
                                {
                                    type: {
                                        id: {
                                            type: String,
                                        },
                                        stdin: {
                                            type: String,
                                        },
                                        expected_output: {
                                            type: String,
                                        },
                                        cpu_time_limit: {
                                            type: Number,
                                        },
                                        memory_limit: {
                                            type: Number,
                                        },
                                        stack_limit: {
                                            type: Number,
                                        }
                                    },
                                },
                            ]
                        },
                    },
                },
            ],
        },

    },
    { timestamps: true },
);

const Problem = mongoose.model("PROBLEM", problemSchema);

export default Problem;