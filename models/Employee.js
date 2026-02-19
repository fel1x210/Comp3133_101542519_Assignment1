const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        last_name: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            enum: {
                values: ['Male', 'Female', 'Other'],
                message: 'Gender must be Male, Female, or Other',
            },
        },
        designation: {
            type: String,
            required: [true, 'Designation is required'],
            trim: true,
        },
        salary: {
            type: Number,
            required: [true, 'Salary is required'],
            min: [1000, 'Salary must be at least 1000'],
        },
        date_of_joining: {
            type: Date,
            required: [true, 'Date of joining is required'],
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
        },
        employee_photo: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

module.exports = mongoose.model('Employee', employeeSchema);
