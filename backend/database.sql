CREATE DATABASE IF NOT EXISTS art_gallery
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE art_gallery;

CREATE TABLE IF NOT EXISTS banners (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_banners_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS artworks (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    artist VARCHAR(100) NOT NULL DEFAULT '',
    category VARCHAR(60) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_artworks_created_at (created_at),
    KEY idx_artworks_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exhibitions (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    date_label VARCHAR(100) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_exhibitions_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS archives (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    artist VARCHAR(100) NOT NULL DEFAULT '',
    category VARCHAR(60) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    archived_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_archives_archived_at (archived_at),
    KEY idx_archives_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_members (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    designation VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_team_members_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_credentials (
    id TINYINT UNSIGNED NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;
