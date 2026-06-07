require("dotenv").config({ path: __dirname + "/.env" });
const http = require("http");
const app = require("./app");
const { logger } = require("./utils/logger");

const server = http.createServer(app);

const PORT = process.env.PORT || 9530;

server.listen(PORT, () => logger.info(`Magic happening on port: ${PORT}`));
