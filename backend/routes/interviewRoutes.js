const express = require("express");
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});


router.post("/:id/generate-questions", authMiddleware, async (req, res) => {
  try {
    const { GoogleGenAI } = require("@google/genai");

    if (!mongoose.isValidObjectId(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid interview ID.",
  });
}


const interview = await Interview.findOne({
  _id: req.params.id,
  user: req.user.id,
}).select("+resumeText");

if (!interview) {
  return res.status(404).json({
    success: false,
    message: "Interview not found",
  });
}

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const resumeSection = interview.resumeText
  ? `

Candidate's resume:
${interview.resumeText}

Generate questions tailored to the candidate's skills, projects, experience, and technologies mentioned in the resume. Do not assume skills or experience that are not present in the resume.`
  : "";

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: `Generate 8 technical interview questions for the role "${interview.role}" at the "${interview.experienceLevel}" level.
${resumeSection}

Return only the questions, one per line, without numbering or explanations.`,
});

    const questions = (response.text || "")
      .split("\n")
      .map((q) => q.replace(/^\d+[\).\s-]*/, "").trim())
      .filter(Boolean);

    if (questions.length === 0) {
      throw new Error("AI did not generate any questions.");
    }

    const updatedInterview = await Interview.findOneAndUpdate(
  {
    _id: req.params.id,
    user: req.user.id,
  },
  { $set: { questions } },
  { new: true, runValidators: true }
);

if (!updatedInterview) {
  return res.status(404).json({
    success: false,
    message: "Interview not found.",
  });
}

    res.json({ success: true, data: updatedInterview });
  } catch (error) {
    console.error("AI question generation error:", error);
    res.status(500).json({
      success: false,
      message: "Could not generate questions. Check your API key and server logs.",
    });
  }
});

// CREATE an interview
router.post("/", authMiddleware, upload.single("resume"), async (req, res) => {  try {
    const { title, role, experienceLevel } = req.body;
    let resumeText = "";

if (req.file) {
  try {
    const pdfBuffer = req.file.buffer;

    // Verify that the uploaded file is actually a PDF
    if (pdfBuffer.subarray(0, 5).toString() !== "%PDF-") {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF file.",
      });
    }

    const pdfData = await pdfParse(pdfBuffer);
    resumeText = (pdfData.text || "").trim().slice(0, 20000);

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in PDF. Please upload a text-based PDF.",
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Could not read this PDF. Please try another PDF.",
    });
  }
}
    if (
      typeof title !== "string" || !title.trim() ||
      typeof role !== "string" || !role.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and role are required.",
      });
    }

    const interview = await Interview.create({
  user: req.user.id,
  title: title.trim(),
  role: role.trim(),
  experienceLevel,
  resumeText,
});

    res.status(201).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create interview.",
    });
  }
});

// READ all interviews
router.get("/", authMiddleware, async (req, res) => {
  try {
    const interviews = await Interview.find({
  user: req.user.id,
}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews.",
    });
  }
});

// READ one interview
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID.",
      });
    }

   
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    res.status(200).json({ success: true, data: interview });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview.",
    });
  }
});

// UPDATE an interview
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID.",
      });
    }

    const allowedFields = [
  "title",
  "role",
  "experienceLevel",
  "status",
];
   

    const updates = {};
    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update.",
      });
    }

    const interview = await Interview.findOneAndUpdate(
  {
    _id: req.params.id,
    user: req.user.id,
  },
  updates,
  { new: true, runValidators: true }
);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not update interview.",
    });
  }
});

// DELETE an interview
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID.",
      });
    }

    const interview = await Interview.findOneAndDelete({
  _id: req.params.id,
  user: req.user.id,
});
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Interview deleted successfully.",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete interview.",
    });
  }
});


router.post("/:id/evaluate-answer", authMiddleware, async (req, res) => {
  try {
    const { question, answer, attemptId } = req.body;

if (
  typeof question !== "string" ||
  !question.trim() ||
  typeof answer !== "string" ||
  !answer.trim() ||
  typeof attemptId !== "string" ||
  !mongoose.isValidObjectId(attemptId)
) {
  return res.status(400).json({
    success: false,
    message:
      "A valid question, answer, and attempt ID are required.",
  });
}

    if (!mongoose.isValidObjectId(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid interview ID.",
  });
}

const interview = await Interview.findOne({
  _id: req.params.id,
  user: req.user.id,
});

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `Evaluate this interview answer for the role ${interview.role} at ${interview.experienceLevel} level.

Question: ${question}
Candidate's answer: ${answer}

Return ONLY valid JSON in this format:
{"score": 75, "feedback": "Specific constructive feedback"}

Score must be an integer from 0 to 100. Give feedback on correctness, clarity, and what could be improved.`,
    });

    const text = response.text || "";
    const jsonText = text.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(jsonText);

   
const rawScore =
  typeof evaluation.score === "number"
    ? evaluation.score
    : Number.parseInt(
        String(evaluation.score ?? "").match(/\d+/)?.[0] ?? "",
        10
      );

if (!Number.isFinite(rawScore) || !evaluation.feedback) {
  throw new Error("AI returned an invalid score or feedback.");
}

const score = Math.max(0, Math.min(100, Math.round(rawScore)));


    // if (!Number.isFinite(score) || !evaluation.feedback) {
    //   throw new Error("AI returned an invalid evaluation.");
    // }

    
const attempt = interview.attempts.id(attemptId);

if (!attempt) {
  return res.status(404).json({
    success: false,
    message: "Interview attempt not found.",
  });
}
const questionExists = interview.questions.some(
  (q) => q.trim() === question.trim()
);

if (!questionExists) {
  return res.status(400).json({
    success: false,
    message: "Question does not belong to this interview.",
  });
}
attempt.answers.push({
  question,
  answer,
  score,
  feedback: evaluation.feedback,
});



const validScores = attempt.answers
  .map((item) => Number(item.score))
  .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);

if (validScores.length === 0) {
  throw new Error("No valid answer scores were saved.");
}

const totalScore = validScores.reduce((sum, value) => sum + value, 0);
const averageScore = Math.round(totalScore / validScores.length);

if (!Number.isFinite(averageScore)) {
  throw new Error("Calculated average score is invalid.");
}

attempt.score = averageScore;
interview.score = averageScore;



await interview.save();


    res.json({
      success: true,
      data: {
        score,
        feedback: evaluation.feedback,
        overallScore: interview.score,
      },
    });
  } catch (error) {
    console.error("Answer evaluation error:", error);
    res.status(500).json({
      success: false,
      message: "Could not evaluate the answer.",
    });
  }
});

router.post("/:id/start-attempt", authMiddleware, async (req, res) => {  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid interview ID.",
  });
}

const interview = await Interview.findOne({
  _id: req.params.id,
  user: req.user.id,
});
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    interview.attempts.push({ answers: [], score: null });
    interview.status = "draft";

    await interview.save();

    const attempt = interview.attempts[interview.attempts.length - 1];

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        interview,
      },
    });
  } catch (error) {
    console.error("Start attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Could not start a new attempt.",
    });
  }
});

module.exports = router;
