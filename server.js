const express = require("express");

const app = express();
app.use(express.json());

app.use("/api", require("./routes/pdf-extract"));

app.listen(process.env.PORT || 4000, console.log("Server is running"));
