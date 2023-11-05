
const User = require('./model/user');

const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

module.exports = { findUserByEmail };
