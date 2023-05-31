-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Aug 02, 2022 at 07:10 PM
-- Server version: 5.7.39
-- PHP Version: 8.0.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `alt_text_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `at_course`
--

CREATE TABLE `at_course` (
  `id` int(11) NOT NULL,
  `course_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `at_image`
--

CREATE TABLE `at_image` (
  `id` int(11) NOT NULL,
  `lms_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_priority` tinyint(1) NOT NULL DEFAULT '0',
  `editor` int(11) DEFAULT NULL,
  `alt_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_decorative` tinyint(1) DEFAULT NULL,
  `is_advanced` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `pushed_to_canvas` tinyint(4) NOT NULL DEFAULT '0',
  `advanced_type` enum('lots_of_text','math_equations','needs_content_expertise','foreign_language','other') DEFAULT NULL,
  `is_unusable` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `at_user`
--

CREATE TABLE `at_user` (
  `id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `lms_id` int(11) NOT NULL,
  `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `images_completed` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `at_course`
--
ALTER TABLE `at_course`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `at_image`
--
ALTER TABLE `at_image`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_image` (`editor`) USING BTREE,
  ADD KEY `image_course` (`course_id`);

--
-- Indexes for table `at_user`
--
ALTER TABLE `at_user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `at_image`
--
ALTER TABLE `at_image`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `at_user`
--
ALTER TABLE `at_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `at_image`
--
ALTER TABLE `at_image`
  ADD CONSTRAINT `at_image_ibfk_1` FOREIGN KEY (`editor`) REFERENCES `at_user` (`id`),
  ADD CONSTRAINT `image_course` FOREIGN KEY (`course_id`) REFERENCES `at_course` (`id`);
COMMIT;
