//Import the npm module
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const ejs = require("ejs");
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");

const session = require("express-session");
const passport = require("passport");
LocalStrategy = require('passport-local').Strategy;

//models
const User = require('./models/user');
const Subscriber = require("./models/subscriber");

require('dotenv').config()

const app = express();

//configure express
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  
}))

//Passport config
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Set up default mongoose connection
mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;
mongoose.set("useCreateIndex", true);

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected to database!
});

app.get("/", function (req, res) {
  res.redirect("/subscribe");
});

app.get("/subscribe", function (req, res) {
  res.render(__dirname + "/views/subscribe.ejs");
});



app.post("/subscribe", function (req, res) {

  const fName = req.body.fName;
  const lName = req.body.lName;
  const email = req.body.email;
  console.log(req.body);

  const subscriber = new Subscriber({
    fName: fName,
    lName: lName,
    email: email,
    subscriber: true,
    lastUpdatedOn: Date(),
    createdOn: Date()
  })

  Subscriber.findOne({ email: email }, function (err, data) {
    if (err) {
      console.log(data);
      res.render(__dirname + "/views/failure.ejs", { msg: "Could not connect to database!! Try Again" });

    } else if (data != null) {
      console.log("Found the Subscriber with same email")
      console.log(data);
      res.render(__dirname + "/views/failure.ejs", { msg: "You Are Already Subscribed" });
    } else {
      subscriber.save(function (err, data) {
        if (err) {
          console.log(err);
          res.render(__dirname + "/views/failure.ejs", { msg: "Could not save in database!! Try Again" });
        } else {
          console.log('Saving successful');
          console.log(data);
          res.render(__dirname + "/views/success.ejs", { msg: "You are now subscribed." });
        }
      });

    }
  });
});

app.get("/unsubscribe", function (req, res) {
  res.render(__dirname + "/views/unsubscribe.ejs");
});

app.post("/unsubscribe", function(req,res){
  const email = req.body.email;
  Subscriber.findByIdAndRemove( {email: email},
    function(err, data){
      if(err){
        return res.render(__dirname + "/views/failure.ejs", { msg: "Given email doesn't exist in our database" });
      }
      return res.render(__dirname + "/views/success.ejs", { msg: "You are now unsubscribed." });
  });


});

app.get("/login", function (req, res) {
  res.render(__dirname + "/views/login.ejs");
})

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      
      passport.authenticate("local")(req, res, function(){
        res.redirect("/cpanel");
      });
    }

  });


})

app.post("/register", function (req, res) {
  User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render(__dirname + "/views/failure.ejs", { msg: err });
    }

    passport.authenticate("local")(req, res, function () {
      res.redirect("/cpanel");
    });
  });
})

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/login');
});


app.get("/cpanel", function (req, res) {
   console.log(req.isAuthenticated(true));
  if (req.isAuthenticated(true)) {
    Subscriber.find(function (err, data) {
      if (err) {
        res.render(__dirname + "/views/failure.ejs", { msg: "Could not connect to database. Try Again" });
      } else {
        res.render(__dirname + "/views/cpanel.ejs", { title: "records", records: data });
      }

    });

  } else {
    res.redirect("/login");
  }


});

app.post("/delete", function (req, res) {
  console.log(req);
  const id = req.body.id;
  Subscriber.findOneAndDelete({ _id: id }, function (err, data) {
    if (err) {
      console.log("Deletion Unsuccessful");
      res.send({ success: false, err: err });
    } else {
      console.log("Deletion Success");
      res.send({ success: true, data: data });
    }
  });

});



app.post("/send_email", function (req, res) {
  const subject = req.body.subject;
  const message = req.body.message;
  const html = req.body.html;

  Subscriber.find(function (err, data) {

    if (err) {
      console.log("Unsuccessful");
      // res.send({ success:false, err:err});
      res.render(__dirname + "/views/failure.ejs", { msg: err });
    } else {
      if (data != null) {
        var emails = data.map(subscriber => subscriber.email);
        async function main() {

          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_ID,
              pass: process.env.EMAIL_PASSWORD
            }
          });

          let mailOptions = {
            // should be replaced with real recipient's account
            from: process.env.EMAIL_ID,
            to: emails,
            subject: subject,
            text: message,
            html: html
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
          });
        }
        res.redirect("/cpanel")
        main().catch(console.error);
      }

    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server running at port");
});
