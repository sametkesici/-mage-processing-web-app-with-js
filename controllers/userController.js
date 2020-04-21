const formValidation = require("../validation/formValidation");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Book = require("../models/Book");
const BooksAndUsers = require("../models/BooksAndUsers");
const passport = require("passport");
var mongodb = require("mongodb");
const { createWorker } = require("tesseract.js");
//var imageThreshold = require("image-filter-threshold");
const mongoose = require("mongoose");

var now = new Date();
require("../authentication/passport/local");

module.exports.postTimeLapse = async (req, res, next) => {
  console.log("ilerlenecek gun : " + req.body.zamanAtlama);
  now = now.setDate(now.getDate() + Number(req.body.zamanAtlama));
  now = new Date(now);
  console.log("değişmiş tarih: " + now);

  res.render("pages/admin");
};
module.exports.getTimeLapse = async (req, res, next) => {
  res.render("pages/admin");
};

async function removeBookFromUser(isbn, userIds) {
  console.log("\n\nKİTAP SİLİNME BAŞLADI");
  console.log("ŞUANKİ KULLANICI", userIds);
  console.log("SİLİNECEK ISBN:", isbn);

  var MongoClient = require("mongodb").MongoClient;
  MongoClient.connect("mongodb://localhost:27017/", function (err, db) {
    if (err) throw err;
    var dbo = db.db("yazlabdb");
    let jsonDataForUpdate = {
      $pull: {
        books: {
          bookIsbn: isbn,
        },
      },
    };
    let query = { userId: userIds };
    dbo
      .collection("BooksAndUsers")
      .updateOne(query, jsonDataForUpdate, function (err, res) {
        if (err) throw err;
        console.log("1 document updated");
        db.close();
        return true;
      });
  });
}

module.exports.postKitapVer = async (req, res, next) => {
  console.log("seçilen dosyanın adı : " + req.files.imageFile.name);
  //Book name is stored in the bookname variable. Book's ISBN image is stored in imageFile object.
  if (!(req.files && req.files.imageFile)) {
    let imageFile = req.files.imageFile.name;
    console.log("Name of the image file: " + imageFile);
  }
  let tempAdress = "./gorsel/temp.jpg";
  //dosyayı taşı
  req.files.imageFile.mv(tempAdress, async function (error) {
    if (error) {
      console.log("Couldn't upload the isbn image file.");
      console.log(error);
    } else {
      console.log("Image file successfully uploaded!");
      let isbn = await readText(tempAdress);
      console.log("isbn : " + isbn);
      let responseFromRemove;
      if (req.user._id) {
        responseFromRemove = await removeBookFromUser(isbn, req.user._id);

        if (responseFromRemove) {
          console.log("BAŞARIYLA GERÇEKTEN SİLİNDİ", data);
          res.render("pages/kitapver");
        } else {
          console.log(
            responseFromRemove + "\nBAŞARIYLA HATA GELDİ ABİ BUNEDİR"
          );
          res.render("pages/kitapver");
        }
      } else {
        console.log("KULLANICI GİRİŞ YAPILMADI");
        res.render("pages/kitapver");
      }
    }
  });

  //read isbn number from given image folder
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
    console.log("RESİMDEN OKUNDU ISBN::::", isbnNumber);
    return isbnNumber;
  }
};

module.exports.getKitapVer = (req, res, next) => {
  res.render("pages/kitapver");
};
module.exports.postKitapVarmi = (req, res, next) => {
  var MongoClient = require("mongodb").MongoClient;
  var url = "mongodb://localhost:27017/";
  const query = { books: [{ bookIsbn: req.body.id }] };
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("yazlabdb");
    dbo
      .collection("BooksAndUsers")
      .find({})
      .toArray(function (err, result) {
        if (err) throw err;

        let sendBool = false;
        result.forEach((book) => {
          book.books.forEach((item) => {
            if (item.bookIsbn == req.body.id) {
              sendBool = true;
            }
          });
        });
        res.send(sendBool);
        db.close();
      });
  });
};

module.exports.getKitapZaman = (req, res, next) => {
  console.log({ SISTEMZAMANI: now });
  var MongoClient = require("mongodb").MongoClient;
  var url = "mongodb://localhost:27017/";
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("yazlabdb");
    dbo
      .collection("BooksAndUsers")
      .find({})
      .toArray(function (err, result) {
        if (err) throw err;

        let sendBool = false;
        result.forEach((book) => {
          book.books.forEach((item) => {
            console.log({ KITABINTARIHI: item.returnDate });
            if (item.returnDate.getTime() < now.getTime()) {
              sendBool = true;
            }
          });
        });
        res.send(sendBool);
        db.close();
      });
  });
};

module.exports.postKitapAra = (req, res, next) => {
  //console.log({ Alo: req.user });
  let bookItem = [];

  let tempDate = new Date(now);
  var nextWeek = tempDate.setDate(tempDate.getDate() + 7);
  nextWeek = new Date(nextWeek);

  for (var key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      console.log("blablalbal : " + req.body[key].isbnNumber);
      bookItem.push({
        bookIsbn: req.body[key].isbnNumber,
        bookDate: now,
        returnDate: nextWeek,
      });
    }
  }

  let jsonDataForSend = {
    userId: req.user._id,
    books: bookItem,
  };
  const query = { userId: req.user._id };

  var MongoClient = require("mongodb").MongoClient;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("yazlabdb");
    dbo
      .collection("BooksAndUsers")
      .find(query)
      .toArray(function (err, result) {
        if (err) throw err;
        if (result.length !== 0) {
          if (result[0].books.length >= 3) {
            res.send(false);
          } else {
            let newBookArray = [];
            result.forEach((book) => {
              newBookArray.push(...book.books);
            });

            let newBookItem = [...newBookArray, ...bookItem];
            console.log({ TEKAT: newBookItem });
            console.log({ TEKAT2: result });
            let jsonDataForUpdate2 = {
              $set: {
                userId: req.user._id,
                books: newBookItem,
              },
            };
            dbo
              .collection("BooksAndUsers")
              .updateOne(query, jsonDataForUpdate2, function (err, res) {
                if (err) throw err;
                console.log("1 document updated");
                db.close();
              });
          }
        } else {
          dbo
            .collection("BooksAndUsers")
            .insertOne(jsonDataForSend, function (err, res) {
              if (err) throw err;
              console.log({ ALO: JSON.stringify(res) });
              console.log("1 document inserted");
              db.close();
            });
        }
        console.log(result);
        db.close();
      });
  });
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

  let isbnNumber = "";

  var data1 = {
    bookName,
    isbnNumber,
  };

  //dosyayı taşı
  req.files.imageFile.mv(imageAddress, async function (error) {
    if (error) {
      console.log("Couldn't upload the isbn image file.");
      console.log(error);
    } else {
      console.log("Image file successfully uploaded!");
      data1.isbnNumber = await readText(imageAddress);
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
  console.log("değişmiş zaman burada da çalışmalı ?? " + now);
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
