var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit')
var sqlite3 = require("sqlite3").verbose()
var crypto = require("crypto")
var lib = require("./lib")
var cookieParser = require('cookie-parser');
let db = new sqlite3.Database("zeon.db", (err) => {
  if (err) {
    console.err(err.message)
  }
  console.log("connected")
  var query = 'CREATE TABLE if not exists users ( ID NUMBER ,USER VARCHAR(25), EMAIL VARCHAR(40), PASSWORD VARCHAR(100), AVATAR VARCHAR(200), EXTRAINFO VARCHAR(10000));'
  db.run(query)

})

var tokens = []

var rand = function() {
    return Math.random().toString(16).substring(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};


// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cookieParser());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

// console.log(crypto.createHash("sha512").update("1234").digest("base64"))

// index page
app.get('/', function(req, res) {
  res.render('index');
});

app.get("/login", (req,res) => {
  res.render("login")
})

app.get("/signup", (req,res) => {
  res.render("signup")
})

app.get("/dashboard", (req,res) => {
  if (req.cookies.zeonsession) {
    res.render("dashboard")
  } else {
    res.redirect("/")
  }
})

app.get("/@:user", (req,res) => {
  db.get("SELECT id, lower(user), user, avatar, extrainfo FROM users WHERE lower(user) = ?", req.params.user.toLowerCase(), (err, row) => {
    if (err) console.error(err)
    if (row) {
      // res.send(`${row.USER} ${row.ID}`)
      res.render("user", {u: row.USER, a: row.AVATAR, id: row.ID, bio: JSON.parse(row.EXTRAINFO).bio})
      
    } else {
      res.send({status: 404})
    }
  })
})


app.post("/api/register", (req, res) => {
  let user = lib.ValRegUser(req.body)
  if (user !== false) {
    let pass = crypto.createHash("sha512").update(user.password).digest("base64")
    db.get(`SELECT lower(user), user, email FROM users WHERE lower(user) = ?`, user.username.toLowerCase(), (err, row) => {
      if (err) console.error(err)
      // return row.user
      if (!row) {
        db.get(`SELECT user, lower(email), email FROM users WHERE lower(email) = ?`, user.email.toLowerCase(), (err, row) => {
          if (err) console.error(err)
          // return row.email
          if (!row) {
            let id = Math.floor(Math.random()*10000000)
            db.run(`INSERT INTO users(id, user, password, email, avatar, extrainfo) VALUES (?, ?, ?, ?, ?, ?)`, [id, user.username, pass, user.email, "/imgs/zeonfull.png", "{}"], (err) => {
              if (err) {
                console.log(err)
              }
              let tk = token()
              tokens.push({token: tk, username: user.username})

              var lt = /</g, 
              gt = />/g, 
              ap = /'/g, 
              ic = /"/g;
              var usn = user.username.toString().replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;"); 
              res.cookie("zeonsession", btoa(JSON.stringify({info:{id, user: usn, pfp: "/imgs/zeonfull.png"}, token: tk})))

              res.send({status: 200, info: {id, user: usn, email: user.email, pfp: "/imgs/zeonfull.png", extra:"{}"}, token: tk})
            })
          } else {
            res.send({status: 409})
          }
        })
      } else {
        res.send({status: 409})
      }
    })
  } else {
    res.send({status: 400})
  }
})

app.post("/api/login", (req, res) => {
  let user = lib.ValLogUser(req.body)
  if (user !== false) {
    let pass = crypto.createHash("sha512").update(user.password).digest("base64")
    db.get("SELECT * FROM users WHERE lower(user) = ?", req.body.username.toLowerCase(), (err, row) => {
      if (err) console.error(err)
      if (row) {
        if (row.PASSWORD == pass) {
          let tk = token()
          tokens.push({token: tk, username: row.USER})

          var lt = /</g, 
          gt = />/g, 
          ap = /'/g, 
          ic = /"/g;
          var usn = row.USER.replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;"); 
          res.cookie("zeonsession", btoa(JSON.stringify({info:{id: row.ID, user: usn, pfp: row.AVATAR}, token: tk})))
          res.send({status: 200, info: {id: row.ID, user: usn, email: row.EMAIL, pfp: row.AVATAR, extra: row.EXTRAINFO}, token: tk})
        } else {
          res.send({status: 409})
        }
      } else {
        res.send({status: 404})
      }
    })
  }
})

app.post("/api/logout", (req, res) => {
  res.clearCookie("zeonsession")
  res.send({status: 200})
})

app.post("/api/validate", (req, res) => {
  let se = req.cookies.zeonsession
  if (se !== undefined) {
    let ses = atob(se)
    let session = JSON.parse(ses)
    if (tokens) {
      let correct = false
      for (let i = 0; i < tokens.length; i++) {
        // console.log(req.body.username, tokens[i].username, )
        // console.log(tokens[i].username)
        if (session.info.user == tokens[i].username) {
          if (tokens[i].token == session.token) {
            correct = true
            res.send({status:200})
            break;
          } else {
            continue;
          }
        } else {
          continue;
        }
      }
      if (!correct) {
        res.clearCookie("zeonsession")
        res.send({status:410})
      }
    } else {
      res.clearCookie("zeonsession")
      res.send({status:410})
    }
  } else {
    res.send({status:401})
  }
})

app.post("/api/userInfo", (req, res) => {
  let se = req.cookies.zeonsession
  if (se !== undefined) {
    let ses = atob(se)
    let session = JSON.parse(ses)
    if (tokens) {
      let correct = false
      for (let i = 0; i < tokens.length; i++) {
        // console.log(req.body.username, tokens[i].username, )
        // console.log(tokens[i].username)
        if (session.info.user == tokens[i].username) {
          if (tokens[i].token == session.token) {
            correct = true
            db.get("SELECT id, user, email, avatar, extrainfo FROM users WHERE lower(user) = ?", session.info.user.toLowerCase(), (err, row) => {
              res.send({status:200, response: row})
            })
            // res.send({status:200})
            break;
          } else {
            continue;
          }
        } else {
          continue;
        }
      }
      if (!correct) {
        res.send({status:410})
      }
    } else {
      res.send({status:410})
    }
  } else {
    res.send({status:401})
  }
})

app.post("/api/update/bio", (req, res) => {
  let se = req.cookies.zeonsession
  if (se !== undefined) {
    let ses = atob(se)
    let session = JSON.parse(ses)
    if (tokens) {
      let correct = false
      for (let i = 0; i < tokens.length; i++) {
        // console.log(req.body.username, tokens[i].username, )
        // console.log(tokens[i].username)
        if (session.info.user == tokens[i].username) {
          if (tokens[i].token == session.token) {
            correct = true
            if (req.body.bio) {
              db.get("SELECT id, extrainfo FROM users WHERE id = ?", session.info.id, (err, row) => {
                // res.send({status:200, response: row})
                extrainfo = JSON.parse(row.EXTRAINFO)
                if (!req.body.bio) res.end()
                if (req.body.bio.length >= 250) res.end()
                let bio = req.body.bio
                // extrainfo.bio = req.body.bio
                var lt = /</g, 
                gt = />/g
                bio = bio.replace(lt, "&lt;").replace(gt, "&gt;"); 
                extrainfo.bio = bio
                console.log(extrainfo)
                db.run(`UPDATE users SET extrainfo = ? WHERE id = ?`, [JSON.stringify(extrainfo), session.info.id], function(err) {
                  if (err) {
                    return console.error(err.message);
                  }
                  console.log(`Row(s) updated: ${this.changes}`);
                  res.send({status:200})

                
                });
              })
            } else {
              res.send({status:417})
            }
            
            // res.send({status:200})
            break;
          } else {
            continue;
          }
        } else {
          continue;
        }
      }
      if (!correct) {
        res.send({status:410})
      }
    } else {
      res.send({status:410})
    }
  } else {
    res.send({status:401})
  }
})

app.listen(3000);
console.log('Server is listening on port 3000');
