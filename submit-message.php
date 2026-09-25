<?php
// submit-message.php
// Simple PHP form handler for anonymous messages
// Configuration

$config = array(
    'recipient_email' => 'your-email@example.com', // CHANGE THIS to your email
    'from_email' => 'noreply@example.com',           // CHANGE THIS to your domain email
    'subject' => 'New Anonymous Message',
    'allowed_origin' => 'https://yourdomain.com'     // CHANGE THIS to your domain
);

// Set response header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . $config['allowed_origin']);
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$message = isset($input['message']) ? trim($input['message']) : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message cannot be empty']);
    exit();
}

// Sanitize message (prevent injection attacks)
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
$message = substr($message, 0, 5000); // Limit to 5000 characters

// Prepare email
$recipient = $config['recipient_email'];
$subject = $config['subject'] . ' - ' . date('Y-m-d H:i:s');
$body = "Anonymous Message Received:\n\n";
$body .= $message . "\n\n";
$body .= "---\n";
$body .= "Received: " . date('Y-m-d H:i:s') . "\n";
$body .= "IP: " . $_SERVER['REMOTE_ADDR'] . "\n";

$headers = "From: " . $config['from_email'] . "\r\n";
$headers .= "Reply-To: " . $config['from_email'] . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email
$mail_sent = mail($recipient, $subject, $body, $headers);

if ($mail_sent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully!'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send message. Please try again later.'
    ]);
}
?>
