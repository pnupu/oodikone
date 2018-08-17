const router = require('express').Router()
const teachers = require('../services/teachers')

router.get('/teachers', async (req, res) => {
  const { searchTerm } = req.query
  const result = await teachers.bySearchTerm(searchTerm)
  res.json(result)
})

module.exports = router