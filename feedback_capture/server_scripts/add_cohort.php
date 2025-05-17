<?php
header('Content-Type: application/json');

// Receive JSON data
$data = json_decode(file_get_contents('php://input'), true);

$servername = "localhost:3307";
$username = "root";
$password = "";
$dbname = "implicit_feedback_db";  // Replace with your actual database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Check if the form has been submitted

$name = $data['cohort'];
$password = $data['password'];

if ($password != '1234') {
  // Close connection
  $conn->close();

  header('Content-Type: application/json');
  echo json_encode([
    'response' => "Wrong Password!",
    'data' => []
  ]);

} else {

  // Prepare and bind SQL statement
  $sql = "INSERT INTO cohorts (name) VALUES (?)";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $name);

  // Execute SQL statement
  if ($stmt->execute()) {
    $response = array("success" => true);
    file_put_contents('log.txt', "Data saved successfully\n", FILE_APPEND);
  } else {
    $response = array("success" => false, "error" => $stmt->error);
    file_put_contents('log.txt', "Error: " . $stmt->error . "\n", FILE_APPEND);
  }

  // SQL statement
  $sql = "SELECT * FROM cohorts";

  // Prepare and bind the statement
  $result = $conn->query($sql);
  var_dump($result);
  $data = [];
  while ($row = mysqli_fetch_assoc($result)) {
          $data[] = $row;
  }

  // Close connection
  $conn->close();

  // Send JSON response
  header('Content-Type: application/json');
  echo json_encode([
    'response' => $response,
    'data' => $data
  ]);
}

