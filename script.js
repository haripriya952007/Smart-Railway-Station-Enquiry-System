/* =========================================
   SMART RAILWAY STATION ENQUIRY
   MAIN JAVASCRIPT
========================================= */


/* ================================
   GLOBAL TRAIN DATA
================================ */

let trains = [];


/* ================================
   LOAD TRAINS FROM MYSQL
================================ */

async function loadTrains() {

    try {

        const response =
            await fetch("http://localhost:5000/api/trains");


        if (!response.ok) {

            throw new Error(
                "Unable to connect to railway API"
            );

        }


        trains = await response.json();


        console.log(
            "Train data loaded:",
            trains
        );


        displayQuickTrains();


    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );


        const quickTrainList =
            document.getElementById(
                "quickTrainList"
            );


        if (quickTrainList) {

            quickTrainList.innerHTML = `
                <div class="not-found">

                    <h3>❌ Unable to Load Trains</h3>

                    <p>
                        Please make sure the
                        Node.js backend server
                        is running.
                    </p>

                </div>
            `;

        }

    }

}


/* ================================
   DISPLAY QUICK TRAINS
================================ */

function displayQuickTrains() {

    const quickTrainList =
        document.getElementById(
            "quickTrainList"
        );


    if (!quickTrainList) {

        return;

    }


    if (trains.length === 0) {

        quickTrainList.innerHTML = `
            <p>No trains available.</p>
        `;

        return;

    }


    let html = "";


    trains.forEach(function(train) {

        html += `

            <div class="quick-train-card">

                <strong>
                    ${train.train_number}
                    -
                    ${train.train_name}
                </strong>

                <span>
                    ${train.source}
                    →
                    ${train.destination}
                    |
                    ${formatTime(train.departure_time)}
                </span>

            </div>

        `;

    });


    quickTrainList.innerHTML = html;

}


/* ================================
   FORMAT TIME
================================ */

function formatTime(time) {

    if (!time) {

        return "";

    }


    const parts =
        time.split(":");


    let hour =
        parseInt(parts[0]);


    const minute =
        parts[1];


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${period}`;

}


/* ================================
   SEARCH TRAIN / ROUTE
================================ */

async function searchRoute() {


    if (trains.length === 0) {

        await loadTrains();

    }


    const trainInput =
        document
            .getElementById("trainInput")
            .value
            .trim()
            .toLowerCase();


    const from =
        document
            .getElementById("fromStation")
            .value
            .trim()
            .toLowerCase();


    const to =
        document
            .getElementById("toStation")
            .value
            .trim()
            .toLowerCase();


    const result =
        document.getElementById(
            "trainResult"
        );


    /* Nothing entered */

    if (
        trainInput === "" &&
        from === "" &&
        to === ""
    ) {

        result.innerHTML = `

            <div class="not-found">

                <h3>
                    ⚠️ Enter Search Details
                </h3>

                <p>
                    Please enter a train name,
                    train number or route.
                </p>

            </div>

        `;

        return;

    }


    /* Search by train name / number */

    if (trainInput !== "") {


        const matchingTrains =
            trains.filter(function(train) {

                return (

                    String(
                        train.train_number
                    )
                    .toLowerCase()
                    .includes(trainInput)

                    ||

                    String(
                        train.train_name
                    )
                    .toLowerCase()
                    .includes(trainInput)

                );

            });


        if (
            matchingTrains.length > 0
        ) {

            displayTrainResults(
                matchingTrains
            );

        } else {

            result.innerHTML = `

                <div class="not-found">

                    <h3>
                        ❌ Train Not Found
                    </h3>

                    <p>
                        Please enter a valid
                        train name or number.
                    </p>

                </div>

            `;

        }


        return;

    }


    /* Search by From + To */

    if (
        from !== "" &&
        to !== ""
    ) {


        const matchingRoutes =
            trains.filter(function(train) {

                return (

                    String(
                        train.source
                    )
                    .toLowerCase()
                    .includes(from)

                    &&

                    String(
                        train.destination
                    )
                    .toLowerCase()
                    .includes(to)

                );

            });


        if (
            matchingRoutes.length > 0
        ) {

            displayTrainResults(
                matchingRoutes
            );

        } else {

            result.innerHTML = `

                <div class="not-found">

                    <h3>
                        ❌ No Train Found
                    </h3>

                    <p>
                        No train is available
                        for this route.
                    </p>

                </div>

            `;

        }


        return;

    }


    /* Only one station entered */

    result.innerHTML = `

        <div class="not-found">

            <h3>
                ⚠️ Enter Both Stations
            </h3>

            <p>
                Please enter both
                From and To stations.
            </p>

        </div>

    `;

}


/* ================================
   DISPLAY TRAIN RESULTS
================================ */

function displayTrainResults(
    trainList
) {


    const result =
        document.getElementById(
            "trainResult"
        );


    let rows = "";


    trainList.forEach(function(train) {

        rows += `

            <tr>

                <td>
                    ${train.train_number}
                </td>

                <td>
                    ${train.train_name}
                </td>

                <td>
                    ${train.source}
                </td>

                <td>
                    ${train.destination}
                </td>

                <td>
                    ${formatTime(
                        train.departure_time
                    )}
                </td>

                <td>
                    ${formatTime(
                        train.arrival_time
                    )}
                </td>

            </tr>

        `;

    });


    result.innerHTML = `

        <h3>
            🚆 Train Details
        </h3>

        <p>
            Data loaded from MySQL Database
        </p>


        <table class="train-table">

            <thead>

                <tr>

                    <th>
                        Train Number
                    </th>

                    <th>
                        Train Name
                    </th>

                    <th>
                        From
                    </th>

                    <th>
                        To
                    </th>

                    <th>
                        Departure
                    </th>

                    <th>
                        Arrival
                    </th>

                </tr>

            </thead>


            <tbody>

                ${rows}

            </tbody>

        </table>

    `;

}


/* ================================
   CLEAR SEARCH
================================ */

function clearSearch() {


    document.getElementById(
        "trainInput"
    ).value = "";


    document.getElementById(
        "fromStation"
    ).value = "";


    document.getElementById(
        "toStation"
    ).value = "";


    document.getElementById(
        "trainResult"
    ).innerHTML = "";

}


/* ================================
   START ENQUIRY
================================ */

function showMessage() {


    const message =
        document.getElementById(
            "homeMessage"
        );


    message.innerHTML = `

        <div class="success-message">

            <h3>
                🚆 Railway Enquiry Started
            </h3>

            <p>
                You can search for trains
                using the Train Enquiry section.
            </p>

        </div>

    `;


    setTimeout(function() {

        document
            .getElementById("trains")
            .scrollIntoView({
                behavior: "smooth"
            });

    }, 500);

}


/* ================================
   GO TO TRAINS
================================ */

function goToTrains() {

    document
        .getElementById("trains")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* ================================
   CHECK STATION STATUS
================================ */

function checkStationStatus() {


    const statusMessage =
        document.getElementById(
            "statusMessage"
        );


    statusMessage.innerHTML = `

        <h3>
            🚦 Current Station Status
        </h3>

        <p>
            🟢 Station is Open
        </p>

        <p>
            🟢 Train Services are Running
        </p>

        <p>
            🟢 Parking is Available
        </p>

        <p>
            🍴 Food Court is Open
        </p>

    `;


    statusMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* ================================
   FACILITY DETAILS
================================ */

function showFacility(
    facility
) {


    const facilityMessage =
        document.getElementById(
            "facilityMessage"
        );


    let message = "";


    if (facility === "Restroom") {

        message = `
            <h3>🚻 Restroom Details</h3>
            <p>
                Restroom facilities are
                available near the main
                station building.
            </p>
        `;

    }


    else if (
        facility === "Food Court"
    ) {

        message = `
            <h3>🍴 Food Court Details</h3>
            <p>
                Food and beverages are
                available for passengers.
            </p>
        `;

    }


    else if (
        facility === "Parking"
    ) {

        message = `
            <h3>🚗 Parking Details</h3>
            <p>
                Two-wheeler and four-wheeler
                parking facilities are available.
            </p>
        `;

    }


    facilityMessage.innerHTML = `

        <div class="success-message">

            ${message}

        </div>

    `;

}


/* ================================
   IMPORTANT NOTICE
================================ */

function showNotice() {


    const noticeMessage =
        document.getElementById(
            "noticeMessage"
        );


    noticeMessage.innerHTML = `

        <div class="success-message">

            <h3>
                ⚠️ Important Railway Notice
            </h3>

            <p>
                Please check the platform
                number before boarding
                your train.
            </p>

            <p>
                Passengers are requested
                to arrive at the station
                at least 30 minutes early.
            </p>

        </div>

    `;


    noticeMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* ================================
   LOAD ANNOUNCEMENTS
================================ */

async function loadAnnouncements() {


    try {

        const response =
            await fetch(
                "http://localhost:5000/api/announcements"
            );


        if (!response.ok) {

            throw new Error(
                "Announcements API error"
            );

        }


        const announcements =
            await response.json();


        const announcementList =
            document.getElementById(
                "announcementList"
            );


        if (
            announcements.length === 0
        ) {

            announcementList.innerHTML = `
                <p>
                    No announcements available.
                </p>
            `;

            return;

        }


        let html = "";


        announcements.forEach(
            function(item) {

                html += `

                    <div class="announcement">

                        <h3>
                            📢 ${item.title}
                        </h3>

                        <p>
                            ${item.message}
                        </p>

                    </div>

                `;

            }
        );


        announcementList.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Announcement error:",
            error
        );


        document.getElementById(
            "announcementList"
        ).innerHTML = `

            <div class="not-found">

                <h3>
                    ❌ Unable to Load Announcements
                </h3>

                <p>
                    Please make sure the
                    backend server is running.
                </p>

            </div>

        `;

    }

}


/* ================================
   PAGE LOAD
================================ */

loadTrains();

loadAnnouncements();