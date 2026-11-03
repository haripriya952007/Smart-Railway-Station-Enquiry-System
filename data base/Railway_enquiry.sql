USE railway_db;

INSERT INTO train_schedule
(train_id, station_id, arrival_time, departure_time, stop_number)
VALUES
(1, 1, NULL, '06:00:00', 1),
(1, 2, '11:30:00', '11:40:00', 2),
(1, 3, '13:30:00', '13:40:00', 3),
(2, 1, NULL, '21:00:00', 1),
(2, 2, '06:20:00', '06:30:00', 2),
(3, 1, NULL, '07:00:00', 1),
(3, 3, '13:50:00', '14:00:00', 2);