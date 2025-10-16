import pool from '../config/database.js';

export const createGeometry = async (req, res) => {
  try {
    const { name, description, geometryType, coordinates, metadata } = req.body;
    const userId = req.userId;

    
    let wkt;
    if (geometryType === 'Point') {
      wkt = `POINT(${coordinates[0]} ${coordinates[1]})`;
    } else if (geometryType === 'LineString') {
      const points = coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
      wkt = `LINESTRING(${points})`;
    } else if (geometryType === 'Polygon') {
      const rings = coordinates.map(ring => {
        const points = ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
        return `(${points})`;
      }).join(', ');
      wkt = `POLYGON(${rings})`;
    }

    // Check geofence if exists
    const geofenceCheck = await pool.query(
      `SELECT COUNT(*) as count FROM geofence_boundaries 
       WHERE active = true 
       AND ST_Contains(boundary, ST_GeomFromText($1, 4326))`,
      [wkt]
    );

    if (geofenceCheck.rows[0].count === '0') {
      const anyGeofence = await pool.query(
        'SELECT COUNT(*) as count FROM geofence_boundaries WHERE active = true'
      );
      
      if (parseInt(anyGeofence.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'Geometry is outside the allowed geofence boundaries' 
        });
      }
    }

    // Insert geometry
    const result = await pool.query(
      `INSERT INTO geometries (name, description, geometry_type, geom, metadata, created_by)
       VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6)
       RETURNING id, name, description, geometry_type, 
                 ST_AsGeoJSON(geom) as geometry, metadata, created_by, created_at`,
      [name, description, geometryType, wkt, JSON.stringify(metadata), userId]
    );

    res.status(201).json({ 
      message: 'Geometry created successfully',
      geometry: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating geometry', error: error.message });
  }
};

export const getAllGeometries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.description, g.geometry_type, 
              ST_AsGeoJSON(g.geom) as geometry, g.metadata, 
              g.created_by, g.created_at, u.username as creator
       FROM geometries g
       LEFT JOIN users u ON g.created_by = u.id
       ORDER BY g.created_at DESC`
    );

    const geometries = result.rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry)
    }));

    res.json(geometries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching geometries', error: error.message });
  }
};

export const getGeometryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.id, g.name, g.description, g.geometry_type, 
              ST_AsGeoJSON(g.geom) as geometry, g.metadata, 
              g.created_by, g.created_at, u.username as creator
       FROM geometries g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Geometry not found' });
    }

    const geometry = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };

    res.json(geometry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching geometry', error: error.message });
  }
};

export const updateGeometry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, metadata } = req.body;

    const result = await pool.query(
      `UPDATE geometries 
       SET name = $1, description = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, description, geometry_type, 
                 ST_AsGeoJSON(geom) as geometry, metadata`,
      [name, description, JSON.stringify(metadata), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Geometry not found' });
    }

    res.json({ 
      message: 'Geometry updated successfully',
      geometry: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating geometry', error: error.message });
  }
};

export const deleteGeometry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM geometries WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Geometry not found' });
    }

    res.json({ message: 'Geometry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting geometry', error: error.message });
  }
};

// Get geometry statistics
export const getGeometryStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        geometry_type,
        COUNT(*) as count,
        AVG(ST_Length(geom::geography)) as avg_length,
        AVG(ST_Area(geom::geography)) as avg_area
       FROM geometries
       GROUP BY geometry_type`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};
