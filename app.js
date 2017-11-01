let express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    Comment     = require("./models/comment"),
    Campground  = require("./models/campground"),
    User        = require("./models/user"),
    seedDB      = require("./seeds"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    middleware = require("./middleware");
    
    // instead of writing "let" multiple times use , commas, between them // use indentation for readability
    
let commentRoutes       = require("./routes/comments"),
    campgroundRoutes    = require("./routes/campgrounds"),
    indexRoutes         = require("./routes/index"),
    userRoutes          = require("./routes/users"),
    blogRoutes          = require("./routes/blog");

require('dotenv').config();

mongoose.connect("mongodb://localhost/yelp_camp_final", {useMongoClient: true});
mongoose.Promise = global.Promise;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(middleware.mySanitizerMiddleware);
app.use(flash());
app.locals.moment = require('moment');
//seedDB(); //seed the database




// ==========================================
//          PASSPORT CONFIGURATION
// ==========================================

app.use(require("express-session")({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// =====================================
//          ROUTES
// =====================================

// pass variables to every single file/template
app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// requiring routes
app.use("/", indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/", userRoutes);
app.use("/blog", blogRoutes);

// 404 message for wrong/missing routes/links/urls -- could also do res.redirect("/") to redirect without message
app.get("*", (req, res) => {
    res.render("deadend");
});

// starting server
app.listen(process.env.PORT, process.env.IP, () => {
    console.log("YelpCamp server has started!");
});