const mongoose = require('mongoose');

async function connectToDb(url) {
    try {
        await mongoose.connect(url, {
            useUnifiedTopology:true,
            useNewUrlParser:true
        });
        console.log("Mongodb connection successfull");
    }
    catch(err) {
        console.log(err.message)
        console.log("Some error occured while connecting to the db")
    }
}

module.exports = connectToDb;