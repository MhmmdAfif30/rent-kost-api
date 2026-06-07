const express = require("express");
require("express-async-errors");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const helmet = require("helmet");
const compression = require("compression");
const unknownEndpoint = require("./middleware/unKnownEndpoint");
const { handleError } = require("./helpers/error");
const { checkConnection } = require("./config");

const app = express();

app.set("trust proxy", 1);
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(compression());
app.use(helmet());
app.use(cookieParser());

app.use("/api", routes);

app.get("/", (req, res) =>
  res.send("<h1 style='text-align: center'>HAHALO</h1>")
);

app.get("/check-db", async (req, res) => {
  try {
    const isConnected = await checkConnection();
    res.json({
      success: isConnected,
      message: isConnected
        ? "Koneksi database OK"
        : "Koneksi database gagal",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat cek koneksi database",
      error: error.message,
    });
  }
});

app.use(unknownEndpoint);
app.use(handleError);

module.exports = app;
