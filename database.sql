CREATE DATABASE IF NOT EXISTS `vdt` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `vdt`;

CREATE TABLE IF NOT EXISTS `modulos` (
  `turma` VARCHAR(255) NOT NULL,
  `nome` LONGTEXT NOT NULL,
  `conteudos` LONGTEXT NOT NULL,
  PRIMARY KEY (`turma`));

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `turma` JSON NOT NULL DEFAULT ( JSON_ARRAY() ),
  `perms` VARCHAR(45) NOT NULL DEFAULT 'aluno',
  `active` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`));

CREATE TABLE `module_content` (
	`id` BIGINT(19) NOT NULL AUTO_INCREMENT,
	`module` VARCHAR(255) NOT NULL COLLATE 'utf8mb3_general_ci',
	`content_title` LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`content` LONGTEXT NOT NULL COLLATE 'utf8mb3_general_ci',
	`position` INT(10) NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `module` (`module`) USING BTREE,
	CONSTRAINT `module` FOREIGN KEY (`module`) REFERENCES `modulos` (`turma`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE `module_evaluations` (
	`id` BIGINT(19) NOT NULL AUTO_INCREMENT,
	`module` VARCHAR(255) NOT NULL COLLATE 'utf8mb3_general_ci',
	`question` LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
	`answers` JSON NOT NULL,
	`correct` JSON NULL DEFAULT NULL,
	`level` INT(10) NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `module` (`module`) USING BTREE,
	CONSTRAINT `module_evaluations` FOREIGN KEY (`module`) REFERENCES `modulos` (`turma`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `user_content_views` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `module` VARCHAR(255) NOT NULL,
  `content_id` BIGINT(19)  NOT NULL,
  `viewed` TINYINT(1) NOT NULL DEFAULT '0',
  `data`JSON NOT NULL DEFAULT ( JSON_ARRAY() ),
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id`) USING BTREE,
  INDEX `module` (`module`) USING BTREE,
  INDEX `content_id` (`content_id`) USING BTREE,
  CONSTRAINT `user_content_views_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `user_content_views_module` FOREIGN KEY (`module`) REFERENCES `modulos` (`turma`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `user_content_views_content_id` FOREIGN KEY (`content_id`) REFERENCES `module_content` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE `evaluations` (
	`id` BIGINT(19) NOT NULL AUTO_INCREMENT,
	`module` VARCHAR(255) NOT NULL COLLATE 'utf8mb3_general_ci',
	`start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`end_date` TIMESTAMP NOT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `module` (`module`) USING BTREE,
	CONSTRAINT `evaluations_module` FOREIGN KEY (`module`) REFERENCES `modulos` (`turma`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `user_evaluations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `evaluation_id` BIGINT NOT NULL,
  `questions` JSON NOT NULL,
  `answers` JSON NOT NULL,
  `score` INT NOT NULL,
  `data` JSON NOT NULL DEFAULT ( JSON_ARRAY() ),
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id`) USING BTREE,
  INDEX `evaluation_id` (`evaluation_id`) USING BTREE,
  CONSTRAINT `user_evaluations_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `user_evaluations_evaluation_id` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);