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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

//User is redirected to a login page if not logged in. Once logged in, user is able to create a new url
app.get("/urls/new", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = {
    user,
  };
  if (!user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//If not logged in, user will be asked to register/login. Once logged in, user is able to access all their urls
app.get("/urls", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = { urls: urlDatabase,
    user };
  res.render("urls_index", templateVars);
});

//Once user is logged in and creates a new url, their urls page will be updated with a random short url and the long url / website provided
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

//Displays the edit a url page if user is logged in. Otherwise, user will be asked to log in
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = { shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };
  if (!user) {
    return res.status(403).send("Login or register");
  } else if (urlDatabase[req.params.shortURL].userID === user.id) {
    res.render("urls_show", templateVars);
  } else {
    return res.status(403).send("Inaccessible. Login to correct account");
  }
});

//Redirects user to website if they click on the short url
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//User can delete their url only if they are logged in
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

//User can edit their url only if they are logged in
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

//User can update their url only if logged it
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

//Login page
app.get("/login", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = { urls: urlDatabase,
    user };
  res.render("urls_login", templateVars);
});

//Login page checks to see if user enter correct credentials
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, users);
  //if authenticated, set a cookie with its user id and redirect.
  if (user) {
    const user_id = user.id;
    req.session["user"] = user_id;
    res.redirect(`/urls`);
  } else {
    return res.status(403).send("Incorrect password or email");
  }
});

//Logs user out
app.post("/logout", (req, res) => {
  req.session["user"] = null;
  res.redirect('/urls');
});

//Registration page
app.get("/register", (req, res) => {
  const userID = req.session["user"];
  const user = users[userID];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_register", templateVars);
});
//Registration page. User must enter an email that doesn't exist and fields cannot be empty
app.post("/register", (req, res) => {
  const userCheck = getUserByEmail(req.body.email, users);
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Email and password cannot be empty");
  } else if (userCheck) {
    return res.status(400).send("Email is already in use");
  }
  const user = generateRandomString();
  users[user] = {
    id: user,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt)
  };
  req.session["user"] = user;
  res.redirect('/urls');
});

