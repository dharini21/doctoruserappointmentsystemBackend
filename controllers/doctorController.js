const bcrypt = require("bcrypt");
const config = require('./../config/config.js')
const jwt = require('jsonwebtoken')
const Availability = require('./../models/availability.js')
const Doctor = require("./../models/doctor.js")
const User = require("./../models/user.js")
const { updateEmail } = require('./../email/sendemail.js')
const Appointment = require("./../models/appointment.js");
const createDoctor = async (req, res) => {
  try {
    const { name, phoneNo, email, hospitalName, specialist, experience, password, role, address } = req.body;
    const ifExits = await Doctor.findOne({ $or: [{ email }, { phoneNo }] })
    if (ifExits) return res.status(400).json({message:'Doctor already exits'})
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const doctor = new Doctor({
      name,
      phoneNo,
      email,
      hospitalName,
      specialist,
      experience,
      password: hashedPassword,
      role,
      address

    })
    await doctor.save();
    return res.status(200).json({ message: 'doctor registration successfully..', doctor: doctor })
  } catch (error) {
    console.error(error);
  }
}


const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email })
    if (!doctor) return res.status(400).json({message:'Bad request'})

    const isMatch = await bcrypt.compare(password, doctor.password)
    if (!isMatch) return res.status(400).json({message:'send invalid password'})

    const token = jwt.sign({ doctor: doctor._id, role: doctor.role }, config.jwtSecret)
    res.json({ doctor, token })
  } catch (error) {
    console.error(error);
  }
}


const getDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({message:'Doctor not found..'})
    res.status(200).json({ message: "get successfully", doctor: doctor });
  } catch (error) {
    console.error(error);
  }
}

const updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { name, specialist, phoneNo, email, address, password } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({message:'Doctor not found..'})

    const updatedDoctor = {
      name,
      specialist,
      phoneNo,
      email,
      address
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updatedDoctor.password = hashedPassword;
    }

    const result = await Doctor.findByIdAndUpdate(doctorId, updatedDoctor, { new: true })
    if (result) res.status(200).json(result)
  } catch (error) {
    console.error(error);
  }
}


const deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({message:'doctor not found'});
    await doctor.deleteOne();
    return res.status(200).json({message:'doctor account was deleted successfully...'});
  } catch (error) {
    console.error(error);
  }
}

const createAvailability = async (req, res) => {
  try {
    const { doctorId, slots } = req.body;

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists)  return res.status(404).json({ message: 'Doctor not found' });

    const newAvailability = new Availability({
      doctorId,
      slots
    });

    const savedAvailability = await newAvailability.save();
    res.status(201).json({
      message: "Availability created successfully",
      availability: savedAvailability,
      doctorId: savedAvailability.doctorId
    });
  } catch (error) {
    console.error('Error creating availability:', error);
  }
}
const getAvailability = async (req, res) => {
  try {
    const  doctorId  = req.params.id;

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists)  return res.status(404).json({ message: 'Doctor not found' });

    const availability = await Availability.find({ doctorId });
    if (!availability.length) return res.status(404).json({message:"No availability found for this doctor"});

    res.status(200).json({
      message: "Availability retrieved successfully",
      availability
    });
  } catch (error) {
    console.error('Error retrieving availability:', error);
  }
}

const updateAvailability = async (req, res) => {
  try {
    const availabilityId = req.params.id;

    const availability = await Availability.findById(availabilityId);
    if (!availability) return res.status(404).json({message:"No availability found for this doctor"});

    const {updateFields} = req.body;

    const updatedAvailability = await Availability.findByIdAndUpdate(
      availabilityId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedAvailability) return res.status(404).json({message:"Availability not found"});

    res.status(200).json({
      message: "Availability updated successfully",
      availability: updatedAvailability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
  }
}


const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.id;

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists)  return res.status(404).json({ message: 'Doctor not found' });


    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error geting doctor appointments:', error);
  }
}

const updateAppointment = async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.params;
    const { userId, status } = req.body;
    
    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists)  return res.status(404).json({ message: 'Doctor not found' });

    const userExists = await User.findById(userId);
    if (!userExists)   return res.status(404).json({ message: 'User not found' });


    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });


    if (status !== 'ACCEPTED' && status !== 'REJECTED' && status !== 'COMPLETED') return res.status(400).json({ message: 'Invalid status. Status must be ACCEPTED or CANCELED.' });

    appointment.status = status;
    await appointment.save();

    const updatedDoctor = await Doctor.findOneAndUpdate(
      {
        _id: doctorId,
        'userAppointments.userId': appointment.patientId,
        'userAppointments.date': appointment.date,
        'userAppointments.time': appointment.time
      },
      {
        $set: { 'userAppointments.$.status': status }
      },
      { new: true }
    );

    if (!updatedDoctor) return res.status(404).json({ message: 'Doctor or appointment not found in userAppointments' });

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: appointment.patientId,
        'appointments.doctorId': doctorId,
        'appointments.date': appointment.date,
        'appointments.time': appointment.time
      },
      {
        $set: { 'appointments.$.status': status }
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User or appointment not found in appointments' });

    await updateEmail(userExists.email, doctorExists.name, userExists.name, appointment.day, appointment.date, appointment.time, appointment.reason, appointment.status)
    res.status(200).json({ message: `Appointment updated successfully`, appointment });
  } catch (error) {
    console.error('Error updating appointment status:', error);
  }
}

module.exports = { createDoctor, loginDoctor, getDoctor, updateDoctor, deleteDoctor, createAvailability, getAvailability, updateAvailability, getDoctorAppointments, updateAppointment }
