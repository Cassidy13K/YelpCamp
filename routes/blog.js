let express = require("express");
let router = express.Router({mergeParams:true});

let middleware = require("../middleware"),
    Blog = require("../models/blog");

// index
router.get("/", (req, res) => {
    Blog.find({}, (err, blogs) => {
        if(err) {
            req.flash("error", "Couldn't find any blog posts, please try again later!");
            return res.redirect("/campgrounds");
        }
        res.render("./blog/index", {blogs});
    }); 
});

// new post form
router.get("/new", middleware.isAdmin, (req, res) => {
    res.render("./blog/new");
});

// post new post
router.post("/", middleware.isAdmin, (req, res) => {
    Blog.create(req.body.blog, (err, newBlog) => {
        if(err) {
            req.flash("error", "There was an error creating the blog post, please try again!");
            return res.redirect("back");
        } else {
            req.flash("success", "Blog Post successfully created!");
            return res.redirect("/blog");
        }
    });
});

// show post details
router.get("/:id", (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if(err || !foundBlog) {
            req.flash("error", "Error: Blog Post not found.");
            return res.redirect("/blog");
        }
            res.render("./blog/show", {blog: foundBlog});
    });
});

// edit post form
router.get("/:id/edit", middleware.isAdmin, (req, res) => {
    Blog.findById(req.params.id, (err, foundBlog) => {
        if(err || !foundBlog) {
            req.flash("error", "Error: Blog Post not found.");
            return res.redirect("/blog/" + req.params.id);
        } else {
            res.render("./blog/edit", {blog: foundBlog});
        }
    });
});

// update post
router.put("/:id", middleware.isAdmin, (req, res) => {
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, (err, foundBlog) => {
        if(err || !foundBlog) {
            req.flash("error", "Error: Blog Post not found.");
            return res.redirect("/blog");
        } else {
            req.flash("success", "Blog Post successfully updated!");
            return res.redirect("/blog/" + req.params.id);
        }
    });
});

// delete post
router.delete("/:id/", middleware.isAdmin, (req, res) => {
    Blog.findByIdAndRemove(req.params.id, (err, foundBlog) => {
        if(err || !foundBlog) {
            req.flash("error", "Error: Couldn't delete blog.");
            return res.redirect("/blog/" + req.params.id);
        } else {  
        req.flash("success", "Blog Post successfully deleted!");
        res.redirect("/blog");
        }
    });
});


module.exports = router;