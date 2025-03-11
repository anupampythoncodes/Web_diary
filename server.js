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
const chapterSchema = new mongoose.Schema({
  name: String, // User's name
  title: String, // Chapter title
  content: { type: String, default: "" }, // Chapter content
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

// Create Model
const Chapter = mongoose.model("Chapter", chapterSchema);

// 🔹 Get all chapters for a user
app.get("/diary/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const chapters = await Chapter.find({ name }).sort({ createdAt: 1 }); // Sort by date
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chapters" });
  }
});

// 🔹 Add a new chapter
app.post("/diary/:name/add", async (req, res) => {
  try {
    const { name } = req.params;
    const { title } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const newChapter = new Chapter({ name, title });
    await newChapter.save();

    res.json(newChapter);
  } catch (error) {
    res.status(500).json({ error: "Error adding chapter" });
  }
});

// 🔹 Edit an existing chapter (only content)
app.put("/diary/:name/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "Content cannot be empty" });

    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      { content },
      { new: true } // Returns updated document
    );

    if (!updatedChapter) return res.status(404).json({ error: "Chapter not found" });

    res.json(updatedChapter);
  } catch (error) {
    res.status(500).json({ error: "Error updating chapter" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
