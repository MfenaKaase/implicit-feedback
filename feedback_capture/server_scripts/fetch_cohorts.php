<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$servername = "localhost:3307";
$username = "root";
$password = "";
$dbname = "implicit_feedback_db";  // Replace with your actual database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error
);
}

// SQL statement
$sql = "SELECT * FROM cohorts";

// Prepare and bind the statement
$result = $conn->query($sql);
// var_dump($result);
$data = [];
 while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
 }

// Close the connection
$conn->close();
$cohorts = json_encode($data);
// Send the response back to JavaScript
header('Content-Type: application/json');
echo($cohorts);

?>