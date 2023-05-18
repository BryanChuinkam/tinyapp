const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
// const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const { urlDatabase, usersDB } = require("./databases");
const { generateRandomString, userExist, validEmailAndPass, passwordAndEmailMatch, urlIDExist, urlsForUser } = require("./functions");


//MIDDLEWARE
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'session', keys: ["bryan"] }));
app.use(morgan('dev'));




// Affects usersDB access
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  const userObj = usersDB[req.session.user_id];
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  if (!validEmailAndPass(req.body.email, req.body.password)) {
    res.statusCode = 404;
    return res.send("Please enter valid email/password!!");
  }
  if (userExist(req.body.email, usersDB)) {
    res.statusCode = 400;
    return res.send("Please user a different email!!");
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  console.log("hashedPassword: ", hashedPassword);
  usersDB[id] = {
    id: id,
    email: req.body.email,
    password: hashedPassword,
  };

  req.session.user_id = id;
  return res.redirect("/urls");

});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const userObj = usersDB[req.session.user_id];
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  if (!validEmailAndPass(req.body.email, req.body.password)) {
    res.statusCode = 404;
    return res.send("Please enter valid email/password!!");
  }
  if (!userExist(req.body.email, usersDB)) {
    res.statusCode = 403;
    return res.send("Please register before logging in!!!");
  }

  const id = passwordAndEmailMatch(req.body.email, req.body.password, usersDB);

  if (passwordAndEmailMatch(req.body.email, req.body.password, usersDB) === 'none') {
    res.statusCode = 403;
    return res.send("Something doesn't add up. Please try again!!!");

  }
  res.cookie('user_id', id);
  return res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/login`);
});





//Affects long/short URLS
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Need to be logged in to do this!!");
  }

  const userObj = usersDB[req.session.user_id];
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { user: userObj, urls: userUrls };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const userObj = usersDB[req.session.user_id];
  const templateVars = { user: userObj };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Need to be logged in to do this!!");
  }

  if (!urlIDExist(req.params.id, urlDatabase)) {
    return res.send("Short URL ID entered could not be found in database.");
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    return res.send("Can only access urls associated to your account!");
  }


  const userObj = usersDB[req.session.user_id];
  const templateVars = { idShort: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: userObj };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Need to be logged in to do this!!");
  }
  const id = generateRandomString();
  urlDatabase[id] = { "longURL": req.body.longURL, "userID": req.session.user_id };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/overhaul", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Need to be logged in to do this!!");
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    return res.send("Can only access urls associated to your account!");
  }

  if (req.body.edit === "edit") {
    return res.redirect(`/urls/${req.params.id}`);
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Need to be logged in to do this!!");
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    return res.send("Can only access urls associated to your account!");
  }

  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect(`/urls`);
});



//NOT PART OF CORE FUNCTIONALITY
app.get("/", (req, res) => {
  res.send("hello!");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});