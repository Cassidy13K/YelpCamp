let express = require("express");
let router = express.Router({mergeParams:true});

let Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    middleware = require("../middleware");


// =====================================
//          COMMENT ROUTES
// ====================================

// show new comment form
router.get("/new", middleware.isLoggedIn, (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
        if(err) return req.flash("error", "Error: Campground not found.") & res.redirect("back");
        else return res.render("./comments/new", {campground});
    });
});

// add new comment
router.post("/", middleware.isLoggedIn, (req, res) => {
    // lookup campground with ID
    Campground.findById(req.params.id, (err, campground) => {
        if(err) {
            console.log(err); 
            res.redirect("/campgrounds");
        } else {
            //console.log(req.body.comment);
            // create new comment
            Comment.create(req.body.comment, (err, comment) => {
                if(err) return req.flash("error", "Error: Comment creation failed.") & res.redirect("back");
                else {
                    // add username and id to comment
                    //console.log("new comment's username will be: " + req.user.username);
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    // save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    //console.log(comment);
                    // redirect to campground show page    
                    req.flash("success", "Comment successfully created.");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

// show edit comment form
router.get("/:comment_id/edit", middleware.isCommentAuthor, (req, res) => {
    //res.send("edit route comments");
    Campground.findById(req.params.id, (err, campground) => {
        if(err || !campground) {
            req.flash("error", "Error: Campground not found.");
            res.redirect("back");
        } else {
            Comment.findById(req.params.comment_id, (err, comment) => {
                if(err || !comment) return req.flash("error", "Error: Comment not found.") & res.redirect("back");
                else return res.render("./comments/edit", {comment, campground});
            });
        }
    });
});

// update comment
router.put("/:comment_id", middleware.isCommentAuthor, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
        (err) ? res.redirect("back") : res.redirect("/campgrounds/" + req.params.id);
    });
});

// delete comment
router.delete("/:comment_id", middleware.isCommentAuthor, (req, res) => {
    //res.send("destroy comment");
    Comment.findByIdAndRemove(req.params.comment_id, err => {
        if(err) {
            req.flash("error", "Comment couldn't be deleted.");
            res.redirect("back");
        } else {
            req.flash("success", "Comment successfully deleted.");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});


module.exports = router;