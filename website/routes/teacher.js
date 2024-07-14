const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/classes', async (req, res) => {
    var sql = `SELECT * FROM modulos`
    var data = await global.db(sql)

    var sql = `SELECT turma FROM users WHERE id = ${req.session.user.id}`
    var turma = await global.db(sql)

    let final = data.filter(d => turma[0].turma.includes(d.turma))

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

    var sql = `SELECT * FROM evaluations WHERE module = ?`
    var evaluations = await global.db(sql, [module])

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'evaluations.ejs'), { data, user: req.session.user, evaluations })

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

    } else if (action == 'test') {
        let { quant, start, end } = req.body

        if(new Date(end) < new Date(start)) {
            req.session.error = 'A data de fim não pode ser maior que a data de início!'
            return res.redirect(`/prof/classes/${encodeURIComponent(module)}/evaluations`)
        }

        var sql = `INSERT INTO evaluations (module, quest_n, start_date, end_date) VALUES (?, ?, ?, ?)`
        await global.db(sql, [module, quant, start, end])

        req.session.success = 'Teste criado com sucesso!'
    } else if (action == 'delete_test') {
        let { id } = req.body

        var sql = `DELETE FROM evaluations WHERE id = ?`
        await global.db(sql, [id])

        req.session.success = 'Teste eliminado com sucesso!'
    } else if (action == 'update_test') {
        let { id, quant, start, end } = req.body

        if(new Date(end) < new Date(start)) {
            req.session.error = 'A data de fim não pode ser maior que a data de início!'
            return res.redirect(`/prof/classes/${encodeURIComponent(module)}/evaluations`)
        }

        var sql = `UPDATE evaluations SET quest_n = ?, start_date = ?, end_date = ? WHERE id = ?`
        await global.db(sql, [quant, start, end, id])

        req.session.success = 'Teste editado com sucesso!'

    }

    return res.redirect(`/prof/classes/${encodeURIComponent(module)}/evaluations`)

})

router.get('/classes/:module/results', async (req, res) => {
        let { module } = req.params
    
        var sql = `SELECT * FROM evaluations WHERE module = ?`
        var data = await global.db(sql, [module])
    
        return res.render(path.join(__dirname, '..', 'views', 'teacher', 'results.ejs'), { data, user: req.session.user })
})

router.post('/classes/:module/results', async (req, res) => {
    let { module } = req.params

    let { action } = req.body

    if (action == 'delete') {
        let { id } = req.body
        var sql = `DELETE FROM user_evaluations WHERE evaluation_id = ?`
        await global.db(sql, [id])

        var sql = `DELETE FROM evaluations WHERE id = ?`
        await global.db(sql, [id])


        req.session.success = 'Teste eliminado com sucesso!'
    }

    return res.redirect(`/prof/classes/${encodeURIComponent(module)}/results`)
})

router.get('/classes/:module/results/:id', async (req, res) => {
    let { module, id } = req.params

    //get all the tests from the id
    var sql = `SELECT * FROM user_evaluations WHERE evaluation_id = ?`
    var data = await global.db(sql, [id])

    //get users username from users table
    for (let i = 0; i < data.length; i++) {
        var sql = `SELECT username FROM users WHERE id = ?`
        var username = await global.db(sql, [data[i].user_id])
        data[i].username = username[0].username
        data[i].module = module
    }

    //render the page
    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'result.ejs'), { data, user: req.session.user })

})

router.post('/classes/:module/results/:id', async (req, res) => {
    let { module, id } = req.params

    let { action } = req.body

    if( action == 'grade') {
        let { grade, user_id } = req.body

        var sql = `UPDATE user_evaluations SET score = ? WHERE user_id = ? AND evaluation_id = ?`
        await global.db(sql, [grade, user_id, id])

        req.session.success = 'Nota alterada com sucesso!'
    }   

    return res.redirect(`/prof/classes/${encodeURIComponent(module)}/results/${id}`)

})

router.get('/classes/:module/results/:id/:user', async (req, res) => {
    let { module, id, user } = req.params

    var sql = `SELECT * FROM user_evaluations WHERE evaluation_id = ? AND user_id = ?`
    var sqlData = await global.db(sql, [id, user])

    let page;

    if(req.query.page) page = req.query.page
    else page = 0

    var sql = `SELECT * FROM module_evaluations WHERE module = ?`
    var correctData = await global.db(sql, [module])

    let filtered = correctData.find((e) => e.question == sqlData[0].questions[page].questions)

    let correct = filtered.correct
    let answersCorrect = []
    correct.forEach((e) => {
        answersCorrect.push(filtered.answers[e])
    })

    let data = {
        questions: sqlData[0].questions[page],
        answers: {
            user: sqlData[0].answers[page],
            correct: answersCorrect,
        },
        time: sqlData[0].data[page]
    }

    let urlData = {
        module,
        id,
        user
    }

    let max = sqlData[0].questions.length

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'q_main.ejs'), { data, user: req.session.user, page, max, urlData })

})

router.get('/stats', async (req, res) => {
    var sql = `SELECT * FROM modulos`
    var data = await global.db(sql)

    var sql = `SELECT turma FROM users WHERE id = ${req.session.user.id}`
    var turma = await global.db(sql)

    let final = data.filter(d => turma[0].turma.includes(d.turma))

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'stats.ejs'), { data: final, user: req.session.user })

})

module.exports = router