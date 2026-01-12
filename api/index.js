export default function handler(req, res) {
  res.status(200).json({
    message: "Blood Donate Backend is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
    method: req.method,
    url: req.url
  });
}