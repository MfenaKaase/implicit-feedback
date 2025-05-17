<?php

// Solr core and server information
$solrUrl = 'http://localhost:8983/solr/feedback';
$query = $_GET['query']; // Replace with your actual search query
$cohort = $_GET['cohort'];

// Solr search endpoint
$searchEndpoint = '/select';

// Construct the Solr query URL
$queryUrl = $solrUrl . $searchEndpoint . '?fl=url,total_active_time,search_query,page_title,leading_paragraph,total_copy,page_saved,bookmarked,printed_document,score&indent=true&q.op=OR&wt=json&q=' . urlencode($query).'&fq=cohort%3A'. urlencode($cohort);

// Initialize cURL session
$ch = curl_init($queryUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// curl_setopt($ch, CURLOPT_USERPWD, "admin:7/WMcKI/:zPD");
// Execute cURL session and get the response
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
}

// Close cURL session
curl_close($ch);

header("Access-Control-Allow-Origin: https://www.google.com");
header('Content-Type: application/json');
echo ($response);
?>
