
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    experienceLevel: {
      type: String,
      enum: ["Fresher", "Junior", "Mid-Level", "Senior"],
      default: "Fresher",
    },

    questions: {
      type: [String],
      default: [],
    },
        resumeText: {
      type: String,
      default: "",
      select: false,
    },
    answers: [
  {
    question: String,
    answer: String,
    score: Number,
    feedback: String,
  },
],
    
    attempts: [
    {
        answers: [
        {
            question: String,
            answer: String,
            score: Number,
            feedback: String,
        },
        ],
        score: {
        type: Number,
        default: null,
        },
        completedAt: {
        type: Date,
        default: Date.now,
        },
    },
    ],

    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);
