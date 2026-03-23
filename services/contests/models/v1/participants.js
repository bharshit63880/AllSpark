import mongoose from "mongoose";


const participantSchema = mongoose.Schema(
    {
        // contest_id, user_id, submissions should be the foreign keys but since we are trying to do the not to relate individual services thus keep the data seperate from the implementation
        contest_id: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
        },
        problems_solved: {
            type: Number,
        },
        submissions: {
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
        total_duration: {
            type: Number, // In Milliseconds
        },
    },
    { timestamps: true },
);

const Participant = mongoose.model("PARTICIPANT", participantSchema);

export default Participant;
