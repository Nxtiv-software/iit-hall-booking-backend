# Request Creation API - Testing Guide

## API Endpoint
**POST** `/requests/requests`

## Headers Required
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

## Request Body Structure

### Required Fields
- `studentId` (string): The UUID of the student's user ID
- `venueId` (string): The UUID of the venue to book
- `requiredDate` (string): ISO 8601 date string

### Optional Fields (Forms)
- `form1Data` (object): Main event details
- `form2Data` (object): Additional requirements
- `form3Data` (object): Resources/equipment
- `form4Data` (object): Custom fields
- `form5Data` (object): Custom fields

## Example Request

```json
{
  "studentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "venueId": "v1e2n3u4-e5i6-d789-0abc-def123456789",
  "requiredDate": "2026-01-25T14:00:00.000Z",
  "form1Data": {
    "societyname": "IEEE Student Branch",
    "eventtype": "Workshop",
    "excoposition": "President",
    "excomembername": "John Doe",
    "eventtitle": "AI & Machine Learning Workshop",
    "participants": "75",
    "description": "A comprehensive hands-on workshop covering the fundamentals of AI and ML with practical applications"
  },
  "form2Data": {
    "equipmentNeeded": "Projector, Microphone, Sound System",
    "setupTime": "1 hour before event",
    "cleanupTime": "30 minutes after",
    "specialRequirements": "Tables arranged in workshop style"
  },
  "form3Data": {
    "cateringRequired": "yes",
    "numberOfMeals": "75",
    "dietaryRestrictions": "10 vegetarian, 5 vegan, 2 gluten-free",
    "refreshments": "Coffee, tea, water, snacks"
  },
  "form4Data": {
    "sponsorName": "Tech Corp",
    "marketingMaterials": "Banners, standees, posters",
    "photographyAllowed": "yes"
  },
  "form5Data": {
    "emergencyContact": "+1234567890",
    "backupVenue": "Hall B",
    "insuranceCertificate": "uploaded",
    "notes": "Please ensure WiFi connectivity for all participants"
  }
}
```

## Expected Response (201 Created)

```json
{
  "message": "Request created successfully",
  "request": {
    "id": "req123-uuid",
    "studentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "venueId": "v1e2n3u4-e5i6-d789-0abc-def123456789",
    "statusId": "status-pending-uuid",
    "title": "AI & Machine Learning Workshop",
    "description": "A comprehensive hands-on workshop covering the fundamentals of AI and ML with practical applications",
    "attendance": 75,
    "requiredDate": "2026-01-25T14:00:00.000Z",
    "formData": {
      "form1": { /* form1Data */ },
      "form2": { /* form2Data */ },
      "form3": { /* form3Data */ },
      "form4": { /* form4Data */ },
      "form5": { /* form5Data */ }
    },
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T10:30:00.000Z",
    "student": { /* student object with user */ },
    "venue": { /* venue object */ },
    "status": { /* status object */ }
  }
}
```

## Error Responses

### 400 Bad Request - Missing venueId
```json
{
  "message": "venueId is required"
}
```

### 400 Bad Request - Missing requiredDate
```json
{
  "message": "requiredDate is required"
}
```

### 404 Not Found - Student not found
```json
{
  "message": "Student not found"
}
```

### 500 Internal Server Error - Status not found
```json
{
  "message": "Default status not found"
}
```

## How to Test

1. **Get your JWT token** by logging in as a student:
   ```http
   POST http://localhost:8800/auth/login
   Content-Type: application/json
   
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```

2. **Get student ID** from the token payload or by calling:
   ```http
   GET http://localhost:8800/students/me
   Authorization: Bearer YOUR_TOKEN
   ```

3. **Get available venue IDs**:
   ```http
   GET http://localhost:8800/venues
   Authorization: Bearer YOUR_TOKEN
   ```

4. **Make the request** with all the form data as shown in the example above.

## Notes

- All form data is stored in the `formData` JSON field
- Common fields (title, description, attendance) are extracted from `form1Data` for easier querying
- The `requiredDate` must be in ISO 8601 format
- Empty form objects (`{}`) are acceptable
- The API automatically sets the status to "PENDING"
