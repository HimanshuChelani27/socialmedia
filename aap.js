const express = require('express');
const db = require('./database.js'); // Assuming the database.js file is in the same directory
const cors = require('cors');

const app = express();
app.use(cors());
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // This line is optional if you need to handle URL-encoded data

// ...

// API endpoint to create a new user
app.post('/users', (req, res) => {
    const { first_name, last_name, username, password } = req.body;

    // Insert user into the 'users' table
    db.run(
        'INSERT INTO users (first_name, last_name, username, password) VALUES (?, ?, ?, ?)',
        [first_name, last_name, username, password],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log(`User added with ID: ${this.lastID}`);
                res.status(201).json({ message: 'User created successfully', user_id: this.lastID });
            }
        }
    );
});


app.post('/login', (req, res) => {
    console.log("YES COMING")
    const { username, password } = req.body;

    // Check if the username exists
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!user) {
            // Username not found
            res.status(401).json({ error: 'Invalid username or password' });
        } else {
            // Compare passwords
            if (user.password === password) {
                // Passwords match, user is authenticated
                res.json({ message: 'Login successful', user_id: user.user_id });
            } else {
                // Passwords do not match
                res.status(401).json({ error: 'Invalid username or password' });
            }
        }
    });
});



// app.post('/logout', (req, res) => {
//     const sessionToken = req.headers.authorization;

//     // Simulated logout by removing the session token from the active sessions set
//     activeSessions.delete(sessionToken);

//     res.json({ message: 'Logout successful' });
// });
// ...
// app.get('/users/:user_id', (req, res) => {
//     const userId = req.params.user_id;

//     // Query to get user details, followers, following, and posts
//     const query = `
//         SELECT 
//             u.user_id, u.first_name, u.last_name, u.username,
//             f.follower_id AS follower_user_id,
//             p.post_id, p.text, p.date_published,
//             l.user_id AS like_user_id
//         FROM 
//             users u
//         LEFT JOIN 
//             followers f ON u.user_id = f.user_id
//         LEFT JOIN 
//             posts p ON u.user_id = p.author_id
//         LEFT JOIN 
//             likes l ON p.post_id = l.post_id
//         WHERE 
//             u.user_id = ?
//     `;

//     db.get(query, [userId], (err, user) => {
//         if (err) {
//             console.error(err.message);
//             res.status(500).json({ error: 'Internal Server Error' });
//         } else if (!user) {
//             // User not found
//             res.status(404).json({ error: 'User not found' });
//         } else {
//             // Organize user details, followers, posts, and likes into a structured response
//             const userDetails = {
//                 user_id: user.user_id,
//                 first_name: user.first_name,
//                 last_name: user.last_name,
//                 username: user.username,
//                 followers: [],
//                 posts: [],
//                 likes: [],
//             };

//             if (user.follower_user_id !== null) {
//                 userDetails.followers.push({
//                     user_id: user.follower_user_id,
//                 });
//             }

//             if (user.post_id !== null) {
//                 userDetails.posts.push({
//                     post_id: user.post_id,
//                     text: user.text,
//                     date_published: user.date_published,
//                 });
//             }

//             if (user.like_user_id !== null) {
//                 userDetails.likes.push({
//                     user_id: user.like_user_id,
//                 });
//             }

//             res.json(userDetails);
//         }
//     });
// });

app.get('/users/:user_id', (req, res) => {
    const userId = req.params.user_id;

    // Query to get user details, followers, following, and posts
    const query = `
        SELECT 
            u.user_id, u.first_name, u.last_name, u.username,
            f.follower_id AS follower_user_id,
            p.post_id, p.text, p.date_published,
            l.user_id AS like_user_id
        FROM 
            users u
        LEFT JOIN 
            followers f ON u.user_id = f.user_id
        LEFT JOIN 
            posts p ON u.user_id = p.author_id
        LEFT JOIN 
            likes l ON p.post_id = l.post_id
        WHERE 
            u.user_id = ?
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (rows.length === 0) {
            // User not found
            res.status(404).json({ error: 'User not found' });
        } else {
            // Organize user details, followers, posts, and likes into a structured response
            const userDetails = {
                user_id: rows[0].user_id,
                first_name: rows[0].first_name,
                last_name: rows[0].last_name,
                username: rows[0].username,
                followers: [],
                posts: [],
                likes: [],
            };

            rows.forEach(row => {
                if (row.follower_user_id !== null) {
                    userDetails.followers.push({
                        user_id: row.follower_user_id,
                    });
                }

                if (row.post_id !== null) {
                    userDetails.posts.push({
                        post_id: row.post_id,
                        text: row.text,
                        date_published: row.date_published,
                    });
                }

                if (row.like_user_id !== null) {
                    userDetails.likes.push({
                        user_id: row.like_user_id,
                    });
                }
            });

            res.json(userDetails);
        }
    });
});



app.delete('/users/:user_id/follow', (req, res) => {
    const loggedInUserId = req.body.loggedInUserId; // Retrieve from the request body
    const followedUserId = req.params.user_id;

    // Check if the user to be unfollowed exists
    db.get('SELECT * FROM users WHERE user_id = ?', [followedUserId], (err, followedUser) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!followedUser) {
            // User to be unfollowed not found
            res.status(404).json({ error: 'User not found' });
        } else {
            // Check if the logged-in user is following the user
            db.get('SELECT * FROM followers WHERE user_id = ? AND follower_id = ?', [followedUserId, loggedInUserId], (err, existingFollow) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (!existingFollow) {
                    // The user is not following the other user
                    res.status(403).json({ error: 'You can not unfollow a user that you are not following' });
                } else {
                    // Stop following the user
                    db.run('DELETE FROM followers WHERE user_id = ? AND follower_id = ?', [followedUserId, loggedInUserId], (err) => {
                        if (err) {
                            console.error(err.message);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            res.status(200).json({ message: 'You have stopped following the user' });
                        }
                    });
                }
            });
        }
    });
});




app.post('/users/:user_id/follow', (req, res) => {
    const loggedInUserId = req.body.loggedInUserId; // Retrieve from the request body
    // const followedUserId = req.params.user_id;
    const followedUserId = req.params.user_id;

    // Check if the user to be followed exists
    db.get('SELECT * FROM users WHERE user_id = ?', [followedUserId], (err, followedUser) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!followedUser) {
            // User to be followed not found
            res.status(404).json({ error: 'User not found' });
        } else {
            // Check if the logged-in user is already following the user
            db.get('SELECT * FROM followers WHERE user_id = ? AND follower_id = ?', [followedUserId, loggedInUserId], (err, existingFollow) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (existingFollow) {
                    // The user is already following the other user
                    res.status(403).json({ error: 'You are already following this user' });
                } else {
                    // Follow the user
                    db.run('INSERT INTO followers (user_id, follower_id) VALUES (?, ?)', [followedUserId, loggedInUserId], (err) => {
                        if (err) {
                            console.error(err.message);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            res.status(200).json({ message: 'You are now following the user' });
                        }
                    });
                }
            });
        }
    });
});


app.get('/search', (req, res) => {
    console.log("Coming in search")
    console.log(req.body)
    const searchQuery = req.body.q || ''; // Retrieve the search query from query parameters

    // Define the base SQL query without any specific conditions
    let query = `
        SELECT 
            user_id, first_name, last_name, username
        FROM 
            users
    `;

    // Check if a search query is provided
    if (searchQuery) {
        // Add conditions to the SQL query if the search query is not empty
        query += `
            WHERE 
                first_name LIKE '%' || ? || '%'
                OR last_name LIKE '%' || ? || '%'
                OR username LIKE '%' || ? || '%'
        `;
    }

    // Define the parameters based on whether a search query is provided
    const params = searchQuery ? [searchQuery, searchQuery, searchQuery] : [];

    db.all(query, params, (err, users) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json(users);
        }
    });
});



app.post('/posts', (req, res) => {
    const { text, author_id } = req.body;

    // Validate that required fields are present
    if (!text || !author_id) {
        res.status(400).json({ error: 'Text and author_id are required fields' });
        return;
    }

    // Insert the new post into the database
    const query = `
        INSERT INTO posts (text, date_published, author_id)
        VALUES (?, ?, ?)
    `;

    const currentDate = new Date().getTime(); // Get the current timestamp

    db.run(query, [text, currentDate, author_id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const newPostId = this.lastID; // Get the ID of the newly inserted post
            res.status(201).json({ message: 'Post created successfully', post_id: newPostId });
        }
    });
});




app.get('/posts/:post_id', (req, res) => {
    const postId = req.params.post_id;

    // Query to get details of a single post
    const query = `
        SELECT 
            post_id, text, date_published, author_id
        FROM 
            posts
        WHERE 
            post_id = ?
    `;

    db.get(query, [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!post) {
            // Post not found
            res.status(404).json({ error: 'Post not found' });
        } else {
            res.status(200).json(post);
        }
    });
});




app.patch('/posts/:post_id', (req, res) => {
    const postId = req.params.post_id;
    const { text } = req.body;

    // Check if the post with the given ID exists
    db.get('SELECT * FROM posts WHERE post_id = ?', [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!post) {
            // Post not found
            res.status(404).json({ error: 'Post not found' });
        } else {
            // Check if the user is authorized to update the post
            // For simplicity, assuming that the user can only update their own posts
            console.log(post.author_id)
            console.log(req.body.user_id)
            if (post.author_id !== req.body.user_id) {
                res.status(403).json({ error: 'You can only update your own posts' });
                return;
            }

            // Update the post with the new text
            const query = 'UPDATE posts SET text = ? WHERE post_id = ?';

            db.run(query, [text, postId], function (err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    res.status(200).json({ message: 'Post updated successfully' });
                }
            });
        }
    });
});




app.delete('/posts/:post_id', (req, res) => {
    const postId = req.params.post_id;

    // Check if the post with the given ID exists
    db.get('SELECT * FROM posts WHERE post_id = ?', [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!post) {
            // Post not found
            res.status(404).json({ error: 'Post not found' });
        } else {
            // Check if the user is authorized to delete the post
            // For simplicity, assuming that the user can only delete their own posts
            if (post.author_id !== req.body.user_id) {
                res.status(403).json({ error: 'You can only delete your own posts' });
                return;
            }

            // Delete the post and associated likes
            const deletePostQuery = 'DELETE FROM posts WHERE post_id = ?';
            const deleteLikesQuery = 'DELETE FROM likes WHERE post_id = ?';

            db.run(deletePostQuery, [postId], function (err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    // Also delete likes associated with the post
                    db.run(deleteLikesQuery, [postId], function (err) {
                        if (err) {
                            console.error(err.message);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            res.status(200).json({ message: 'Post deleted successfully' });
                        }
                    });
                }
            });
        }
    });
});



app.post('/posts/:post_id/like', (req, res) => {
    const postId = req.params.post_id;
    console.log(postId)
    const loggedInUserId = req.body.loggedInUserId; 

    console.log("Like api hitting")
    // console.log("REquest", req)

    // Check if the post with the given ID exists
    db.get('SELECT * FROM posts WHERE post_id = ?', [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!post) {
            // Post not found
            res.status(404).json({ error: 'Post not found' });
        } else {
            // Check if the user has already liked the post
            db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, loggedInUserId], (err, existingLike) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (existingLike) {
                    // The user has already liked the post
                    res.status(403).json({ error: 'You have already liked this post' });
                } else {
                    // Like the post
                    db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, loggedInUserId], (err) => {
                        if (err) {
                            console.error(err.message);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            res.status(200).json({ message: 'Post liked successfully' });
                        }
                    });
                }
            });
        }
    });
});




app.delete('/posts/:post_id/unlike', (req, res) => {
    const postId = req.params.post_id;
    const loggedInUserId = req.body.loggedInUserId; // Assuming you retrieve the logged-in user ID from the request body

    // Check if the post with the given ID exists
    db.get('SELECT * FROM posts WHERE post_id = ?', [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!post) {
            // Post not found
            res.status(404).json({ error: 'Post not found' });
        } else {
            // Check if the user has liked the post
            db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, loggedInUserId], (err, existingLike) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (!existingLike) {
                    // The user has not yet liked the post
                    res.status(403).json({ error: 'You can not unlike a post that you have not yet liked' });
                } else {
                    // Unlike the post
                    db.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, loggedInUserId], (err) => {
                        if (err) {
                            console.error(err.message);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            res.status(200).json({ message: 'Post unliked successfully' });
                        }
                    });
                }
            });
        }
    });
});




app.get('/feed', (req, res) => {
    const loggedInUserId = req.body.loggedInUserId; // Assuming you retrieve the logged-in user ID from the request body

    if (!loggedInUserId) {
        // If there is no logged-in user, return a list of all posts ordered by date (newest first)
        db.all('SELECT * FROM posts ORDER BY date_published DESC', [], (err, posts) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(200).json({ posts });
            }
        });
    } else {
        // If there is a logged-in user, retrieve posts from the logged-in user and their followers
        const query = `
            SELECT 
                p.post_id, p.text, p.date_published,
                u.user_id AS author_id, u.first_name AS author_first_name, u.last_name AS author_last_name, u.username AS author_username
            FROM 
                posts p
            INNER JOIN 
                users u ON p.author_id = u.user_id
            INNER JOIN 
                followers f ON u.user_id = f.follower_id
            WHERE 
                f.user_id = ?
            ORDER BY 
                p.date_published DESC
        `;

        db.all(query, [loggedInUserId], (err, feed) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(200).json({ feed });
            }
        });
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});