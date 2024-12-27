CREATE DATABASE IF NOT EXISTS dbs12848931;
USE dbs12848931;
CREATE TABLE users(
	account VARCHAR(50) NOT NULL UNIQUE,
	signature VARCHAR(150),
	current_level TINYINT UNSIGNED DEFAULT 1,
	last_level_passed TINYINT UNSIGNED DEFAULT 0,
	arbi_test_eth_sent BOOLEAN DEFAULT FALSE,
	graduation_gift_minted BOOLEAN DEFAULT FALSE,
	gg_mint_requests TINYINT UNSIGNED DEFAULT 0,
	sep_test_eth_sent BOOLEAN DEFAULT FALSE,
	commissioner_task TINYINT UNSIGNED DEFAULT 1,
	PRIMARY KEY (account)
);