const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/students', async (req, res) => {
    var sql = "SELECT * FROM users WHERE active = 1"
    let data = await global.db(sql)

    var sql = `SELECT * FROM turmas`
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

        var sql = `UPDATE users SET username = ?, password = ?, email = ?, turma = ?, perms = ? WHERE id = ?`
        await global.db(sql, [username, password, email, (JSON.stringify(arr) || "[]"), perms, id])

        req.session.success = 'Utilizador editado com sucesso!'
    }

    return res.redirect('/admin/students')

})

router.get('/classes', async (req, res) => {
    var sql = `SELECT * FROM turmas`
    var data = await global.db(sql)

    res.render(path.join(__dirname, '..', 'views', 'admin', 'classes.ejs'), { data, user: req.session.user })
})

router.post('/classes', async (req, res) => {
    var { action } = req.body

    if (action == 'delete') {
        var { id } = req.body
        var sql = `DELETE FROM turmas WHERE turma = ?`
        await global.db(sql, [id])

        req.session.success = 'Turma apagada com sucesso!'

    } else if (action == 'update') {

        var { id, nome, contents } = req.body
        var sql = `UPDATE turmas SET nome = ?, conteudos = ? WHERE turma = ?`
        await global.db(sql, [nome, String(contents), id])

        req.session.success = 'Turma atualizada com sucesso!'

    } else if (action == 'add') {

        var { turma, nome, contents } = req.body

        var test = await global.db(`SELECT * FROM turmas WHERE turma = ?`, [turma])
        if (test.length > 0) {
            req.session.error = 'Já existe uma turma com esse nome!'
            return res.redirect('/admin/classes')
        }

        var sql = `INSERT INTO turmas (turma, nome, conteudos) VALUES (?, ?, ?)`
        await global.db(sql, [turma, nome, String(contents)])

        req.session.success = 'Turma criada com sucesso!'

    }

    res.redirect('/admin/classes')
})

router.get('/registrations', async (req, res) => {
    var sql = `SELECT * FROM users WHERE active = 0`
    let data = await global.db(sql)

    var sql = `SELECT * FROM turmas`
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