const express = require('express'); //imports the express framework
const router = express.Router(); //creates a new router instance 
const sqlite3 = require('sqlite3').verbose(); //imports the SQLite3 module

//sets up the SQLite database connection
const db = new sqlite3.Database('./database.db');

//middleware to provide blog settings to views
router.use((req, res, next) => {
    //uses shared settings for rendering views
    res.locals.blogTitle = res.locals.title; //blog title
    res.locals.blogSubtitle = res.locals.subtitle; //blog subtitle
    res.locals.authorName = res.locals.author; //author name
    next(); //moves to the next middleware or route handler
});

//function to format timestamp to desired format (dd/mm/yy hh:mm:ss)
function formatTimestamp(timestamp) {
    const date = new Date(timestamp); //converts timestamp to date object
    const day = date.getDate().toString().padStart(2, '0'); //gets date and format as 2 digits
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // gets month and format as 2 digits
    const year = date.getFullYear().toString().slice(-2); //gets year and format as 2 digits
    const hours = date.getHours().toString().padStart(2, '0'); //gets hours and format as 2 digits
    const minutes = date.getMinutes().toString().padStart(2, '0'); //gets minutes and format as 2 digits
    const seconds = date.getSeconds().toString().padStart(2, '0'); //gets seconds and format as 2 digits
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; //returns the formated timestamp
}

//GET request to render author home page
router.get('/', (req, res) => {

    //purpose: retrieves and displays draft and published articles on the author home page
    //inputs: req (the Express request object), res (the Express response object)
    //outputs: renders 'author-home' view with draft and published articles, or sends error response
    
    //retrives all draft articles
    db.all('SELECT * FROM draft_articles', (err, draftArticles) => {
        if (err) {
            //logs error to the console
            console.error(err); 
            //sends an error response
            res.status(500).send('Failed to load draft articles'); 
            return;
        }
        //retrives all published articles 
        db.all('SELECT * FROM published_articles', (err, publishedArticles) => {
            if (err) {
                //logs error to the console
                console.error(err); 
                //sends an error response
                res.status(500).send('Failed to load published articles');
                return;
            }
            //formats the timestamps for the draft articles
            draftArticles.forEach(article => {
                article.createdAt = formatTimestamp(article.createdAt);
                article.lastModifiedAt = formatTimestamp(article.lastModifiedAt);
            });
            //formats the timestamps for the published articles
            publishedArticles.forEach(article => {
                article.createdAt = formatTimestamp(article.createdAt);
                article.lastModifiedAt = formatTimestamp(article.lastModifiedAt);
                article.publishedAt = formatTimestamp(article.publishedAt);
            });
            //renders the homepage with articles 
            res.render('author-home', {
                draftArticles,
                publishedArticles
            });
        });
    });
});

//GET request to render 'author-settings' page view
router.get('/settings', (req, res) => {

    //purpose: renders the author settings page
    //inputs: req (the Express request object), res (the Express response object)
    //outputs: renders 'author-settings' view

    res.render('author-settings');
});

//POST request to handle form submission and update settings
router.post('/settings', (req, res) => {

    //purpose: updates blog settings based on form submission
    //inputs: req (the Express request object with form data in req.body), res (the Express response object)
    //outputs: redirects to the author home page or sends an error response
   
    const { blogTitle: newTitle, blogSubtitle: newSubtitle, authorName: newName } = req.body;

    //updates the local variable for blog title
    res.locals.blogTitle = newTitle; 
    //updates the local variable for blog subtitle
    res.locals.blogSubtitle = newSubtitle; 
    //updates the variable for author name
    res.locals.authorName = newName; 
    
    //inserts or replaces the settings in the database
    db.run('INSERT OR REPLACE INTO settings (id, value) VALUES (?, ?), (?, ?), (?, ?)', 
        ['title', newTitle, 'subtitle', newSubtitle, 'author', newName], 
        (err) => {
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to update settings');
                //exits the function
                return;
            }
            //redirects to the author home page
            res.redirect('/authors'); 
        }
    );
});

//GET request to render the 'new-draft' page
router.get('/new-draft', (req, res) => {

    //purpose: renders the page for creating a new draft article
    //inputs: req (the Express request object), res (the Express response object)
    //outputs: renders 'new-draft' view

    res.render('new-draft');
});

//POST request to handle new draft submission
router.post('/new-draft', (req, res) => {

    //purpose: saves a new draft article to the database
    //inputs: article data from request body
    //outputs: redirects to the author home page or sends an error response

    //extracts title and content from request body
    const { title, content } = req.body;

    if (title && content) {
        //prepares and executes the SQL statement to insert a new draft article
        const stmt = db.prepare('INSERT INTO draft_articles (title, content, createdAt, lastModifiedAt) VALUES (?, ?, ?, ?)');
        stmt.run(title, content, new Date(), new Date(), (err) => {
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to save draft article');
                //exits the function
                return;
            }
            //redirects the user back the author page
            res.redirect('/authors');
        });
        stmt.finalize();
    } else {
        res.status(400).send('Title and content are required');
    }
});

//GET request to render the 'edit-article' page
router.get('/edit-article/:id', (req, res) => {

    //purpose: retrieves and displays an article for editing based on its ID
    //inputs: articleId from URL params
    //outputs: renders 'edit-article' view with the article data or sends an error response

    //gets the article ID from URL parameters
    const articleId = parseInt(req.params.id); 
    //retrieves the draft article by ID
    db.get('SELECT * FROM draft_articles WHERE id = ?', [articleId], (err, article) => {
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to load article');
            //exits the function
            return;
        }
        if (article) {
            //formats the timestamps for draft article
            article.createdAt = formatTimestamp(article.createdAt);
            article.lastModifiedAt = formatTimestamp(article.lastModifiedAt);
            res.render('edit-article', { article });
        } else {
            //retrieves the published article by ID if not found in drafts
            db.get('SELECT * FROM published_articles WHERE id = ?', [articleId], (err, article) => {
                if (err) {
                    //logs an error to the console
                    console.error(err);
                    //sends a HTTP response
                    res.status(500).send('Failed to load article');
                    //exits the function
                    return;
                }
                if (article) {
                    //formats the timestamps for published article
                    article.createdAt = formatTimestamp(article.createdAt);
                    article.lastModifiedAt = formatTimestamp(article.lastModifiedAt);
                    res.render('edit-article', { article });
                } else {
                    res.status(404).send('Article not found');
                }
            });
        }
    });
});

//POST request to handle edit article submission
router.post('/edit-article/:id', (req, res) => {

    //purpose: updates an existing article based on its ID
   //inputs: articleId from URL params and article data from request body
    //outputs: redirects to the author home page or sends an error response

    //gets the article ID from URL parameters
    const articleId = parseInt(req.params.id); 
    //extracts the title and content from request body
    const { title, content } = req.body; 

    if (title && content) {
        //checks if the article is a draft
        db.get('SELECT * FROM draft_articles WHERE id = ?', [articleId], (err, draftArticle) => {
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to load article');
                //exits the function
                return;
            }
            if (draftArticle) {
                //updates the draft article if it exists
                db.run('UPDATE draft_articles SET title = ?, content = ?, lastModifiedAt = ? WHERE id = ?', 
                    [title, content, new Date(), articleId], 
                    (err) => {
                        if (err) {
                            //logs an error to the console
                            console.error(err);
                            //sends a HTTP response
                            res.status(500).send('Failed to update article');
                            //exits the function
                            return;
                        }
                        //redirects the user back the author page
                        res.redirect('/authors');
                    }
                );
            } else {
                //updates the published article if draft does not exist
                db.run('UPDATE published_articles SET title = ?, content = ?, lastModifiedAt = ? WHERE id = ?', 
                    [title, content, new Date(), articleId], 
                    (err) => {
                        if (err) {
                            //logs an error to the console
                            console.error(err);
                            //sends a HTTP response
                            res.status(500).send('Failed to update article');
                            //exits the function
                            return;
                        }
                        //redirects the user back the author page
                        res.redirect('/authors');
                    }
                );
            }
        });
    } else {
        res.status(400).send('Title and content are required');
    }
});

//PUT request to handle article publication
router.put('/publish-article/:id', (req, res) => {

    //purpose: publishes a draft article based on its ID
    //inputs: articleId from URL params
    //outputs: redirects to the author home page or sends an error response

    //gets the article ID from URL parameters
    const articleId = parseInt(req.params.id);

    //retrieves the draft article by ID
    db.get('SELECT * FROM draft_articles WHERE id = ?', [articleId], (err, article) => {
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to load draft article');
            //exits the function
            return;
        }
        if (article) {
            //inserts the article into published_articles
            db.run('INSERT INTO published_articles (title, content, createdAt, lastModifiedAt, publishedAt) VALUES (?, ?, ?, ?, ?)', 
                [article.title, article.content, article.createdAt, new Date(), new Date()], 
                (err) => {
                    if (err) {
                        //logs an error to the console
                        console.error(err);
                        //sends a HTTP response
                        res.status(500).send('Failed to publish article');
                        //exits the function
                        return;
                    }
                    //deletes the article from draft_articles
                    db.run('DELETE FROM draft_articles WHERE id = ?', [articleId], (err) => {
                        if (err) {
                            //logs an error to the console
                            console.error(err);
                            //sends a HTTP response
                            res.status(500).send('Failed to delete draft article');
                            //exits the function
                            return;
                        }
                        res.sendStatus(204);
                    });
                }
            );
        } else {
            res.status(404).send('Draft article not found');
        }
    });
});

//DELETE request to handle article deletion
router.delete('/delete-article/:id', (req, res) => {

    //purpose: deletes an article based on its ID
    //inputs: articleId from URL params
    //outputs: redirects to the author home page or sends an error response

    //gets the article ID from URL parameters
    const articleId = parseInt(req.params.id);

    //deletes the article from draft_articles
    db.run('DELETE FROM draft_articles WHERE id = ?', [articleId], (err) => {
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to delete draft article');
            //exits the function
            return;
        }
        //deletes the article from published_articles
        db.run('DELETE FROM published_articles WHERE id = ?', [articleId], (err) => {
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to delete published article');
                //exits the function
                return;
            }
            res.sendStatus(204);
        });
    });
});

//GET request to render moderate comments page for the specific article
router.get('/moderate-comments/:id', (req, res) => {

    //purpose: renders the page for moderating comments
    //inputs: articleId from URL params
    //outputs: renders 'moderate-comments' view with comments data or sends an error response

    //retrieves the article ID from the route parameters and converts it to an integer
    const articleId = parseInt(req.params.id);

    //queries the database to select all the comments for the specified article
    //it will filter out the replies by checking the NULL in the parent_comment_id_column
    db.all('SELECT * FROM comments WHERE articleId = ? AND parent_comment_id IS NULL ORDER BY createdAt ASC', [articleId], (err, comments) => {
        //checks if there was any error executing the database
        if (err) {
            //logs the error to the console
            console.error(err);
            //sends an HTTP response
            res.status(500).send('Failed to load comments');
            //exits the function
            return;
        }
        //formats the creation timestamp of each comment
        comments.forEach(comment => {
            comment.createdAt = formatTimestamp(comment.createdAt);
        });
        //renders the 'moderate-comments' view template and passes the articleId and the formatted comments to the template
        res.render('moderate-comments', { articleId, comments });
    });
});


//POST request to handle comment moderation (approve)
router.post('/moderate-comments/:articleId/:commentId', (req, res) => {

    //purpose: approves a comment based on its ID
    //inputs: articleId & commentId from URL params & action from request body
    //outputs: redirects to the moderate comments page or sends an error response

    //gets the article ID from URL parameters
    const articleId = parseInt(req.params.articleId);
    //gets the comment ID from URL parameters
    const commentId = parseInt(req.params.commentId);
    //extract action from request body
    const { action } = req.body; 
    //determines whether to approve or reject the comment
    const approved = action === 'approve' ? 1 : 0;

    //updates the comment's moderated status and approval status
    db.run('UPDATE comments SET moderated = 1, approved = ? WHERE id = ?', [approved, commentId], (err) => {
        if (err) {
            //logs the error to the console
            console.error(err);
            //sends an HTTP response
            res.status(500).send('Failed to moderate comment');
            //exits the function
            return;
        }
        //redirects back to the moderate comments page for the specifc article
        res.redirect(`/authors/moderate-comments/${articleId}`);
    });
});


//DELETE request to handle comment deletion
router.delete('/moderate-comments/:articleId/:commentId', (req, res) => {

    //purpose: deletes a comment based on its ID
    //inputs: articleId & commentId from URL params
    //outputs: redirects to the moderate comments page or sends an error response

    //gets the article ID from URL parameters
    const articleId = parseInt(req.params.articleId);
    //gets the comment ID from URL parameters
    const commentId = parseInt(req.params.commentId);

    //deletes the comment from the database
    db.run('DELETE FROM comments WHERE id = ?', [commentId], (err) => {
        if (err) {
            //logs the error to the console
            console.error(err);
            //sends an HTTP response
            res.status(500).send('Failed to delete comment');
            //exits the function
            return;
        }
        //no content means successful deletion
        res.sendStatus(204); 
    });
});


//POST request to handle new reply submission
router.post('/reply/:commentId', (req, res) => {

    //purpose: adds a new reply to a specific parent comment
    //input: `commentId` from URL params, `commentContent` and `avatar` from request body
    //putput: redirects to the previous page or sends a HTTP error response if failed

    //extracts the parent comment ID from the URL parameters
    const parentCommentId = parseInt(req.params.commentId);
    //extracts the reply comment and avatar from the request body
    const { commentContent, avatar } = req.body;

    //checks if the comment content is provided 
    if (commentContent) {
        const stmt = db.prepare('INSERT INTO comments (articleId, commenterName, commentContent, avatar, createdAt, parent_comment_id) VALUES ((SELECT articleId FROM comments WHERE id = ?), "Anonymous", ?, ?, ?, ?)'); 
        stmt.run(parentCommentId, commentContent, avatar, new Date(), parentCommentId, (err) => {
            if (err) {
                //logs the error to the console
                console.error(err);
                //sends an HTTP response
                res.status(500).send('Failed to save reply');
                 //exits the function
                return;
            }
            //reloads the page to show the new reply
            res.redirect('back'); 
        });
        stmt.finalize();
    } else {
        res.status(400).send('Content is required to submit a reply');
    }
});



//GET request to fetch replies for the specific comment
router.get('/replies/:commentId', (req, res) => {

    //purpose: retrieves all replies associated with a specific comment
    //input: `commentId` from URL params
    //output: JSON response with a list of replies or sends a HTTP error response if failed


    //retrieves the comment ID from the route parameters and converts it to an integer
    const commentId = parseInt(req.params.commentId);

    //queries the database to select all the replies for the specific comment
    db.all('SELECT * FROM comments WHERE parent_comment_id = ? ORDER BY createdAt ASC', [commentId], (err, replies) => {
        //checks if there was an error executing the query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to load replies');
            //exits the function
            return;
        }
        //formats the creation timestamp of each reply and sets a default avatar if none is provided
        replies.forEach(reply => {
            reply.createdAt = formatTimestamp(reply.createdAt);
            reply.avatar = reply.avatar || 'default-avatar.png'; 
        });
        //sends the reply as a JSON response
        res.json(replies);
    });
});

//POST request to add a thumbs-up reaction to a comment
router.post('/reaction/thumbs-up/:commentId', (req, res) => {

    //purpose: increments the thumbs-up count associated with a specific comment
    //input: `commentId` from URL params
    //output: JSON response with a list of replies or sends a HTTP error response if failed

    //retrieves the comment ID from the route parameters and converts it to an integer
    const commentId = parseInt(req.params.commentId);

    //updates the thumbs-up count for the specifc comment
    //increments the thumbsup count by 1
    db.run('UPDATE comments SET thumbsUp = thumbsUp + 1 WHERE id = ?', [commentId], (err) => {
        //checks if there was an error executing the query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to add thumbs-up reaction');
            //exits the function
            return;
        }
        //reloads the page to show the updated count
        res.redirect('back'); 
    });
});

//POST request to add a thumbs-down reaction to a comment
router.post('/reaction/thumbs-down/:commentId', (req, res) => {

    //purpose: increments the thumbs-down count associated with a specific comment
    //input: `commentId` from URL params
    //output: JSON response with a list of replies or sends a HTTP error response if failed

    //retrieves the comment ID from the route parameters and converts it to an integer
    const commentId = parseInt(req.params.commentId);

    //updates the thumbs-down count for the specific comment
    //increments the thumbsDown count by 1
    db.run('UPDATE comments SET thumbsDown = thumbsDown + 1 WHERE id = ?', [commentId], (err) => {
        //checks if there was an error executing the query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to add thumbs-down reaction');
            //exits the function
            return;
        }
        //reloads the page to show the updated count
        res.redirect('back'); 
    });
});

//POST request to remove a thumbs-up reaction from a comment
router.post('/reaction/remove-thumbs-up/:commentId', (req, res) => {

    //purpose: decrements the thumbs-up count associated with a specific comment
    //input: `commentId` from URL params
    //output: JSON response with a list of replies or sends a HTTP error response if failed

    //retrieves the comment ID from the route parameters and converts it to an integer
    const commentId = parseInt(req.params.commentId);

    //updates the thumbs-up count for the specific comment
    //decrements the thumbsUp count by 1
    db.run('UPDATE comments SET thumbsUp = thumbsUp - 1 WHERE id = ?', [commentId], (err) => {
        //checks if there was an error executing the query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to remove thumbs-up reaction');
            //exits the function
            return;
        }
        //reloads the page to show the updated count
        res.redirect('back'); 
    });
});

//POST request to remove a thumbs-down reaction from a comment
router.post('/reaction/remove-thumbs-down/:commentId', (req, res) => {

    //purpose: decrements the thumbs-down count associated with a specific comment
    //input: `commentId` from URL params
    //output: JSON response with a list of replies or sends a HTTP error response if failed

    //retrieves the comment ID from the route parameters and converts it to an integer
    const commentId = parseInt(req.params.commentId);

    //updates the thumbs-down count for the specifc comment
    //decrements the thumbsDown count by 1
    db.run('UPDATE comments SET thumbsDown = thumbsDown - 1 WHERE id = ?', [commentId], (err) => {
        //checks if there was an error executing the query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to remove thumbs-down reaction');
            //exits the function
            return;
        }
        //reloads the page to show the updated count
        res.redirect('back'); 
    });
});



module.exports = router;
