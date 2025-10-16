const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const resp = await axios.get('https://jsonplaceholder.typicode.com/posts?userId=' + req.user.id);
    res.json(resp.data);
  } catch(err) {
    next(err);
  }
});

module.exports = router;