let express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");
    
// =====================================
//          MISC ROUTES
// =====================================

// landing page
router.get("/", (req, res) => {
    res.render("landing");
});

// =====================================
//          AUTH ROUTES
// ====================================

// show register form
router.get("/register", (req, res) => res.render("register", {page: "register"}));

// handles signup logic
router.post("/register", (req, res) => {
    let newUser = new User({
        username: req.body.username, 
        email: req.body.email
    });
    //eval(require("locus"));
    //if(req.body.adminCode === "secret") {
    //   newUser.isAdmin = true;
    //}
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            //console.log(err);
            req.flash("error", "Error: This email and/or username exists already!");
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Thank you for registering to YelpCamp, ${req.body.username}!`);
            res.redirect("/campgrounds");
        });
    });
});

// login form
router.get("/login", (req, res) => res.render("login", {page: "login"}));

// handling login logic
// app.post("/login", middleware, callback)
router.post("/login", passport.authenticate("local", {
    successFlash: "Welcome back!",
    successRedirect: "/campgrounds",
    failureFlash: true,
    failureRedirect: "/login",
    }), (req, res) => {
        User.findById(req.params.id, (err, foundUser) => {
            if(err || !foundUser) return console.log(err);
            foundUser.resetPasswordToken = undefined;
            foundUser.resetPasswordExpires = undefined;
    });
});

// logout route
router.get("/logout", (req, res) => { 
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

// SHOW forgot password form
router.get("/forgot", (req, res) => res.render("forgot"));

// SEND forgot password form
router.post("/forgot", (req, res, next) => {
    // prewritten functions using nodemailer, async & crypto packages
    async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user || err) {
              req.flash('error', 'No account with that email address exists.');
              return res.redirect('/forgot');
            }
    
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 90000000; // 15 minutes
    
            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
              user: process.env.GMAIL_MAIL,
              pass: process.env.GMAIL_PW
            }
          });
          var mailOptions = {
            to: user.email,
            from: "YelpCamp BootCamp",
            subject: 'YelpCamp Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              'The link will expire after 15 minutes.' +
              'If you did not request this, you can ignore this email and your password will remain unchanged.\n\n' +
              'Thank you for using YelpCamp!'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            console.log('mail sent');
            req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

// SHOW reset form
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user || err) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

// POST reset form/update PW
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user || err) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }
            if(req.body.password === req.body.confirm) {
                user.setPassword(req.body.password, function(err) {
                    if(err) {
                        req.flash('error', err.message);
                        return res.redirect('back');
                    }
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
    
                    user.save(function(err) {
                        if(err) {
                            req.flash('error', err.message);
                            return res.redirect('back');
                        }
                        req.logIn(user, function(err) {
                            done(err, user);
                        });
                    });
                });
            } else {
                req.flash("error", "Passwords do not match.");
                return res.redirect('back');
            }
        });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.GMAIL_MAIL,
          pass: process.env.GMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.GMAIL_MAIL,
        subject: 'YelpCamp password changed!',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n' +
          'If you did not do this please click on the link below to secure your account:\n\n' +
          'http://' + req.headers.host + '/forgot \n\n' +
          'Thank you for using YelpCamp!'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
    ], function(err) {
        if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        res.redirect('/campgrounds');
    });
});


module.exports = router;