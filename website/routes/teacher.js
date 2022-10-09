const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/classes', async (req, res) => {
    var sql = `SELECT * FROM modulos`
    var data = await global.db(sql)

    var sql = `SELECT turma FROM users WHERE id = ${req.session.user.id}`
    var turma = await global.db(sql)

    let final = data.filter(d => turma.some(t => t.turma == d.turma))

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'classes.ejs'), { data: final, user: req.session.user })

})

router.get('/classes/:module/contents', async (req, res) => {
    var { module } = req.params
    var sql = `SELECT * FROM module_content WHERE module = ? ORDER BY position ASC`
    var data = await global.db(sql, [module])

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'content.ejs'), { data, user: req.session.user })
})

router.post('/classes/:module/contents', async (req, res) => {

    let { action } = req.body
    let module = req.params.module

    if (action == 'new') {
        let { title, editordata, position } = req.body

        var sql = `INSERT INTO module_content (module, content_title, content, position) VALUES (?, ?, ?, ?)`
        await global.db(sql, [module, String(title), String(editordata), position])

        req.session.success = 'Conteúdo criado com sucesso!'
    } else if (action == 'edit') {
        let { title, editordata, id, position } = req.body

        var sql = `UPDATE module_content SET content_title = ?, content = ?, position = ? WHERE id = ?`
        await global.db(sql, [String(title), String(editordata), position, id])

        req.session.success = 'Conteúdo editado com sucesso!'
    } else if (action == 'delete') {
        let { id } = req.body

        var sql = `DELETE FROM module_content WHERE id = ?`
        await global.db(sql, [id])

        req.session.success = 'Conteúdo deletado com sucesso!'
    }

    return res.redirect(`/prof/classes/${encodeURIComponent(module)}/contents`)
})

router.get('/classes/:module/evaluations', async (req, res) => {

    let { module } = req.params

    var sql = `SELECT * FROM module_evaluations WHERE module = ?`
    var data = await global.db(sql, [module])

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'evaluations.ejs'), { data, user: req.session.user })

})

router.post('/classes/:module/evaluations', async (req, res) => {

    let { action } = req.body
    let module = req.params.module

    if (action == 'new') {

        let { editordata, answers, correct, level } = req.body

        let arr = []
        if (!Array.isArray(answers)) arr.push(answers)
        else arr = answers

        let arr2 = []
        if (!Array.isArray(correct)) arr2.push(correct)
        else arr2 = correct

        var sql = `INSERT INTO module_evaluations (module, question, answers, correct, level) VALUES (?, ?, ?, ?, ?)`
        await global.db(sql, [module, String(editordata), JSON.stringify(arr), JSON.stringify(arr2), level])

        req.session.success = 'Questão criada com sucesso!'

    } else if (action == 'edit') {

        let { editordata, answers, correct, level, id } = req.body

        let arr = []
        if (!Array.isArray(answers)) arr.push(answers)
        else arr = answers

        let arr2 = []
        if (!Array.isArray(correct)) arr2.push(correct)
        else arr2 = correct

        var sql = `UPDATE module_evaluations SET question = ?, answers = ?, correct = ?, level = ? WHERE id = ?`
        await global.db(sql, [String(editordata), JSON.stringify(arr), JSON.stringify(arr2), level, id])

        req.session.success = 'Questão editada com sucesso!'

    } else if (action == 'delete') {

        let { id } = req.body

        var sql = `DELETE FROM module_evaluations WHERE id = ?`
        await global.db(sql, [id])

        req.session.success = 'Questão eliminada com sucesso!'

    }
    return res.redirect(`/prof/classes/${encodeURIComponent(module)}/evaluations`)

})

router.get('/classes/:module/results', async (req, res) => {

})


module.exports = router