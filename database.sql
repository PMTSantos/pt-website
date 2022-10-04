CREATE DATABASE IF NOT EXISTS `vdt` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `vdt`;

CREATE TABLE IF NOT EXISTS `turmas` (
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
  PRIMARY KEY (`id`));