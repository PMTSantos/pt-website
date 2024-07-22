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

function secondsToHms(d) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    // Adding leading zeros if the number is less than 10
    let hDisplay = h < 10 ? '0' + h : h;
    let mDisplay = m < 10 ? '0' + m : m;
    let sDisplay = s < 10 ? '0' + s : s;
    return hDisplay + ':' + mDisplay + ':' + sDisplay;
}

router.get('/stats/:module', async (req, res) => {
    let { module } = req.params

    var sql = `SELECT ucv.data, ucv.module, mc.content_title FROM user_content_views AS ucv JOIN module_content AS mc ON ucv.content_id = mc.id WHERE ucv.module = ?`
    const user_content_views = await global.db(sql, [module])

    sql = `SELECT * FROM user_evaluations AS ue JOIN evaluations AS me ON ue.evaluation_id = me.id WHERE me.module = ?`
    const user_evaluations = await global.db(sql, [module])

    let avg = {
        contentReadingTime: 0,
        contentPauses: 0,
        contentPausesTime: 0,
        testsTime: 0,
        testsPauses: 0,
        testsPausesTime: 0
    }

    user_content_views.forEach((e) => {

        avg.contentPauses += parseInt(e.data.pausas)
    
        //tempo e tempoPausas hh:mm:ss
        let tempo = e.data.tempo == '' ? '00:00:00'.split(':') : e.data.tempo.split(':')
        let tempoPausas = e.data.tempoPausas == '' ? '00:00:00'.split(':') : e.data.tempoPausas.split(':')
    
        avg.contentReadingTime += parseInt(tempo[0]) * 3600 + parseInt(tempo[1]) * 60 + parseInt(tempo[2])
        avg.contentPausesTime += parseInt(tempoPausas[0]) * 3600 + parseInt(tempoPausas[1]) * 60 + parseInt(tempoPausas[2])
    })
    
    let countContentViews = user_content_views.length;

    avg.contentReadingTime = avg.contentReadingTime / countContentViews;
    avg.contentPausesTime = avg.contentPausesTime / countContentViews;
    avg.contentPauses = avg.contentPauses / countContentViews;

    // Convert avg.contentReadingTime and avg.contentPausesTime to hh:mm:ss
    avg.contentReadingTime = secondsToHms(avg.contentReadingTime);
    avg.contentPausesTime = secondsToHms(avg.contentPausesTime);

    let countEval = 0;

    user_evaluations.forEach((e) => {

        e.data.forEach((f) =>{
            avg.testsPauses += parseInt(f.pausas)

            //tempo e tempoPausas hh:mm:ss
            let tempo = f.tempo == '' ? '00:00:00'.split(':') : f.tempo.split(':')
            let tempoPausas = f.tempoPausas == '' ? '00:00:00'.split(':') : f.tempoPausas.split(':')

           avg.testsTime += parseInt(tempo[0]) * 3600 + parseInt(tempo[1]) * 60 + parseInt(tempo[2])
            avg.testsPausesTime += parseInt(tempoPausas[0]) * 3600 + parseInt(tempoPausas[1]) * 60 + parseInt(tempoPausas[2])

            countEval++;
        })
    })

    avg.testsTime = avg.testsTime / countEval;
    avg.testsPausesTime = avg.testsPausesTime / countEval;

    // Convert avg.testsTime and avg.testsPausesTime to hh:mm:ss
    avg.testsTime = secondsToHms(avg.testsTime);
    avg.testsPausesTime = secondsToHms(avg.testsPausesTime);

    let rawContentData = []

    user_content_views.forEach((e) => {
        let index = rawContentData.findIndex((f) => f.content_title == e.content_title)
        if (index == -1) {
            rawContentData.push({
                content_title: e.content_title,
                totalReadingTime: 0, //
                avgReadingTime: 0,
                totalPauses: 0, //
                avgPauses: 0,
                totalPausesTime: 0, //
                avgPauseTime: 0,
                count: 0
            })
            index = rawContentData.length - 1
        }

        rawContentData[index].count++
        rawContentData[index].totalReadingTime += parseInt(e.data.tempo.split(':')[0]) * 3600 + parseInt(e.data.tempo.split(':')[1]) * 60 + parseInt(e.data.tempo.split(':')[2])
        rawContentData[index].totalPauses += parseInt(e.data.pausas)
        rawContentData[index].totalPausesTime += parseInt(e.data.tempoPausas.split(':')[0]) * 3600 + parseInt(e.data.tempoPausas.split(':')[1]) * 60 + parseInt(e.data.tempoPausas.split(':')[2])
    })

    rawContentData.forEach((e) => {
        e.avgReadingTime = e.totalReadingTime / e.count
        e.avgPauseTime = e.totalPausesTime / e.count
        e.avgPauses = e.totalPauses / e.count

        e.totalReadingTime = secondsToHms(e.totalReadingTime)
        e.totalPausesTime = secondsToHms(e.totalPausesTime)
        e.avgReadingTime = secondsToHms(e.avgReadingTime)
        e.avgPauseTime = secondsToHms(e.avgPauseTime)
    })

    
    async function processEvaluations() {
        let rawQuestionData = []
        for (const evaluation of user_evaluations) {
            var qIndex = 0;
            for (const question of evaluation.questions) {
                let index = rawQuestionData.findIndex((q) => q.questionText == question.questions);

                if (index == -1) {
                    rawQuestionData.push({
                        questionText: question.questions,
                        totalReadingTime: 0,
                        avgReadingTime: 0,
                        totalPauses: 0,
                        avgPauses: 0,
                        totalPausesTime: 0,
                        avgPauseTime: 0,
                        count: 0,
                        successCount: 0,
                        successRate: 0,
                        attempts: 0
                    });
                    index = rawQuestionData.length - 1;
                }
    
                rawQuestionData[index].count++;
                rawQuestionData[index].attempts++;
    
                let data = evaluation.data[qIndex];
                if (data) {
                    rawQuestionData[index].totalReadingTime += parseInt(data.tempo.split(':')[0]) * 3600 + parseInt(data.tempo.split(':')[1]) * 60 + parseInt(data.tempo.split(':')[2]);
                    rawQuestionData[index].totalPauses += parseInt(data.pausas);
                    rawQuestionData[index].totalPausesTime += parseInt(data.tempoPausas.split(':')[0]) * 3600 + parseInt(data.tempoPausas.split(':')[1]) * 60 + parseInt(data.tempoPausas.split(':')[2]);
                }
    
            sql = 'SELECT answers, correct FROM module_evaluations WHERE question = ? AND module = ?'
            let correctData = await global.db(sql, [question.questions, module])

            let curAnswersIndex = evaluation.answers[qIndex].split(',').map((e) => parseInt(e));
            let correctAnswersIndex = correctData[0].correct;
            let correctAnswers = [];

            correctAnswersIndex.forEach((e) => {
                correctAnswers.push(correctData[0].answers[e]);
            });

            let curAnswers = [];
            curAnswersIndex.forEach((e) => {
                curAnswers.push(question.answers[e]);
            });

            if (curAnswers.length == correctAnswers.length) {
                let correct = 0;
                for (let i = 0; i < correctAnswers.length; i++) {
                    let correctAnswerValue = correctAnswers[i];
                    let userAnswerValue = curAnswers.find((e) => e == correctAnswerValue);
                    if (userAnswerValue) {
                        correct++;
                    }
                }
    
                if (correct == correctAnswers.length && data) {
                    rawQuestionData[index].successCount++;
                }
            }
            qIndex++;
            }
        }
    
        // Calculate averages and convert times to hh:mm:ss format
        rawQuestionData.forEach((q) => {
            q.avgReadingTime = q.totalReadingTime / q.count;
            q.avgPauseTime = q.totalPausesTime / q.count;
            q.avgPauses = q.totalPauses / q.count;
    
            q.totalReadingTime = secondsToHms(q.totalReadingTime);
            q.totalPausesTime = secondsToHms(q.totalPausesTime);
            q.avgReadingTime = secondsToHms(q.avgReadingTime);
            q.avgPauseTime = secondsToHms(q.avgPauseTime);
    
            q.successRate = (q.successCount / q.attempts) * 100; // Percentage
        });
    
        return rawQuestionData;
    }
    
    // Call the function to process evaluations
    let rawQuestionData = await processEvaluations();

    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'stat.ejs'), { avg, rawContentData, rawQuestionData, module, user: req.session.user })
})

router.get('/stats/:module/students', async (req, res) => {
    let { module } = req.params

    var sql = `SELECT id, username FROM users WHERE JSON_CONTAINS(turma, '"${module}"');`
    var data = await global.db(sql)

    //console.log(data)
    return res.render(path.join(__dirname, '..', 'views', 'teacher', 'stat_student.ejs'), { data, module, user: req.session.user })
})

router.get('/stats/:module/students/:id', async (req, res) => {
    var { module, id } = req.params

    var sql = `SELECT * FROM user_content_views AS ucv JOIN module_content AS mc ON ucv.content_id = mc.id WHERE ucv.user_id = ? AND mc.module = ?`
    var user_content_views = await global.db(sql, [id, module])

    sql = `SELECT * FROM user_evaluations AS ue JOIN evaluations AS e ON ue.evaluation_id = e.id WHERE ue.user_id = ? AND e.module = ?`
    var user_evaluations = await global.db(sql, [id, module])

    let avg = {
        contentReadingTime: 0,
        contentPauses: 0,
        contentPausesTime: 0,
        testsTime: 0,
        testsPauses: 0,
        testsPausesTime: 0
    }

    user_content_views.forEach((e) => {

        avg.contentPauses += parseInt(e.data.pausas)
    
        //tempo e tempoPausas hh:mm:ss
        let tempo = e.data.tempo == '' ? '00:00:00'.split(':') : e.data.tempo.split(':')
        let tempoPausas = e.data.tempoPausas == '' ? '00:00:00'.split(':') : e.data.tempoPausas.split(':')
    
        avg.contentReadingTime += parseInt(tempo[0]) * 3600 + parseInt(tempo[1]) * 60 + parseInt(tempo[2])
        avg.contentPausesTime += parseInt(tempoPausas[0]) * 3600 + parseInt(tempoPausas[1]) * 60 + parseInt(tempoPausas[2])
    })
    
    let countContentViews = user_content_views.length;

    avg.contentReadingTime = avg.contentReadingTime / countContentViews;
    avg.contentPausesTime = avg.contentPausesTime / countContentViews;
    avg.contentPauses = avg.contentPauses / countContentViews;

    // Convert avg.contentReadingTime and avg.contentPausesTime to hh:mm:ss
    avg.contentReadingTime = secondsToHms(avg.contentReadingTime);
    avg.contentPausesTime = secondsToHms(avg.contentPausesTime);

    let countEval = 0;

    user_evaluations.forEach((e) => {

        e.data.forEach((f) =>{
            avg.testsPauses += parseInt(f.pausas)

            //tempo e tempoPausas hh:mm:ss
            let tempo = f.tempo == '' ? '00:00:00'.split(':') : f.tempo.split(':')
            let tempoPausas = f.tempoPausas == '' ? '00:00:00'.split(':') : f.tempoPausas.split(':')

           avg.testsTime += parseInt(tempo[0]) * 3600 + parseInt(tempo[1]) * 60 + parseInt(tempo[2])
            avg.testsPausesTime += parseInt(tempoPausas[0]) * 3600 + parseInt(tempoPausas[1]) * 60 + parseInt(tempoPausas[2])

            countEval++;
        })
    })

    avg.testsTime = avg.testsTime / countEval;
    avg.testsPausesTime = avg.testsPausesTime / countEval;

    // Convert avg.testsTime and avg.testsPausesTime to hh:mm:ss
    avg.testsTime = secondsToHms(avg.testsTime);
    avg.testsPausesTime = secondsToHms(avg.testsPausesTime);

    let rawContentData = []

    user_content_views.forEach((e) => {
        let index = rawContentData.findIndex((f) => f.content_title == e.content_title)
        if (index == -1) {
            rawContentData.push({
                content_title: e.content_title,
                totalReadingTime: 0, //
                avgReadingTime: 0,
                totalPauses: 0, //
                avgPauses: 0,
                totalPausesTime: 0, //
                avgPauseTime: 0,
                count: 0
            })
            index = rawContentData.length - 1
        }

        rawContentData[index].count++
        rawContentData[index].totalReadingTime += parseInt(e.data.tempo.split(':')[0]) * 3600 + parseInt(e.data.tempo.split(':')[1]) * 60 + parseInt(e.data.tempo.split(':')[2])
        rawContentData[index].totalPauses += parseInt(e.data.pausas)
        rawContentData[index].totalPausesTime += parseInt(e.data.tempoPausas.split(':')[0]) * 3600 + parseInt(e.data.tempoPausas.split(':')[1]) * 60 + parseInt(e.data.tempoPausas.split(':')[2])
    })

    rawContentData.forEach((e) => {
        e.avgReadingTime = e.totalReadingTime / e.count
        e.avgPauseTime = e.totalPausesTime / e.count
        e.avgPauses = e.totalPauses / e.count

        e.totalReadingTime = secondsToHms(e.totalReadingTime)
        e.totalPausesTime = secondsToHms(e.totalPausesTime)
        e.avgReadingTime = secondsToHms(e.avgReadingTime)
        e.avgPauseTime = secondsToHms(e.avgPauseTime)
    })

    let rawQuestionData = false

    sql = 'SELECT username FROM users WHERE id = ?'
    let username = await global.db(sql, [id])

    res.render(path.join(__dirname, '..', 'views', 'teacher', 'stat.ejs'), { avg, rawContentData, rawQuestionData, module, user: req.session.user, username: username[0].username })


})

module.exports = router