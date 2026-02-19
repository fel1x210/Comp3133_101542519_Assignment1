# COMP3133 - Employee Management System (Assignment 1)

A backend API for managing employees built with **Node.js**, **Express**, **GraphQL (Apollo Server)**, and **MongoDB**.

## Tech Stack

- Node.js & Express
- Apollo Server (GraphQL)
- MongoDB (Mongoose)
- Cloudinary (Employee photo uploads)
- JWT (Authentication)
- bcryptjs (Password hashing)

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

Server runs at `http://localhost:4000/graphql`

## GraphQL API

### Mutations

| Operation | Description |
|-----------|-------------|
| `signup(username, email, password)` | Create a new user account |
| `addEmployee(...)` | Add a new employee (photo uploaded to Cloudinary) |
| `updateEmployee(eid, input)` | Update an employee by ID |
| `deleteEmployee(eid)` | Delete an employee by ID |

### Queries

| Operation | Description |
|-----------|-------------|
| `login(usernameOrEmail, password)` | Login and receive JWT token |
| `getAllEmployees` | Get all employees |
| `searchEmployeeById(eid)` | Search employee by ID |
| `searchEmployeeByDesignationOrDepartment(designation, department)` | Filter employees |

## Testing

Import `COMP3133_Assignment1.postman_collection.json` into Postman to test all endpoints.

## Deployment

Hosted on Vercel: [Live URL]([https://comp3133-101542519-assignment1.vercel.app](http://comp3133-101542519-assignment1-g5q2.vercel.app/))
