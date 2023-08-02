const winston = require("winston");
const path = require("path");

const msgLogger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			filename: path.join(__dirname, "./logs/messages.log")
		})
	],
	format: winston.format.printf((log) => `[${new Date().toLocaleString()}] - ${log.message}`)
});

module.exports = msgLogger;
