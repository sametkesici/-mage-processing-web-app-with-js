const express = require("express");
const exphbs = require("express-handlebars");
const UserRouter = require("./routes/users");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const BooksAndUsers = require("./models/BooksAndUsers");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const cookiePartser = require("cookie-parser");
const fileUpload = require("express-fileupload");

mongoose
  .connect("mongodb://localhost:27017/yazlabdb", {
    useCreateIndex: true,
    useNewUrlParser: true,
  })
  .then((data) => {
    console.log("CONNECTED DATABASE FROM APP.JS");
  });
mongoose.Promise = global.Promise;

const app = express();
const PORT = 5000;

app.use(cookiePartser("yazlab"));
app.use(
  session({
    cookie: { maxAge: 60000 },
    resave: true,
    secret: "yazlab",
    saveUninitialized: true,
  })
);
app.use(flash());

//passport-

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.flashSuccess = req.flash("flashSuccess");
  res.locals.flashError = req.flash("flashError");

  res.locals.passportFailure = req.flash("error");
  res.locals.passportSuccess = req.flash("success");

  res.locals.user = req.user;

  next();
});

//mongoose-mongodb connection

mongoose.connect("mongodb://localhost/yazlabdb", {
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("connected to database");
});

//handlebars
app.use(fileUpload());

app.engine("handlebars", exphbs({ defaultLayout: "mainLayout" }));
app.set("view engine", "handlebars");

//Body parser middleware

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Router Middleware

app.use(UserRouter);

app.get("/", (req, res, next) => {
  User.find({})
    .then((users) => {
      res.render("pages/index", {
        users: users,
      });
    })
    .catch((err) => console.log(err));
});

app.use((req, res, next) => {
  res.render("static/404");
});

app.listen(PORT, () => {
  console.log("app started");
});
