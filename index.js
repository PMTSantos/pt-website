const path = require('path');
const express = require('express');
var session = require('express-session');
const fileUpload = require('express-fileupload');
require('ejs');
var bodyParser = require('body-parser')
const con = require("./handlers/mysql.js")
require('./handlers/anticrash.js')();

var speakeasy = require("speakeasy");
var qrcode = require("qrcode");

const bcrypt = require('bcrypt');
const saltRounds = 10;

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
//app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: false }));

app.use(fileUpload());

app.listen(80, () => {
    console.log('Application listening on port 80!');
});

function authRole(role) {
    return (req, res, next) => {
        if (req.session.user.perms !== role && req.session.user.perms !== 'admin') {
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
        if (req.originalUrl.includes('2fa') && req.originalUrl.includes('url')) {
            let url = req.originalUrl.split('?url=')[1]
            res.redirect(`/?url=${encodeURIComponent(url)}`);
        }
        else {
            res.redirect(`/?url=${encodeURIComponent(req.originalUrl)}`);
        }
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
    let lastUrl = req.get('Referrer')
    req.session.destroy(function () {
        res.redirect(`/?info=${encodeURIComponent('Sessão terminada com sucesso')}&url=${encodeURIComponent(lastUrl)}`);
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

    res.render(path.join(__dirname, 'website', 'views', 'login.ejs'), { st });
})

app.get('/register', (req, res) => {
    res.render(path.join(__dirname, 'website', 'views', 'register.ejs'));
})

app.get('/dashboard', restrict, async (req, res) => {

    var sql = `SELECT * FROM modulos`
    var data = await global.db(sql)

    var sql = `SELECT turma FROM users WHERE id = ${req.session.user.id}`
    var turma = await global.db(sql)

    let final = data.filter(d => turma[0].turma.includes(d.turma))

    res.render(path.join(__dirname, 'website', 'views', 'user', 'dash.ejs'), { user: req.session.user, data: final });
})

app.post('/', async (req, res) => {
    let { email, ppw } = req.body;
    let { url } = req.query

    let user = await global.db('SELECT * FROM users WHERE email = ?', [email]);

    if (user.length > 0 && bcrypt.compareSync(ppw, user[0].password)) {
        if (user[0].active == '1') {
            req.session.user = user[0];
            if(user[0].tfa != null) {
                res.redirect('/2fa?url=' + url);
            } else {
                res.redirect(url || '/dashboard');
            }
        } else {
            res.redirect(`/?error=` + encodeURIComponent('Conta Pendente para Aprovação!'));
        }
    }
    else {
        let error = `Email ou password incorretos!`
        req.session.error = error;
        res.redirect('/');
    }
})

app.post('/register', async (req, res) => {
    let { username, email, password, ppwVerify } = req.body;

    let user = await global.db('SELECT * FROM users WHERE email = ?', [email]);

    if (user.length > 0) {
        let error = `Endereço de email em uso!`
        req.session.error = error;
        res.redirect('/register');
    }
    else if (password !== ppwVerify) {
        let error = `As passwords não coincidem!`
        req.session.error = error;
        res.redirect('/register');
    }
    else {
        const hash = bcrypt.hashSync(password, saltRounds);

        await global.db('INSERT INTO users (username, email, password, perms, active) VALUES (?, ?, ?, "aluno", false)', [username, email, hash]);
        let success = `Utilizador criado com sucesso! Aguarde que um administrador aprove a conta!`
        req.session.success = success;
        res.redirect('/');
    }
})

app.get('*/getQRCode', restrict, async (req, res) => {
    let secret = speakeasy.generateSecret({ length: 20, name: 'Val do TGEIO20 - LMS' });

    console.log(secret.base32);

    qrcode.toDataURL(secret.otpauth_url, function(err, data_url) {
      
        res.json({ secret: secret.base32, data_url: data_url });
      });
})

app.post('*/verify', async (req, res) => {
    let { secret, token } = req.body;
    let { id } = req.session.user;

    console.log("secret", secret);
    console.log("token", token);

    let verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token
    });

    res.json({ verified });
    
    if(verified) {
        await global.db('UPDATE users SET tfa = ? WHERE id = ?', [secret, id]);
    }
})

app.post('*/remove2fa',restrict, async (req, res) => {
    let { id } = req.session.user;

    await global.db('UPDATE users SET tfa = NULL WHERE id = ?', [id]);

    res.json({ success: true });
})

app.post('*/updateSettings', restrict, async(req, res) => {
    let { id } = req.session.user;
    let { username } = req.body;

    await global.db('UPDATE users SET username = ? WHERE id = ?', [username, id]);
    req.session.user.username = username;

    res.json({ success: true });
})

app.get('/2fa', restrict, async (req, res) => {
    let st;

    res.render(path.join(__dirname, 'website', 'views', '2fa.ejs'), { st });
})

app.post('/2fa', restrict, async (req, res) => {
    let { token } = req.body;
    let {  url }   = req.query;
    let { tfa } = req.session.user;


    let verified = speakeasy.totp.verify({
        secret: tfa,
        encoding: 'base32',
        token: token
    });

    if(verified) {
       if(url != undefined && url != '' && url != null) {
            res.redirect(decodeURIComponent(url));
       }
         else {
                res.redirect('/dashboard');
         }
    } else {
        let error = `Código inválido! Tente novamente!`
        req.session.error = error;
        res.redirect('/2fa');
    }
})

app.use('/admin', restrict, authRole('admin'), require('./website/routes/admin'));
app.use('/prof', restrict, authRole('professor'), require('./website/routes/teacher'));
app.use('/aluno', restrict, authRole('aluno'), require('./website/routes/user'));

//https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04 opção 3
