const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define Schema
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  chapters: [
    {
      title: { type: String, required: true },
      content: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const UserDiary = mongoose.model("UserDiary", userSchema);

// 🔹 Get user's diary (all chapters)
app.get("/diary/:name", async (req, res) => {
  try {
    const { name } = req.params;
    let userDiary = await UserDiary.findOne({ name });

    if (!userDiary) {
      userDiary = await new UserDiary({ name, chapters: [] }).save();
    }

    res.json(userDiary.chapters);
  } catch (error) {
    res.status(500).json({ error: "Error fetching diary" });
  }
});

// 🔹 Add a new chapter
app.post("/diary/:name/add", async (req, res) => {
  try {
    const { name } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    let userDiary = await UserDiary.findOne({ name });

    if (!userDiary) {
      userDiary = new UserDiary({ name, chapters: [] });
    }

    const newChapter = { title, content: "", createdAt: new Date() };
    userDiary.chapters.push(newChapter);

    userDiary.markModified("chapters"); // 🔹 Fix: Ensure changes are detected
    await userDiary.save();

    res.json(userDiary.chapters);
  } catch (error) {
    res.status(500).json({ error: "Error adding chapter" });
  }
});

// 🔹 Edit chapter content (fixing save issue)
app.put("/diary/:name/edit/:id", async (req, res) => {
  try {
    const { name, id } = req.params;
    const { content } = req.body;

    let userDiary = await UserDiary.findOne({ name });

    if (!userDiary) {
      return res.status(404).json({ error: "User not found" });
    }

    let chapter = userDiary.chapters.id(id); // Find chapter by MongoDB ID
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    chapter.content = content;

    userDiary.markModified("chapters"); // Ensure changes are detected
    await userDiary.save();

    res.json(userDiary.chapters);
  } catch (error) {
    res.status(500).json({ error: "Error updating chapter" });
  }
});

// Start Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
