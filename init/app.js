const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { insertMany } = require("../models/listing");

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

main().then(() => {
        console.log("Connected to DB");
    }).catch((err) => {
        console.log(err);
    });
    
async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "69e44e859188ce593f654c46"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
}

initDB();
