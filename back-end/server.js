const express = require("express");
const cors = require("cors");

const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// HOME API
app.get("/", (req, res) => {
    res.json({
        message: "Smart Railway Station Enquiry API is running"
    });
});

// GET ALL TRAINS
app.get("/api/trains", (req, res) => {
    const sql = "SELECT * FROM trains";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// ADD TRAIN
app.post("/api/trains", (req, res) => {
    const {
        train_number,
        train_name,
        source,
        destination,
        departure_time,
        arrival_time
    } = req.body;

    const sql = `
        INSERT INTO trains
        (train_number, train_name, source, destination, departure_time, arrival_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            train_number,
            train_name,
            source,
            destination,
            departure_time,
            arrival_time
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                message: "Train added successfully",
                trainId: result.insertId
            });
        }
    );
});

// UPDATE TRAIN
app.put("/api/trains/:id", (req, res) => {
    const { id } = req.params;

    const {
        train_number,
        train_name,
        source,
        destination,
        departure_time,
        arrival_time
    } = req.body;

    const sql = `
        UPDATE trains
        SET train_number = ?,
            train_name = ?,
            source = ?,
            destination = ?,
            departure_time = ?,
            arrival_time = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            train_number,
            train_name,
            source,
            destination,
            departure_time,
            arrival_time,
            id
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Train not found"
                });
            }

            res.json({
                message: "Train updated successfully"
            });
        }
    );
});

// DELETE TRAIN
app.delete("/api/trains/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM trains WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Train not found"
            });
        }

        res.json({
            message: "Train deleted successfully"
        });
    });
});

// STATIONS API
app.get("/api/stations", (req, res) => {
    const sql = "SELECT * FROM stations";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// SCHEDULE API
app.get("/api/schedules", (req, res) => {
    const sql = "SELECT * FROM train_schedule";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// FARE API
app.get("/api/fares", (req, res) => {
    const sql = "SELECT * FROM fares";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// ANNOUNCEMENTS API
app.get("/api/announcements", (req, res) => {
    const sql = "SELECT * FROM announcements";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// SEAT AVAILABILITY API
app.get("/api/availability", (req, res) => {
    const sql = `
        SELECT
            tsa.train_id,
            t.train_number,
            t.train_name,
            DATE_FORMAT(tsa.journey_date, '%Y-%m-%d') AS journey_date,
            tsa.total_seats,
            tsa.booked_seats,
            (tsa.total_seats - tsa.booked_seats) AS available_seats
        FROM train_seat_availability tsa
        JOIN trains t ON tsa.train_id = t.id
        ORDER BY tsa.journey_date
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// PASSENGER BOOKING API
app.post("/api/bookings", (req, res) => {
    const {
        passenger_name,
        age,
        gender,
        train_id,
        from_station,
        to_station,
        journey_date,
        seats_booked
    } = req.body;

    if (
        !passenger_name ||
        !age ||
        !train_id ||
        !from_station ||
        !to_station ||
        !journey_date ||
        !seats_booked
    ) {
        return res.status(400).json({
            message: "Please provide all required booking details"
        });
    }

    if (
        !Number.isInteger(Number(age)) ||
        Number(age) < 1 ||
        !Number.isInteger(Number(seats_booked)) ||
        Number(seats_booked) < 1
    ) {
        return res.status(400).json({
            message: "Age and seat count must be valid positive numbers"
        });
    }

    if (from_station === to_station) {
        return res.status(400).json({
            message: "From and To stations must be different"
        });
    }

    db.beginTransaction((transactionError) => {
        if (transactionError) {
            return res.status(500).json({
                error: transactionError.message
            });
        }

        const availabilitySql = `
            SELECT *
            FROM train_seat_availability
            WHERE train_id = ?
              AND journey_date = ?
            FOR UPDATE
        `;

        db.query(
            availabilitySql,
            [train_id, journey_date],
            (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                if (results.length === 0) {
                    return db.rollback(() => {
                        res.status(404).json({
                            message: "Seat availability not found for this train and date"
                        });
                    });
                }

                const availableSeats =
                    results[0].total_seats - results[0].booked_seats;

                if (Number(seats_booked) > availableSeats) {
                    return db.rollback(() => {
                        res.status(400).json({
                            message: "Not enough seats available",
                            available_seats: availableSeats
                        });
                    });
                }

                const bookingSql = `
                    INSERT INTO bookings
                    (
                        passenger_name,
                        age,
                        gender,
                        train_id,
                        from_station,
                        to_station,
                        journey_date,
                        seats_booked,
                        booking_status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
                `;

                db.query(
                    bookingSql,
                    [
                        passenger_name,
                        age,
                        gender || null,
                        train_id,
                        from_station,
                        to_station,
                        journey_date,
                        seats_booked
                    ],
                    (bookingError, bookingResult) => {
                        if (bookingError) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: bookingError.message
                                });
                            });
                        }

                        const updateSql = `
                            UPDATE train_seat_availability
                            SET booked_seats = booked_seats + ?
                            WHERE train_id = ?
                              AND journey_date = ?
                        `;

                        db.query(
                            updateSql,
                            [seats_booked, train_id, journey_date],
                            (updateError) => {
                                if (updateError) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: updateError.message
                                        });
                                    });
                                }

                                db.commit((commitError) => {
                                    if (commitError) {
                                        return db.rollback(() => {
                                            res.status(500).json({
                                                error: commitError.message
                                            });
                                        });
                                    }

                                    res.status(201).json({
                                        message: "Booking successful",
                                        booking_id: bookingResult.insertId,
                                        passenger_name,
                                        train_id,
                                        journey_date,
                                        seats_booked: Number(seats_booked),
                                        remaining_seats:
                                            availableSeats - Number(seats_booked),
                                        booking_status: "Confirmed"
                                    });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// GET ALL PASSENGER BOOKINGS
app.get("/api/bookings", (req, res) => {
    const sql = `
        SELECT
            b.booking_id,
            b.passenger_name,
            b.age,
            b.gender,
            t.train_number,
            t.train_name,
            b.from_station,
            b.to_station,
            DATE_FORMAT(b.journey_date, '%Y-%m-%d') AS journey_date,
            b.seats_booked,
            b.booking_status,
            b.booking_time
        FROM bookings b
        JOIN trains t ON b.train_id = t.id
        ORDER BY b.booking_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// START SERVER
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});