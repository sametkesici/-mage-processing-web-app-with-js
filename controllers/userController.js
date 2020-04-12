const formValidation = require("../validation/formValidation");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Book = require("../models/Book");
const BooksAndUsers = require("../models/BooksAndUsers");
const passport = require("passport");
var mongodb = require("mongodb");
const { createWorker } = require("tesseract.js");
//var imageThreshold = require("image-filter-threshold");


//var nWorkers = 4;
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
  console.log("Name of the book: " + bookName);

  let isbn = "";

  var data1 = {
    bookName,
    isbn,
  };

  //let image = imageThreshold(req.files.imageFile, { imageThreshold: 30 }, nWorkers);

  //dosyayı taşı
  req.files.imageFile.mv(imageAddress, async function (error) {
    if (error) {
      console.log("Couldn't upload the isbn image file.");
      console.log(error);
    } else {
      console.log("Image file successfully uploaded!");
      /*readText(imageAddress)
        .then((isbnNumber) => {
          data1.isbn = isbnNumber;
          console.log("mahmuuut"+ data1.isbn)
        })
        .catch();*/
      data1.isbn = await readText(imageAddress);
      await saveToDatabase(data1);
    }
  });

  const worker = createWorker();

  async function readText(imageAddress, book) {
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const {
      data: { text },
    } = await worker.recognize(imageAddress);
    console.log(text);
    await worker.terminate();
    //get the isbn number from readed text
    let textArr = text.split("\n");
    var isbnText = "";
    var i;

    for (i = 0; i < textArr.length; i++) {
      var str = textArr[i];
      if (str.includes("ISBN")) {
        isbnText = textArr[i];
      }
    }
    isbnText = isbnText.replace("ISBN", "");
    let isbnNumber = isbnText.replace(/-/g, "");
    isbnNumber = isbnNumber.replace(/\D/g, "");
    console.log(isbnNumber);
    return isbnNumber;
  }

  // pushlamak için yorum satırı
  async function saveToDatabase(data1) {
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
