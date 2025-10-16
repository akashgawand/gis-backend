import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password, roleId, departmentId } = req.body;

   
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or email already exists!" });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role_id, department_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role_id, department_id`,
      [username, email, hashedPassword, roleId, departmentId]
    );

    res.status(201).json({
      message: "User registered successfully!",
      user: result.rows[0],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during signup", error: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { username, password } = req.body;

   
    const result = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const user = result.rows[0];


    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        accessToken: null,
        message: "Invalid password!",
      });
    }


    const token = jwt.sign(
      { id: user.id, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Get user permissions
    const permissions = await pool.query(
      `SELECT p.name 
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [user.role_id]
    );

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      permissions: permissions.rows.map((p) => p.name),
      accessToken: token,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during signin", error: error.message });
  }
};
