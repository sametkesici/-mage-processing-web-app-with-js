const formValidation = require("../validation/formValidation");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const passport = require("passport");
var mongodb = require("mongodb");



require("../authentication/passport/local");

//admin kitap ekleme

module.exports.postAdminAddBook = (req, res, next) => {
  var bookName = req.body.bookName;
  
  const isbnNumber = req.body.isbnNumber;
  console.log(req.files.imageFile);
  //Book name is stored in the bookname variable. Book's ISBN image is stored in imageFile object.
  if (!(req.files && req.files.imageFile)) {
    let imageFile = req.files.imageFile;
    console.log("Name of the image file: " + imageFile);
  }
  let imageAddress = "../isbnPictures/" + bookName.trim() + ".jpeg";

  //consola yazdır
  //console.log("Name of the image file: " + imageFile.bookName);
  //console.log("Image object: " + imageFile);
  console.log("Name of the book: " + bookName.trim());


  //dosyayı taşı
  req.files.imageFile.mv("./gorsel/" + bookName + ".jpeg", function (error) {
    if (error) {
      console.log("Couldn't upload the isbn image file.");
      console.log(error);
    } else {
      console.log("Image file successfully uploaded!");
      //readImageAndUploadBookInfo(imageAddress, bookName);
    }
  });

  var data1 = {
    bookName,
    isbnNumber,
  };

  // pushlamak için yorum satırı
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

    res.render("pages/admin");
  });
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
