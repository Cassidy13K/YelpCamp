let express = require("express");
let router = express.Router();

let Campground  = require("../models/campground"),
    middleware = require("../middleware"),
    geocoder = require("geocoder");

const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");    
};

// =====================================
//          CAMPGROUND ROUTES
// =====================================

// INDEX - show all campgrounds
router.get("/", (req, res) => {
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({name: regex}, (err, allCampgrounds) => {
            if(err){
                console.log(err);    
            } else {
                if(allCampgrounds.length < 1) {
                    req.flash("error", "No campgrounds found that match your search!");
                    res.redirect("/campgrounds");
                }
                else {
                    res.render("./campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
                }
            }
        });    
    } else {
        // get all campgrounds from db
        Campground.find({}, 
        (err, allCampgrounds) => (err) ? console.log(err) : res.render("./campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"}));
    }
});

// CREATE - add new campground to db
router.post("/", middleware.isLoggedIn, (req, res) => {
   let name = req.body.name;
   let image = req.body.image;
   let price = req.body.price;
   let desc = req.body.description;
   let author = {
       id: req.user._id,
       username: req.user.username
    };
    
    geocoder.geocode(req.body.location, (err, data) => {
        if(err) return console.log(err);
        else if(data && data.results && data.results.length) {
            let lat = data.results[0].geometry.location.lat;
            let lng = data.results[0].geometry.location.lng;
            let location = data.results[0].formatted_address;
            let newCampground = {name, image, price, description: desc, author, location, lat, lng};
       
            //create new campground and save to db
            Campground.create(newCampground, (err, newlyCreated) => {
                if(err) {
                   req.flash("error", "Error: Campground creation failed.");
                   res.redirect("back");
                }  else {
                   //console.log(newlyCreated);
                   req.flash("success", "Campground successfully created!");
                   res.redirect("/campgrounds");
                }
            });
        }
        else return req.flash("error", "Invalid address please try again.") & res.redirect("back");
    });    
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("./campgrounds/new");
});

// SHOW - more information on a certain campground
router.get("/:id", (req, res) => {
    //res.send("this will be the show page on day");
    Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
        if(err || !foundCampground){
            req.flash("error", "Error: Campground not found.");
            res.redirect("back");
        } else {
            res.render("./campgrounds/show", {campground:foundCampground});
        }
    });    
});

// EDIT campground route (show form)
router.get("/:id/edit", middleware.isCampgroundAuthor, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if(err || !foundCampground) return req.flash("error", "Error: Campground not found.") & res.redirect("back");
        res.render("./campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE campground route (put request and redirect)
router.put("/:id", middleware.isCampgroundAuthor, (req, res) => {
        let newData = {
            name: req.body.campground.name, 
            image: req.body.campground.image, 
            description: req.body.campground.description, 
            cost: req.body.campground.price, 
            location: req.body.campground.location, 
            lat: req.body.campground.lat, 
            lng: req.body.campground.lng
        };
    
        geocoder.geocode(req.body.campground.location, function (err, data) {
            if(err) return console.log(err);
            else if(data && data.results && data.results.length) {
                newData['lat'] = data.results[0].geometry.location.lat;
                newData['lng'] = data.results[0].geometry.location.lng;
                newData['location'] = data.results[0].formatted_address;
            } else return req.flash("error", "Invalid address please try again.") & res.redirect("back");
            
            Campground.findByIdAndUpdate(req.params.id, newData, function(err, newlyCreated){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated!");
                    res.redirect("/campgrounds/" + req.params.id);
                }
            });
        });
});

// delete campground
router.delete("/:id", middleware.isCampgroundAuthor, (req, res) => {
    Campground.findByIdAndRemove(req.params.id, (err) => {
        (err) ? res.redirect("/campgrounds") : req.flash("success", "Campground successfully deleted.") & res.redirect("/campgrounds");
    });
});

module.exports = router;