import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const verifyToken = (req, res, next) => {
  const token =
    req.headers["x-access-token"] ||
    req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Unauthorized! Token is invalid or expired." });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT p.name 
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN roles r ON r.id = rp.role_id
         JOIN users u ON u.role_id = r.id
         WHERE u.id = $1`,
        [req.userId]
      );

      const userPermissions = result.rows.map((row) => row.name);

      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          message: `Access denied! You need '${requiredPermission}' permission.`,
        });
      }

      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error checking permissions", error: error.message });
    }
  };
};

// Check multiple permissions (user must have at least one)
export const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT p.name 
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN roles r ON r.id = rp.role_id
         JOIN users u ON u.role_id = r.id
         WHERE u.id = $1`,
        [req.userId]
      );

      const userPermissions = result.rows.map((row) => row.name);
      const hasPermission = permissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Access denied! You need one of these permissions: ${permissions.join(
            ", "
          )}`,
        });
      }

      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error checking permissions", error: error.message });
    }
  };
};


//net stop postgresql-x64-18
