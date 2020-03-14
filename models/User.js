const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({

    username : {
        type : String,
        required : true
    },

    password : {
        type : String,
        required : true
    },

    isAdmin : {
        type : Boolean,
        required : false,
        default : false
    }

    
})

const BookSchema = new Schema ({

    bookName : {
        type : String,
        required : true
    },
    
    isbnNumber : {
        type : String,
        required : true
        


    }

})

 

const User = mongoose.model("User",UserSchema);


module.exports = User;