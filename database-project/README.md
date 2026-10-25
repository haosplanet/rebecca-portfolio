# 📚 University of London - : Databases & The Web Project

A full-stack web and database application developed as coursework for the Databases & The Web module at the University of London. The project features a dynamic blogging platform built with Node.js, Express, EJS, and SQLite3, complete with advanced extensions for comment moderation, threaded replies, user reactions, and flexible sorting.

---

## 🏗️ System Architecture & Schema

The application follows a standard MVC (Model-View-Controller) architecture backed by an Express server and an SQLite3 relational database:

* **Client Tier:** Web browser rendering EJS views (author-home, reader-article, moderate-comments, etc.).
* **Server Tier:** Node.js & Express handling routing (author.js, reader.js) and controllers for business logic.
* **Database Tier:** SQLite3 (database.db) storing tables for authors, comments, settings, draft articles, and published articles.

### Entity-Relationship Structure (Key Tables)
* **`author`**: Stores author profile details (id, authorName, blogTitle, blogSubtitle).
* **`published_articles`**: Stores article content, timestamps, likes, reads, and moderation flags.
* **`comments`**: Manages user interactions, supporting extensions such as moderation status (moderated, approved), threaded hierarchy (parent_comment_id), and reactions (thumbsUp, thumbsDown).

---

## ✨ Features & Extensions Implemented

### 1. Comment Moderation System
* Authors can review, approve, or reject reader comments via a dedicated moderation view (/authors/moderate-comments/:articleId).
* Unapproved comments are automatically filtered out from public reader views to prevent spam and maintain content quality.
* Authors have full capabilities to delete inappropriate comments.

### 2. Threaded Replies & Author Engagement
* Readers and authors can reply directly to comments, managed through a parent_comment_id foreign key relationship in the database.
* Endpoints handle fetching replies dynamically via JSON and reloading views upon submission.

### 3. User Reactions (Thumbs Up / Thumbs Down)
* Interactive reaction routes (/reaction/thumbs-up/:commentId and /reaction/thumbs-down/:commentId) allow users to increment or decrement like and dislike counts on comments dynamically.

### 4. Dynamic Comment Sorting
* Readers can sort comments based on different criteria (e.g., published date descending/ascending or commenter name) using query parameters (?sortBy=) handled in the router logic.

---

## 🛠️ Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** SQLite3 (sqlite3)
* **Templating Engine:** EJS (Embedded JavaScript Templates)
* **Architecture:** MVC (Model-View-Controller)

---
