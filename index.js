const express = require("express");
const connectDB = require("./config/connectDB");
const app = express();

const cors = require("cors");
app.use(cors());

require("dotenv").config();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.use("/auth", require("./routes/authRouter"));
app.use("/api/albums", require("./routes/albumRouter"));
app.use("/api/images", require("./routes/imageRouter"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
