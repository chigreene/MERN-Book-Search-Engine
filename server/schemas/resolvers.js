const { Book, User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    user: async () => {
      return await User.find().populate("savedBooks");
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      console.log("User:", user);

      const token = signToken(user);
      console.log("Token:", token);
      return { token, user };
    },
    login: async (parent, { username, password }) => {
      const user = await User.findOne({ username });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (
      parent,
      { bookId, authors, description, title, image, link }
    ) => {
      if (context.user) {
        const newBook = await Book.create({
          bookId,
          authors,
          description,
          title,
          image,
          link,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          //   is this the right id to use here????
          { $addToSet: { savedBooks: newBook.bookId } }
        );

        return newBook;
      }

      throw AuthenticationError;
    },
  },
  removeBook: async (parent, { bookId }, context) => {
    if (context.user) {
      const book = await Book.findOneAndDelete({
        bookId: bookId,
        //   may need to add another filter here to make user only logged in user can remove this from his list
      });

      await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: book.bookId } }
      );

      return book;
    }

    throw AuthenticationError;
  },
};

module.export = resolvers;
