const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  let output = "";
  const letters = "abcdefghijklmnopqrstuvwxyz";

  for (let count = 0; count <= 5; count++) {
    let letterIndex = Math.floor(Math.random() * 26);
    output += letters[letterIndex];
  }

  return output;
};

app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { idShort: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
  // res.redirect(urlDatabase[req.params.id]);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/overhaul", (req, res) => {
  if(req.body.edit === "edit"){
    return res.redirect(`/urls/${req.params.id}`);
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  // console.log('params: ', req.params.id);
  // console.log('body: ', req.body);
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});