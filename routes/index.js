var express = require('express');
const passport = require('passport');
var router = express.Router();
const userModel = require("./users");
const localStrategy = require("passport-local");
const upload = require("./multer");
const postModel = require("./post");

passport.use(new localStrategy(userModel.authenticate()));

// to display login page
router.get('/', function (req, res, next) {
  res.render('index', { nav: false });
});
// to login user into app
router.post('/login', passport.authenticate("local", {
  failureRedirect: "/",
  successRedirect: "profile",
}), function (req, res, next) {
});
//  function to check if user is logged in or not
function isLoggedin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// ---------------------------------------------------------------
// to display register page
router.get('/register', function (req, res, next) {
  res.render('register', { nav: false });
});
// to register user
router.post('/register', function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    name: req.body.fullname,
    email: req.body.email,
    contact: req.body.contact,
  });

  userModel.register(data, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      })
    })
});

// ---------------------------------------------------------------
// to logout user
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// ---------------------------------------------------------------
// to display profile page
router.get('/profile', isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("profile", { user, nav: true });
});

// to upload profile picture
router.post('/fileUpload', isLoggedin, upload.single("image"), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

// to display add new post page
router.get('/add', isLoggedin, async function (req, res, next) {
  const user = 
  await userModel.findOne({ username: req.session.passport.user });

  res.render("add", { user, nav: true });
});

// to create new post
router.post('/createPost', upload.single("postImage"), isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

// to show posts
router.get('/show/posts', isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("show", { user, nav: true });
});

// to show single post with details
router.get('/show/posts/:postId', isLoggedin, async function (req, res, next) {
  const post = await postModel.findOne({ _id: req.params.postId });
  const title = post.title;
  const description = post.description;
  const image = post.image;
  const user = await userModel.findOne({ _id: post.user });
  res.render("post", {nav: true,title,description,image,user });
});

// feed page
router.get('/feed', isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  const posts = await postModel.find().populate("user");
  res.render("feed", { user, nav: true,posts });
});

module.exports = router;
