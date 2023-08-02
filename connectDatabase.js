const mongoose = require("mongoose");
const logger = require("./logger");

// Connexion à la base de données.
exports.connect = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		
		logger.info(
			"Connexion à la base de données réussie !"
		);
	}
	catch (e) {
		logger.error(
			`Une erreur est survenue pendant la connexion à la base de données\n${e}`
		);
	}
};