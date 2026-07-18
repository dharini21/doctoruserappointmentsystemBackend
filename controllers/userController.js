const bcrypt = require("bcrypt");
const User = require("./../models/user.js");
const Doctor = require("./../models/doctor.js")
const Appointment = require("./../models/appointment.js");
const Availability = require("./../models/availability.js")
const config = require('./../config/config.js')
const Rating = require('./../models/ratings.js')
const jwt = require('jsonwebtoken')
const { sendWelcomeEmail, sendDeleteEmail, requestEmail, cancelEmail } = require('./../email/sendemail.js');

const createUser = async (req, res) => {
  try {
    const { name, email, phoneNo, password, role } = req.body;

    const ifExits = await User.findOne({ $or: [{ email }, { phoneNo }] });
    if (ifExits) return res.status(400).json({ message: "User already Exists..." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      phoneNo,
      password: hashedPassword,
      role
    });
    await user.save();
    await sendWelcomeEmail(user.email, user.name, password);
    return res
      .status(200)
      .json({ message: "user registration successfully", user: user });
  } catch (error) {
    console.error("error", error);
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, phoneNo, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { phoneNo }] })
    if (!user) return res.status(400).json({ message: "Bad Request" })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).send('send invalid password')

    const token = jwt.sign({ user: user._id, role: user.role }, config.jwtSecret)
    res.json({ user, token })
  } catch (error) {
    console.error(error);
  }
}

const getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'user not found' });
    res.status(200).json({ message: "get successfully", user: user });
  } catch (error) {
    console.error("error", error);
  } 
}


// const getAllUser=async(req, res)=>{
//   try {
//     const user = await User.find();
//     if (!user) return res.status(404).send("user not found");

//     return res.status(200).json({ message: "get successfully", user: user });
//   } catch (error) {
//     console.error("error", error);
//   }
// }

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phoneNo, password } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'user not found' });

    const updateuser = {
      name,
      email,
      phoneNo
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateuser.password = hashedPassword;
    }

    const result = await User.findByIdAndUpdate(userId, updateuser, { new: true })
    if (result) return res.status(200).json(result)

  } catch (error) {
    console.error(error);
  }
}

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'user not found' });
    await user.deleteOne();
    await sendDeleteEmail(user.email, user.name)
    return res.status(200).send("user account was deleted successfully...");
  } catch (error) {
    console.error(error);
  }
}

const getAllDoctor = async (req, res) => {
  try {
    const doctors = await Doctor.aggregate([
      {
        $lookup: {
          from: 'availabilities',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'availability'
        }
      },
      {
        $project: {
          name: 1,
          phoneNo: 1,
          email: 1,
          hospitalName: 1,
          specialist: 1,
          experience: 1,
          address: 1,
          availability: 1,
          averageRating: { $avg: "$userRatings.rating" }
        }
      },
      {
        $unset: 'availability.doctorId'
      }
    ]);

    if (!doctors.length) {
      return res.status(404).json({ message: 'Doctor not found' });
    }


    res.status(200).json({ message: "Doctors retrieved successfully", doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
  }
}
const makeAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, day, date, time, reason } = req.body;

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) return res.status(404).json({ message: 'Doctor not found' });

    const patientExists = await User.findById(patientId);
    if (!patientExists) return res.status(404).json({ message: 'Patient not found' });
    const availability = await Availability.findOne({ doctorId });
    if (!availability) return res.status(404).json({ message: "doctor availability not found" })
    const slot = availability.slots.find(
      (slot) => slot.date.toISOString() === new Date(date).toISOString() && slot.day === day && slot.isAvailable === true
    );

    if (!slot) return res.status(400).json({ error: 'No available slots on this date.' });

    if (!availability) return res.status(400).json({ error: 'Availability Not Found' });

    const startTime = slot.time.startTime;
    const endTime = slot.time.endTime;

    const [appointmentHour, appointmentMinute] = time.split(":").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const isWithinTimeRange =
      (appointmentHour > startHour || (appointmentHour === startHour && appointmentMinute >= startMinute)) &&
      (appointmentHour < endHour || (appointmentHour === endHour && appointmentMinute <= endMinute));

    if (!isWithinTimeRange) return res.status(400).json({ error: 'Selected time is not within the available time range.' });
    const existingAppointment = await Appointment.findOne({
      doctorId,
      day,
      date,
      time
    });

    if (existingAppointment) return res.status(400).json({ message: 'Doctor already booked at this time.' });
    const newAppointment = new Appointment({
      doctorId,
      patientId,
      day,
      date,
      time,
      reason
    });
    await newAppointment.save();

    await Availability.findOneAndUpdate(
      {
        doctorId: doctorId,
        'slots.date': new Date(newAppointment.date)
      },
      {
        $inc: { 'slots.$.availabilityCount': -1 }
      },
      { new: true }
    );

    if (slot.availabilityCount - 1 <= 0) {
      await Availability.findOneAndUpdate(
        {
          doctorId: doctorId,
          'slots.date': new Date(newAppointment.date),
        },
        { $set: { 'slots.$.isAvailable': false } },
        { new: true }
      );
    }

    await Doctor.findByIdAndUpdate(
      doctorId,
      { $push: { userAppointments: { userId: patientId, date, time, status: 'SCHEDULED' } } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      patientId,
      { $push: { appointments: { doctorId, date, time, status: 'SCHEDULED' } } },
      { new: true }
    );


    await availability.save()
    await requestEmail(doctorExists.email, doctorExists.name, patientExists.name, day, date, time, reason);

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
  }
}


const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId, userId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(400).json({ message: "appointment not found" })

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) return res.status(404).json({ message: 'Doctor not found' });

    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'User not found' });
    appointment.status = 'CANCELED';
    await Doctor.findByIdAndUpdate(
      doctorId,
      { $pull: { userAppointments: { userId: userId, date: appointment.date, time: appointment.time } } }
    );
    await User.findByIdAndUpdate(
      userId,
      { $pull: { appointments: { doctorId: doctorId, date: appointment.date, time: appointment.time } } }
    );

    const updatedAvailability = await Availability.findOneAndUpdate(
      {
        doctorId: doctorId,
        'slots.date': new Date(appointment.date)
      },
      { $set: { 'slots.$.isAvailable': true } },
      { new: true }
    );


    if (!updatedAvailability) return res.status(404).json({ message: 'Availability slot not found or could not be updated' });
    await appointment.save();

    await cancelEmail(doctorExists.email, doctorExists.name, userExists.name, appointment.day, appointment.date, appointment.time)
    res.status(200).json({ message: 'Appointment canceled successfully', appointment });

  } catch (error) {
    console.error('Error canceling appointment:', error);
  }
}

const ratingDoctor=async(req, res)=>{
  try {
    const { userId, doctorId, rating, review } = req.body;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }


    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) return res.status(404).json({ message: 'Doctor not found' });

    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'User not found' });
    const appointmentIn = await Appointment.findOne({
      doctorId,
      patientId: userId,
      status: 'COMPLETED'
    });

    if (!appointmentIn) return res.status(400).json({ error: 'You can only rate after the appointment is completed.' });
    const newRating = new Rating({
      appointmentId,
      userId,
      rating,
      review
    });

    await newRating.save();

    const existingRating = doctorExists.userRatings.find(
      (rating) => rating.appointmentId.toString() === appointmentId
    );

    if (existingRating) return res.status(400).json({ error: 'You have already rated this doctor.' });
    await Doctor.findByIdAndUpdate(
      doctorId,
      { $push: { userRatings: { appointmentId: appointmentId, userId: userId, rating, review } } }
    );

    res.status(200).json({ newRating })
  } catch (error) {
    console.error("Error accured", error);
  }
}

module.exports = { createUser, loginUser, getUser, updateUser, deleteUser, getAllDoctor, makeAppointment, cancelAppointment, ratingDoctor };
