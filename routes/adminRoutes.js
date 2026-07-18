const express = require('express');
const router = express.Router();
const { createAdmin, loginAdmin, getAdmin, updateAdmin, deleteAdmin, createUserByAdmin } = require('./../controllers/adminController.js');
const { authorize } = require('../middlewares/authMiddleware.js');

//admin auth
router.post('/create/admin', createAdmin)
router.post('/login/admin', loginAdmin)
router.get('/get/admin/:id', authorize, getAdmin)
router.put('/update/admin/:id', authorize, updateAdmin)
router.delete('/delete/admin/:id', authorize, deleteAdmin)
router.post('/createUserByAdmin', authorize, createUserByAdmin)

module.exports = router;
