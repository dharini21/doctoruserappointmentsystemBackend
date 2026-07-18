const express = require('express')
const router = express.Router()
const { authenticateRole, authorize } = require('./../middlewares/authMiddleware.js')
const { getUser, loginUser, updateUser, createUser, deleteUser, getAllDoctor, makeAppointment, cancelAppointment, ratingDoctor } = require('../controllers/userController.js')
const Enum = require('../utils/enum.js')


// user auth
router.post('/create/user', createUser)
router.post('/login/user', loginUser)
router.get('/get/user/:id', authorize, authenticateRole([Enum.ROLES.USER, Enum.ROLES.ADMIN]), getUser)
router.get('/getAll/doctor', getAllDoctor)
router.put('/update/user/:id', authorize, authenticateRole([Enum.ROLES.USER, Enum.ROLES.ADMIN]), updateUser)
router.delete('/delete/user/:id', authorize, authenticateRole([Enum.ROLES.USER, Enum.ROLES.ADMIN]), deleteUser)
router.post('/makeAppointment/user', authorize, authenticateRole([Enum.ROLES.USER, Enum.ROLES.ADMIN]), makeAppointment)
router.put('/cancelAppointment/:appointmentId', authorize, authenticateRole([Enum.ROLES.USER, Enum.ROLES.ADMIN]), cancelAppointment)
router.post('/ratingDoctor/:appointmentId', authorize, authenticateRole([Enum.ROLES.USER]), ratingDoctor)
module.exports = router;
