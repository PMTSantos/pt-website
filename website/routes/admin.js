const express = require('express')
const router = express.Router()
const path = require('path')

const bcrypt = require('bcrypt');
const saltRounds = 10;

router.get('/students', async (req, res) => {
    var sql = "SELECT * FROM users WHERE active = 1"
    let data = await global.db(sql)

    var sql = `SELECT * FROM modulos`
    let turmas = await global.db(sql)

    return res.render(path.join(__dirname, '..', 'views', 'admin', 'users.ejs'), { data, user: req.session.user, turmas })
})

router.post('/students', async (req, res) => {
    let { action } = req.body

    if (action == 'delete') {
        let { id } = req.body
        var sql = `DELETE FROM users WHERE id = ${id}`
        await global.db(sql)

        req.session.success = 'Utilizador eliminado com sucesso!'
    } else if (action == 'edit') {
        let { id, username, email, turmas, password, perms } = req.body

        let arr = []
        if(!Array.isArray(turmas)) arr.push(turmas)
        else arr = turmas

        var sql = `UPDATE users SET username = ?, email = ?, turma = ?, perms = ? WHERE id = ?`
        await global.db(sql, [username, email, (JSON.stringify(arr) || "[]"), perms, id])

        if (password != '') {
            const hash = bcrypt.hashSync(password, saltRounds);

            var sql = `UPDATE users SET password = ? WHERE id = ?`
            await global.db(sql, [hash, id])
        }

        req.session.success = 'Utilizador editado com sucesso!'
    }

    return res.redirect('/admin/students')

})

router.get('/classes', async (req, res) => {
    var sql = `SELECT * FROM modulos`
    var data = await global.db(sql)

    res.render(path.join(__dirname, '..', 'views', 'admin', 'classes.ejs'), { data, user: req.session.user })
})

router.post('/classes', async (req, res) => {
    var { action } = req.body

    if (action == 'delete') {
        var { id } = req.body

        var sqlStatements = [
            "DELETE ue FROM user_evaluations AS ue JOIN evaluations AS e ON e.id = ue.evaluation_id WHERE e.module = ?;",
            "DELETE FROM evaluations WHERE module = ?",
            "DELETE FROM user_content_views WHERE module = ?",
            "DELETE FROM module_content WHERE module = ?",
            "DELETE FROM modulos WHERE turma = ?"
        ]

        sqlStatements.forEach(async (sql) => {
            await global.db(sql, [id])
        })  

        var sql = `SELECT id, turma FROM users`
        var users = await global.db(sql)

        users.forEach(async (user) => {
            let arr = []
            if(!Array.isArray(user.turma)) arr.push(user.turma)
            else arr = user.turma

            if(arr.includes(id)) {
                arr = arr.filter((el) => el != id)
                var sql = `UPDATE users SET turma = ? WHERE id = ?`
                await global.db(sql, [JSON.stringify(arr), user.id])
            }
        })

        req.session.success = 'Módulo apagado com sucesso!'

    } else if (action == 'update') {

        var { id, nome, contents } = req.body
        var sql = `UPDATE modulos SET nome = ?, conteudos = ? WHERE turma = ?`
        await global.db(sql, [nome, String(contents), id])

        req.session.success = 'Módulo atualizado com sucesso!'

    } else if (action == 'add') {

        var { turma, nome, contents } = req.body

        var test = await global.db(`SELECT * FROM modulos WHERE turma = ?`, [turma])
        if (test.length > 0) {
            req.session.error = 'Já existe um módulo com esse nome!'
            return res.redirect('/admin/classes')
        }

        var sql = `INSERT INTO modulos (turma, nome, conteudos) VALUES (?, ?, ?)`
        await global.db(sql, [turma, nome, String(contents)])

        req.session.success = 'Módulo criado com sucesso!'

    } else if (action == 'clone') {
        var {turma, nome, contents, keep, original} = req.body

        var test = await global.db(`SELECT * FROM modulos WHERE turma = ?`, [turma])
        if (test.length > 0) {
            req.session.error = 'Já existe um módulo com esse nome!'
            return res.redirect('/admin/classes')
        }

        var sql = `INSERT INTO modulos (turma, nome, conteudos) VALUES (?, ?, ?)`
        await global.db(sql, [turma, nome, String(contents)])

        

        if(keep && keep.includes('tests')) {
            var sql = `SELECT * FROM evaluations WHERE module = ?`
            var tests = await global.db(sql, [original])

            for(let i = 0; i < tests.length; i++) {
                var sql = `INSERT INTO evaluations (module, quest_n, start_date, end_date) VALUES (?, ?, ?, ?)`
                await global.db(sql, [turma, tests[i].quest_n, tests[i].start_date, tests[i].end_date])
            }

            var sql = `SELECT * FROM module_evaluations WHERE module = ?`
            var questions = await global.db(sql, [original])

            for(let i = 0; i < questions.length; i++) {
                var sql = `INSERT INTO module_evaluations (module,  question, answers, correct, level) VALUES (?, ?, ?, ?, ?)`
                await global.db(sql, [turma, questions[i].question, JSON.stringify(questions[i].answers), JSON.stringify(questions[i].correct), questions[i].level])
            }

        }
        if (keep && keep.includes('contents')) {
            var sql = `SELECT * FROM module_content WHERE module = ?`
            var contents = await global.db(sql, [original])

            for(let i = 0; i < contents.length; i++) {
                var sql = `INSERT INTO module_content (module, content_title, content, position) VALUES (?, ?, ?, ?)`
                await global.db(sql, [turma, contents[i].content_title, contents[i].content, contents[i].position])
            }
        }

    }

    res.redirect('/admin/classes')
})

router.get('/registrations', async (req, res) => {
    var sql = `SELECT * FROM users WHERE active = 0`
    let data = await global.db(sql)

    var sql = `SELECT * FROM modulos`
    let turmas = await global.db(sql)

    return res.render(path.join(__dirname, '..', 'views', 'admin', 'registrations.ejs'), { data, user: req.session.user, turmas })

})
router.post('/registrations', async (req, res) => {
    let { id, action } = req.body

    if (action == 'accept') {

        let { perm, turmas } = req.body

        let arr = []
        if(!Array.isArray(turmas)) arr.push(turmas)
        else arr = turmas

        var sql = `UPDATE users SET active = 1, perms = ?, turma = ? WHERE id = ?`
        await global.db(sql, [perm, (JSON.stringify(arr) || '[]'), id])

        req.session.success = `Utilizador aprovado com sucesso!`
        return res.redirect('/admin/registrations')

    }
    else if (action == 'reject') {

        var sql = `DELETE FROM users WHERE id = ?`
        await global.db(sql, [id])

        req.session.success = `Utilizador rejeitado com sucesso!`
        return res.redirect('/admin/registrations')

    }
})


module.exports = router