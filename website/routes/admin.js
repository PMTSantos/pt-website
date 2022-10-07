const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/students', async (req, res) => {

})

router.get('/students/:id', async (req, res) => {

})

router.get('/classes', async (req, res) => {

})

router.get('/classes/:id', async (req, res) => {

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

        var sql = `UPDATE users SET active = 1, perms = ?, turma = ? WHERE id = ?`
        await global.db(sql, [perm, (turmas || '[]') , id])

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