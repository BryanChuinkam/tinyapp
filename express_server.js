const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

//MIDDLEWARE
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};


const generateRandomString = () => {
  let output = "";
  const letters = "abcdefghijklmnopqrstuvwxyz";

  for (let count = 0; count <= 5; count++) {
    let letterIndex = Math.floor(Math.random() * 26);
    output += letters[letterIndex];
  }

  return output;
};

const userExist = (userEmail, users) => {
  // returns true if email has already been registered
  for (const user in users) {
    if (userEmail === users[user].email) {
      return true;
    }
  }
  return false;
};

const validEmailAndPass = (userEmail, password) => {
  // Returns true of valid email and password are entered
  // for now just ensures empty strings are not passed.
  if (!userEmail || !password) {
    return false;
  }
  return true;
};

const passwordAndEmailMatch = (userEmail, password, users) => {
  // returns user id if password matches password that was registered with email
  for (const user in users) {
    if ((userEmail === users[user].email) && (password === users[user].password)) {
      return users[user].id;
    }
  }
  return 'none';
};

// Affects USERS access
app.get("/register", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {

  if (!validEmailAndPass(req.body.email, req.body.password)) {
    res.statusCode = 404;
    return res.send("Please enter valid email/password!!");
  }
  if (userExist(req.body.email, users)) {
    res.statusCode = 400;
    return res.send("Please user a different email!!");
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password,
  };

  res.cookie('user_id', id);
  return res.redirect("/urls");

});

app.get("/login", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  if (!validEmailAndPass(req.body.email, req.body.password)) {
    res.statusCode = 404;
    return res.send("Please enter valid email/password!!");
  }
  if (!userExist(req.body.email, users)) {
    res.statusCode = 403;
    return res.send("Please register before logging in!!!");
  }
  const id = passwordAndEmailMatch(req.body.email, req.body.password, users);

  if (passwordAndEmailMatch(req.body.email, req.body.password, users) === 'none') {
    res.statusCode = 403;
    return res.send("Something doesn't add up. Please try again!!!");

  }
  res.cookie('user_id', id);
  return res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/login`);
});





//Affects long/short URLS
app.get("/urls", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { user: userObj };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { idShort: req.params.id, longURL: urlDatabase[req.params.id], user: userObj };
  res.render("urls_show", templateVars);
  // res.redirect(urlDatabase[req.params.id]);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/overhaul", (req, res) => {
  if (req.body.edit === "edit") {
    return res.redirect(`/urls/${req.params.id}`);
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect(`/urls`);
});



//NOT PART OF CORE FUNCTIONALITY
app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});