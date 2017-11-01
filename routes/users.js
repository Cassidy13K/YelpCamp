let express = require("express");
let router = express.Router();

let Campground  = require("../models/campground"),
    middleware = require("../middleware"),
    User = require("../models/user"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");


// =====================================
//          USER ROUTES
// =====================================

// SHOW user profile
router.get("/users/:id", middleware.isLoggedIn, (req, res) => {
    //res.send("reached user page route");
    User.findById(req.params.id, (err, foundUser) => {
        if(err || !foundUser) {
            req.flash("error", "Error: Couldn't find user!");
            return res.redirect("back");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec((err, campgrounds) => {
            if(err || !foundUser) {
                req.flash("error", "Error: Couldn't find user's campgrounds.");
                return res.redirect("back");
            }
            res.render("./users/show", {user: foundUser, campgrounds});
        });
    });
});

// EDIT form user profile
router.get("/users/:id/edit", middleware.isUser, (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if(err || !foundUser) return req.flash("error", "Error: Couldn't find user!") & req.redirect("back");
        res.render("./users/edit", {user: foundUser});
    });
});

// UPDATE user profile
router.put("/users/:id", middleware.isUser, (req, res) => {
    User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
        if(err) {
            req.flash("error", "Something went wrong with updating your profile, please try again!");
            res.redirect("back");
        } else {
            if(req.body.adminCode === process.env.ADMIN_CODE) {
                updatedUser.isAdmin = true;
                updatedUser.save();
                req.flash("success", "Successfully updated your profile and made you admin!");
                res.redirect("/users/" + req.params.id);
            }
            else {
                req.flash("success", "Successfully updated your profile!");
                res.redirect("/users/" + req.params.id);
            }
        }
    });
});

// DELETE user & profile
router.delete("/users/:id", middleware.isUser, (req, res) => {
    Campground.find({"author.id": req.params.id}, (err, usersCampgrounds) => {
        if(err) return req.flash("error", "Error: Something went wrong") & req.redirect("back");
        else {
            usersCampgrounds.forEach((foundCampground) => {
                foundCampground.author.username = "*deleted User*";
                foundCampground.save();
            });
        }
    }); 
    User.findByIdAndRemove(req.params.id, (err) => {
        if(err) {
            req.flash("error", "Error: Something went wrong");
            res.redirect("back");
        } else {
            req.flash("success", "User deleted!");
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;