const router = require('express').Router();
const { upload, uploadAndOptimize } = require('../config/upload');
const { auth } = require('../middleware/auth');

router.post('/product', auth(['vendor', 'admin']), upload.single('image'), async (req, res) => {
    const url = await uploadAndOptimize(req.file);
    res.json({ url });
});

module.exports = router;
