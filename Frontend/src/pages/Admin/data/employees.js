const dummyUsers = [
  
  {
    "id": "user1",
    "Name": "John Doe",
    "Role": "Admin",
    "Created at": "2024-03-01T12:00:00Z",
    "Status": "happy",
    "Updated at": "2024-03-15T14:00:00Z"
  },
  {
    "id": "user2",
    "Name": "Jane Smith",
    "Role": "User",
    "Created at": "2024-02-20T10:00:00Z",
    "Status": "frustrated",
    "Updated at": "2024-03-10T16:00:00Z"
  },
  {
    "id": "user3",
    "Name": "Alice Brown",
    "Role": "User",
    "Created at": "2024-01-10T09:30:00Z",
    "Status": "sad",
    "Updated at": "2024-03-05T11:45:00Z"
  },
  {
    "id": "user4",
    "Name": "Bob Johnson",
    "Role": "Admin",
    "Created at": "2024-03-05T08:15:00Z",
    "Status": "okay",
    "Updated at": "2024-03-18T10:30:00Z"
  },
  {
    "id": "user5",
    "Name": "Charlie White",
    "Role": "User",
    "Created at": "2024-02-28T07:45:00Z",
    "Status": "excited",
    "Updated at": "2024-03-14T09:20:00Z"
  },
  {
    "id": "user6",
    "Name": "Daniel Green",
    "Role": "Moderator",
    "Created at": "2024-01-15T14:10:00Z",
    "Status": "happy",
    "Updated at": "2024-03-12T15:30:00Z"
  },
  {
    "id": "user7",
    "Name": "Eve Black",
    "Role": "SuperAdmin",
    "Created at": "2024-02-10T09:25:00Z",
    "Status": "excited",
    "Updated at": "2024-03-09T12:45:00Z"
  },
  {
    "id": "user8",
    "Name": "Frank Carter",
    "Role": "Moderator",
    "Created at": "2024-03-12T11:00:00Z",
    "Status": "okay",
    "Updated at": "2024-03-19T08:30:00Z"
  },
  {
    "id": "user9",
    "Name": "Grace Lewis",
    "Role": "User",
    "Created at": "2024-02-05T14:50:00Z",
    "Status": "sad",
    "Updated at": "2024-03-20T10:20:00Z"
  },
  {
    "id": "user10",
    "Name": "Henry Adams",
    "Role": "Admin",
    "Created at": "2024-01-18T08:30:00Z",
    "Status": "frustrated",
    "Updated at": "2024-03-15T09:50:00Z"
  },
  ...Array.from({ length: 30 }, (_, i) => ({
    "id": `user${i + 11}`,
    "Name": `User ${i + 11}`,
    "Role": ["User", "Admin", "Moderator", "SuperAdmin"][Math.floor(Math.random() * 4)],
    "Created at": new Date(2024, Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 28) + 1).toISOString(),
    "Status": ["frustrated", "sad", "okay", "happy", "excited"][Math.floor(Math.random() * 5)],
    "Updated at": new Date(2024, 2, Math.floor(Math.random() * 20) + 1).toISOString()
  }))
];

export default dummyUsers;
