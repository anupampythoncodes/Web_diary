require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const mongo_uri = "mongodb+srv://anupamsingh1414:rishisingh@instadata.wxmcy.mongodb.net/
// Connect to MongoDB
mongoose
  .connect(mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Chapter Schema
const ChapterSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const UserDiarySchema = new mongoose.Schema({
  username: String,
  chapters: [ChapterSchema],
});

const Diary = mongoose.model("Diary", UserDiarySchema);

// API Routes

// Get user's diary (sorted by date)
app.get("/diary/:name", async (req, res) => {
  const { name } = req.params;
  let userDiary = await Diary.findOne({ username: name });

  if (!userDiary) {
    userDiary = new Diary({ username: name, chapters: [] });
    await userDiary.save();
  }

  res.json(
    userDiary.chapters.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )
  );
});

// Add a new chapter
app.post("/diary/:name/add", async (req, res) => {
  const { name } = req.params;
  const { title, content } = req.body;

  let userDiary = await Diary.findOne({ username: name });

  if (!userDiary) {
    userDiary = new Diary({ username: name, chapters: [] });
  }

  userDiary.chapters.push({ title, content });
  await userDiary.save();

  res.json({ message: "Chapter added", chapters: userDiary.chapters });
});

// Edit a chapter
app.put("/diary/:name/edit/:chapterId", async (req, res) => {
  const { name, chapterId } = req.params;
  const { title, content } = req.body;

  let userDiary = await Diary.findOne({ username: name });
  if (!userDiary) return res.status(404).json({ message: "Diary not found" });

  const chapter = userDiary.chapters.id(chapterId);
  if (!chapter) return res.status(404).json({ message: "Chapter not found" });

  chapter.title = title;
  chapter.content = content;
  await userDiary.save();

  res.json({ message: "Chapter updated", chapters: userDiary.chapters });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
