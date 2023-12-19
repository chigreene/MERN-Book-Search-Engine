const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, arg, context) => {
      // console.log("Context:", context);
      const userId = context.user._id;
      // console.log("User ID:", userId);
      const foundUser = await User.findById(userId);
      // console.log("User:", foundUser);
      return foundUser;
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      // console.log("addUser called with:", { username, email, password });

      try {
        const user = await User.create({ username, email, password });
        // console.log("User:", user);

        const token = signToken(user);
        // console.log("Token:", token);

        return { token, user };
      } catch (error) {
        console.error("Error in addUser:", error);
      }
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

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
      { input: { bookId, authors, description, title, image, link } },
      context
    ) => {
      if (context.user) {
        const newBook = {
          bookId,
          authors,
          description,
          title,
          image,
          link,
        };

        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          //   is this the right id to use here????
          { $addToSet: { savedBooks: newBook } },
          { new: true }
        );

        return updatedUser;
      }

      throw AuthenticationError;
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id, "savedBooks.bookId": bookId },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );

        if (!updatedUser) {
          throw new Error("No book with this id found for this user");
        }

        return updatedUser;
      }

      throw AuthenticationError;
    },
  },
};

module.exports = resolvers;
