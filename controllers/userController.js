const formValidation = require("../validation/formValidation");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Book = require("../models/Book");
const BooksAndUsers = require("../models/BooksAndUsers");
const passport = require("passport");
var mongodb = require("mongodb");
require("../authentication/passport/local");

module.exports.postKitapAra = (req, res, next) => {
  console.log(req.body);
  for (var key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      console.log(req.body[key].bookName);
    }
  }
  console.log(req.user);
};

module.exports.getKitapAra = (req, res, next) => {
  function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    Book.find({ bookName: regex }, function (err, books) {
      if (err) {
        console.log(err);
      } else {
        res.render("pages/kitapara", { books });
      }
    });
  } else {
    Book.find({})
      .then((books) => {
        res.render("pages/kitapara", { books });
      })
      .catch((err) => console.log(err));
  }

  //  if (req.query.search) {
  //      Book.find({"bookName": req.query.search})
  //      .then(books => {
  //         res.render("pages/kitapara",{books});
  //         console.log({ALO:books})
  //      })
  //      .catch(err =>console.log(err));

  //   }else{
  //      Book.find({})
  //     .then(books =>
  //      {

  //          res.render("pages/kitapara",{ books });
  //      })
  //      .catch(err => console.log(err));
  //   }
};

//admin kitap ekleme
module.exports.postAdminAddBook = (req, res, next) => {
  const bookName = req.body.bookName;
  const isbnNumber = req.body.isbnNumber;

  var data1 = {
    bookName,
    isbnNumber,
  };

  if (bookName != "" || isbnNumber != "") {
    mongodb.MongoClient.connect("mongodb://localhost", function (err, client) {
      if (err) throw err;

      const db = client.db("yazlabdb");
      var Data = [data1];

      db.collection("books").insertMany(
        Data,
        (forceServerObjectId = true),
        function (err, data) {
          if (err != null) {
            return console.log(err);
          }
          console.log(data.ops);
        }
      );
    });
  } else {
    res.render("pages/admin");
  }
};

module.exports.getUserLoginAdmin = (req, res, next) => {
  res.render("pages/admin");
};

module.exports.getUserLogin = (req, res, next) => {
  res.render("pages/login");
};

module.exports.getUserLogout = (req, res, next) => {
  req.logout();
  req.flash("success", "successfully logout");
  res.redirect("/login");
};

module.exports.getUserRegister = (req, res, next) => {
  res.render("pages/register");
};

module.exports.postUserLogin = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureMessage: "/login",
    failureMessage: true,
    successFlash: true,
  })(req, res, next);
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
      errors: validationErrors,
    });
  }

  User.findOne({
    username,
  })
    .then((user) => {
      if (user) {
        errors.push({ message: "Username Already In Use" });
        return res.render("pages/register", {
          username: username,
          password: password,
          errors: errors,
        });
      }

      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
          // Store hash in your password DB.
          if (err) throw err;
          const newUser = new User({
            username: username,
            password: hash,
          });

          newUser
            .save()
            .then(() => {
              console.log("succesful");
              req.flash("flashSuccess", "Successfully Register");

              res.redirect("/");
            })
            .catch((err) => console.log(err));
        });
      });
    })
    .catch((err) => console.log(err));
};
