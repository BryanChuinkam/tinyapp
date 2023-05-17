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

// Affects USERS
app.get("/register", (req, res) => {
  const userObj = users[req.cookies.user_id]
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  id = generateRandomString();
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie('user_id', id);
  console.log('users: ', users);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});





//Affects long/short URLS 
app.get("/urls", (req, res) => {
  console.log('cookies in get url: ', req.cookies);
  const userObj = users[req.cookies.user_id]
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userObj = users[req.cookies.user_id]
  const templateVars = { user: userObj };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { idShort: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
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