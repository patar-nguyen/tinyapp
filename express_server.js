const express = require("express");
const app = express();
const PORT = 8080;
const { getUserByEmail, authenticateUser, generateRandomString } = require('./helpers');

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['e3b84cd4-4ae4-49be-a597-45bffdcf6f4f', 'e79b97a8-6180-4d52-9e2f-90c7242e787a']
}));


// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
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
};

//adding new url
app.get("/urls/new", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = {
    user,
  };
  if (!userID) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//creating the urls page
app.get("/urls", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = { urls: urlDatabase,
    user };
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

//generating random key and assigning it to new website
app.post("/urls", (req, res) => {
  const randomKey = generateRandomString();
  const userID = req.session["user"];
  const user = users[userID];
  urlDatabase[randomKey] = {
    longURL: req.body.longURL,
    userID: user.id
  };
  res.redirect(`/urls/${randomKey}`);
});

//urls list page
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = { shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//delete url
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  if (!user) {
    return res.status(403).send("You cannot delete. Please login or register");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//editing url
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["user"];
  const user = users[userID];
  if (!user) {
    return res.status(403).send("Cannot edit. Login or register");
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});

//updating url after editing
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["user"];
  const user = users[userID];

  if (!user) {
    return res.status(403).send("Cannot edit. Login or register");
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: user.id
    };
  }
  res.redirect('/urls');
});

//login page
app.get("/login", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = { urls: urlDatabase,
    user };
  res.render("urls_login", templateVars);
});

//login page
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, users);
  //if authenticated, set a cookie with its user id and redirect.
  if (user) {
    const user_id = user.id;
    //res.cookie('user', user_id);
    req.session["user"] = user_id;
    res.redirect(`/urls`);
  } else {
    return res.status(403).send("Incorrect password");
  }
});

//logout
app.post("/logout", (req, res) => {
  req.session["user"] = null;
  //res.clearCookie('user');
  res.redirect('/urls');
});

//registration page
app.get("/register", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_register", templateVars);
});
//registration page
app.post("/register", (req, res) => {
  const userCheck = getUserByEmail(req.body.email, users);
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Email and password cannot be blank");
  } else if (userCheck) {
    return res.status(400).send("Email is already in use");
  }
  const user = generateRandomString();
  users[user] = {
    id: user,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt)
  };
  //res.cookie('user', user);
  req.session["user"] = user;
  res.redirect('/urls');
});

