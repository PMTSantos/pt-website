const path = require('path');
const express = require('express');
var session = require('express-session');
require('ejs');
var bodyParser = require('body-parser')
const con = require("./handlers/mysql.js")
require('./handlers/anticrash.js')();

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
app.use('/static', express.static(path.join(__dirname, 'website', 'public')))
app.use(express.static(path.join(__dirname, 'website', 'public')));

app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 's%3Al3ozSdvQ83TtC5RvJ.CibaQoHtaY0H3QOB1kqR8H2A',
    cookie: {

        expires: 3600000
    }
}));
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.listen(80, () => {
    console.log('Application listening on port 80!');
});

function authRole(role) {
    return (req, res, next) => {
        if (req.session.user.perms !== role) {
            res.status(403);
            let error = `Acesso negado!`
            //req.session.error = error;
            return res.redirect('/dashboard');
        }
        next();
    }
}

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        let error = `Acesso negado!`
        req.session.error = error;
        res.redirect('/');
    }
}

app.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = `
    <div class="alert alert-danger alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <h6><i class="fas fa-ban"></i><b> Erro!</b></h6>
        ${err}
    </div>`;

    if (msg) res.locals.message = `
        <div class="alert alert-success alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <h6><i class="fas fa-check"></i><b> Sucesso!</b></h6>
            ${msg}
        </div>
    `;
    next();
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect(`/?info=`+ encodeURIComponent('Sessão terminada com sucesso'));
    });
});

app.get('/', (req, res) => {
    let st;
    let query = req.query

    if (query.info) st = `
        <div class="alert alert-success alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <h6><i class="fas fa-check"></i><b> Sucesso!</b></h6>
                 ${query.info}
            </div>
    `

    if (query.error) st = `
        <div class="alert alert-danger alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <h6><i class="fas fa-ban"></i><b> Erro!</b></h6>
            ${query.error}
        </div>`
    
    else if (query.error) st = `<div class="alert"><span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>${query.error}</div>`
    res.render(path.join(__dirname, 'website', 'views', 'login.ejs'), {st});
})

app.get('/register', (req, res) => {
    res.render(path.join(__dirname, 'website', 'views', 'register.ejs'));
})

app.get('/dashboard', restrict, (req, res) => {
    res.render(path.join(__dirname, 'website', 'views', 'user', 'dash.ejs'), { user: req.session.user });
})

app.post('/', async (req, res) => {
    let { email, ppw } = req.body;

    let user = await global.db('SELECT * FROM users WHERE email = ? AND password = ?', [email, ppw]);

    if (user.length > 0) {
        req.session.user = user[0];
        res.redirect('/dashboard');
    }
    else {
        let error = `Utilizador ou password incorretos!`
        req.session.error = error;
        res.redirect('/');
    }
})

app.post('/register', async (req, res) => {
    let { username, email, password, ppwVerify } = req.body;

    let user = await global.db('SELECT * FROM users WHERE email = ?', [email]);

    if (user.length > 0) {
        let error = `Enderço de email em uso!`
        req.session.error = error;
        res.redirect('/register');
    }
    else if (password !== ppwVerify) {
        let error = `As passwords não coincidem!`
        req.session.error = error;
        res.redirect('/register');
    }
    else {
        await global.db('INSERT INTO users (username, email, password, perms, active) VALUES (?, ?, ?, "aluno", false)', [username, email, password]);
        let success = `Utilizador criado com sucesso! Aguarde que um administrador aprove a conta!`
        req.session.success = success;
        res.redirect('/');
    }
})

app.use('/admin', restrict, authRole('admin'), require('./website/routes/admin'));
app.use('/teacher', restrict, authRole('teacher'), require('./website/routes/teacher'));
app.use('/aluno', restrict, authRole('aluno'), require('./website/routes/user'));