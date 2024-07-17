# NovahCare Springs Hospital 

Online Appointment Booking Platfrom

Welcome to the platform! 
This web application allows users to book and manage their doctor appointments. 
Users can select a branch, a doctor, a date and a time for their doctor's appointment. 
They can also edit and cancel existing appointments.

# Features

- **Branch and Doctor Selection:** Users can choose a branch and a doctor based on the doctors' specialty.
- **Time Slot Booking:** Users can book appointments during office hours (8 AM to 5 PM, excluding OOF (Out of Office) hours like between 1 PM to 2 PM (lunch hour)).
- **Edit and Cancel Appointments:** Users can edit their appointment details like selecting a different branch, doctor, specialty (reason for booking), date and time and they can also cancel their appointments altogether.
- **Validation:** Ensures every booking details are complete for it to be successful and that no double bookings occur for the same doctor, branch, date, and time.

# Technologies Used

- HTML
- CSS
- JavaScript
- Fetch API

## Getting Started

# Prerequisites

- - Ensure you have Node.js and npm (Node Package Manager) installed.
- Install JSON-server using the command:
    
    **npm install -g json-server**

- There is a `db.json` file for the JSON-server. Run the JSON-server with the command:
    
    **json-server --watch db.json**

- Ensure you have a running backend server that exposes the required endpoints (`/branches`, `/docSpecialties`, `/doctors`, `/appointments`).
# Installation

1. Fork and Clone the repository into your local machine:
    ```bash
    git clone https://github.com/yourusername/NovahCare-Appointment-Booking.git
    ```

2. Navigate to the project directory:
    ```bash
    cd NovahCare-Appointment-Booking
    ```

3. Open `index.html` in your browser.

# Usage

1. **Load the Application:**
   Open `index.html` in your browser.

2. **Book an Appointment:**
   - Fill in your personal details (first name, last name, age, contact, email, residence).
   - Select a reason for the appointment from the dropdown menu.
   - Select a branch from the dropdown menu.
     - If "Other" is selected, an input field will appear to enter a custom reason.
   - Choose a doctor from the available options- the doctors shown are the ones available for the selected reason within the selected branch.
   - Select a date and time for the appointment.
   - Click on the **Book Appointment** button at the bottom of the form to book your appointment.

3. **Edit an Appointment:**
   - Click the "**Edit**" button next to the appointment you want to edit.
   - Update the appointment details in the form.
   - Click on the **Book Appointment** button at the bottom of the form to submit your changes.

4. **Cancel an Appointment:**
   - Click the "**Cancel**" button next to the appointment you want to cancel.
   - Confirm the cancellation in the prompt.

# File Structure

## `index.html`
The main HTML file that includes the structure of the application.

## `styles.css`
The CSS file for styling the application.

## `db.json`
The database for storing doctors, appointments and specialties data.

## `main.js`
The JavaScript file containing the logic for fetching data, updating the UI, and handling user interactions.


# Endpoints

The application interacts with the following backend endpoints:

- `GET /branches`: Fetches the list of NovahCare Springs Hospital branches.
- `GET /docSpecialties`: Fetches the list of various doctor specialties.
- `GET /doctors`: Fetches the list of all doctors.
- `GET /doctors?branch=<branch>`: Fetches the list of doctors for a specific branch.
- `GET /appointments`: Fetches the list of all appointments.
- `POST /appointments`: Creates a new appointment.
- `PUT /appointments/<appointmentId>`: Updates an existing appointment.
- `DELETE /appointments/<appointmentId>`: Deletes an appointment.

