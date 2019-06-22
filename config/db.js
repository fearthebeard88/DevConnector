const mongoose = require("mongoose");
const config = require("config");

// db represents the url we are using to connect to mongo
const db = config.get("mongoURI");

const connectDB = async () => {
    try {
        // wait for a response from the mongodb server
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log("MongoDB is connected.");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
