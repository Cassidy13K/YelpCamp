let Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    User        = require("../models/user");


// =====================================
//          MIDDLEWARES
// =====================================

let middlewareObj = {};


// own middleware to have expressSanitizer run on EVERY route change, whole req.body (so all fields)
middlewareObj.mySanitizerMiddleware = (req, res, next) => {
  //console.log('LOGGED')
  let str = JSON.stringify(req.body);
  let sanitized = req.sanitize(str);
  req.body = JSON.parse(sanitized);
  next();
};

middlewareObj.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) return next();
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
};

middlewareObj.isCampgroundAuthor = (req, res, next) => {
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err, foundCampground) => {
            if (err || !foundCampground) {
                req.flash("error", "Error: Campground not found.");
                res.redirect("back");
            } else {
                if(foundCampground.author.id.equals(req.user._id)  || req.user.isAdmin) {
                    next();  
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};

middlewareObj.isCommentAuthor = (req, res, next) => {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err || !foundComment) {
                req.flash("error", "Error: Comment not found.");
                res.redirect("back");
            } else {
                if(foundComment.author.id.equals(req.user._id)  || req.user.isAdmin) {
                    next();  
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};

middlewareObj.isUser = (req, res, next) => {
    if(req.isAuthenticated()){
        User.findById(req.params.id, (err, foundUser) => {
            if (err || !foundUser) {
                req.flash("error", "Error: User not found.");
                res.redirect("back");
            } else {
                if(foundUser._id.equals(req.user._id)  || req.user.isAdmin) {
                    next();  
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};

middlewareObj.isAdmin = (req, res, next) => {
    if(req.user && req.user.isAdmin) {
        next();
    } else {
        req.flash("error", "You don't have permission to do that!");
        res.redirect("/blog");
    }
  
};

module.exports = middlewareObj;