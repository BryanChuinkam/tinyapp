const bcrypt = require("bcryptjs");


const generateRandomString = () => {
  let output = "";
  const letters = "abcdefghijklmnopqrstuvwxyz";

  for (let count = 0; count <= 5; count++) {
    let letterIndex = Math.floor(Math.random() * 26);
    output += letters[letterIndex];
  }

  return output;
};

const getUserByEmail = (userEmail, usersDB) => {
  // returns true if email has already been registered
  for (const user in usersDB) {
    if (userEmail === usersDB[user].email) {
      return usersDB[user].id;
    }
  }
};

const validEmailAndPass = (userEmail, password) => {
  // Returns true of valid email and password are entered
  // for now just ensures empty strings are not passed.
  if (!userEmail || !password) {
    return false;
  }
  return true;
};

const passwordAndEmailMatch = (userEmail, password, usersDB) => {
  // returns user id if password matches password that was registered with email
  for (const user in usersDB) {
    if ((userEmail === usersDB[user].email) && (bcrypt.compareSync(password, usersDB[user].password))) {
      return usersDB[user].id;
    }
  }
  return 'none';
};

const urlIDExist = (urlId, urlDatabase) => {
  // returns true if urlID is found in urlDatabase
  const objKeys = Object.keys(urlDatabase);
  if (objKeys.includes(urlId)) {
    return true;
  }
  return false;
};

const urlsForUser = (userID, urlDatabase) => {
  //returns object of the URLs where the userID is equal to the id of the currently logged-in user
  let output = {};

  for (const urlID in urlDatabase) {
    if (userID === urlDatabase[urlID].userID) {
      output[urlID] = urlDatabase[urlID].longURL;
    }
  }
  return output;
};



module.exports = { generateRandomString, getUserByEmail, validEmailAndPass, passwordAndEmailMatch, urlIDExist, urlsForUser };