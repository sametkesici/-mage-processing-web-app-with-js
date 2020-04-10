const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BooksandUsersSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },

  books: [
    {
      bookIsbn: { type: String, default: 0 },
      bookDate: { type: Date, default: Date.now },
      returnDate: { type: Date, default: Date.now },
    },
  ],
});

const BooksAndUsers = mongoose.model("BooksAndUsers", BooksandUsersSchema);

module.exports = BooksAndUsers;
