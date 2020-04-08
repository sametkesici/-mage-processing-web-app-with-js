const formValidation = require("../validation/formValidation");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const passport = require("passport");
var mongodb = require("mongodb");
const { createWorker } = require("tesseract.js");



require("../authentication/passport/local");

//admin kitap ekleme

module.exports.postAdminAddBook = (req, res, next) => {
  var bookName = req.body.bookName;
  
  console.log(req.files.imageFile);
  //Book name is stored in the bookname variable. Book's ISBN image is stored in imageFile object.
  if (!(req.files && req.files.imageFile)) {
    let imageFile = req.files.imageFile;
    console.log("Name of the image file: " + imageFile);
  }
  bookName = bookName.split(" ").join("");
  let imageAddress = "./gorsel/" + bookName + ".jpeg";

  //consola yazdır
  //console.log("Name of the image file: " + imageFile.bookName);
  //console.log("Image object: " + imageFile);
  console.log("Name of the book: " + bookName);

  let isbn = "";
  //dosyayı taşı
  req.files.imageFile.mv(imageAddress, function (error) {
    if (error) {
      console.log("Couldn't upload the isbn image file.");
      console.log(error);
    } else {
      console.log("Image file successfully uploaded!");
      readText(imageAddress);
    }
  });

  const worker = createWorker();

  
  async function readText ( imageAddress ) {
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize( imageAddress );
      console.log(text);
      await worker.terminate();
      //get the isbn number from readed text
      let textArr = text.split("\n");
      var isbnText = "";
      var i;

      for(i= 0; i < textArr.length; i++){
        var str = textArr[i];
        if (str.includes("ISBN")){
          isbnText = textArr[i];
        }
      }
      isbnText = isbnText.replace("ISBN", "");
      let isbnNumber = isbnText.replace(/-/g, "");
      isbnNumber = isbnNumber.replace(/\D/g, '')
      console.log(isbnNumber);
      return isbnNumber;
      
    }

    console.log(isbn +"outside func");
  

  var data1 = {
    bookName,
    isbn,
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
