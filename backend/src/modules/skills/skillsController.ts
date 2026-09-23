import { Request, Response } from "express";
import pool from "../../config/db";

export async function getSkills(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.description,
        d.code AS department_code,
        d.name AS department_name
      FROM skills s
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.category ASC, s.name ASC;
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skills catalog.",
    });
  }
}

export async function getDepartments(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT id, code, name, description
      FROM departments
      ORDER BY code ASC;
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch academic departments.",
    });
  }
}
