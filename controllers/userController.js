const formValidation = require("../validation/formValidation")
const bcrypt = require('bcrypt');
const User = require("../models/User")
const passport = require("passport")
require("../authentication/passport/local");



module.exports.getUserLogin = (req, res, next) => {
    res.render("pages/login")
}

module.exports.getUserLogout = (req, res, next) => {

    req.logout();
    req.flash("success","successfully logout")
    res.redirect("/login")
}

module.exports.getUserRegister = (req, res, next) => {
    res.render("pages/register")
}

module.exports.postUserLogin = (req, res, next) => {
    passport.authenticate("local",{
        successRedirect : "/",
        failureMessage : "/login",
        failureMessage : true,
        successFlash : true,

    })(req,res,next)
};

module.exports.postUserRegister = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const errors = [];
    const validationErrors = formValidation.registerValidation(
        username,
        password

    );


    //ServerSide Validation
    if (validationErrors.length > 0) {
        return res.render("pages/register", {
            username: username,
            password: password,
            errors: validationErrors
        })
    }


    User.findOne({
        username
    }).then(user => {
        if (user) {
            errors.push({ message: "Username Already In Use" });
            return res.render("pages/register", {
                username: username,
                password: password,
                errors: errors,
            })
        }



        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                // Store hash in your password DB.
                if (err) throw err;
                const newUser = new User({
                    username: username,
                    password: hash

                });

                newUser
                    .save()
                    .then(() => {
                        console.log("succesful");
                        req.flash("flashSuccess","Successfully Register");
                        
                        res.redirect("/");
                    }).catch(err => console.log(err));
            });
        });

    }).catch(err => console.log(err));




}