PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- creates table for storing author and blog information
CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- unique identifier for author and serves as the primary key
    authorName TEXT NOT NULL, -- name of author
    blogTitle TEXT NOT NULL, -- name of blog
    blogSubtitle TEXT NOT NULL -- subtitle of blog
);


-- creates table for storing comments
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- unique identifier for each comment and serves as the primary key
    articleId INTEGER NOT NULL,            -- ID of the article to which the comment belongs
    commenterName TEXT NOT NULL,           -- name of commenter
    commentContent TEXT NOT NULL,          -- Content of comment
    avatar TEXT,                           -- URL or path to the commenter's avatar image
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, -- timestamp of when the comment was created, defaults to the current time
    moderated INTEGER DEFAULT 0,           -- indicates whether the comment has been moderated (0 for no, 1 for yes)
    approved INTEGER DEFAULT 0,            -- indicates whether the comment has been approved (0 for no, 1 for yes)
    parent_comment_id INTEGER DEFAULT NULL, -- ID of the parent comment if this is a reply, otherwise NULL
    thumbsUp INTEGER DEFAULT 0,            -- number of thumbs-up reactions to the comment
    thumbsDown INTEGER DEFAULT 0,          -- number of thumbs-down reactions to the commeDnt
    FOREIGN KEY (articleId) REFERENCES published_articles(id), -- foreign key constraint linking to the published_articles table
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE -- foreign key constraint linking to the comments table for replies, with cascading delete
);


-- creates table for storing blog settings (blog title, subtitle and author name)
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(10) NOT NULL PRIMARY KEY, -- unique identifier for each setting and serves as the primary key
    value VARCHAR(100) NOT NULL -- value that is associated with the setting
);

-- creates table for storing draft articles 
CREATE TABLE IF NOT EXISTS draft_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- unique identifier for each draft article and serves as the primary key
    title TEXT,  -- title of the draft article
    content TEXT, -- content of the draft article
    author_id INTEGER, -- foreign key that references the id column in the authors table
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, -- timestamp when the draft article was created, defaults to current timestamp
    lastModifiedAt DATETIME, -- timestamp when the draft article was last modified
    FOREIGN KEY(author_id) REFERENCES authors(id) -- ensures referential integrity
);

-- creates table for storing published articles 
CREATE TABLE IF NOT EXISTS published_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- unique identifier for each published article and serves as the primary key
    title TEXT, -- title of the published article
    content TEXT, -- content of the published article
    createdAt DATETIME, -- timestamp when the published article was created
    lastModifiedAt DATETIME, -- timestamp when the published article was last modified
    publishedAt DATETIME, -- timestamp when the published article was published
    likes INTEGER DEFAULT 0, -- default value for likes
    reads INTEGER DEFAULT 0 -- default value for reads
);

-- inserts the default data for the blog settings (ensure no duplicates)
INSERT OR IGNORE INTO Settings (id, value) VALUES
    ('title', 'THE BLOGGING TOOL'), -- default title setting
    ('subtitle', 'CM2040 Databases, Network and the Web Midterm Coursework'), -- default subtitle setting
    ('author', 'Author : Rebecca Francis'); -- default author setting

COMMIT;
