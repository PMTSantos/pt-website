const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/:module/contents', async(req, res) => {
    var { module } = req.params

    var sql = `SELECT * FROM module_content WHERE module = ? ORDER BY position ASC`
    var data = await global.db(sql, [module])

    var sql = `SELECT content_id FROM user_content_views WHERE user_id = ? AND module = ?`
    var viewed = await global.db(sql, [req.session.user.id, module])

    return res.render(path.join(__dirname, '..', 'views', 'user', 'contents.ejs'), { data, user: req.session.user, viewed})
})

router.post('/:module/contents', async(req, res) => {
    var { module } = req.params
    
    let {id, tempo, pausas, tempoPausas} = req.body

    let object = {
        tempo, pausas, tempoPausas
    }

    var sql = `INSERT INTO user_content_views (user_id, module, content_id, viewed, data) VALUES (?, ?, ?, ?, ?)`
    await global.db(sql, [req.session.user.id, module, id, 1, JSON.stringify(object)])

    return res.redirect(`/aluno/${encodeURIComponent(module)}/contents`)
})

router.get('/:module/evaluations', async(req, res) => {
    var { module } = req.params

    var sql = `SELECT * FROM evaluations WHERE module = ?`
    var evaluations = await global.db(sql, [module])

    var sql = `SELECT evaluation_id, score FROM user_evaluations WHERE user_id = ?`
    var viewed = await global.db(sql, [req.session.user.id, ])

    let data = evaluations.filter(e => viewed.some(v => v.evaluation_id == e.id))
    return res.render(path.join(__dirname, '..', 'views', 'user', 'evaluations.ejs'), { data, user: req.session.user, viewed})

})

module.exports = router