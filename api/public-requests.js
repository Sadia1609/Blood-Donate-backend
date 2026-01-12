export default function handler(req, res) {
  const mockRequests = [
    {
      _id: "1",
      blood_group: "A+",
      recipient_name: "John Doe",
      recipient_district: "Dhaka",
      recipient_upazila: "Dhanmondi",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Dhaka Medical College",
      donation_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      donation_time: "10:00 AM",
      requester_name: "Jane Smith",
      requester_email: "jane@example.com",
      full_address: "123 Medical Street, Dhaka",
      request_message: "Urgent blood needed for surgery"
    },
    {
      _id: "2",
      blood_group: "O-",
      recipient_name: "Alice Johnson",
      recipient_district: "Chittagong",
      recipient_upazila: "Panchlaish",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Chittagong Medical College",
      donation_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      donation_time: "2:00 PM",
      requester_name: "Bob Wilson",
      requester_email: "bob@example.com",
      full_address: "456 Hospital Road, Chittagong",
      request_message: "Emergency blood requirement"
    },
    {
      _id: "3",
      blood_group: "B+",
      recipient_name: "Mike Brown",
      recipient_district: "Sylhet",
      recipient_upazila: "Sylhet Sadar",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Sylhet MAG Osmani Medical College",
      donation_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      donation_time: "11:30 AM",
      requester_name: "Sarah Davis",
      requester_email: "sarah@example.com",
      full_address: "789 Medical Campus, Sylhet",
      request_message: "Blood needed for cancer treatment"
    }
  ];

  res.status(200).json(mockRequests);
}