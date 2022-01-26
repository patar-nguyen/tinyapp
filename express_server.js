const express = require("express");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//adding new username to cookies
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user"];
  const user = users[userID];
  const templateVars = {
    user,
  };

  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["user"];
  const user = users[userID];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

function generateRandomString() {
  let newURL = Math.random().toString(36).substr(2,6);
  return newURL;
}

const randomKey = generateRandomString();

//generating random key and assigning it to new website
app.post("/urls", (req, res) => {
  console.log(req.body);  
  res.redirect(`/urls/${randomKey}`);   
  urlDatabase[randomKey] = req.body.longURL;
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user"];
  const user = users[userID];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  const newURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = newURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect `/urls`;
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect('/urls');
});

//registration page
app.get("/register", (req, res) => { 
  const userID = req.cookies["user"];
  const user = users[userID];
  const templateVars = { 
    urls: urlDatabase, 
    user
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.pass) {
    return res.status(400).send("Email and password cannot be blank");
  }
  const user_id = generateRandomString();
  users[user_id] = {
    id: user_id,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie("user", user_id);
  res.redirect("/urls");

});
