"use strict";

const express = require("express");
const { User, Course } = require("../models");
const { asyncHandler } = require("../middleware/async-handler");
const { authenticateUser } = require("../middleware/auth-user");

// Router instance
const router = express.Router();

/*
  A /api/courses GET route that will return all courses including
  the User associated with each course and a 200 HTTP status code.
*/
router.get(
  "/courses/",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "emailAddress"],
        },
      ],
    });
    res.status(200).json(courses);
  })
);

/*
  A /api/courses/:id GET route that will return the 
  corresponding course including the User associated 
  with that course and a 200 HTTP status code.
*/
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "emailAddress"],
        },
      ],
    });
    course
      ? res.status(200).json(course)
      : res.status(400).json({ message: "Course not found!" });
  })
);

/*
  A /api/courses POST route that will create a new course,
  set the Location header to the URI for the newly
  created course, and return a 201 HTTP status code and no content.
*/
router.post(
  "/courses",
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const course = await Course.create(req.body);
      res.status(201).location(`/courses/${course.id}`).end();
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

/*
  A /api/courses/:id PUT route that will update the corresponding
  course and return a 204 HTTP status code and no content.
*/
router.put(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      if (course.userId === req.currentUser.id) {
        try {
          await course.update(req.body);
          res.status(204).end();
        } catch(error) {
          if (
            error.name === "SequelizeValidationError" ||
            error.name === "SequelizeUniqueConstraintError"
          ) {
            const errors = error.errors.map((err) => err.message);
            res.status(400).json({ errors });
          } else {
            throw error;
          }
        }
      } else {
        res
          .status(403)
          .json({ message: "You don't have access to update this course" });
      }
    } else {
      res.status(404).json({ message: "Course not found!" });
    }
  })
);

/*
  A /api/courses/:id DELETE route that will delete the corresponding
  course and return a 204 HTTP status code and no content.
*/
router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      if (course.userId === req.currentUser.id) {
        await course.destroy();
        res.status(204).end();
      } else {
        res
          .status(403)
          .json({ message: "You don't have access to delete this course" });
      }
    } else {
      res.status(404).json({ message: "Course not found!" });
    }
  })
);

module.exports = router;
