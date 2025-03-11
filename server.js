const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.end.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define Schema
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true }, // User's name (unique)
  chapters: [
    {
      title: String,
      content: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

// Create Model
const UserDiary = mongoose.model("UserDiary", userSchema);

// 🔹 Get user's diary (all chapters)
app.get("/diary/:name", async (req, res) => {
  try {
    const { name } = req.params;
    let userDiary = await UserDiary.findOne({ name });

    if (!userDiary) {
      userDiary = await new UserDiary({ name, chapters: [] }).save(); // Create entry if not exists
    }

    res.json(userDiary.chapters);
  } catch (error) {
    res.status(500).json({ error: "Error fetching diary" });
  }
});

// 🔹 Add a new chapter to user's diary
app.post("/diary/:name/add", async (req, res) => {
  try {
    const { name } = req.params;
    const { title } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    let userDiary = await UserDiary.findOne({ name });

    if (!userDiary) {
      userDiary = new UserDiary({ name, chapters: [] });
    }

    const newChapter = { title, content: "", createdAt: new Date() };
    userDiary.chapters.push(newChapter);
    await userDiary.save();

    res.json(newChapter);
  } catch (error) {
    res.status(500).json({ error: "Error adding chapter" });
  }
});

// 🔹 Edit an existing chapter's content
app.put("/diary/:name/edit/:index", async (req, res) => {
  try {
    const { name, index } = req.params;
    const { content } = req.body;

    let userDiary = await UserDiary.findOne({ name });

    if (!userDiary) return res.status(404).json({ error: "User not found" });

    if (!userDiary.chapters[index]) return res.status(404).json({ error: "Chapter not found" });

    userDiary.chapters[index].content = content;
    await userDiary.save();

    res.json(userDiary.chapters[index]);
  } catch (error) {
    res.status(500).json({ error: "Error updating chapter" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
