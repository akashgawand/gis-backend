import pool from '../config/database.js';

export const getAllRoles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
              array_agg(p.name) as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       GROUP BY r.id
       ORDER BY r.id`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const result = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    const roleId = result.rows[0].id;

    // Assign permissions
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [roleId, permissionId]
        );
      }
    }

    res.status(201).json({ message: 'Role created successfully', role: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const result = await pool.query(
      'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Update permissions
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
    
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [id, permissionId]
        );
      }
    }

    res.json({ message: 'Role updated successfully', role: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting role', error: error.message });
  }
};
