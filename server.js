const express = require("express");
const connectDB = require("./config/db.js");
const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Init middleware
// body-parser is now built in to express instead of having to install it separately
app.use(express.json({extended: false}));

// requests made to the root return api running msg
app.get("/", (req, res) => {
    res.send("API Running.");
});

// routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});
