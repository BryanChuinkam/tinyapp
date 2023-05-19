const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const { generateRandomString, getUserByEmail, validEmailAndPass, passwordAndEmailMatch, urlIDExist, urlsForUser } = require("./helpers");


//MIDDLEWARE
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'session', keys: ["bryan"] }));
app.use(morgan('dev'));

//Databases
const urlDatabase = {};
const usersDB = {};

//Routes

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
    const message = "Please enter valid email/password!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  if (getUserByEmail(req.body.email, usersDB)) {
    res.statusCode = 400;
    const message = "Please user a different email!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
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
    const message = "Please enter valid email/password!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }
  if (!getUserByEmail(req.body.email, usersDB)) {
    res.statusCode = 403;
    const message = "Please register before logging in!!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  const id = passwordAndEmailMatch(req.body.email, req.body.password, usersDB);

  if (passwordAndEmailMatch(req.body.email, req.body.password, usersDB) === 'none') {
    res.statusCode = 403;
    const message = "Something doesn't add up. Please try again!!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);

  }
  req.session.user_id = id;

  return res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/login`);
});


app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    const message = "Need to be logged in to do this!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
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
    const message = "Need to be logged in to do this!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  if (!urlIDExist(req.params.id, urlDatabase)) {
    const message = "Short URL ID entered could not be found in database.";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    const message = "Can only access urls associated to your account!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  const userObj = usersDB[req.session.user_id];
  const templateVars = { idShort: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: userObj };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!req.session.user_id) {
    const message = "Need to be logged in to do this!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  if (!urlIDExist(req.params.id, urlDatabase)) {
    const message = "Short URL ID entered could not be found in database.";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    const message = "Can only access urls associated to your account!";
    const templateVars = { user: undefined, message };

    return res.render("error_page", templateVars);
  }


  res.redirect(urlDatabase[req.params.id].longURL);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    const message = "Need to be logged in to do this!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }
  const id = generateRandomString();
  urlDatabase[id] = { "longURL": req.body.longURL, "userID": req.session.user_id };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    const message = "Need to be logged in to do this!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    const message = "Can only access urls associated to your account!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  if (!req.session.user_id) {
    const message = "Need to be logged in to do this!!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const userUrlIds = Object.keys(userURLs);

  if (!userUrlIds.includes(req.params.id)) {
    const message = "Can only access urls associated to your account!";
    const templateVars = { user: undefined, message };
    return res.render("error_page", templateVars);
  }

  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect(`/urls`);
});


app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect(`/urls`);
  }
  return res.render("home", { user: undefined });
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});