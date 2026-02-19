const User = require('../models/User');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
const cloudinary = require('cloudinary').v2;

// JWT Secret
const JWT_SECRET = 'comp3133_assignment1_secret_key';

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dulpqdnti',
    api_key: '443447755986753',
    api_secret: 'JXTTse2rmOsTxP7IrTjcXdacMMQ',
});

const resolvers = {
    // Format date fields for User type
    User: {
        created_at: (parent) => parent.created_at ? new Date(parent.created_at).toISOString().split('T')[0] : null,
        updated_at: (parent) => parent.updated_at ? new Date(parent.updated_at).toISOString().split('T')[0] : null,
    },

    // Format date fields for Employee type
    Employee: {
        date_of_joining: (parent) => parent.date_of_joining ? new Date(parent.date_of_joining).toISOString().split('T')[0] : null,
        created_at: (parent) => parent.created_at ? new Date(parent.created_at).toISOString().split('T')[0] : null,
        updated_at: (parent) => parent.updated_at ? new Date(parent.updated_at).toISOString().split('T')[0] : null,
    },

    Query: {
        // Login - Allow user to access the system
        login: async (_, { usernameOrEmail, password }) => {
            try {
                // Find user by username or email
                const user = await User.findOne({
                    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
                });

                if (!user) {
                    throw new GraphQLError('Invalid username/email or password', {
                        extensions: { code: 'AUTHENTICATION_ERROR' },
                    });
                }

                // Compare password
                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    throw new GraphQLError('Invalid username/email or password', {
                        extensions: { code: 'AUTHENTICATION_ERROR' },
                    });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: user._id, username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    token,
                    user,
                };
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('Login failed: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Get all employees
        getAllEmployees: async () => {
            try {
                return await Employee.find();
            } catch (error) {
                throw new GraphQLError('Failed to fetch employees: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Search employee by ID
        searchEmployeeById: async (_, { eid }) => {
            try {
                const employee = await Employee.findById(eid);
                if (!employee) {
                    throw new GraphQLError('Employee not found with id: ' + eid, {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }
                return employee;
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(
                    'Failed to search employee: ' + error.message,
                    { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
                );
            }
        },

        // Search employee by designation or department
        searchEmployeeByDesignationOrDepartment: async (
            _,
            { designation, department }
        ) => {
            try {
                const filter = {};
                if (designation) filter.designation = new RegExp(designation, 'i');
                if (department) filter.department = new RegExp(department, 'i');

                if (Object.keys(filter).length === 0) {
                    throw new GraphQLError(
                        'Please provide at least a designation or department to search',
                        { extensions: { code: 'BAD_USER_INPUT' } }
                    );
                }

                return await Employee.find(filter);
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(
                    'Failed to search employees: ' + error.message,
                    { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
                );
            }
        },
    },

    Mutation: {
        // Signup - Create new user account
        signup: async (_, { username, email, password }) => {
            try {
                // Validate input
                if (!username || username.trim().length < 3) {
                    throw new GraphQLError(
                        'Username must be at least 3 characters long',
                        { extensions: { code: 'BAD_USER_INPUT' } }
                    );
                }

                const emailRegex = /^\S+@\S+\.\S+$/;
                if (!emailRegex.test(email)) {
                    throw new GraphQLError('Please provide a valid email address', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                if (!password || password.length < 6) {
                    throw new GraphQLError(
                        'Password must be at least 6 characters long',
                        { extensions: { code: 'BAD_USER_INPUT' } }
                    );
                }

                // Check if user already exists
                const existingUser = await User.findOne({
                    $or: [{ username }, { email }],
                });

                if (existingUser) {
                    throw new GraphQLError('Username or email already exists', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Create new user
                const user = new User({ username, email, password });
                await user.save();

                return user;
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('Signup failed: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Add new employee with Cloudinary photo upload
        addEmployee: async (_, args) => {
            try {
                const {
                    first_name,
                    last_name,
                    email,
                    gender,
                    designation,
                    salary,
                    date_of_joining,
                    department,
                    employee_photo,
                } = args;

                // Validate salary
                if (salary < 1000) {
                    throw new GraphQLError('Salary must be at least 1000', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Validate email
                const emailRegex = /^\S+@\S+\.\S+$/;
                if (!emailRegex.test(email)) {
                    throw new GraphQLError('Please provide a valid email address', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Validate gender
                if (!['Male', 'Female', 'Other'].includes(gender)) {
                    throw new GraphQLError('Gender must be Male, Female, or Other', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Check if employee email already exists
                const existingEmployee = await Employee.findOne({ email });
                if (existingEmployee) {
                    throw new GraphQLError(
                        'An employee with this email already exists',
                        { extensions: { code: 'BAD_USER_INPUT' } }
                    );
                }

                // Upload photo to Cloudinary if provided (base64 or URL)
                let photoUrl = null;
                if (employee_photo) {
                    try {
                        const uploadResult = await cloudinary.uploader.upload(
                            employee_photo,
                            {
                                folder: 'comp3133_assignment1/employees',
                                resource_type: 'image',
                            }
                        );
                        photoUrl = uploadResult.secure_url;
                    } catch (uploadError) {
                        console.error('Cloudinary upload error:', uploadError.message);
                        // If upload fails, store the original value as-is (could be a URL)
                        photoUrl = employee_photo;
                    }
                }

                const employee = new Employee({
                    first_name,
                    last_name,
                    email,
                    gender,
                    designation,
                    salary,
                    date_of_joining,
                    department,
                    employee_photo: photoUrl,
                });

                await employee.save();
                return employee;
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('Failed to add employee: ' + error.message, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        },

        // Update employee by ID
        updateEmployee: async (_, { eid, input }) => {
            try {
                // Validate salary if provided
                if (input.salary !== undefined && input.salary < 1000) {
                    throw new GraphQLError('Salary must be at least 1000', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Validate email if provided
                if (input.email) {
                    const emailRegex = /^\S+@\S+\.\S+$/;
                    if (!emailRegex.test(input.email)) {
                        throw new GraphQLError('Please provide a valid email address', {
                            extensions: { code: 'BAD_USER_INPUT' },
                        });
                    }
                }

                // Validate gender if provided
                if (
                    input.gender &&
                    !['Male', 'Female', 'Other'].includes(input.gender)
                ) {
                    throw new GraphQLError('Gender must be Male, Female, or Other', {
                        extensions: { code: 'BAD_USER_INPUT' },
                    });
                }

                // Upload new photo to Cloudinary if provided
                if (input.employee_photo) {
                    try {
                        const uploadResult = await cloudinary.uploader.upload(
                            input.employee_photo,
                            {
                                folder: 'comp3133_assignment1/employees',
                                resource_type: 'image',
                            }
                        );
                        input.employee_photo = uploadResult.secure_url;
                    } catch (uploadError) {
                        console.error('Cloudinary upload error:', uploadError.message);
                        // Keep original value if upload fails
                    }
                }

                const employee = await Employee.findByIdAndUpdate(eid, input, {
                    new: true,
                    runValidators: true,
                });

                if (!employee) {
                    throw new GraphQLError('Employee not found with id: ' + eid, {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }

                return employee;
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(
                    'Failed to update employee: ' + error.message,
                    { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
                );
            }
        },

        // Delete employee by ID
        deleteEmployee: async (_, { eid }) => {
            try {
                const employee = await Employee.findByIdAndDelete(eid);
                if (!employee) {
                    throw new GraphQLError('Employee not found with id: ' + eid, {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }
                return {
                    message: 'Employee deleted successfully. ID: ' + eid,
                };
            } catch (error) {
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(
                    'Failed to delete employee: ' + error.message,
                    { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
                );
            }
        },
    },
};

module.exports = resolvers;
