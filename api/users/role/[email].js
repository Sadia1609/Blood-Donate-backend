export default function handler(req, res) {
  const { email } = req.query;
  
  console.log("Fetching role for:", email);
  
  res.status(200).json({
    email: email,
    role: "donar",
    status: "active",
    name: "Test User"
  });
}