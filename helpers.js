const bcrypt = require('bcryptjs');


//function to loop through user object and check to see if there is an existing user with the same credentials
const getUserByEmail = (email, database) => {
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
  return undefined;
};

const authenticateUser = (email, password, users) => {
  const user = getUserByEmail(email, users);
  // console.log("FORM PASSWORD:", password, "DB PASSWORD:", user.password);
  // compares passwords to see if they match
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return false;
  }
};

const generateRandomString = function() {
  let newURL = Math.random().toString(36).substr(2,6);
  return newURL;
}

module.exports = { getUserByEmail, authenticateUser, generateRandomString };
