const express = require('express')
const router = express.Router()
const path = require('path')

router.get('/:module/contents', async (req, res) => {
    var { module } = req.params

    var sql = `SELECT * FROM module_content WHERE module = ? ORDER BY position ASC`
    var data = await global.db(sql, [module])

    var sql = `SELECT content_id FROM user_content_views WHERE user_id = ? AND module = ?`
    var viewed = await global.db(sql, [req.session.user.id, module])

    return res.render(path.join(__dirname, '..', 'views', 'user', 'contents.ejs'), { data, user: req.session.user, viewed })
})

router.post('/:module/contents', async (req, res) => {
    var { module } = req.params

    let { id, tempo, pausas, tempoPausas } = req.body

    let object = {
        tempo, pausas, tempoPausas
    }

    var sql = `INSERT INTO user_content_views (user_id, module, content_id, viewed, data) VALUES (?, ?, ?, ?, ?)`
    await global.db(sql, [req.session.user.id, module, id, 1, JSON.stringify(object)])

    return res.redirect(`/aluno/${encodeURIComponent(module)}/contents`)
})

router.get('/:module/evaluations', async (req, res) => {
    var { module } = req.params

    var sql = `SELECT * FROM evaluations WHERE module = ?`
    var evaluations = await global.db(sql, [module])

    var sql = `SELECT evaluation_id, score FROM user_evaluations WHERE user_id = ?`
    var viewed = await global.db(sql, [req.session.user.id,])

    let data = evaluations/*.filter(e => viewed.some(v => v.evaluation_id == e.id))*/
    return res.render(path.join(__dirname, '..', 'views', 'user', 'evaluations.ejs'), { data, user: req.session.user, viewed })

})

router.get('/:module/evaluations/:id', async (req, res) => {
    var { module, id } = req.params

    var value;

    var sql = `SELECT * FROM evaluations WHERE module = ? AND id = ?`
    var evaluation = await global.db(sql, [module, id])

    if (evaluation.length == 0) return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)
    else if (new Date > new Date(evaluation[0].end_date)) return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)
    else if (new Date < new Date(evaluation[0].start_date)) return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)

    var sql = `SELECT question, answers, correct FROM module_evaluations WHERE module = ?`
    var evaluations = await global.db(sql, [module])

    let page;
    if (req.query.page) {
        page = req.query.page;

        var sql = `SELECT * FROM user_evaluations WHERE user_id = ? AND evaluation_id = ?`
        var sqlData = await global.db(sql, [req.session.user.id, id])

        value = {
            questions: sqlData[0].questions[page].questions,
            answers: sqlData[0].questions[page].answers,
            hasMultiple: sqlData[0].questions[page].hasMultiple,
            isLast: sqlData[0].questions[page].isLast,
        }

        

    }
    else {
        let questions = evaluation[0].quest_n
        page = 0;

        let random = []
        for (let i = 0; i < questions; i++) {
            let randomIndex = Math.floor(Math.random() * evaluations.length)
            var data = {
                questions: evaluations[randomIndex].question,
                hasMultiple: evaluations[randomIndex].correct.length > 1 ? true : false,
                isLast: i == questions - 1 ? true : false,
            }
            //get all the answers, randomize them and set it to the data
            let answers = evaluations[randomIndex].answers
            answers = answers.sort(() => Math.random() - 0.5)
            data.answers = answers
            
            random.push(data)
            evaluations.splice(randomIndex, 1)
        }
        var sql = `SELECT * FROM user_evaluations WHERE user_id = ? AND evaluation_id = ?`
        var verify = await global.db(sql, [req.session.user.id, id])

        if (verify.length == 0) {
            var sql = `INSERT INTO user_evaluations (user_id, evaluation_id, questions, answers, score, data) VALUES (?, ?, ?, ?, ?, ?)`
            await global.db(sql, [req.session.user.id, id, JSON.stringify(random), JSON.stringify([]), -1, JSON.stringify([])]) 

            value =  random[page]

        } else {
            value = verify[0].questions[page]

        }
    }

    return res.render(path.join(__dirname, '..', 'views', 'user', 'q_main.ejs'), { user: req.session.user, page, data: value })

})
router.post('/:module/evaluations/:id', async (req, res) => {
    var { module, id } = req.params
    var { action, selected, userID, n, tempoPausas, pausas, tempo  } = req.body

    var sql = `SELECT * FROM evaluations WHERE module = ? AND id = ?`
    var evaluation = await global.db(sql, [module, id])

    if (evaluation.length == 0) return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)
    else if (new Date > new Date(evaluation[0].end_date)) return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)
    else if (new Date < new Date(evaluation[0].start_date)) return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)

    if(action == 'continue') {
        var sql = `SELECT * FROM user_evaluations WHERE user_id = ? AND evaluation_id = ?`
        var sqlData = await global.db(sql, [req.session.user.id, id])

        let answers = sqlData[0].answers
        let data = sqlData[0].data

        let objectData = {
            tempo, pausas, tempoPausas
        }

        answers.push(selected)

        data.push(objectData)

        var sql = `UPDATE user_evaluations SET answers = ?, data = ? WHERE user_id = ? AND evaluation_id = ?`
        await global.db(sql, [JSON.stringify(answers), JSON.stringify(data), req.session.user.id, id])

        return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations/${id}?page=${parseInt(n) + 1}`)
    } else if (action == 'final') {
        var sql = `SELECT * FROM user_evaluations WHERE user_id = ? AND evaluation_id = ?`
        var sqlData = await global.db(sql, [req.session.user.id, id])

        let answers = sqlData[0].answers
        let data = sqlData[0].data

        let objectData = {
            tempo, pausas, tempoPausas
        }

        answers.push(selected)

        data.push(objectData)

        var sql = `UPDATE user_evaluations SET answers = ?, data = ? WHERE user_id = ? AND evaluation_id = ?`
        await global.db(sql, [JSON.stringify(answers), JSON.stringify(data), req.session.user.id, id])

        var sql = `SELECT question, answers, correct FROM module_evaluations WHERE module = ?`
        var evaluations = await global.db(sql, [module])

        let score = 0;
        for (let i = 0; i < sqlData[0].questions.length; i++) {
            let correctIndex = evaluations.find(e => e.question == sqlData[0].questions[i].questions).correct
            let answerIndex = sqlData[0].answers[i]

            //get user answer value from questions column
            let userAnswer = sqlData[0].questions[i].answers[answerIndex]
            //get correct answer value from answers column
            let correctAnswer = evaluations.find(e => e.question == sqlData[0].questions[i].questions).answers[correctIndex]
            //compare both
            if (userAnswer == correctAnswer) score++
           

        }

        score = (score / sqlData[0].questions.length) * 100

        var sql = `UPDATE user_evaluations SET score = ? WHERE user_id = ? AND evaluation_id = ?`
        await global.db(sql, [score, req.session.user.id, id])

        return res.redirect(`/aluno/${encodeURIComponent(module)}/evaluations`)
    }

})

module.exports = router