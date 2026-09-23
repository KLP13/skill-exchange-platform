import { Router } from "express";
import { getSkills, getDepartments } from "./skillsController";

const router = Router();

router.get("/", getSkills);
router.get("/departments", getDepartments);

export default router;
