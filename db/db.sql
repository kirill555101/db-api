-- Create extensions

CREATE EXTENSION IF NOT EXISTS CITEXT;

-- Create tables

CREATE UNLOGGED TABLE IF NOT EXISTS users(
	id SERIAL NOT NULL PRIMARY KEY,
	nickname CITEXT COLLATE ucs_basic NOT NULL UNIQUE,
	fullname VARCHAR NOT NULL,
	about TEXT,
	email CITEXT NOT NULL UNIQUE
);

CREATE UNLOGGED TABLE IF NOT EXISTS forums(
	id SERIAL NOT NULL PRIMARY KEY,
	title VARCHAR NOT NULL,
	"user" CITEXT NOT NULL,
	slug CITEXT NOT NULL UNIQUE,
	posts INTEGER DEFAULT 0,
	threads INTEGER DEFAULT 0
);

CREATE UNLOGGED TABLE IF NOT EXISTS threads(
	id SERIAL NOT NULL PRIMARY KEY,
	title VARCHAR NOT NULL,
	author CITEXT NOT NULL,
	forum CITEXT NOT NULL,
	"message" TEXT NOT NULL,
	votes INTEGER DEFAULT 0,
	slug CITEXT UNIQUE,
	created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNLOGGED TABLE IF NOT EXISTS posts(
	id SERIAL NOT NULL PRIMARY KEY,
	parent INTEGER,
	author CITEXT NOT NULL,
	"message" TEXT NOT NULL,
	"isEdited" BOOLEAN DEFAULT FALSE,
	forum CITEXT NOT NULL,
	thread INTEGER NOT NULL,
	created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	pathtopost INTEGER ARRAY
);

CREATE UNLOGGED TABLE IF NOT EXISTS votes(
	id SERIAL NOT NULL PRIMARY KEY,
	nickname CITEXT NOT NULL,
	voice INTEGER NOT NULL,
	thread INTEGER NOT NULL,

	CONSTRAINT votes_unique_nickname_thread UNIQUE(nickname, thread)
);

CREATE UNLOGGED TABLE IF NOT EXISTS forums_users(
	id SERIAL NOT NULL PRIMARY KEY,
	slug CITEXT NOT NULL,
	nickname CITEXT NOT NULL,

	CONSTRAINT forums_users_unique_slug_nickname UNIQUE(slug, nickname)
);

-- Create sequences

CREATE SEQUENCE seq_posts_id START 1;

-- Create indexes

CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_forums_user ON forums("user");

CREATE INDEX IF NOT EXISTS idx_threads_forum ON threads(forum);

CREATE INDEX IF NOT EXISTS idx_posts_thread_pathtopost ON posts(thread, pathtopost);

CREATE INDEX IF NOT EXISTS idx_votes_voice_thread_nickname ON votes(voice, thread, nickname);
