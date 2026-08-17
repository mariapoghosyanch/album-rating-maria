const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3000;

// ------------------------------------------------------------
// Pfade
// ------------------------------------------------------------

// __dirname bezeichnet den Ordner, in dem server.js liegt.
const frontendPath = path.join(__dirname, "..", "frontend");
const imagesPath = path.join(__dirname, "images");
const databasePath = path.join(__dirname, "database.db");

// ------------------------------------------------------------
// Datenbank öffnen
// ------------------------------------------------------------

// Falls database.db noch nicht existiert, wird sie erstellt.
const db = new Database(databasePath);

// Fremdschlüssel-Beziehungen in SQLite aktivieren.
db.pragma("foreign_keys = ON");

// WAL ist für die Arbeit mit SQLite in Webanwendungen sinnvoll.
db.pragma("journal_mode = WAL");

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------

// Erlaubt später das Lesen von JSON-Daten aus Requests.
app.use(express.json());

// Liefert index.html, styles.css und script.js aus.
app.use(express.static(frontendPath));

// Macht Bilder unter /images/... erreichbar.
app.use("/images", express.static(imagesPath));

// ------------------------------------------------------------
// Tabellen erstellen
// ------------------------------------------------------------

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        image_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        album_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (album_id) REFERENCES albums(id),
        FOREIGN KEY (user_id) REFERENCES users(id),

        UNIQUE (album_id, user_id)
    );
`);

// ------------------------------------------------------------
// Beispieldaten einfügen
// ------------------------------------------------------------

function seedDatabase() {
    const userCount = db
        .prepare("SELECT COUNT(*) AS count FROM users")
        .get().count;

    const albumCount = db
        .prepare("SELECT COUNT(*) AS count FROM albums")
        .get().count;

    const reviewCount = db
        .prepare("SELECT COUNT(*) AS count FROM reviews")
        .get().count;

    //if (userCount === 0) {
    const insertUser = db.prepare(`
        INSERT INTO users (username)
        VALUES (?)
    `);

    //insertUser.run("Nina");
    //insertUser.run("Luca");
    //insertUser.run("Max");

    console.log("✅ Dummy-User wurden eingefügt.");
    //}

    //if (albumCount === 0) {
        const insertAlbum = db.prepare(`
            INSERT INTO albums (
                title,
                artist,
                image_path,
                created_at
            )
            VALUES (?, ?, ?, ?)
        `);

       /* insertAlbum.run(
            "In Rainbows",
            "Radiohead",
            "/images/in-rainbows.jpg",
            "2026-08-01 10:00:00"
        );

        insertAlbum.run(
            "Random Access Memories",
            "Daft Punk",
            "/images/random-access-memories.jpg",
            "2026-08-02 10:00:00"
        );

        insertAlbum.run(
            "To Pimp a Butterfly",
            "Kendrick Lamar",
            "/images/to-pimp-a-butterfly.jpg",
            "2026-08-03 10:00:00"
        );

        insertAlbum.run(
            "Whatever People Say I Am, That's What I'm Not",
            "Arctic Monkeys",
            "/images/whatever-people-say-i-am.jpg",
            "2026-08-04 10:00:00"
        );

        insertAlbum.run(
            "Brat",
            "Charli XCX",
            "/images/brat.png",
            "2026-08-05 10:00:00"
        );*/

        insertAlbum.run(
            "Abbey Road",
            "The Beatles",
            "/images/abbey-road.jpg",
            "2026-08-17 20:45:00"
        );

        console.log("✅ Beispielalben wurden eingefügt.");
    }

    //if (reviewCount === 0) {
        const insertReview = db.prepare(`
            INSERT INTO reviews (
                album_id,
                user_id,
                rating,
                review_text,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
        `);

        const reviews = [
            /*[
                1,
                1,
                5,
                "Sehr atmosphärisch und überraschend abwechslungsreich.",
                "2026-08-01 11:00:00"
            ],
            [
                1,
                2,
                4,
                "Grossartiges Album mit vielen starken Songs.",
                "2026-08-01 14:30:00"
            ],
            [
                2,
                1,
                4,
                "Sehr sauber produziert und voller kleiner Details. Ein absoluter Banger!",
                "2026-08-02 09:15:00"
            ],
            [
                2,
                2,
                5,
                "Ein moderner Klassiker.",
                "2026-08-02 17:20:00"
            ],
            [
                3,
                1,
                5,
                "Musikalisch und textlich extrem stark.",
                "2026-08-03 08:40:00"
            ],
            [
                3,
                2,
                3,
                "Dieses Album wird mit jedem Hören besser, aber nicht unbedingt mein Stil.",
                "2026-08-03 18:10:00"
            ],
            [
                4,
                1,
                5,
                "Bestes Debut Album aller Zeiten!",
                "2026-08-04 11:25:00"
            ],
            [
                4,
                2,
                4,
                "Krass - Alex Turner war erst 19 Jahre alt!",
                "2026-08-04 16:45:00"
            ],
            [
                5,
                1,
                5,
                "Brat Summer! Charli XCX ist eine der besten Pop-Künstlerinnen der letzten Jahre.",
                "2026-08-05 09:05:00"
            ],
            [
                5,
                2,
                3,
                "Nicht mein typisches Genre, aber dennoch eine gute Produktion.",
                "2026-08-05 12:30:00"
            ]
           [
                6,
                3,
                5,
                "Love it!",
                "2026-08-17 20:55:00"
            ],

        ];

        const insertAllReviews = db.transaction((reviewList) => {
            for (const review of reviewList) {
                insertReview.run(...review);
            }
        });

        insertAllReviews(reviews);*/

        //console.log("✅ Beispielreviews wurden eingefügt.");



//seedDatabase();

// ------------------------------------------------------------
// API-Routen
// ------------------------------------------------------------

// Liefert alle Alben inklusive Durchschnitt und Anzahl Reviews.
app.get("/api/albums", (req, res) => {
    try {
        const albums = db.prepare(`
            SELECT
                albums.id,
                albums.title,
                albums.artist,
                albums.image_path,
                albums.created_at,
                ROUND(AVG(reviews.rating), 1) AS average_rating,
                COUNT(reviews.id) AS review_count
            FROM albums
            LEFT JOIN reviews
                ON albums.id = reviews.album_id
            GROUP BY albums.id
            ORDER BY albums.created_at DESC
        `).all();

        res.json(albums);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Die Alben konnten nicht geladen werden."
        });
    }
}),

// Liefert ein einzelnes Album inklusive seiner Reviews.
app.get("/api/albums/:id", (req, res) => {
    try {
        const albumId = Number(req.params.id);

        if (!Number.isInteger(albumId)) {
            return res.status(400).json({
                error: "Die Album-ID ist ungültig."
            });
        }

        const album = db.prepare(`
            SELECT
                albums.id,
                albums.title,
                albums.artist,
                albums.image_path,
                albums.created_at,
                ROUND(AVG(reviews.rating), 1) AS average_rating,
                COUNT(reviews.id) AS review_count
            FROM albums
            LEFT JOIN reviews
                ON albums.id = reviews.album_id
            WHERE albums.id = ?
            GROUP BY albums.id
        `).get(albumId);

        if (!album) {
            return res.status(404).json({
                error: "Das Album wurde nicht gefunden."
            });
        }

        const reviews = db.prepare(`
            SELECT
                reviews.id,
                reviews.rating,
                reviews.review_text,
                reviews.created_at,
                users.id AS user_id,
                users.username
            FROM reviews
            JOIN users
                ON reviews.user_id = users.id
            WHERE reviews.album_id = ?
            ORDER BY reviews.created_at DESC
        `).all(albumId);

        res.json({
            ...album,
            reviews
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Das Album konnte nicht geladen werden."
        });
    }
}),

// Liefert die neuesten Reviews für die Startseite.
app.get("/api/reviews/latest", (req, res) => {
    try {
        const reviews = db.prepare(`
            SELECT
                reviews.id,
                reviews.rating,
                reviews.review_text,
                reviews.created_at,
                users.id AS user_id,
                users.username,
                albums.id AS album_id,
                albums.title AS album_title,
                albums.artist,
                albums.image_path
            FROM reviews
            JOIN users
                ON reviews.user_id = users.id
            JOIN albums
                ON reviews.album_id = albums.id
            ORDER BY reviews.created_at DESC
            LIMIT 10
        `).all();

        res.json(reviews);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Die Reviews konnten nicht geladen werden."
        });
    }
}),

app.get("/api/users", (req, res) => {
    try {
        const users = db.prepare(`
            SELECT
                users.id,
                users.username
            FROM users
            ORDER BY users.username DESC
        `).all();

        res.json(users);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Die Users konnten nicht geladen werden."
        });
    }
}),

app.get("/api/users/:id/reviews", (req, res) => {
    try {



        const userId = Number(req.params.id);

        if (!Number.isInteger(userId)) {
            return res.status(400).json({
                error: "Die User-ID ist ungültig."
            });
        }

        const user = db.prepare(`
            SELECT
                users.id,
                users.username
            FROM users
            LEFT JOIN reviews
                ON users.id = reviews.user_id
            WHERE users.id = ?
            GROUP BY users.id
        `).get(userId);

        if (!user) {
            return res.status(404).json({
                error: "Der User wurde nicht gefunden."
            });
        }

        const reviews = db.prepare(`
            SELECT
                reviews.id,
                reviews.rating,
                reviews.review_text,
                reviews.created_at,
                albums.id AS album_id,
                albums.title AS album_title,
                albums.artist,
                albums.image_path
            FROM reviews
            JOIN albums
                ON reviews.album_id = albums.id
            WHERE reviews.user_id = ?
            ORDER BY reviews.created_at DESC
        `).all(userId);

        res.json({
            ...user,
            reviews
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Der User konnte nicht geladen werden."
        });
    }
}),

// ------------------------------------------------------------
// Server starten
// ------------------------------------------------------------

app.listen(PORT, () => {
    console.log("-------------------------------------------");
    console.log("🎵 Album Rating Server läuft!");
    console.log(`🌐 Webseite: http://localhost:${PORT}`);
    console.log(`📀 Alben:    http://localhost:${PORT}/api/albums`);
    console.log(`⭐ Reviews:  http://localhost:${PORT}/api/reviews/latest`);
    console.log('Users: http://localhost:3000/api/users');
    console.log("-------------------------------------------");
})]