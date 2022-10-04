const path = require('path');
const express = require('express');
var session = require('express-session');
const ejs = require('ejs');
var bodyParser = require('body-parser')
const con = require("./handlers/mysql.js")

const app = express();

var TGEIO =
    `TTTTTTTTTTTTTTTTTTTTTTT       GGGGGGGGGGGGGEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIII     OOOOOOOOO           222222222222222         000000000     
T:::::::::::::::::::::T    GGG::::::::::::GE::::::::::::::::::::EI::::::::I   OO:::::::::OO        2:::::::::::::::22     00:::::::::00   
T:::::::::::::::::::::T  GG:::::::::::::::GE::::::::::::::::::::EI::::::::I OO:::::::::::::OO      2::::::222222:::::2  00:::::::::::::00 
T:::::TT:::::::TT:::::T G:::::GGGGGGGG::::GEE::::::EEEEEEEEE::::EII::::::IIO:::::::OOO:::::::O     2222222     2:::::2 0:::::::000:::::::0
TTTTTT  T:::::T  TTTTTTG:::::G       GGGGGG  E:::::E       EEEEEE  I::::I  O::::::O   O::::::O                 2:::::2 0::::::0   0::::::0
        T:::::T       G:::::G                E:::::E               I::::I  O:::::O     O:::::O                 2:::::2 0:::::0     0:::::0
        T:::::T       G:::::G                E::::::EEEEEEEEEE     I::::I  O:::::O     O:::::O              2222::::2  0:::::0     0:::::0
        T:::::T       G:::::G    GGGGGGGGGG  E:::::::::::::::E     I::::I  O:::::O     O:::::O         22222::::::22   0:::::0 000 0:::::0
        T:::::T       G:::::G    G::::::::G  E:::::::::::::::E     I::::I  O:::::O     O:::::O       22::::::::222     0:::::0 000 0:::::0
        T:::::T       G:::::G    GGGGG::::G  E::::::EEEEEEEEEE     I::::I  O:::::O     O:::::O      2:::::22222        0:::::0     0:::::0
        T:::::T       G:::::G        G::::G  E:::::E               I::::I  O:::::O     O:::::O     2:::::2             0:::::0     0:::::0
        T:::::T        G:::::G       G::::G  E:::::E       EEEEEE  I::::I  O::::::O   O::::::O     2:::::2             0::::::0   0::::::0
      TT:::::::TT       G:::::GGGGGGGG::::GEE::::::EEEEEEEE:::::EII::::::IIO:::::::OOO:::::::O     2:::::2       2222220:::::::000:::::::0
      T:::::::::T        GG:::::::::::::::GE::::::::::::::::::::EI::::::::I OO:::::::::::::OO      2::::::2222222:::::2 00:::::::::::::00 
      T:::::::::T          GGG::::::GGG:::GE::::::::::::::::::::EI::::::::I   OO:::::::::OO        2::::::::::::::::::2   00:::::::::00   
      TTTTTTTTTTT             GGGGGG   GGGGEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIII     OOOOOOOOO          22222222222222222222     000000000     
                                                                                                                                          `

console.log(TGEIO)

global.db = (sql, values = []) => {
    return new Promise((resolve, reject) => {
        con(sql, values, (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    })
}

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"))

app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 's%3Al3ozSdvQ83TtC5RvJ.CibaQoHtaY0H3QOB1kqR8H2A',
    cookie: {

        expires: 300000
    }
}));
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.render(`${__dirname}/views/index.ejs`);
});

app.listen(80, () => {
    console.log('Application listening on port 80!');
});

function authRole(role) {
    return (req, res, next) => {
        if (req.session.user.perm !== role) {
            res.status(403);
            let error = `<div class="error-msg" style="margin-left:33%;">
            <i class="fa fa-times-circle"></i>
            Acesso negado!
          </div>`
            //req.session.error = error;
            return res.redirect('/menu')
        }
        next();
    }
}

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        let error = `<div class="error-msg" style="margin-left:33%;">
            <i class="fa fa-times-circle"></i>
            Acesso negado!
          </div>`
        req.session.error = error;
        res.redirect('/login');
    }
}

app.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = err;
    if (msg) res.locals.message = msg;
    next();
});
