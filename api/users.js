export default function handler(req, res) {
  if (req.method === 'POST') {
    const userInfo = req.body;
    console.log("User registration:", userInfo);
    
    res.status(200).json({
      acknowledged: true,
      insertedId: "mock_id_" + Date.now(),
      message: "User registered successfully"
    });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}